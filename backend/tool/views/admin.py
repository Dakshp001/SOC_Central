# backend/tool/views/admin.py - FIXED VERSION WITH BETTER ERROR HANDLING

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.utils import timezone
import logging
import json

from ..models import SecurityDataUpload, DataAccessLog, DataNotification
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()

def check_super_admin_permission(user):
    """Check if user has super_admin role"""
    if not user or not user.is_authenticated:
        logger.warning(f"Unauthenticated user attempting admin access")
        return False
    
    # Check role-based permissions
    user_role = getattr(user, 'role', None)
    logger.info(f"User {user.email} has role: {user_role}")
    return user_role in ['super_admin', 'admin']  # Allow both super_admin and admin

class DatasetListView(APIView):
    """List all datasets with details for admin management"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            logger.info(f"Dataset list requested by user: {request.user.email}")
            
            # Check admin permission
            if not check_super_admin_permission(request.user):
                logger.warning(f"Access denied for user {request.user.email} with role {getattr(request.user, 'role', 'unknown')}")
                return Response({
                    'success': False,
                    'error': 'Admin privileges required for data management',
                    'user_role': getattr(request.user, 'role', 'unknown')
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get user's company or allow super admin to see all
            user_company = getattr(request.user, 'company_name', 'default_company')
            user_role = getattr(request.user, 'role', 'user')
            
            # Super admin can see all company data, regular admin only their company
            if user_role == 'super_admin':
                datasets = SecurityDataUpload.objects.all()
                logger.info(f"Super admin accessing all datasets")
            else:
                datasets = SecurityDataUpload.objects.filter(company_name=user_company)
                logger.info(f"Admin accessing company datasets for: {user_company}")
            
            # Order by upload date (newest first)
            datasets = datasets.order_by('-uploaded_at').select_related('uploaded_by', 'activated_by')
            
            dataset_list = []
            for dataset in datasets:
                dataset_info = {
                    'upload_id': dataset.id,
                    'tool_type': dataset.tool_type,
                    'file_name': dataset.file_name,
                    'file_size': dataset.file_size,
                    'uploaded_at': dataset.uploaded_at.isoformat(),
                    'uploaded_by': {
                        'name': f"{dataset.uploaded_by.first_name} {dataset.uploaded_by.last_name}",
                        'email': dataset.uploaded_by.email
                    },
                    'is_active': dataset.is_active,
                    'status': dataset.status,
                    'company_name': dataset.company_name
                }
                
                # Add activation info if available
                if dataset.activated_at and dataset.activated_by:
                    dataset_info.update({
                        'activated_at': dataset.activated_at.isoformat(),
                        'activated_by': {
                            'name': f"{dataset.activated_by.first_name} {dataset.activated_by.last_name}",
                            'email': dataset.activated_by.email
                        }
                    })
                
                dataset_list.append(dataset_info)
            
            logger.info(f"Returning {len(dataset_list)} datasets to user {request.user.email}")
            
            return Response({
                'success': True,
                'datasets': dataset_list,
                'total_count': len(dataset_list),
                'user_company': user_company,
                'viewing_scope': 'all_companies' if user_role == 'super_admin' else 'company_only'
            })
            
        except Exception as e:
            logger.error(f"Error fetching datasets: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to fetch datasets: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DataStatsView(APIView):
    """Get comprehensive data statistics for admin dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            logger.info(f"Data stats requested by user: {request.user.email}")
            
            # Check admin permission
            if not check_super_admin_permission(request.user):
                return Response({
                    'success': False,
                    'error': 'Admin privileges required for data statistics',
                    'user_role': getattr(request.user, 'role', 'unknown')
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get user's company or allow super admin to see all
            user_company = getattr(request.user, 'company_name', 'default_company')
            user_role = getattr(request.user, 'role', 'user')
            
            # Base queryset - super admin sees all, regular admin sees company only
            if user_role == 'super_admin':
                base_queryset = SecurityDataUpload.objects.all()
            else:
                base_queryset = SecurityDataUpload.objects.filter(company_name=user_company)
            
            # Calculate basic statistics
            total_datasets = base_queryset.count()
            active_datasets = base_queryset.filter(is_active=True).count()
            total_storage = base_queryset.aggregate(total_size=Sum('file_size'))['total_size'] or 0
            tools_with_data = list(base_queryset.values_list('tool_type', flat=True).distinct())
            
            stats = {
                'total_datasets': total_datasets,
                'active_datasets': active_datasets,
                'total_storage_mb': float(total_storage) / (1024 * 1024),
                'tools_with_data': tools_with_data,
                'datasets_by_tool': {},
                'datasets_by_status': {},
                'datasets_by_company': {}
            }
            
            # Get datasets by tool type
            tool_stats = base_queryset.values('tool_type').annotate(
                count=Count('id'),
                active_count=Count('id', filter=Q(is_active=True))
            )
            
            for tool in tool_stats:
                stats['datasets_by_tool'][tool['tool_type']] = {
                    'total': tool['count'],
                    'active': tool['active_count']
                }
            
            # Get datasets by status
            status_stats = base_queryset.values('status').annotate(count=Count('id'))
            for status_item in status_stats:
                stats['datasets_by_status'][status_item['status']] = status_item['count']
            
            # Get datasets by company (only for super admin)
            if user_role == 'super_admin':
                company_stats = base_queryset.values('company_name').annotate(
                    count=Count('id'),
                    active_count=Count('id', filter=Q(is_active=True))
                )
                for company in company_stats:
                    stats['datasets_by_company'][company['company_name']] = {
                        'total': company['count'],
                        'active': company['active_count']
                    }
            
            # Add date range info
            oldest_dataset = base_queryset.order_by('uploaded_at').first()
            newest_dataset = base_queryset.order_by('-uploaded_at').first()
            
            if oldest_dataset:
                stats['oldest_dataset'] = oldest_dataset.uploaded_at.isoformat()
            if newest_dataset:
                stats['newest_dataset'] = newest_dataset.uploaded_at.isoformat()
            
            logger.info(f"Returning stats to user {request.user.email}: {total_datasets} datasets")
            
            return Response({
                'success': True,
                'stats': stats,
                'generated_at': timezone.now().isoformat(),
                'viewing_scope': 'all_companies' if user_role == 'super_admin' else 'company_only'
            })
            
        except Exception as e:
            logger.error(f"Error calculating data stats: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to calculate statistics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetAllDataView(APIView):
    """Reset all data - delete all datasets and related records"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            logger.info(f"Reset all data requested by user: {request.user.email}")
            logger.info(f"Request body: {request.body}")
            
            # Check admin permission
            if not check_super_admin_permission(request.user):
                logger.warning(f"Access denied for reset operation by user {request.user.email}")
                return Response({
                    'success': False,
                    'error': 'Admin privileges required for data reset',
                    'user_role': getattr(request.user, 'role', 'unknown')
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Parse request data
            try:
                if request.content_type == 'application/json':
                    request_data = json.loads(request.body) if request.body else {}
                else:
                    request_data = request.data
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {str(e)}")
                return Response({
                    'success': False,
                    'message': 'Invalid JSON in request body'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get confirmation from request
            confirm = request_data.get('confirm', False)
            target_scope = request_data.get('scope', 'company')  # 'company' or 'all'
            
            logger.info(f"Reset parameters: confirm={confirm}, scope={target_scope}")
            
            if not confirm:
                return Response({
                    'success': False,
                    'message': 'Confirmation required. Set confirm=true to proceed.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Determine what to delete based on user role and scope
            user_company = getattr(request.user, 'company_name', 'default_company')
            user_role = getattr(request.user, 'role', 'user')
            
            with transaction.atomic():
                if user_role == 'super_admin' and target_scope == 'all':
                    # Super admin can delete ALL data from ALL companies
                    datasets_to_delete = SecurityDataUpload.objects.all()
                    scope_description = "all companies"
                    logger.warning(f"CRITICAL: Super admin {request.user.email} requested deletion of ALL system data")
                else:
                    # Delete only company data (default for admin, forced for regular users)
                    datasets_to_delete = SecurityDataUpload.objects.filter(company_name=user_company)
                    scope_description = f"company '{user_company}'"
                    logger.warning(f"Admin {request.user.email} requested deletion of company data: {user_company}")
                
                # Count before deletion
                delete_count = datasets_to_delete.count()
                tool_types = list(datasets_to_delete.values_list('tool_type', flat=True).distinct())
                
                logger.info(f"About to delete {delete_count} datasets of types: {tool_types}")
                
                if delete_count == 0:
                    return Response({
                        'success': True,
                        'message': 'No datasets found to delete',
                        'deleted_count': 0,
                        'scope': scope_description
                    })
                
                # Get dataset IDs for logging
                dataset_ids = list(datasets_to_delete.values_list('id', flat=True))
                
                # Delete related access logs first (cascade should handle this, but being explicit)
                access_logs_deleted = DataAccessLog.objects.filter(upload__in=dataset_ids).count()
                DataAccessLog.objects.filter(upload__in=dataset_ids).delete()
                
                # Delete notifications related to these datasets
                notifications_deleted = DataNotification.objects.filter(upload__in=dataset_ids).count()
                DataNotification.objects.filter(upload__in=dataset_ids).delete()
                
                # Delete the datasets (this will cascade to related objects)
                datasets_to_delete.delete()
                
                # Log the successful operation
                logger.warning(
                    f"SUCCESS: User {request.user.email} deleted {delete_count} datasets "
                    f"for {scope_description} - Tools: {', '.join(tool_types)} - "
                    f"Also deleted {access_logs_deleted} access logs and {notifications_deleted} notifications"
                )
                
                return Response({
                    'success': True,
                    'message': f'Successfully deleted all data for {scope_description}',
                    'deleted_count': delete_count,
                    'deleted_tools': tool_types,
                    'scope': scope_description,
                    'also_deleted': {
                        'access_logs': access_logs_deleted,
                        'notifications': notifications_deleted
                    },
                    'reset_by': {
                        'name': f"{request.user.first_name} {request.user.last_name}",
                        'email': request.user.email,
                        'role': user_role
                    },
                    'reset_at': timezone.now().isoformat()
                })
                
        except Exception as e:
            logger.error(f"Error resetting data: {str(e)}", exc_info=True)
            return Response({
                'success': False,
                'message': f'Failed to reset data: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DataCompanyTransferView(APIView):
    """Transfer datasets between companies (Super Admin only)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            logger.info(f"Data transfer requested by user: {request.user.email}")
            
            # Check super admin permission (only super admin can transfer between companies)
            if getattr(request.user, 'role', None) != 'super_admin':
                return Response({
                    'success': False,
                    'error': 'Super Admin privileges required for data transfer',
                    'user_role': getattr(request.user, 'role', 'unknown')
                }, status=status.HTTP_403_FORBIDDEN)
            
            upload_ids = request.data.get('upload_ids', [])
            target_company = request.data.get('target_company', '').strip()
            
            if not upload_ids or not target_company:
                return Response({
                    'success': False,
                    'message': 'upload_ids and target_company are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            with transaction.atomic():
                # Update datasets
                updated_count = SecurityDataUpload.objects.filter(
                    id__in=upload_ids
                ).update(company_name=target_company)
                
                # Log the transfer
                logger.warning(
                    f"Super admin {request.user.email} transferred {updated_count} datasets "
                    f"to company '{target_company}'"
                )
                
                return Response({
                    'success': True,
                    'message': f'Successfully transferred {updated_count} datasets to {target_company}',
                    'transferred_count': updated_count,
                    'target_company': target_company
                })
                
        except Exception as e:
            logger.error(f"Error transferring data: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to transfer data: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CompanySpecificUploadView(APIView):
    """Upload data for a specific company (Admin and Super Admin)"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    
    def get(self, request):
        """Get list of available companies for upload selection"""
        try:
            logger.info(f"Company list requested by user: {request.user.email}")
            
            # Check admin permission
            if not check_super_admin_permission(request.user):
                return Response({
                    'success': False,
                    'error': 'Admin privileges required',
                    'user_role': getattr(request.user, 'role', 'unknown')
                }, status=status.HTTP_403_FORBIDDEN)
            
            user_role = getattr(request.user, 'role', 'user')
            user_company = getattr(request.user, 'company_name', 'default_company')
            
            # Get unique company names from existing users
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            if user_role == 'super_admin':
                # Super admin can see all companies
                companies = User.objects.values_list('company_name', flat=True).distinct()
                companies = [c for c in companies if c and c.strip()]
                logger.info(f"Super admin accessing all companies: {len(companies)} found")
            else:
                # Regular admin can only upload for their own company
                companies = [user_company] if user_company else []
                logger.info(f"Admin accessing own company: {user_company}")
            
            return Response({
                'success': True,
                'companies': sorted(companies),
                'user_company': user_company,
                'user_role': user_role,
                'can_select_company': user_role == 'super_admin'
            })
            
        except Exception as e:
            logger.error(f"Error fetching companies: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to fetch companies: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Upload data for a specific company"""
        try:
            print("=== COMPANY SPECIFIC UPLOAD REQUEST ===")
            print(f"Request method: {request.method}")
            print(f"Request path: {request.path}")
            print(f"Request data keys: {list(request.data.keys())}")
            print(f"Request FILES: {list(request.FILES.keys())}")
            logger.info(f"Company-specific upload requested by user: {request.user.email}")
            logger.info(f"Request path: {request.path}")
            
            # Check admin permission
            if not check_super_admin_permission(request.user):
                print(f"ADMIN PERMISSION DENIED: User {request.user.email} role: {getattr(request.user, 'role', 'unknown')}")
                return Response({
                    'success': False,
                    'error': 'Admin privileges required for data uploads',
                    'user_role': getattr(request.user, 'role', 'unknown')
                }, status=status.HTTP_403_FORBIDDEN)
            
            file = request.FILES.get('file')
            tool_type = request.data.get('tool_type', '').lower()
            target_company = request.data.get('target_company', '').strip()
            auto_activate = request.data.get('auto_activate', True)
            
            if not file:
                return Response({
                    'success': False,
                    'message': 'No file provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not target_company:
                return Response({
                    'success': False,
                    'message': 'Target company is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user_role = getattr(request.user, 'role', 'user')
            user_company = getattr(request.user, 'company_name', 'default_company')
            
            # Validate company selection permissions
            if user_role != 'super_admin' and target_company != user_company:
                return Response({
                    'success': False,
                    'message': 'You can only upload data for your own company',
                    'user_company': user_company,
                    'requested_company': target_company
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Validate that target company exists
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            company_exists = User.objects.filter(company_name=target_company).exists()
            if not company_exists:
                return Response({
                    'success': False,
                    'message': f'No users found for company: {target_company}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"ADMIN PROCESSING: {tool_type} file upload for company: {target_company}")
            logger.info(f"Processing {tool_type} file upload for company: {target_company}")
            
            # Use the universal upload logic but override company
            from ..views.universal import UniversalUploadView
            
            # Create a modified request with the target company
            # We need to temporarily override the user's company for the upload
            original_company = getattr(request.user, 'company_name', 'default_company')
            request.user.company_name = target_company
            
            print(f"ADMIN DELEGATING: Calling UniversalUploadView with tool_type='{tool_type}'")
            
            # Process the upload
            universal_view = UniversalUploadView()
            response = universal_view.post(request)
            
            print(f"ADMIN RESPONSE: Status {response.status_code}, Success: {response.data.get('success') if hasattr(response, 'data') else 'N/A'}")
            
            # Restore original company
            request.user.company_name = original_company
            
            # Add company-specific information to response
            if response.status_code == 201 and response.data.get('success'):
                response.data['data']['target_company'] = target_company
                response.data['data']['uploaded_by_company'] = user_company
                response.data['data']['cross_company_upload'] = (target_company != user_company)
                
                logger.info(f"Successfully uploaded {tool_type} data for company {target_company}")
            
            return response
            
        except Exception as e:
            logger.error(f"Error in company-specific upload: {str(e)}")
            return Response({
                'success': False,
                'message': f'Upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)