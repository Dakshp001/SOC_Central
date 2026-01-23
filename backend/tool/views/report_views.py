# backend/tool/views/report_views.py

import json
import os
from datetime import datetime, timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.http import JsonResponse, HttpResponse, FileResponse
from django.contrib.auth.decorators import login_required
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from django.conf import settings
from django.db import models
import logging

from ..models import (
    SOCReport, SOCReportSection, SOCReportTemplate, SOCReportExport,
    SecurityDataUpload, AnomalyDetection
)
from ..services.report_service import SOCReportService
from authentication.decorators import require_admin_or_superuser

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@require_admin_or_superuser
def soc_reports_view(request):
    """List SOC reports or create new report"""
    
    if request.method == 'GET':
        # Get query parameters
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 10))
        report_type = request.GET.get('report_type', '')
        status_filter = request.GET.get('status', '')
        
        # Filter reports by company and optionally by type/status
        reports = SOCReport.objects.filter(
            company_name=getattr(request.user, 'company_name', 'default_company')
        ).select_related('created_by').prefetch_related('sections', 'data_uploads')
        
        if report_type:
            reports = reports.filter(report_type=report_type)
        if status_filter:
            reports = reports.filter(status=status_filter)
        
        # Paginate results
        paginator = Paginator(reports, per_page)
        page_obj = paginator.get_page(page)
        
        reports_data = []
        for report in page_obj:
            reports_data.append({
                'id': report.id,
                'title': report.title,
                'report_type': report.report_type,
                'description': report.description,
                'status': report.status,
                'tool_types': report.tool_types,
                'report_period_start': report.report_period_start.isoformat(),
                'report_period_end': report.report_period_end.isoformat(),
                'created_by': {
                    'id': report.created_by.id,
                    'username': report.created_by.username
                },
                'created_at': report.created_at.isoformat(),
                'updated_at': report.updated_at.isoformat(),
                'generated_at': report.generated_at.isoformat() if report.generated_at else None,
                'sections_count': report.sections.count(),
                'data_sources_count': report.data_uploads.count(),
                'exported_formats': report.exported_formats,
                'data_summary': report.get_data_summary()
            })
        
        return Response({
            'success': True,
            'reports': reports_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginator.count,
                'pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validate required fields
            required_fields = ['title', 'report_type', 'tool_types', 'report_period_start', 'report_period_end']
            for field in required_fields:
                if field not in data:
                    return Response({
                        'success': False,
                        'message': f'Required field missing: {field}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Parse dates
            period_start = datetime.strptime(data['report_period_start'], '%Y-%m-%d').date()
            period_end = datetime.strptime(data['report_period_end'], '%Y-%m-%d').date()
            
            if period_start >= period_end:
                return Response({
                    'success': False,
                    'message': 'End date must be after start date'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create report
            with transaction.atomic():
                report = SOCReport.objects.create(
                    title=data['title'],
                    report_type=data['report_type'],
                    description=data.get('description', ''),
                    tool_types=data['tool_types'],
                    report_period_start=period_start,
                    report_period_end=period_end,
                    created_by=request.user,
                    company_name=getattr(request.user, 'company_name', 'default_company')
                )
                
                # Link relevant data uploads
                if data.get('data_upload_ids'):
                    uploads = SecurityDataUpload.objects.filter(
                        id__in=data['data_upload_ids'],
                        company_name=report.company_name
                    )
                    report.data_uploads.set(uploads)
                else:
                    # Auto-select active datasets for specified tools
                    active_uploads = SecurityDataUpload.objects.filter(
                        tool_type__in=data['tool_types'],
                        company_name=report.company_name,
                        is_active=True,
                        status='active'
                    )
                    report.data_uploads.set(active_uploads)
            
            logger.info(f"Created SOC report {report.id} by user {request.user.id}")
            
            return Response({
                'success': True,
                'message': 'SOC report created successfully',
                'report_id': report.id,
                'report': {
                    'id': report.id,
                    'title': report.title,
                    'status': report.status,
                    'created_at': report.created_at.isoformat()
                }
            }, status=status.HTTP_201_CREATED)
            
        except json.JSONDecodeError:
            return Response({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating SOC report: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to create report'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
@require_admin_or_superuser
def soc_report_detail_view(request, report_id):
    """Get, update, or delete specific SOC report"""
    
    try:
        report = get_object_or_404(
            SOCReport,
            id=report_id,
            company_name=getattr(request.user, 'company_name', 'default_company')
        )
        
        # Check if user can edit this report
        if not report.can_edit(request.user) and request.method in ['PUT', 'DELETE']:
            return Response({
                'success': False,
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
    except SOCReport.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Report not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # Get detailed report data with sections
        sections_data = []
        for section in report.sections.all():
            sections_data.append({
                'id': section.id,
                'section_type': section.section_type,
                'title': section.title,
                'content': section.content,
                'order': section.order,
                'chart_data': section.chart_data,
                'chart_type': section.chart_type,
                'is_ai_generated': section.is_ai_generated,
                'manually_edited': section.manually_edited,
                'last_edited_by': {
                    'id': section.last_edited_by.id,
                    'username': section.last_edited_by.username
                } if section.last_edited_by else None,
                'updated_at': section.updated_at.isoformat()
            })
        
        return Response({
            'success': True,
            'report': {
                'id': report.id,
                'title': report.title,
                'report_type': report.report_type,
                'description': report.description,
                'status': report.status,
                'tool_types': report.tool_types,
                'report_period_start': report.report_period_start.isoformat(),
                'report_period_end': report.report_period_end.isoformat(),
                'executive_summary': report.executive_summary,
                'monitoring_overview': report.monitoring_overview,
                'incident_summary': report.incident_summary,
                'critical_threat_analysis': report.critical_threat_analysis,
                'recommendations': report.recommendations,
                'kpi_metrics': report.kpi_metrics,
                'charts_config': report.charts_config,
                'appendix': report.appendix,
                'ai_model_used': report.ai_model_used,
                'generation_time': report.generation_time,
                'exported_formats': report.exported_formats,
                'created_by': {
                    'id': report.created_by.id,
                    'username': report.created_by.username
                },
                'created_at': report.created_at.isoformat(),
                'updated_at': report.updated_at.isoformat(),
                'generated_at': report.generated_at.isoformat() if report.generated_at else None,
                'sections': sections_data,
                'data_summary': report.get_data_summary()
            }
        })
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            
            # Update report fields
            if 'title' in data:
                report.title = data['title']
            if 'description' in data:
                report.description = data['description']
            if 'appendix' in data:
                report.appendix = data['appendix']
            
            report.save()
            
            # Update sections if provided
            if 'sections' in data:
                for section_data in data['sections']:
                    if 'id' in section_data:
                        # Update existing section
                        section = get_object_or_404(SOCReportSection, id=section_data['id'], report=report)
                        if 'content' in section_data:
                            section.content = section_data['content']
                            section.manually_edited = True
                            section.last_edited_by = request.user
                        if 'title' in section_data:
                            section.title = section_data['title']
                        section.save()
            
            logger.info(f"Updated SOC report {report.id} by user {request.user.id}")
            
            return Response({
                'success': True,
                'message': 'Report updated successfully'
            })
            
        except json.JSONDecodeError:
            return Response({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error updating SOC report {report_id}: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to update report'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'DELETE':
        try:
            report_title = report.title
            report.delete()
            
            logger.info(f"Deleted SOC report {report_id} ({report_title}) by user {request.user.id}")
            
            return Response({
                'success': True,
                'message': f'Report "{report_title}" deleted successfully'
            })
            
        except Exception as e:
            logger.error(f"Error deleting SOC report {report_id}: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to delete report'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_admin_or_superuser
def generate_report_content_view(request, report_id):
    """Generate report content using AI"""
    
    try:
        report = get_object_or_404(
            SOCReport,
            id=report_id,
            company_name=getattr(request.user, 'company_name', 'default_company')
        )
        
        if not report.can_edit(request.user):
            return Response({
                'success': False,
                'message': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        if report.status == 'generating':
            return Response({
                'success': False,
                'message': 'Report is already being generated'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Start AI generation
        report_service = SOCReportService()
        
        # Update status immediately
        report.status = 'generating'
        report.save()
        
        # Generate report content (this could be made async in production)
        success = report_service.generate_report(report)
        
        if success:
            logger.info(f"Successfully generated content for report {report_id}")
            return Response({
                'success': True,
                'message': 'Report content generated successfully'
            })
        else:
            logger.error(f"Failed to generate content for report {report_id}")
            return Response({
                'success': False,
                'message': 'Failed to generate report content'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except SOCReport.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Report not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error generating report content for {report_id}: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to generate report content'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_admin_or_superuser  
def available_data_sources_view(request):
    """Get available data sources for report generation"""
    
    try:
        company_name = getattr(request.user, 'company_name', 'default_company')
        
        # Get active data uploads grouped by tool type
        active_uploads = SecurityDataUpload.objects.filter(
            company_name=company_name,
            is_active=True,
            status='active'
        ).select_related('uploaded_by', 'activated_by')
        
        # Get all uploads (for selection)
        all_uploads = SecurityDataUpload.objects.filter(
            company_name=company_name,
            status__in=['completed', 'active']
        ).select_related('uploaded_by')[:50]  # Limit for performance
        
        # Group by tool type and include processed data info
        tools_data = {}
        for upload in active_uploads:
            if upload.tool_type not in tools_data:
                tools_data[upload.tool_type] = {
                    'tool_type': upload.tool_type,
                    'active_dataset': None,
                    'total_records': 0,
                    'date_range': {'start': None, 'end': None},
                    'uploads_count': 0,
                    'last_updated': None,
                    'anomalies_count': 0
                }
            
            # Calculate date range from processed data if available
            date_range = {'start': None, 'end': None}
            if upload.processed_data and 'details' in upload.processed_data:
                threats = upload.processed_data['details'].get('threats', [])
                timestamps = []
                for threat in threats:
                    reported_time = threat.get('reported_time') or threat.get('identifying_time')
                    if reported_time:
                        timestamps.append(reported_time)
                
                if timestamps:
                    date_range['start'] = min(timestamps)
                    date_range['end'] = max(timestamps)
            
            tools_data[upload.tool_type].update({
                'active_dataset': {
                    'id': upload.id,
                    'file_name': upload.file_name,
                    'record_count': upload.record_count,
                    'uploaded_at': upload.uploaded_at.isoformat(),
                    'activated_at': upload.activated_at.isoformat() if upload.activated_at else None
                },
                'total_records': upload.record_count,
                'date_range': date_range,
                'uploads_count': 1,  # For active dataset, always 1
                'last_updated': upload.uploaded_at
            })
            
            # Get anomaly count for this upload
            anomaly_count = AnomalyDetection.objects.filter(upload=upload).count()
            tools_data[upload.tool_type]['anomalies_count'] = anomaly_count
        
        # Get recent anomalies summary
        recent_anomalies = AnomalyDetection.objects.filter(
            company_name=company_name,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).values('severity').annotate(count=models.Count('id'))
        
        return Response({
            'success': True,
            'data_sources': list(tools_data.values()),  # Changed from 'available_tools' to match frontend
            'recent_anomalies_summary': {
                item['severity']: item['count'] for item in recent_anomalies
            },
            'total_active_sources': len(tools_data),
            'all_uploads': [
                {
                    'id': upload.id,
                    'tool_type': upload.tool_type,
                    'file_name': upload.file_name,
                    'record_count': upload.record_count,
                    'uploaded_at': upload.uploaded_at.isoformat(),
                    'is_active': upload.is_active,
                    'status': upload.status
                } for upload in all_uploads
            ]
        })
        
    except Exception as e:
        logger.error(f"Error getting available data sources: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to get data sources'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@require_admin_or_superuser
def export_report_view(request, report_id):
    """Export report to PDF or Word format"""
    
    try:
        data = json.loads(request.body)
        export_format = data.get('format', 'pdf').lower()
        
        if export_format not in ['pdf', 'docx']:
            return Response({
                'success': False,
                'message': 'Invalid export format. Use "pdf" or "docx"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        report = get_object_or_404(
            SOCReport,
            id=report_id,
            company_name=getattr(request.user, 'company_name', 'default_company')
        )
        
        if report.status != 'completed':
            return Response({
                'success': False,
                'message': 'Report must be completed before export'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate file path
        timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
        relative_file_path = os.path.join('reports', str(report.id), f'export_{timestamp}.{export_format}')
        absolute_file_path = os.path.join(settings.MEDIA_ROOT, relative_file_path)
        
        # Use report service to export
        from ..services.report_service import SOCReportService
        report_service = SOCReportService()
        
        if export_format == 'pdf':
            success = report_service.export_to_pdf(report, absolute_file_path)
        else:  # docx
            success = report_service.export_to_docx(report, absolute_file_path)
        
        if not success:
            return Response({
                'success': False,
                'message': f'Failed to generate {export_format.upper()} file'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get file size
        file_size = os.path.getsize(absolute_file_path) if os.path.exists(absolute_file_path) else 0
        
        # Create export record
        export_record = SOCReportExport.objects.create(
            report=report,
            format=export_format,
            file_path=relative_file_path,
            file_size=file_size,
            exported_by=request.user,
            export_settings=data.get('settings', {})
        )
        
        # Update report's exported formats
        if export_format not in report.exported_formats:
            report.exported_formats.append(export_format)
            report.last_exported = timezone.now()
            report.save()
        
        logger.info(f"Successfully exported report {report_id} to {export_format.upper()}")
        
        return Response({
            'success': True,
            'message': f'Report exported to {export_format.upper()} successfully',
            'export_id': export_record.id,
            'file_path': relative_file_path,
            'file_size': file_size,
            'download_url': f'/media/{relative_file_path}' if success else None
        })
        
    except json.JSONDecodeError:
        return Response({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error exporting report {report_id}: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to export report'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@require_admin_or_superuser
def report_templates_view(request):
    """Get available report templates"""
    
    try:
        company_name = getattr(request.user, 'company_name', 'default_company')
        
        templates = SOCReportTemplate.objects.filter(
            company_name=company_name,
            is_active=True
        ).select_related('created_by')
        
        templates_data = []
        for template in templates:
            templates_data.append({
                'id': template.id,
                'name': template.name,
                'description': template.description,
                'template_type': template.template_type,
                'sections_config': template.sections_config,
                'default_charts': template.default_charts,
                'is_default': template.is_default,
                'created_by': {
                    'id': template.created_by.id,
                    'username': template.created_by.username
                },
                'created_at': template.created_at.isoformat()
            })
        
        return Response({
            'success': True,
            'templates': templates_data
        })
        
    except Exception as e:
        logger.error(f"Error getting report templates: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to get report templates'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)