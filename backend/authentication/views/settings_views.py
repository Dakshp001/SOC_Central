# backend/authentication/views/settings_views.py
"""
User Settings Management Views
Handles user settings, preferences, activity logs, 2FA, and data export
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from ..utils import get_client_ip, get_user_agent

import logging

logger = logging.getLogger(__name__)

# ==========================================
# USER SETTINGS VIEWS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_settings(request):
    """Get user settings and preferences"""
    try:
        from ..models_settings import UserSettings
        
        settings = UserSettings.get_or_create_for_user(request.user)
        
        return Response({
            'success': True,
            'settings': settings.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error getting user settings for {request.user.email}: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Failed to retrieve settings'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_settings(request):
    """Update user settings and preferences"""
    try:
        from ..models_settings import UserSettings, UserActivityLog
        
        settings = UserSettings.get_or_create_for_user(request.user)
        
        # Log the settings change
        UserActivityLog.objects.create(
            user=request.user,
            action='settings_change',
            description='User updated their settings',
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request),
            metadata={'updated_fields': list(request.data.keys())}
        )
        
        # Update settings from request data
        settings.update_from_dict(request.data)
        
        logger.info(f"Settings updated for user: {request.user.email}")
        
        return Response({
            'success': True,
            'message': 'Settings updated successfully',
            'settings': settings.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error updating user settings for {request.user.email}: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Failed to update settings'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_user_settings(request):
    """Reset user settings to defaults"""
    try:
        from ..models_settings import UserSettings, UserActivityLog
        
        settings = UserSettings.get_or_create_for_user(request.user)
        
        # Reset to defaults
        settings.email_notifications = True
        settings.push_notifications = True
        settings.security_alerts = True
        settings.product_updates = False
        settings.marketing_emails = False
        settings.login_notifications = True
        settings.profile_visibility = 'team'
        settings.activity_tracking = True
        settings.analytics_sharing = False
        settings.theme = 'system'
        settings.language = 'en'
        settings.timezone = 'UTC'
        settings.date_format = 'MM/DD/YYYY'
        settings.default_view = 'dashboard'
        settings.two_factor_enabled = False
        settings.session_timeout = 300  # Changed default from 60 seconds (1 minute) to 300 seconds (5 minutes)
        settings.advanced_settings = {}
        settings.save()
        
        # Log the reset
        UserActivityLog.objects.create(
            user=request.user,
            action='settings_change',
            description='User reset settings to defaults',
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        logger.info(f"Settings reset to defaults for user: {request.user.email}")
        
        return Response({
            'success': True,
            'message': 'Settings reset to defaults successfully',
            'settings': settings.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Error resetting user settings for {request.user.email}: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Failed to reset settings'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_user_data(request):
    """Export user data including settings, profile, and activity logs"""
    try:
        from ..models_settings import UserSettings, UserActivityLog
        
        user = request.user
        settings = UserSettings.get_or_create_for_user(user)
        
        # Gather all user data
        user_data = {
            'profile': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'company_name': user.company_name,
                'job_title': user.job_title,
                'department': user.department,
                'role': user.role,
                'is_active': user.is_active,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'last_login': user.last_login.isoformat() if user.last_login else None,
            },
            'settings': settings.to_dict(),
            'activity_logs': [
                {
                    'action': log.action,
                    'description': log.description,
                    'timestamp': log.timestamp.isoformat(),
                    'ip_address': log.ip_address,
                    'metadata': log.metadata
                }
                for log in UserActivityLog.objects.filter(user=user).order_by('-timestamp')[:100]
            ],
            'export_info': {
                'exported_at': timezone.now().isoformat(),
                'export_type': 'full_user_data',
                'version': '1.0'
            }
        }
        
        # Log the export
        UserActivityLog.objects.create(
            user=user,
            action='data_export',
            description='User exported their data',
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        logger.info(f"Data exported for user: {user.email}")
        
        return Response({
            'success': True,
            'message': 'Data exported successfully',
            'data': user_data
        })
        
    except Exception as e:
        logger.error(f"Error exporting user data for {request.user.email}: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Failed to export data'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_activity_logs(request):
    """Get user activity logs"""
    try:
        from ..models_settings import UserActivityLog
        
        # Get pagination parameters
        page = int(request.GET.get('page', 1))
        limit = min(int(request.GET.get('limit', 50)), 100)  # Max 100 per page
        offset = (page - 1) * limit
        
        # Get logs
        logs = UserActivityLog.objects.filter(user=request.user).order_by('-timestamp')
        total_count = logs.count()
        logs_page = logs[offset:offset + limit]
        
        logs_data = [
            {
                'id': log.id,
                'action': log.action,
                'description': log.description,
                'timestamp': log.timestamp.isoformat(),
                'ip_address': log.ip_address,
                'user_agent': log.user_agent,
                'metadata': log.metadata
            }
            for log in logs_page
        ]
        
        return Response({
            'success': True,
            'logs': logs_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting activity logs for {request.user.email}: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Failed to retrieve activity logs'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enable_two_factor_auth(request):
    """Enable two-factor authentication for user"""
    try:
        from ..models_settings import UserSettings, UserActivityLog
        
        settings = UserSettings.get_or_create_for_user(request.user)
        
        # For now, just toggle the setting
        # In a real implementation, you'd generate QR codes, verify TOTP, etc.
        settings.two_factor_enabled = True
        settings.save()
        
        # Log the security change
        UserActivityLog.objects.create(
            user=request.user,
            action='security_event',
            description='Two-factor authentication enabled',
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        logger.info(f"2FA enabled for user: {request.user.email}")
        
        return Response({
            'success': True,
            'message': 'Two-factor authentication enabled successfully',
            'qr_code_url': 'data:image/png;base64,placeholder',  # Placeholder
            'backup_codes': ['123456', '789012', '345678']  # Placeholder
        })
        
    except Exception as e:
        logger.error(f"Error enabling 2FA for {request.user.email}: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Failed to enable two-factor authentication'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_two_factor_auth(request):
    """Disable two-factor authentication for user"""
    try:
        from ..models_settings import UserSettings, UserActivityLog
        
        settings = UserSettings.get_or_create_for_user(request.user)
        settings.two_factor_enabled = False
        settings.save()
        
        # Log the security change
        UserActivityLog.objects.create(
            user=request.user,
            action='security_event',
            description='Two-factor authentication disabled',
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        logger.info(f"2FA disabled for user: {request.user.email}")
        
        return Response({
            'success': True,
            'message': 'Two-factor authentication disabled successfully'
        })
        
    except Exception as e:
        logger.error(f"Error disabling 2FA for {request.user.email}: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Failed to disable two-factor authentication'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)