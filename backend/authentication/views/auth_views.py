# backend/authentication/views/auth_views.py
"""
Core Authentication Views
Handles signup, login, logout, OTP verification, token verification, MFA
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache
from datetime import timedelta

from ..models import User, UserSession, MFACode
from ..serializers import UserSerializer, SignupSerializer, MFACodeSerializer, ResendMFASerializer
from ..utils import get_client_ip, get_user_agent, rate_limit_check
from ..services import EmailService

import logging
import random
import uuid
import hashlib

logger = logging.getLogger(__name__)

# ==========================================
# CACHE HELPER FUNCTIONS
# ==========================================

def get_pending_signup_data(temp_user_id):
    """Get pending signup data from cache"""
    return cache.get(f"pending_signup_{temp_user_id}")

def set_pending_signup_data(temp_user_id, data, timeout=3600):
    """Set pending signup data in cache"""
    cache.set(f"pending_signup_{temp_user_id}", data, timeout)

def delete_pending_signup_data(temp_user_id):
    """Delete pending signup data from cache"""
    cache.delete(f"pending_signup_{temp_user_id}")
    cache.delete(f"pending_signup_{temp_user_id}_otp")

def get_pending_otp_data(temp_user_id):
    """Get pending OTP data from cache"""
    return cache.get(f"pending_signup_{temp_user_id}_otp")

def set_pending_otp_data(temp_user_id, data, timeout=600):
    """Set pending OTP data in cache"""
    cache.set(f"pending_signup_{temp_user_id}_otp", data, timeout)

# ==========================================
# AUTHENTICATION VIEWS
# ==========================================

@api_view(['POST'])
@permission_classes([AllowAny])
def signup_request(request):
    """Step 1: Request signup and send OTP"""
    
    try:
        # Rate limiting check
        client_ip = get_client_ip(request)
        if not rate_limit_check(client_ip, 'signup', limit=10, window=3600):
            return Response({
                'success': False,
                'message': 'Too many signup attempts. Please try again later.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        serializer = SignupSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email'].lower()
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'message': 'User with this email already exists'
            }, status=status.HTTP_409_CONFLICT)
        
        # Validate password
        try:
            validate_password(serializer.validated_data['password'])
        except ValidationError as e:
            return Response({
                'success': False,
                'message': ' '.join(e.messages),
                'errors': {'password': e.messages}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate temporary user ID
        temp_user_id = str(uuid.uuid4())
        
        # Store signup data in cache
        signup_data = {
            'email': email,
            'first_name': serializer.validated_data.get('first_name', '').title(),
            'last_name': serializer.validated_data.get('last_name', '').title(),
            'company_name': serializer.validated_data.get('company_name', ''),
            'job_title': serializer.validated_data.get('job_title', ''),
            'department': serializer.validated_data.get('department', ''),
            'phone_number': serializer.validated_data.get('phone_number', ''),
            'password': serializer.validated_data['password'],
            'created_at': timezone.now().isoformat(),
            'ip_address': client_ip,
            'user_agent': get_user_agent(request)
        }
        set_pending_signup_data(temp_user_id, signup_data)
        
        # Generate OTP
        otp_code = str(random.randint(100000, 999999))
        otp_expires = timezone.now() + timezone.timedelta(minutes=getattr(settings, 'OTP_EXPIRY_MINUTES', 10))
        
        # Store OTP data
        otp_data = {
            'otp_code': otp_code,
            'email': email,
            'created_at': timezone.now().isoformat(),
            'expires_at': otp_expires.isoformat(),
            'attempts': 0,
            'max_attempts': getattr(settings, 'MAX_OTP_ATTEMPTS', 5)
        }
        set_pending_otp_data(temp_user_id, otp_data)
        
        logger.info(f"Generated OTP for signup: {email} (temp_id: {temp_user_id})")
        
        # Send OTP email
        email_service = EmailService()
        if email_service.send_signup_otp_email(email, otp_code, serializer.validated_data.get('first_name', '')):
            return Response({
                'success': True,
                'message': 'OTP sent to your email. Please verify to complete signup.',
                'user_id': temp_user_id,
                'expires_in': getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
            }, status=status.HTTP_201_CREATED)
        else:
            # Clean up on email failure
            delete_pending_signup_data(temp_user_id)
            return Response({
                'success': False,
                'message': 'Failed to send verification email. Please check your email configuration.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Signup error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Signup failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_signup_otp(request):
    """Step 2: Verify OTP and CREATE user in database"""
    
    temp_user_id = request.data.get('user_id')
    otp_code = request.data.get('otp_code', '').strip()
    
    if not temp_user_id or not otp_code:
        return Response({
            'success': False,
            'message': 'User ID and OTP code are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get stored signup data from cache
        signup_data = get_pending_signup_data(temp_user_id)
        otp_data = get_pending_otp_data(temp_user_id)
        
        if not signup_data or not otp_data:
            return Response({
                'success': False,
                'message': 'Invalid or expired signup session. Please start over.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if OTP expired
        expires_at = timezone.datetime.fromisoformat(otp_data['expires_at'].replace('Z', '+00:00'))
        if timezone.now() > expires_at:
            delete_pending_signup_data(temp_user_id)
            return Response({
                'success': False,
                'message': 'OTP has expired. Please request a new signup.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check max attempts
        if otp_data['attempts'] >= otp_data['max_attempts']:
            delete_pending_signup_data(temp_user_id)
            return Response({
                'success': False,
                'message': 'Maximum OTP attempts exceeded. Please start over.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify OTP code
        if otp_data['otp_code'] != otp_code:
            # Increment attempts
            otp_data['attempts'] += 1
            set_pending_otp_data(temp_user_id, otp_data)
            
            remaining = otp_data['max_attempts'] - otp_data['attempts']
            logger.warning(f"Invalid OTP for {signup_data['email']}. Attempts: {otp_data['attempts']}")
            
            return Response({
                'success': False,
                'message': f'Invalid OTP code. {remaining} attempts remaining.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # OTP is correct - create the user
        try:
            # First, handle company creation/assignment
            company = None
            company_name = signup_data['company_name']
            
            if company_name:
                # Try to find existing company first
                from ..models import Company
                try:
                    company = Company.objects.get(name=company_name)
                    logger.info(f"Found existing company: {company_name}")
                except Company.DoesNotExist:
                    # Create new company with default tool permissions
                    company = Company.objects.create(
                        name=company_name,
                        display_name=company_name,
                        description=f"Auto-created company for {company_name}",
                        enabled_tools=['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall'],
                        is_active=True
                    )
                    
                    # Create detailed tool permissions for each tool
                    from ..models import CompanyToolPermission
                    default_tools = ['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall']
                    for tool_type in default_tools:
                        CompanyToolPermission.objects.create(
                            company=company,
                            tool_type=tool_type,
                            is_enabled=True,
                            can_view=True,
                            can_upload=True,
                            can_analyze=True,
                            can_export=True,
                            can_manage=False,
                            data_retention_days=365,
                            max_upload_size_mb=100,
                            max_records_per_upload=100000
                        )
                    
                    logger.info(f"Created new company: {company_name} with all tools enabled and detailed permissions")
            
            user = User.objects.create_user(
                username=signup_data['email'],
                email=signup_data['email'],
                first_name=signup_data['first_name'],
                last_name=signup_data['last_name'],
                password=signup_data['password'],
                company=company,
                company_name=signup_data['company_name'],
                job_title=signup_data['job_title'],
                department=signup_data['department'], 
                phone_number=signup_data['phone_number'],
                is_active=True,
                is_email_verified=True,
                role='general'
            )
            
            logger.info(f"User created: {user.email} (ID: {user.id})")
            
            # Clean up temporary data
            delete_pending_signup_data(temp_user_id)
            
            # Create session
            session_data = f'signup_{user.id}_{timezone.now().timestamp()}'
            session_key = hashlib.md5(session_data.encode()).hexdigest()[:32]
            
            UserSession.objects.create(
                user=user,
                session_key=session_key,
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'success': True,
                'message': 'Account verified and created successfully!',
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except Exception as user_error:
            logger.error(f"Failed to create user: {str(user_error)}")
            return Response({
                'success': False,
                'message': 'Failed to create account. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"OTP verification error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Verification failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request):
    """Resend OTP for pending signup"""
    
    temp_user_id = request.data.get('user_id')
    
    if not temp_user_id:
        return Response({
            'success': False,
            'message': 'User ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        signup_data = get_pending_signup_data(temp_user_id)
        
        if not signup_data:
            return Response({
                'success': False,
                'message': 'Signup session not found. Please start over.'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Generate new OTP
        otp_code = str(random.randint(100000, 999999))
        otp_expires = timezone.now() + timezone.timedelta(minutes=getattr(settings, 'OTP_EXPIRY_MINUTES', 10))
        
        # Update OTP data
        otp_data = {
            'otp_code': otp_code,
            'email': signup_data['email'],
            'created_at': timezone.now().isoformat(),
            'expires_at': otp_expires.isoformat(),
            'attempts': 0,
            'max_attempts': getattr(settings, 'MAX_OTP_ATTEMPTS', 5)
        }
        set_pending_otp_data(temp_user_id, otp_data)
        
        logger.info(f"Resending OTP for {signup_data['email']}")
        
        email_service = EmailService()
        if email_service.send_signup_otp_email(signup_data['email'], otp_code, signup_data['first_name']):
            return Response({
                'success': True,
                'message': 'New OTP sent to your email.',
                'expires_in': getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
            })
        else:
            return Response({
                'success': False,
                'message': 'Failed to send OTP. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Resend OTP error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to resend OTP.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login with email and password - Step 1: Password verification"""
    email = request.data.get('email', '').lower()
    password = request.data.get('password')
    
    if not email or not password:
        return Response({
            'success': False,
            'message': 'Email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Rate limiting check - but first check if this might be a super-admin
    client_ip = get_client_ip(request)
    is_potential_super_admin = False
    
    try:
        # Check if the email belongs to a privileged user
        potential_user = User.objects.get(email=email)
        role_value = str(getattr(potential_user, 'role', '') or '').strip().lower()
        if (
            role_value in ['super_admin', 'super admin', 'admin']
            or getattr(potential_user, 'is_superuser', False)
            or getattr(potential_user, 'is_staff', False)
        ):
            is_potential_super_admin = True
            logger.info(f"Privileged login attempt detected for {email} (role={role_value}) - bypassing rate limit")
    except User.DoesNotExist:
        pass
    
    # Apply rate limiting only for non-privileged users
    if not is_potential_super_admin and not rate_limit_check(client_ip, 'login', limit=5, window=900):
        return Response({
            'success': False,
            'message': 'Too many login attempts. Please try again later.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    try:
        # First check if user exists and get their status
        try:
            user_account = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"Failed login attempt for non-existent email: {email} from {client_ip}")
            return Response({
                'success': False,
                'message': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user account is inactive
        if not user_account.is_active:
            logger.warning(f"Login attempt for inactive account: {email} from {client_ip}")
            return Response({
                'success': False,
                'message': 'Your account has been deactivated. Please contact support for assistance.',
                'error_code': 'ACCOUNT_DEACTIVATED'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Authenticate user (this also checks password)
        user = authenticate(username=email, password=password)
        
        if not user:
            logger.warning(f"Failed login attempt (wrong password) for {email} from {client_ip}")
            return Response({
                'success': False,
                'message': 'Invalid email or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check email verification
        if not user.is_email_verified:
            return Response({
                'success': False,
                'message': 'Please verify your email first',
                'require_verification': True,
                'user_id': str(user.id)
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Double-check active status (redundant but safe)
        if not user.is_active:
            return Response({
                'success': False,
                'message': 'Your account has been deactivated. Please contact support.',
                'error_code': 'ACCOUNT_DEACTIVATED'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Password is correct - check if MFA bypass is needed
        # MFA bypass list - emails that skip 2FA
        MFA_BYPASS_EMAILS = [
            'jenish.b@cybersecurityumbrella.com',
            'pateldaksh756@gmail.com',
            'csu.aiml@gmail.com',
            # Add more emails here as needed
        ]

        # Check if user should bypass MFA
        if user.email.lower() in [email.lower() for email in MFA_BYPASS_EMAILS]:
            logger.info(f"MFA bypass for {user.email} - skipping 2FA")

            # Update user login time
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])

            # Create or update user session
            session_data = f'login_{user.id}_{timezone.now().timestamp()}'
            session_key = hashlib.md5(session_data.encode()).hexdigest()[:32]

            session, created = UserSession.objects.get_or_create(
                user=user,
                ip_address=client_ip,
                defaults={
                    'session_key': session_key,
                    'user_agent': get_user_agent(request),
                    'is_active': True
                }
            )

            if not created:
                session.last_activity = timezone.now()
                session.is_active = True
                session.save()

            # Generate tokens
            refresh = RefreshToken.for_user(user)

            # Send login alert asynchronously
            import threading
            def send_login_alert():
                try:
                    from core.email_service.notifications import security_notifications
                    is_suspicious = False
                    security_notifications.login_alert(user, request, is_suspicious=is_suspicious)
                except Exception as e:
                    logger.warning(f"Failed to send login alert: {e}")

            threading.Thread(target=send_login_alert, daemon=True).start()

            logger.info(f"Successful bypass login for {user.email} from {client_ip}")

            return Response({
                'success': True,
                'message': 'Login successful',
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                },
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)

        # Regular flow - require MFA
        # Invalidate any existing MFA codes for this user
        MFACode.objects.filter(user=user, is_used=False).update(is_used=True)

        # Create new MFA code
        mfa_code = MFACode.objects.create(
            user=user,
            ip_address=client_ip,
            user_agent=get_user_agent(request)
        )

        # Send MFA code via email
        email_service = EmailService()
        if email_service.send_mfa_code_email(user.email, mfa_code.code, user.first_name):
            logger.info(f"MFA code sent to {user.email} for login verification")
            return Response({
                'success': True,
                'message': 'Password verified. Please check your email for the 4-digit verification code.',
                'require_mfa': True,
                'user_id': str(user.id),
                'expires_in': 10
            }, status=status.HTTP_200_OK)
        else:
            # Clean up MFA code if email fails
            mfa_code.delete()
            return Response({
                'success': False,
                'message': 'Failed to send verification code. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Login error for {email}: {str(e)}")
        return Response({
            'success': False,
            'message': 'Login failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_mfa_code(request):
    """Step 2: Verify MFA code and complete login"""
    
    serializer = MFACodeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user_id = serializer.validated_data['user_id']
    code = serializer.validated_data['code']
    
    try:
        # Get user
        user = User.objects.get(id=user_id)
        
        # Get the most recent MFA code for this user
        mfa_code = MFACode.objects.filter(
            user=user,
            is_used=False
        ).order_by('-created_at').first()
        
        if not mfa_code:
            return Response({
                'success': False,
                'message': 'No verification code found. Please request a new code.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if MFA code is valid
        if not mfa_code.is_valid():
            if timezone.now() >= mfa_code.expires_at:
                mfa_code.mark_as_used()
                return Response({
                    'success': False,
                    'message': 'Verification code has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            elif mfa_code.attempts >= getattr(settings, 'MAX_MFA_ATTEMPTS', 3):
                mfa_code.mark_as_used()
                return Response({
                    'success': False,
                    'message': 'Too many incorrect attempts. Please request a new code.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify the code
        if mfa_code.code != code:
            mfa_code.increment_attempts()
            max_attempts = getattr(settings, 'MAX_MFA_ATTEMPTS', 3)
            remaining = max_attempts - mfa_code.attempts

            logger.warning(f"Invalid MFA code for {user.email}. Attempts: {mfa_code.attempts}")

            if remaining <= 0:
                try:
                    mfa_code.mark_as_used()
                except Exception:
                    pass
                return Response({
                    'success': False,
                    'message': 'Too many incorrect attempts. Please request a new code.'
                }, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                'success': False,
                'message': f'Invalid verification code. {remaining} attempts remaining.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Code is correct - complete login
        mfa_code.mark_as_used()
        
        # Update user login time
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        # Create or update user session
        client_ip = get_client_ip(request)
        session_data = f'login_{user.id}_{timezone.now().timestamp()}'
        session_key = hashlib.md5(session_data.encode()).hexdigest()[:32]
        
        session, created = UserSession.objects.get_or_create(
            user=user,
            ip_address=client_ip,
            defaults={
                'session_key': session_key,
                'user_agent': get_user_agent(request),
                'is_active': True
            }
        )
        
        if not created:
            session.last_activity = timezone.now()
            session.is_active = True
            session.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Send login alert asynchronously
        import threading
        def send_login_alert():
            try:
                from core.email_service.notifications import security_notifications
                is_suspicious = False
                security_notifications.login_alert(user, request, is_suspicious=is_suspicious)
            except Exception as e:
                logger.warning(f"Failed to send login alert: {e}")
        
        threading.Thread(target=send_login_alert, daemon=True).start()
        
        logger.info(f"Successful MFA login for {user.email} from {client_ip}")
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            },
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invalid user ID'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"MFA verification error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Verification failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_mfa_code(request):
    """Resend MFA code with 2-minute cooldown"""
    
    serializer = ResendMFASerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user_id = serializer.validated_data['user_id']
    
    try:
        # Get user
        user = User.objects.get(id=user_id)
        
        # Check if there's a recent MFA code
        recent_mfa = MFACode.objects.filter(
            user=user,
            is_used=False
        ).order_by('-created_at').first()
        
        if recent_mfa and not recent_mfa.can_resend():
            time_remaining = 120 - (timezone.now() - recent_mfa.last_sent_at).total_seconds()
            return Response({
                'success': False,
                'message': f'Please wait {int(time_remaining)} seconds before requesting a new code.'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Invalidate existing MFA codes
        MFACode.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Create new MFA code
        client_ip = get_client_ip(request)
        mfa_code = MFACode.objects.create(
            user=user,
            ip_address=client_ip,
            user_agent=get_user_agent(request)
        )
        
        # Send MFA code via email
        email_service = EmailService()
        if email_service.send_mfa_code_email(user.email, mfa_code.code, user.first_name):
            logger.info(f"MFA code resent to {user.email}")
            return Response({
                'success': True,
                'message': 'New verification code sent to your email.',
                'expires_in': 10
            }, status=status.HTTP_200_OK)
        else:
            # Clean up MFA code if email fails
            mfa_code.delete()
            return Response({
                'success': False,
                'message': 'Failed to send verification code. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invalid user ID'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Resend MFA error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to resend verification code.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user and blacklist refresh token"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Deactivate user sessions
        UserSession.objects.filter(
            user=request.user,
            ip_address=get_client_ip(request),
            is_active=True
        ).update(is_active=False)
        
        logger.info(f"User {request.user.email} logged out")
        
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        })
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        })


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def check_session_status(request):
    """Check current session status and timeout information"""
    try:
        user = request.user
        
        # Get user's session timeout setting
        from authentication.models_settings import UserSettings
        user_settings = UserSettings.get_or_create_for_user(user)
        session_timeout_seconds = user_settings.get_session_timeout_seconds()
        
        # Get current session info
        client_ip = get_client_ip(request)
        current_session = UserSession.objects.filter(
            user=user,
            ip_address=client_ip,
            is_active=True
        ).first()
        
        if current_session:
            # Calculate time remaining
            elapsed_seconds = (timezone.now() - current_session.last_activity).total_seconds()
            remaining_seconds = max(0, session_timeout_seconds - elapsed_seconds)
            
            # Check if session has expired
            is_expired = remaining_seconds <= 0
            
            return Response({
                'success': True,
                'session_active': not is_expired,
                'timeout_seconds': session_timeout_seconds,
                'remaining_seconds': int(remaining_seconds),
                'last_activity': current_session.last_activity.isoformat(),
                'expires_at': (current_session.last_activity + timedelta(seconds=session_timeout_seconds)).isoformat()
            })
        else:
            return Response({
                'success': False,
                'session_active': False,
                'message': 'No active session found',
                'code': 'NO_SESSION'
            }, status=401)
            
    except Exception as e:
        logger.error(f"Session status check error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to check session status',
            'error': str(e)
        }, status=500)


@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def verify_token(request):
    """Verify if JWT token is valid - PUBLIC ENDPOINT"""
    from rest_framework_simplejwt.authentication import JWTAuthentication
    from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
    
    try:
        jwt_auth = JWTAuthentication()
        header = jwt_auth.get_header(request)
        
        if header is None:
            return Response({
                'success': False,
                'valid': False,
                'message': 'No authorization header provided'
            }, status=status.HTTP_200_OK)
        
        raw_token = jwt_auth.get_raw_token(header)
        if raw_token is None:
            return Response({
                'success': False,
                'valid': False,
                'message': 'Invalid token format'
            }, status=status.HTTP_200_OK)
        
        validated_token = jwt_auth.get_validated_token(raw_token)
        user = jwt_auth.get_user(validated_token)
        
        return Response({
            'success': True,
            'valid': True,
            'user': UserSerializer(user).data,
            'message': 'Token is valid'
        }, status=status.HTTP_200_OK)
        
    except (InvalidToken, TokenError) as e:
        return Response({
            'success': False,
            'valid': False,
            'message': f'Token validation failed: {str(e)}'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return Response({
            'success': False,
            'valid': False,
            'message': 'Token verification failed'
        }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def auth_health_check(request):
    """Authentication service health check - PUBLIC ENDPOINT"""
    return Response({
        'success': True,
        'status': 'ok',
        'service': 'authentication',
        'version': '1.0.0',
        'timestamp': timezone.now().isoformat()
    }, status=status.HTTP_200_OK)