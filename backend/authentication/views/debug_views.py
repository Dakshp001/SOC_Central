# backend/authentication/views/debug_views.py
"""
Debug and Testing Views
Handles debugging endpoints for development and testing
REMOVE THESE IN PRODUCTION
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

from ..models import PasswordResetToken
from ..services import EmailService

import logging
import os

logger = logging.getLogger(__name__)

# ==========================================
# DEBUG VIEWS (REMOVE IN PRODUCTION)
# ==========================================

@api_view(['GET'])
@permission_classes([AllowAny])
def debug_password_reset_system(request):
    """Debug the entire password reset system"""
    try:
        # Basic system info
        debug_info = {
            'system_status': {
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'NOT SET'),
                'debug_mode': settings.DEBUG,
                'allowed_hosts': settings.ALLOWED_HOSTS,
                'current_host': request.get_host(),
                'request_url': request.build_absolute_uri(),
            },
            'database_status': {
                'active_reset_tokens': PasswordResetToken.objects.filter(is_used=False).count(),
                'total_reset_tokens': PasswordResetToken.objects.count(),
            },
            'email_config': {
                'backend': settings.EMAIL_BACKEND,
                'host': getattr(settings, 'EMAIL_HOST', 'NOT SET'),
                'from_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'NOT SET'),
            }
        }
        
        # Test token URL generation
        try:
            test_token = "8iCfUCBaHjr2ODRxk2ISfBNpTmLKtSRt6OhD55yLKow"  # Your actual token
            email_service = EmailService()
            test_url = f"{email_service.frontend_url}/reset-password/{test_token}"
            debug_info['url_generation'] = {
                'test_token': test_token,
                'generated_url': test_url,
                'email_service_frontend_url': email_service.frontend_url,
            }
        except Exception as e:
            debug_info['url_generation_error'] = str(e)
        
        # Check if your specific token exists
        try:
            token_obj = PasswordResetToken.objects.get(token="8iCfUCBaHjr2ODRxk2ISfBNpTmLKtSRt6OhD55yLKow")
            debug_info['your_token_status'] = {
                'exists': True,
                'is_used': token_obj.is_used,
                'is_valid': token_obj.is_valid(),
                'created_at': token_obj.created_at.isoformat(),
                'user_email': token_obj.user.email,
                'expires_at': token_obj.expires_at.isoformat() if hasattr(token_obj, 'expires_at') else 'No expiry field'
            }
        except PasswordResetToken.DoesNotExist:
            debug_info['your_token_status'] = {
                'exists': False,
                'message': 'Token not found in database'
            }
        except Exception as e:
            debug_info['your_token_status'] = {
                'error': str(e)
            }
        
        return Response({
            'success': True,
            'message': 'Password reset system debug complete',
            'debug_info': debug_info
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Debug endpoint failed'
        }, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def test_password_reset_api(request):
    """Test the password reset API with provided data"""
    try:
        # Get the actual token from your URL
        test_token = request.data.get('token', '8iCfUCBaHjr2ODRxk2ISfBNpTmLKtSRt6OhD55yLKow')
        test_password = request.data.get('password', 'TestPassword123!')
        
        # Simulate the exact API call your frontend makes
        debug_steps = []
        
        # Step 1: Find token
        try:
            reset_token = PasswordResetToken.objects.get(token=test_token, is_used=False)
            debug_steps.append(f"✅ Token found for user: {reset_token.user.email}")
        except PasswordResetToken.DoesNotExist:
            debug_steps.append("❌ Token not found or already used")
            return Response({
                'success': False,
                'message': 'Token not found',
                'debug_steps': debug_steps
            })
        
        # Step 2: Check validity
        if reset_token.is_valid():
            debug_steps.append("✅ Token is valid (not expired)")
        else:
            debug_steps.append("❌ Token has expired")
            return Response({
                'success': False,
                'message': 'Token expired',
                'debug_steps': debug_steps
            })
        
        # Step 3: Validate password
        try:
            validate_password(test_password, reset_token.user)
            debug_steps.append("✅ Password validation passed")
        except ValidationError as e:
            debug_steps.append(f"❌ Password validation failed: {e.messages}")
            return Response({
                'success': False,
                'message': 'Password validation failed',
                'debug_steps': debug_steps
            })
        
        # Step 4: Simulate password reset (without actually changing it)
        debug_steps.append("✅ Password reset would succeed")
        
        return Response({
            'success': True,
            'message': 'Password reset test completed successfully',
            'debug_steps': debug_steps,
            'token_info': {
                'user_email': reset_token.user.email,
                'created_at': reset_token.created_at.isoformat(),
                'is_used': reset_token.is_used
            }
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Test API failed'
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def debug_system_info(request):
    """Debug endpoint to check system configuration"""
    try:
        from django.urls import reverse
        
        debug_info = {
            'system_info': {
                'debug_mode': settings.DEBUG,
                'allowed_hosts': settings.ALLOWED_HOSTS,
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'NOT SET'),
                'current_host': request.get_host(),
                'request_url': request.build_absolute_uri(),
                'request_method': request.method,
                'request_path': request.path,
            },
            'environment_vars': {
                'FRONTEND_URL': os.environ.get('FRONTEND_URL', 'NOT SET'),
                'API_BASE_URL': os.environ.get('API_BASE_URL', 'NOT SET'),
                'ALLOWED_HOSTS': os.environ.get('ALLOWED_HOSTS', 'NOT SET'),
                'DEBUG': os.environ.get('DEBUG', 'NOT SET'),
            },
            'cors_config': {
                'cors_allowed_origins': getattr(settings, 'CORS_ALLOWED_ORIGINS', []),
                'cors_allow_all_origins': getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False),
                'cors_allow_credentials': getattr(settings, 'CORS_ALLOW_CREDENTIALS', False),
            },
            'available_endpoints': [
                '/api/auth/health/',
                '/api/auth/login/',
                '/api/auth/users/',
                '/api/auth/reset-password-confirm/',
                '/api/auth/debug/system-info/',
            ],
            'middleware_info': {
                'middleware_classes': [str(m) for m in settings.MIDDLEWARE],
            }
        }
        
        # Test database connection
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                debug_info['database_status'] = 'Connected'
        except Exception as e:
            debug_info['database_status'] = f'Error: {str(e)}'
        
        return Response({
            'success': True,
            'debug_info': debug_info,
            'timestamp': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'Debug endpoint failed'
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def debug_urls(request):
    """Debug endpoint to check URL configuration in production"""
    try:
        debug_info = {
            'frontend_url': getattr(settings, 'FRONTEND_URL', 'NOT SET'),
            'api_base_url': getattr(settings, 'API_BASE_URL', 'NOT SET'),
            'debug_mode': settings.DEBUG,
            'allowed_hosts': settings.ALLOWED_HOSTS,
            'current_host': request.get_host(),
            'request_url': request.build_absolute_uri(),
        }
        
        # Test EmailService
        try:
            email_service = EmailService()
            debug_info['email_service_frontend_url'] = email_service.frontend_url
        except Exception as e:
            debug_info['email_service_error'] = str(e)
        
        # Test token URL generation
        try:
            test_token = "test-token-123"
            test_url = f"{settings.FRONTEND_URL}/reset-password/{test_token}"
            debug_info['sample_reset_url'] = test_url
        except Exception as e:
            debug_info['url_generation_error'] = str(e)
        
        return Response({
            'success': True,
            'debug_info': debug_info
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def test_reset_url_generation(request):
    """Test password reset URL generation without authentication"""
    try:
        # Test token
        test_token = "sample-token-123"
        
        # Generate URL using the same method as the actual reset
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{test_token}"
        
        return Response({
            'success': True,
            'test_data': {
                'frontend_url': getattr(settings, 'FRONTEND_URL', 'NOT SET'),
                'sample_token': test_token,
                'generated_reset_url': reset_url,
                'url_components': {
                    'base': settings.FRONTEND_URL,
                    'path': f'/reset-password/{test_token}'
                }
            },
            'message': 'URL generation test successful'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'message': 'URL generation test failed'
        }, status=500)