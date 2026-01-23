# backend/tool/gsuite/views.py - MEMORY OPTIMIZED VERSION

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.core.files.uploadedfile import InMemoryUploadedFile, TemporaryUploadedFile
import logging
import gc

# Fixed imports - avoid circular dependencies
from .processor import process_gsuite_excel
from ..models import SecurityDataUpload, DataNotification, DataAccessLog

logger = logging.getLogger(__name__)

def check_admin_permission(user):
    """Check if user has admin or super_admin role"""
    if not user or not user.is_authenticated:
        return False
    
    user_role = getattr(user, 'role', None)
    return user_role in ['admin', 'super_admin']

class GSuiteUploadView(APIView):
    """Enhanced GSuite upload view with database persistence"""
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]
    tool_name = "gsuite"

    def post(self, request, *args, **kwargs):
        # Check admin permission
        if not check_admin_permission(request.user):
            return Response({
                'success': False,
                'error': 'Admin privileges required for file uploads',
                'user_role': getattr(request.user, 'role', 'unknown')
            }, status=status.HTTP_403_FORBIDDEN)
        
        logger.info(f"GSuite upload authorized for user: {request.user.email} (Role: {getattr(request.user, 'role', 'unknown')})")
        
        try:
            uploaded_file = request.FILES.get("file")
            if not uploaded_file:
                return Response({
                    'success': False,
                    'error': 'No file provided'
                }, status=status.HTTP_400_BAD_REQUEST)

            if not uploaded_file.name.endswith(('.xlsx', '.xls')):
                return Response({
                    'success': False,
                    'error': 'Invalid file format. Please upload an Excel file.'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get user's company for data sharing - with fallback
            user_company = getattr(request.user, 'company_name', 'default_company')
            if not user_company:
                user_company = 'default_company'
            
            logger.info(f"Processing GSuite file: {uploaded_file.name} ({uploaded_file.size} bytes) for company: {user_company}")

            # Reset file position to ensure clean read
            uploaded_file.seek(0)
            
            # Force garbage collection before processing large files
            if uploaded_file.size > 10 * 1024 * 1024:  # 10MB+
                logger.info("Large file detected, forcing garbage collection")
                gc.collect()
            
            with transaction.atomic():
                # Process the file using the enhanced processor
                try:
                    result = process_gsuite_excel(uploaded_file)
                finally:
                    # Ensure file is properly closed and cleaned up
                    if hasattr(uploaded_file, 'close'):
                        uploaded_file.close()
                    # Force garbage collection after processing
                    gc.collect()
                
                if "error" in result:
                    logger.error(f"GSuite processing failed: {result['error']}")
                    return Response({
                        'success': False,
                        'error': f"Processing failed: {result['error']}"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Save to database with enhanced metadata
                upload = SecurityDataUpload.objects.create(
                    tool_type='gsuite',
                    file_name=uploaded_file.name,
                    file_size=uploaded_file.size,
                    uploaded_by=request.user,
                    company_name=user_company,
                    processed_data=result,
                    sheet_names=result.get('rawSheetNames', []),
                    status='completed',
                    processed_at=timezone.now(),
                    is_public_to_company=True
                )
                
                # Auto-activate the dataset for company-wide access
                upload.activate(request.user)
                
                # Notify all company users about new active data
                self._notify_company_users(upload, 'data_activated')
                
                # Log the upload - using correct access_type
                DataAccessLog.objects.create(
                    upload=upload,
                    user=request.user,
                    access_type='view'  # Using valid choice from model
                )
                
                logger.info(f"Successfully saved and activated GSuite data for {user_company}")
                
                # Enhanced response with database metadata
                enhanced_result = {
                    **result,
                    'success': True,
                    'upload_id': upload.id,
                    'is_active': upload.is_active,
                    'uploaded_at': upload.uploaded_at.isoformat(),
                    'company_name': user_company,
                    'uploaded_by': {
                        'name': f"{request.user.first_name} {request.user.last_name}",
                        'email': request.user.email
                    }
                }
                
                return Response(enhanced_result, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Critical error in GSuite upload: {str(e)}")
            return Response({
                'success': False,
                'error': f"Upload failed: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _notify_company_users(self, upload, notification_type):
        """Notify all company users about data changes"""
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Get all users from the same company except the uploader
            company_users = User.objects.filter(
                company_name=upload.company_name
            ).exclude(id=upload.uploaded_by.id)
            
            # Add is_email_verified filter only if the field exists
            if hasattr(User, 'is_email_verified'):
                company_users = company_users.filter(is_email_verified=True)
            
            notifications = []
            for user in company_users:
                notifications.append(DataNotification(
                    recipient=user,
                    notification_type=notification_type,
                    title=f"New GSuite Data Available! 📊",
                    message=f"{upload.uploaded_by.first_name} {upload.uploaded_by.last_name} uploaded new GSuite security data with {upload.processed_data.get('kpis', {}).get('emailsScanned', 0)} emails scanned",
                    upload=upload
                ))
            
            if notifications:
                DataNotification.objects.bulk_create(notifications)
                logger.info(f"Created {len(notifications)} notifications for company users")
        except Exception as e:
            logger.warning(f"Failed to create notifications: {str(e)}")


class GSuiteActiveDataView(APIView):
    """Get active GSuite data for the user's company"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user_company = getattr(request.user, 'company_name', 'default_company')
            if not user_company:
                user_company = 'default_company'
            
            # Get active GSuite dataset for the user's company
            active_upload = SecurityDataUpload.get_active_data('gsuite', user_company)
            
            if not active_upload:
                return Response({
                    'success': True,
                    'message': 'No active GSuite data found',
                    'data': None
                })
            
            # Log access
            DataAccessLog.objects.create(
                upload=active_upload,
                user=request.user,
                access_type='view'
            )
            
            # Return the processed data
            response_data = {
                'success': True,
                'data': {
                    'upload_id': active_upload.id,
                    'data': active_upload.processed_data,
                    'file_name': active_upload.file_name,
                    'uploaded_by': {
                        'name': f"{active_upload.uploaded_by.first_name} {active_upload.uploaded_by.last_name}",
                        'email': active_upload.uploaded_by.email
                    },
                    'uploaded_at': active_upload.uploaded_at.isoformat(),
                    'activated_at': active_upload.activated_at.isoformat() if active_upload.activated_at else None,
                    'activated_by': {
                        'name': f"{active_upload.activated_by.first_name} {active_upload.activated_by.last_name}",
                        'email': active_upload.activated_by.email
                    } if active_upload.activated_by else None
                },
                'company_name': user_company
            }
            
            logger.info(f"Served active GSuite data to {request.user.email}")
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Error fetching active GSuite data: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to fetch active GSuite data'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)