# backend/tool/views/debug.py
# Debug endpoints to verify data storage and sharing

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from ..models import SecurityDataUpload, DataNotification, DataAccessLog
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class DebugDataStorageView(APIView):
    """Debug endpoint to verify data storage and sharing"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            user_company = user.company_name
            
            debug_info = {
                'user_info': {
                    'id': user.id,
                    'email': user.email,
                    'role': user.role,
                    'company_name': user_company,
                    'is_authenticated': user.is_authenticated,
                    'is_email_verified': user.is_email_verified
                },
                'database_status': {},
                'data_sharing_status': {},
                'troubleshooting': []
            }
            
            # Check total uploads
            total_uploads = SecurityDataUpload.objects.count()
            active_uploads = SecurityDataUpload.objects.filter(is_active=True).count()
            user_company_uploads = SecurityDataUpload.objects.filter(company_name=user_company).count()
            user_company_active = SecurityDataUpload.objects.filter(
                company_name=user_company, 
                is_active=True
            ).count()
            
            debug_info['database_status'] = {
                'total_uploads_in_db': total_uploads,
                'total_active_uploads': active_uploads,
                'user_company_uploads': user_company_uploads,
                'user_company_active': user_company_active
            }
            
            # Check company users
            company_users = User.objects.filter(company_name=user_company)
            admins = company_users.filter(role__in=['admin', 'super_admin'])
            general_users = company_users.filter(role='general')
            
            debug_info['data_sharing_status'] = {
                'company_users_total': company_users.count(),
                'company_admins': [{'email': u.email, 'id': u.id} for u in admins],
                'company_general_users': [{'email': u.email, 'id': u.id} for u in general_users],
                'current_user_type': 'admin' if user.role in ['admin', 'super_admin'] else 'general'
            }
            
            # Get active datasets for this company
            active_datasets = SecurityDataUpload.objects.filter(
                company_name=user_company,
                is_active=True
            ).select_related('uploaded_by', 'activated_by')
            
            datasets_info = []
            for dataset in active_datasets:
                datasets_info.append({
                    'id': dataset.id,
                    'tool_type': dataset.tool_type,
                    'file_name': dataset.file_name,
                    'uploaded_by': {
                        'email': dataset.uploaded_by.email,
                        'id': dataset.uploaded_by.id
                    },
                    'uploaded_at': dataset.uploaded_at.isoformat(),
                    'is_active': dataset.is_active,
                    'company_name': dataset.company_name,
                    'has_data': bool(dataset.processed_data),
                    'data_keys': list(dataset.processed_data.keys()) if dataset.processed_data else []
                })
            
            debug_info['active_datasets'] = datasets_info
            
            # Troubleshooting analysis
            troubleshooting = []
            
            if total_uploads == 0:
                troubleshooting.append("❌ No uploads found in database - upload process may have failed")
            
            if user_company_uploads == 0:
                troubleshooting.append(f"❌ No uploads found for company '{user_company}' - check company name matching")
            
            if user_company_active == 0 and user_company_uploads > 0:
                troubleshooting.append("❌ Uploads exist but none are active - check activation process")
            
            if not user_company:
                troubleshooting.append("❌ User has no company name set - required for data sharing")
            
            if user_company_active > 0:
                troubleshooting.append("✅ Active data exists for your company")
            
            if len(datasets_info) > 0:
                troubleshooting.append(f"✅ Found {len(datasets_info)} active datasets")
            
            debug_info['troubleshooting'] = troubleshooting
            
            # Check recent notifications
            recent_notifications = DataNotification.objects.filter(
                recipient=user
            ).order_by('-created_at')[:5]
            
            debug_info['recent_notifications'] = [
                {
                    'id': n.id,
                    'title': n.title,
                    'message': n.message,
                    'created_at': n.created_at.isoformat(),
                    'is_read': n.is_read
                }
                for n in recent_notifications
            ]
            
            return Response({
                'success': True,
                'debug_info': debug_info,
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Debug endpoint error: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TestActiveDataView(APIView):
    """Test the active data endpoint that frontend uses"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user_company = request.user.company_name
            
            logger.info(f"Testing active data for user: {request.user.email}, company: {user_company}")
            
            # This simulates the exact same logic as the real active-data endpoint
            active_uploads = SecurityDataUpload.objects.filter(
                company_name=user_company,
                is_active=True,
                status='active'
            ).select_related('uploaded_by', 'activated_by')
            
            # Build response data
            active_data = {}
            for upload in active_uploads:
                logger.info(f"Found active upload: {upload.tool_type} - {upload.file_name}")
                
                active_data[upload.tool_type] = {
                    'upload_id': upload.id,
                    'data': upload.processed_data,
                    'file_name': upload.file_name,
                    'uploaded_by': {
                        'name': f"{upload.uploaded_by.first_name} {upload.uploaded_by.last_name}",
                        'email': upload.uploaded_by.email
                    },
                    'uploaded_at': upload.uploaded_at.isoformat(),
                    'activated_at': upload.activated_at.isoformat() if upload.activated_at else None,
                    'activated_by': {
                        'name': f"{upload.activated_by.first_name} {upload.activated_by.last_name}",
                        'email': upload.activated_by.email
                    } if upload.activated_by else None
                }
            
            result = {
                'success': True,
                'message': f'Active data for {user_company}',
                'data': active_data,
                'company_name': user_company,
                'total_active_tools': len(active_data),
                'debug_info': {
                    'user_email': request.user.email,
                    'user_company': user_company,
                    'query_results_count': active_uploads.count(),
                    'found_tools': list(active_data.keys())
                }
            }
            
            logger.info(f"Returning {len(active_data)} active datasets")
            return Response(result)
            
        except Exception as e:
            logger.error(f"Test active data error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to fetch active data',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)