# backend/authentication/views/password_views.py
"""
Password Management Views
Handles password reset, change password, password confirmation
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache

from ..models import User, PasswordResetToken, UserSession
from ..utils import get_client_ip, get_user_agent, rate_limit_check
from ..fast_email_service import FastEmailService

import logging

logger = logging.getLogger(__name__)

# ==========================================
# PASSWORD RESET VIEWS
# ==========================================

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset_otp(request):
    """Step 1: Request OTP for password reset"""
    email = request.data.get('email', '').lower().strip()
    
    if not email:
        return Response({
            'success': False,
            'message': 'Email address is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate email format
    from django.core.validators import validate_email
    try:
        validate_email(email)
    except ValidationError:
        return Response({
            'success': False,
            'message': 'Please enter a valid email address'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Rate limiting with IP-based tracking
    client_ip = get_client_ip(request)
    is_potential_super_admin = False
    
    try:
        # Check if the email belongs to a super-admin user
        potential_user = User.objects.get(email=email)
        if potential_user.role == 'super_admin':
            is_potential_super_admin = True
            logger.info(f"Super-admin password reset OTP detected for {email} - bypassing rate limit")
    except User.DoesNotExist:
        pass
    
    # Apply rate limiting only for non-super-admin users
    if not is_potential_super_admin and not rate_limit_check(client_ip, 'password_reset_otp', limit=5, window=3600):
        return Response({
            'success': False,
            'message': 'Too many OTP requests. Please try again later.',
            'retry_after': 3600
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    try:
        # Check if user exists and is active
        user = User.objects.filter(email=email, is_active=True).first()
        
        if user:
            # Invalidate previous OTP attempts for password reset
            from ..models import OTPVerification
            old_otps = OTPVerification.objects.filter(
                user=user, 
                purpose='password_reset', 
                is_used=False
            )
            logger.info(f"Invalidating {old_otps.count()} old OTP attempts for {user.email}")
            old_otps.update(is_used=True)
            
            # Create new OTP
            otp_verification = OTPVerification.objects.create(
                user=user,
                purpose='password_reset',
                ip_address=client_ip,
                user_agent=request.META.get('HTTP_USER_AGENT', '')[:500]
            )
            logger.info(f"Created password reset OTP for {user.email}")
            
            # Send OTP email
            try:
                email_service = FastEmailService()
                email_sent = email_service.send_password_reset_otp_email(user, otp_verification.otp_code)
                
                if email_sent:
                    logger.info(f"Password reset OTP sent to {email} from {client_ip}")
                else:
                    logger.error(f"Failed to send password reset OTP to {email}")
                    return Response({
                        'success': False,
                        'message': 'Failed to send verification code. Please contact support if this continues.',
                        'error_code': 'EMAIL_SEND_FAILED'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            except Exception as e:
                logger.error(f"Error sending password reset OTP to {email}: {str(e)}")
                return Response({
                    'success': False,
                    'message': 'Email service is temporarily unavailable. Please try again later.',
                    'error_code': 'EMAIL_SERVICE_ERROR'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Log the attempt but don't reveal if email exists
            logger.warning(f"Password reset OTP attempted for non-existent/inactive email: {email} from {client_ip}")
        
        # Always return success to prevent email enumeration
        return Response({
            'success': True,
            'message': 'If an account with that email exists and is active, a verification code has been sent.',
            'next_steps': 'Check your email for the 6-digit verification code. The code will expire in 10 minutes.',
            'requires_otp': True
        })
        
    except Exception as e:
        logger.error(f"Unexpected error in password reset OTP for {email}: {str(e)}")
        return Response({
            'success': False,
            'message': 'An unexpected error occurred. Please try again later.',
            'error_code': 'INTERNAL_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_password_reset_otp(request):
    """Step 2: Verify OTP and send password reset link"""
    email = request.data.get('email', '').lower().strip()
    otp_code = request.data.get('otp_code', '').strip()
    
    if not all([email, otp_code]):
        return Response({
            'success': False,
            'message': 'Email and verification code are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Rate limiting for OTP verification attempts
    client_ip = get_client_ip(request)
    if not rate_limit_check(client_ip, 'otp_verification', limit=10, window=3600):
        return Response({
            'success': False,
            'message': 'Too many verification attempts. Please try again later.',
            'retry_after': 3600
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    try:
        # Find user
        user = User.objects.filter(email=email, is_active=True).first()
        if not user:
            logger.warning(f"OTP verification attempted for non-existent email: {email} from {client_ip}")
            return Response({
                'success': False,
                'message': 'Invalid email or verification code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find valid OTP
        from ..models import OTPVerification
        otp_verification = OTPVerification.objects.filter(
            user=user,
            purpose='password_reset',
            otp_code=otp_code,
            is_used=False
        ).first()
        
        if not otp_verification:
            logger.warning(f"Invalid OTP attempt for {email}: {otp_code}")
            return Response({
                'success': False,
                'message': 'Invalid or expired verification code'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Increment attempts
        otp_verification.attempts += 1
        
        # Check if OTP is still valid
        if not otp_verification.is_valid():
            otp_verification.save()
            logger.warning(f"Expired/invalid OTP verification for {email}")
            return Response({
                'success': False,
                'message': 'Verification code has expired. Please request a new one.',
                'error_code': 'OTP_EXPIRED'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Mark OTP as used
        otp_verification.is_used = True
        otp_verification.save()
        
        # Now create and send password reset token
        from ..models import PasswordResetToken
        
        # Invalidate previous reset tokens
        old_tokens = PasswordResetToken.objects.filter(user=user, is_used=False)
        logger.info(f"Invalidating {old_tokens.count()} old reset tokens for {user.email}")
        old_tokens.update(is_used=True)
        
        # Create reset token
        reset_token = PasswordResetToken.objects.create(
            user=user,
            ip_address=client_ip
        )
        logger.info(f"Created password reset token for {user.email} after OTP verification")
        
        # Send password reset email
        try:
            email_service = FastEmailService()
            email_sent = email_service.send_password_reset_email(user, reset_token.token)
            
            if email_sent:
                logger.info(f"Password reset email sent to {email} after OTP verification from {client_ip}")
            else:
                logger.error(f"Failed to send password reset email to {email}")
                return Response({
                    'success': False,
                    'message': 'Verification successful, but failed to send reset email. Please contact support.',
                    'error_code': 'EMAIL_SEND_FAILED'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error sending password reset email to {email}: {str(e)}")
            return Response({
                'success': False,
                'message': 'Verification successful, but email service is temporarily unavailable. Please contact support.',
                'error_code': 'EMAIL_SERVICE_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Log successful OTP verification
        logger.info(f"Password reset OTP verified successfully for user: {user.email}")
        
        return Response({
            'success': True,
            'message': 'Verification successful! Password reset instructions have been sent to your email.',
            'next_steps': 'Check your email for password reset instructions. The link will expire in 1 hour.'
        })
        
    except Exception as e:
        logger.error(f"Error verifying password reset OTP for {email}: {str(e)}")
        return Response({
            'success': False,
            'message': 'An error occurred while verifying your code. Please try again.',
            'error_code': 'VERIFICATION_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Enhanced password reset request with rate limiting and security"""
    email = request.data.get('email', '').lower().strip()
    
    if not email:
        return Response({
            'success': False,
            'message': 'Email address is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate email format
    from django.core.validators import validate_email
    try:
        validate_email(email)
    except ValidationError:
        return Response({
            'success': False,
            'message': 'Please enter a valid email address'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Rate limiting with IP-based tracking
    client_ip = get_client_ip(request)
    is_potential_super_admin = False
    
    try:
        # Check if the email belongs to a super-admin user
        potential_user = User.objects.get(email=email)
        if potential_user.role == 'super_admin':
            is_potential_super_admin = True
            logger.info(f"Super-admin password reset detected for {email} - bypassing rate limit")
    except User.DoesNotExist:
        pass
    
    # Apply rate limiting only for non-super-admin users
    if not is_potential_super_admin and not rate_limit_check(client_ip, 'password_reset', limit=3, window=3600):
        return Response({
            'success': False,
            'message': 'Too many password reset requests. Please try again later.',
            'retry_after': 3600
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    try:
        # Check if user exists and is active
        user = User.objects.filter(email=email, is_active=True).first()
        
        if user:
            # Invalidate previous reset tokens
            old_tokens = PasswordResetToken.objects.filter(user=user, is_used=False)
            logger.info(f"Invalidating {old_tokens.count()} old tokens for {user.email}")
            old_tokens.update(is_used=True)
            
            # Create reset token
            reset_token = PasswordResetToken.objects.create(
                user=user,
                ip_address=client_ip
            )
            logger.info(f"Created password reset token for {user.email}")
            
            # Send password reset email
            try:
                email_service = FastEmailService()
                email_sent = email_service.send_password_reset_email(user, reset_token.token)
                
                if email_sent:
                    logger.info(f"Password reset email sent to {email} from {client_ip}")
                else:
                    logger.error(f"Failed to send password reset email to {email}")
                    return Response({
                        'success': False,
                        'message': 'Failed to send reset email. Please contact support if this continues.',
                        'error_code': 'EMAIL_SEND_FAILED'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            except Exception as e:
                logger.error(f"Error sending password reset email to {email}: {str(e)}")
                return Response({
                    'success': False,
                    'message': 'Email service is temporarily unavailable. Please try again later.',
                    'error_code': 'EMAIL_SERVICE_ERROR'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Log the attempt but don't reveal if email exists
            logger.warning(f"Password reset attempted for non-existent/inactive email: {email} from {client_ip}")
        
        # Always return success to prevent email enumeration
        return Response({
            'success': True,
            'message': 'If an account with that email exists and is active, password reset instructions have been sent.',
            'next_steps': 'Check your email for reset instructions. The link will expire in 1 hour.'
        })
        
    except Exception as e:
        logger.error(f"Unexpected error in password reset for {email}: {str(e)}")
        return Response({
            'success': False,
            'message': 'An unexpected error occurred. Please try again later.',
            'error_code': 'INTERNAL_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request):
    """Confirm password reset using secure token"""
    logger.info(f"Password reset confirmation attempt from IP: {get_client_ip(request)}")
    
    token = request.data.get('token', '').strip()
    new_password = request.data.get('new_password', '')
    confirm_password = request.data.get('confirm_password', '')
    
    logger.info(f"Reset password request data: token_length={len(token) if token else 0}, has_new_password={bool(new_password)}, has_confirm_password={bool(confirm_password)}")
    
    # Validate input
    if not all([token, new_password, confirm_password]):
        return Response({
            'success': False,
            'message': 'Token, new password, and password confirmation are required',
            'missing_fields': [
                field for field, value in {
                    'token': token,
                    'new_password': new_password,
                    'confirm_password': confirm_password
                }.items() if not value
            ]
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check password match
    if new_password != confirm_password:
        return Response({
            'success': False,
            'message': 'Passwords do not match',
            'error_code': 'PASSWORD_MISMATCH'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Find and validate token
        reset_token = PasswordResetToken.objects.filter(token=token).first()
        
        if not reset_token:
            logger.warning(f"Password reset attempted with invalid token: {token[:16]}...")
            return Response({
                'success': False,
                'message': 'Invalid or expired reset link',
                'error_code': 'INVALID_TOKEN'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not reset_token.is_valid():
            logger.warning(f"Password reset attempted with expired/used token for user: {reset_token.user.email}")
            return Response({
                'success': False,
                'message': 'This reset link has expired or has already been used',
                'error_code': 'TOKEN_EXPIRED',
                'next_steps': 'Please request a new password reset link'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate password strength
        try:
            validate_password(new_password, reset_token.user)
        except ValidationError as e:
            return Response({
                'success': False,
                'message': 'Password does not meet security requirements',
                'error_code': 'WEAK_PASSWORD',
                'password_requirements': list(e.messages)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update user password
        user = reset_token.user
        user.set_password(new_password)
        user.last_password_reset = timezone.now()
        
        # If this was an activation token, mark email as verified
        if reset_token.token_type == 'activation':
            user.is_email_verified = True
            user.password_reset_required = False
            logger.info(f"User account activated: {user.email}")
        
        user.save()
        
        # Send password change notification for reset asynchronously
        import threading
        def send_password_reset_alert():
            try:
                from core.email_service.notifications import security_notifications
                security_notifications.password_changed(user, request, user_initiated=False)
            except Exception as e:
                logger.warning(f"Failed to send password reset notification: {e}")
        
        threading.Thread(target=send_password_reset_alert, daemon=True).start()
        
        # Mark token as used
        reset_token.mark_as_used()
        
        # Invalidate all other tokens for this user
        PasswordResetToken.objects.filter(
            user=user,
            is_used=False
        ).exclude(id=reset_token.id).update(is_used=True, used_at=timezone.now())
        
        # Invalidate all sessions for security
        UserSession.objects.filter(user=user).update(is_active=False)
        
        # Log successful password reset
        action = 'activated' if reset_token.token_type == 'activation' else 'reset'
        logger.info(f"Password {action} successfully for user: {user.email}")
        
        return Response({
            'success': True,
            'message': f'Password {action} successfully',
            'user': {
                'email': user.email,
                'full_name': user.get_full_name(),
                'is_email_verified': user.is_email_verified,
                'action': action
            },
            'next_steps': 'You can now log in with your new password'
        })
        
    except Exception as e:
        logger.error(f"Error resetting password: {str(e)}")
        return Response({
            'success': False,
            'message': 'An error occurred while resetting your password',
            'error_code': 'RESET_ERROR',
            'details': str(e) if settings.DEBUG else 'Please try again or contact support'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password with current password verification"""
    logger.info(f"Password change attempt for user: {request.user.email} from IP: {get_client_ip(request)}")
    
    current_password = request.data.get('current_password', '')
    new_password = request.data.get('new_password', '')
    confirm_password = request.data.get('confirm_password', '')
    
    # Validate input
    if not all([current_password, new_password, confirm_password]):
        return Response({
            'success': False,
            'message': 'Current password, new password, and password confirmation are required',
            'missing_fields': [
                field for field, value in {
                    'current_password': current_password,
                    'new_password': new_password,
                    'confirm_password': confirm_password
                }.items() if not value
            ]
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if new passwords match
    if new_password != confirm_password:
        return Response({
            'success': False,
            'message': 'New passwords do not match',
            'error_code': 'PASSWORD_MISMATCH'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if new password is different from current
    if current_password == new_password:
        return Response({
            'success': False,
            'message': 'New password must be different from current password',
            'error_code': 'SAME_PASSWORD'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Verify current password
        user = request.user
        if not user.check_password(current_password):
            logger.warning(f"Invalid current password attempt for user: {user.email}")
            return Response({
                'success': False,
                'message': 'Current password is incorrect',
                'error_code': 'INVALID_CURRENT_PASSWORD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new password strength
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({
                'success': False,
                'message': 'New password does not meet requirements',
                'error_code': 'WEAK_PASSWORD',
                'password_errors': e.messages
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Rate limiting check
        client_ip = get_client_ip(request)
        if not rate_limit_check(client_ip, 'password_change', limit=5, window=3600):
            return Response({
                'success': False,
                'message': 'Too many password change attempts. Please try again later.',
                'error_code': 'RATE_LIMITED'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Change password
        user.set_password(new_password)
        user.save()
        
        # Log the password change
        logger.info(f"Password successfully changed for user: {user.email}")
        
        # Invalidate all existing sessions/tokens for security
        try:
            # Blacklist all existing refresh tokens
            from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                try:
                    from rest_framework_simplejwt.tokens import RefreshToken
                    refresh_token = RefreshToken(token.token)
                    refresh_token.blacklist()
                except Exception as e:
                    logger.warning(f"Failed to blacklist token: {e}")
            
            # Clear user sessions
            UserSession.objects.filter(user=user).delete()
            
        except Exception as e:
            logger.warning(f"Failed to invalidate sessions for user {user.email}: {e}")
        
        # Send password change notification asynchronously
        import threading
        def send_password_change_alert():
            try:
                from core.email_service.notifications import security_notifications
                security_notifications.password_changed(user, request, user_initiated=True)
            except Exception as e:
                logger.warning(f"Failed to send password change confirmation email: {e}")
        
        threading.Thread(target=send_password_change_alert, daemon=True).start()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully. Please log in again with your new password.',
            'requires_reauth': True
        })
        
    except Exception as e:
        logger.error(f"Error changing password for user {request.user.email}: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'An error occurred while changing your password. Please try again.',
            'error_code': 'CHANGE_PASSWORD_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)