# backend/authentication/views/activation.py - FIXED VERSION
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings
import logging

from ..models import User, PasswordResetToken, UserSession
from ..utils import get_client_ip, get_user_agent

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def activate_account(request):
    """
    Activate a user account with a token and set initial password
    This is specifically for new users who received an activation link
    """
    
    # ENHANCED: Add extensive logging
    logger.info(f"ACTIVATION REQUEST: {request.method} {request.path}")
    logger.info(f"   Content-Type: {request.content_type}")
    logger.info(f"   IP: {get_client_ip(request)}")
    logger.info(f"   Data keys: {list(request.data.keys()) if request.data else 'No data'}")
    
    token = request.data.get('token')
    new_password = request.data.get('password')  # Frontend sends 'password'
    confirm_password = request.data.get('confirm_password')
    
    if not token:
        logger.error("No activation token provided")
        return Response({
            'success': False,
            'message': 'Activation token is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not new_password or not confirm_password:
        logger.error("Missing password fields")
        return Response({
            'success': False,
            'message': 'Password and confirmation are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        logger.error("Passwords don't match")
        return Response({
            'success': False,
            'message': 'Passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Validate password strength
        validate_password(new_password)
        logger.info("Password validation passed")
    except ValidationError as e:
        logger.error(f"Password validation failed: {e}")
        return Response({
            'success': False,
            'message': 'Password validation failed',
            'errors': list(e.messages)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        #  CRITICAL FIX: Remove token_type filter or make it optional
        logger.info(f" Searching for token: {token[:20]}...")
        
        # Try with token_type first (for new tokens)
        reset_token = PasswordResetToken.objects.filter(
            token=token,
            token_type='activation',
            is_used=False
        ).first()
        
        # If not found, try without token_type (for legacy tokens)
        if not reset_token:
            logger.info(" Token not found with activation type, trying without type filter...")
            reset_token = PasswordResetToken.objects.filter(
                token=token,
                is_used=False
            ).first()
            
            if reset_token:
                logger.info(f" Found token without type filter. Token type: {getattr(reset_token, 'token_type', 'None')}")
        
        if not reset_token:
            logger.warning(f" No valid token found for: {token[:20]}...")
            
            #  DEBUG: Check what tokens exist
            all_tokens = PasswordResetToken.objects.filter(token=token)
            logger.info(f" DEBUG: Found {all_tokens.count()} tokens with this value")
            for t in all_tokens:
                logger.info(f"   Token: {t.token[:20]}..., Type: {getattr(t, 'token_type', 'None')}, Used: {t.is_used}, Created: {t.created_at}")
            
            return Response({
                'success': False,
                'message': 'Invalid or expired activation link'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f" Token found: {reset_token.user.email}")
        
        # Check if token is expired (24 hours for activation)
        expiry_hours = getattr(settings, 'ACTIVATION_TOKEN_EXPIRY_HOURS', 24)
        if reset_token.created_at < timezone.now() - timezone.timedelta(hours=expiry_hours):
            logger.warning(f" Token expired for user: {reset_token.user.email}")
            reset_token.is_used = True
            reset_token.save()
            return Response({
                'success': False,
                'message': 'Activation link has expired. Please contact your administrator.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = reset_token.user
        logger.info(f" User details: {user.email}, Active: {user.is_active}, Verified: {user.is_email_verified}")
        
        # Verify user can be activated
        if user.is_email_verified and user.has_usable_password():
            logger.warning(f" Account already activated: {user.email}")
            return Response({
                'success': False,
                'message': 'Account is already activated'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Activate the user account
        logger.info(f" Activating account for: {user.email}")
        user.set_password(new_password)
        user.is_email_verified = True
        user.is_active = True
        user.save(update_fields=['password', 'is_email_verified', 'is_active'])
        
        # Mark token as used
        reset_token.is_used = True
        reset_token.used_at = timezone.now()
        reset_token.save(update_fields=['is_used', 'used_at'])
        
        # Create initial user session
        try:
            UserSession.objects.create(
                user=user,
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request),
                is_active=True
            )
            logger.info(" User session created")
        except Exception as e:
            logger.warning(f" Failed to create session: {e}")
            # Don't fail activation if session creation fails
        
        logger.info(f" Account activated successfully: {user.email}")
        
        return Response({
            'success': True,
            'message': 'Account activated successfully! You can now log in.',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.get_full_name(),
                'company_name': user.company_name
            }
        })
        
    except Exception as e:
        logger.error(f" Account activation error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Account activation failed. Please try again or contact support.',
            'debug_error': str(e) if getattr(settings, 'DEBUG', False) else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def validate_activation_token(request, token):
    """
    Validate an activation token without using it
    Useful for frontend to check if a token is valid before showing the form
    """
    
    logger.info(f" TOKEN VALIDATION: {token[:20]}... from IP: {get_client_ip(request)}")
    
    try:
        #  CRITICAL FIX: Same logic as activation - try with and without token_type
        reset_token = PasswordResetToken.objects.filter(
            token=token,
            token_type='activation',
            is_used=False
        ).first()
        
        # If not found, try without token_type
        if not reset_token:
            logger.info(" Token not found with activation type, trying without type filter...")
            reset_token = PasswordResetToken.objects.filter(
                token=token,
                is_used=False
            ).first()
            
            if reset_token:
                logger.info(f" Found token without type filter. Token type: {getattr(reset_token, 'token_type', 'None')}")
        
        if not reset_token:
            logger.warning(f" Token validation failed for: {token[:20]}...")
            
            #  DEBUG: Check what tokens exist
            all_tokens = PasswordResetToken.objects.filter(token=token)
            logger.info(f" DEBUG: Found {all_tokens.count()} tokens with this value")
            for t in all_tokens:
                logger.info(f"   Token: {t.token[:20]}..., Type: {getattr(t, 'token_type', 'None')}, Used: {t.is_used}")
            
            return Response({
                'success': False,
                'valid': False,
                'message': 'Invalid activation token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check expiry
        expiry_hours = getattr(settings, 'ACTIVATION_TOKEN_EXPIRY_HOURS', 24)
        is_expired = reset_token.created_at < timezone.now() - timezone.timedelta(hours=expiry_hours)
        
        if is_expired:
            logger.warning(f" Token expired: {token[:20]}...")
            return Response({
                'success': False,
                'valid': False,
                'message': 'Activation token has expired'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = reset_token.user
        
        # Check if already activated
        if user.is_email_verified and user.has_usable_password():
            logger.info(f" Account already activated: {user.email}")
            return Response({
                'success': False,
                'valid': False,
                'message': 'Account is already activated'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f" Token validation successful: {user.email}")
        
        return Response({
            'success': True,
            'valid': True,
            'message': 'Activation token is valid',
            'user': {
                'email': user.email,
                'full_name': user.get_full_name(),
                'company_name': user.company_name
            },
            'expires_in_hours': expiry_hours
        })
        
    except Exception as e:
        logger.error(f" Token validation error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'valid': False,
            'message': 'Failed to validate token',
            'debug_error': str(e) if getattr(settings, 'DEBUG', False) else None
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)