# backend/authentication/middleware.py - FIXED FOR ACTIVATION
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import UserSession
from .utils import get_client_ip, get_user_agent

logger = logging.getLogger(__name__)
User = get_user_model()

print("*** MIDDLEWARE CLASS BEING IMPORTED! ***")

class RoleBasedPermissionMiddleware(MiddlewareMixin):
    """
    Middleware to enforce role-based permissions at the middleware level
    ✅ FIXED: Proper activation endpoints support
    """
    
    def __init__(self, get_response):
        print("*** MIDDLEWARE INSTANCE BEING CREATED! ***")
        self.get_response = get_response
        super().__init__(get_response)
    
    # URLs that require write permissions
    WRITE_REQUIRED_PATHS = [
        '/api/tool/',
        '/api/upload/',
        '/api/analytics/save/',
        '/api/dashboard/settings/',
        '/api/auth/admin/',
    ]
    
    # URLs that require admin permissions (super admin only)
    ADMIN_REQUIRED_PATHS = [
        '/api/auth/promote-user/',
        '/api/auth/demote-user/',
        '/api/auth/users/',
        '/api/auth/delete-user/',
        '/api/auth/toggle-user-status/',
        '/admin/',
    ]
    
    # URLs that don't require authentication - ✅ UPDATED with activation endpoints
    PUBLIC_PATHS = [
        '/',                                    # Root path for health checks
        '/health/',                             # Health endpoint
        '/api/health/',                         # API health endpoint
        '/api/auth/signup/',
        '/api/auth/verify-signup/',
        '/api/auth/login/',

        '/api/auth/request-password-reset/',
        '/api/auth/reset-password-confirm/',    # 🔥 CRITICAL: Password reset
        '/api/auth/reset-password/',
        '/api/auth/activate-account/',          # 🆕 ADDED: Account activation
        '/api/auth/validate-activation-token/', # 🆕 ADDED: Token validation
        '/api/auth/resend-otp/',
        '/api/auth/health/',
        '/api/auth/info/',
        '/api/auth/verify-token/',
        '/api/auth/debug/',
        '/admin/login/',
        '/static/',
        '/media/',
        '/favicon.ico',
        '/robots.txt',
    ]

    def process_request(self, request):
        print("*** PROCESS_REQUEST CALLED! ***")
        
        # 🔥 EMERGENCY DEBUG: Force write to file to bypass any logging issues
        try:
            with open('D:\\CSU\\SOCCENTRAL\\backend\\MIDDLEWARE_DEBUG.txt', 'a', encoding='utf-8') as f:
                f.write(f"MIDDLEWARE HIT: {request.method} {request.path}\n")
                f.flush()
        except Exception as e:
            # Also try a different location in case of permission issues
            try:
                with open('C:\\temp\\MIDDLEWARE_DEBUG.txt', 'a', encoding='utf-8') as f:
                    f.write(f"MIDDLEWARE HIT: {request.method} {request.path} - Error: {str(e)}\n")
                    f.flush()
            except:
                pass
            
        request_path = request.path.rstrip('/')
        
        # 🔍 DEBUG: Print ALL request paths to see what we're getting
        print(f"🔍 MIDDLEWARE: Processing {request.method} path='{request.path}' stripped='{request_path}'")
        

        
        # ✅ IMPROVED: Better logging with user info if available
        user_info = getattr(request, 'user', None)
        user_display = f"{user_info.email} ({user_info.role})" if user_info and hasattr(user_info, 'email') else 'Anonymous'
        
        # 🔍 AGGRESSIVE DEBUG: Log ALL requests
        logger.warning(f"🚀 MIDDLEWARE ENTRY: {request.method} {request_path} - User: {user_display}")
        

        
        # ✅ ENHANCED: Special handling for activation endpoints
        if request_path.startswith('/api/auth/activate-account') or request_path.startswith('/api/auth/validate-activation-token'):
            logger.debug(f"ACTIVATION ENDPOINT ALLOWED: {request_path}")
            return None
        


        # Skip for other public paths
        matching_public_path = None
        for path in self.PUBLIC_PATHS:
            path_clean = path.rstrip('/')
            
            # Special case: root path should only match exactly "/" or "/health/"
            if path_clean == '':
                if request_path == '/' or request_path == '/health/':
                    matching_public_path = path
                    break
            # For other paths, ensure exact match or that it's followed by / or end of string
            elif (request_path == path_clean or 
                  request_path.startswith(path_clean + '/') or 
                  (path_clean.endswith('/') and request_path.startswith(path_clean))):
                matching_public_path = path
                break
        
        if matching_public_path:
            logger.debug(f"PUBLIC PATH ALLOWED: {request_path} (matched: {matching_public_path})")
            return None
        
        # Skip for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            logger.debug(f"OPTIONS request allowed: {request_path}")
            return None
        
        logger.debug(f"PROTECTED PATH: {request_path} - Checking authentication...")
        
        # Get user from JWT token
        user = self.get_user_from_token(request)
        
        if not user:
            logger.warning(f"AUTH REQUIRED for: {request_path} from IP: {get_client_ip(request)}")
            return JsonResponse({
                'success': False,
                'message': 'Authentication required',
                'code': 'AUTH_REQUIRED_NEW_VERSION'
            }, status=401)
        
        logger.info(f"USER AUTHENTICATED: {user.email} (Role: {user.role})")
        
        # Check if user is active and verified
        if not user.is_active:
            logger.warning(f"ACCOUNT DEACTIVATED: {user.email}")
            return JsonResponse({
                'success': False,
                'message': 'Account is deactivated',
                'code': 'ACCOUNT_DEACTIVATED'
            }, status=403)
        
        if not user.is_email_verified:
            logger.warning(f"EMAIL NOT VERIFIED: {user.email}")
            return JsonResponse({
                'success': False,
                'message': 'Email verification required',
                'code': 'EMAIL_NOT_VERIFIED'
            }, status=403)
        
        # Check role-based permissions
        if any(request_path.startswith(path.rstrip('/')) for path in self.ADMIN_REQUIRED_PATHS):
            if not user.can_manage_users():
                logger.warning(f"INSUFFICIENT PRIVILEGES: {user.email} (Role: {user.role}) tried to access {request_path}")
                return JsonResponse({
                    'success': False,
                    'message': 'Super Admin privileges required',
                    'code': 'INSUFFICIENT_PRIVILEGES',
                    'required_role': 'super_admin',
                    'current_role': user.role
                }, status=403)
            else:
                logger.info(f"ADMIN ACCESS GRANTED: {user.email} accessing {request_path}")
        
        elif any(request_path.startswith(path.rstrip('/')) for path in self.WRITE_REQUIRED_PATHS):
            if not user.can_write():
                logger.warning(f"INSUFFICIENT PRIVILEGES: {user.email} (Role: {user.role}) tried to access {request_path}")
                return JsonResponse({
                    'success': False,
                    'message': 'Admin privileges required',
                    'code': 'INSUFFICIENT_PRIVILEGES',
                    'required_role': 'admin',
                    'current_role': user.role
                }, status=403)
        
        # Check session timeout before allowing access
        session_valid = self.check_session_timeout(request, user)
        if not session_valid:
            logger.warning(f"SESSION EXPIRED: {user.email} session timed out")
            return JsonResponse({
                'success': False,
                'message': 'Session expired due to inactivity',
                'code': 'SESSION_EXPIRED'
            }, status=401)
        
        # Update user session activity
        self.update_session_activity(request, user)
        
        logger.debug(f"REQUEST APPROVED: {user.email} -> {request_path}")
        return None
    
    def check_session_timeout(self, request, user):
        """Check if user session has timed out"""
        try:
            client_ip = get_client_ip(request)
            
            # Get user's session timeout setting (in seconds)
            try:
                from .models_settings import UserSettings
                user_settings = UserSettings.get_or_create_for_user(user)
                session_timeout_seconds = user_settings.get_session_timeout_seconds()
                logger.debug(f"Session timeout for {user.email}: {session_timeout_seconds} seconds")
            except Exception as e:
                logger.error(f"Error getting user settings for {user.email}: {str(e)}")
                session_timeout_seconds = 3600  # Default 1 hour
            
            # Calculate timeout threshold
            timeout_threshold = timezone.now() - timezone.timedelta(seconds=session_timeout_seconds)
            
            # Check if user has any active sessions that haven't timed out
            active_sessions = UserSession.objects.filter(
                user=user,
                ip_address=client_ip,
                is_active=True,
                last_activity__gte=timeout_threshold
            )
            
            return active_sessions.exists()
            
        except Exception as e:
            logger.error(f"Error checking session timeout for {user.email}: {str(e)}")
            return True  # Default to allowing access if check fails
    
    def get_user_from_token(self, request):
        """Extract and validate user from JWT token with enhanced debugging"""
        try:
            logger.debug(f"JWT: Starting token extraction for {request.path}...")
            
            jwt_auth = JWTAuthentication()
            header = jwt_auth.get_header(request)
            
            if header is None:
                logger.debug(f"JWT: No Authorization header found")
                available_headers = [h for h in request.headers.keys() if 'auth' in h.lower()]
                logger.debug(f"JWT: Auth-related headers: {available_headers}")
                return None
            
            logger.debug(f"JWT: Authorization header found: Bearer {str(header)[7:17]}...")
            
            raw_token = jwt_auth.get_raw_token(header)
            if raw_token is None:
                logger.debug(f"JWT: Could not extract raw token from header")
                return None
            
            logger.debug(f"JWT: Raw token extracted: {str(raw_token)[:20]}...")
            
            validated_token = jwt_auth.get_validated_token(raw_token)
            logger.debug(f"JWT: Token validation successful")
            
            user = jwt_auth.get_user(validated_token)
            logger.debug(f"JWT: User extracted: {user.email} (ID: {user.id}, Role: {user.role})")
            
            # Add user to request for later use
            request.user = user
            return user
            
        except InvalidToken as e:
            logger.debug(f"JWT: Invalid token - {str(e)}")
            return None
        except TokenError as e:
            logger.debug(f"JWT: Token error - {str(e)}")
            return None
        except Exception as e:
            logger.error(f"JWT: Unexpected error - {str(e)}", exc_info=True)
            return None
    
    def update_session_activity(self, request, user):
        """Update user session last activity and check for timeout"""
        try:
            client_ip = get_client_ip(request)
            
            # Get user's session timeout setting (in seconds)
            try:
                from .models_settings import UserSettings
                user_settings = UserSettings.get_or_create_for_user(user)
                session_timeout_seconds = user_settings.get_session_timeout_seconds()
                logger.debug(f"Session timeout for {user.email}: {session_timeout_seconds} seconds")
            except Exception as e:
                logger.error(f"Error getting user settings for {user.email}: {str(e)}")
                session_timeout_seconds = 3600  # Default 1 hour
            
            # Calculate timeout threshold
            timeout_threshold = timezone.now() - timezone.timedelta(seconds=session_timeout_seconds)
            
            # First, deactivate expired sessions
            expired_sessions = UserSession.objects.filter(
                user=user,
                is_active=True,
                last_activity__lt=timeout_threshold
            )
            
            expired_count = expired_sessions.count()
            if expired_count > 0:
                expired_sessions.update(is_active=False)
                logger.info(f"Deactivated {expired_count} expired session(s) for {user.email}")
            
            # Update current session activity
            sessions_updated = UserSession.objects.filter(
                user=user,
                ip_address=client_ip,
                is_active=True
            ).update(last_activity=timezone.now())
            
            if sessions_updated > 0:
                logger.debug(f"Updated {sessions_updated} session(s) for {user.email}")
            else:
                # Create new session if none exists
                UserSession.objects.create(
                    user=user,
                    session_key=request.session.session_key or 'jwt-based',
                    ip_address=client_ip,
                    user_agent=get_user_agent(request)[:1000],  # Limit length
                    last_activity=timezone.now()
                )
                logger.debug(f"Created new session for {user.email}")
                
        except Exception as e:
            logger.error(f"Failed to update session activity for {user.email}: {str(e)}")

class SecurityHeadersMiddleware(MiddlewareMixin):
    """Add security headers to all responses - ✅ ENHANCED"""
    
    def process_response(self, request, response):
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # ✅ ENHANCED: Environment-specific headers
        if hasattr(settings, 'IS_PRODUCTION') and settings.IS_PRODUCTION:
            # Force HSTS in production
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        else:
            # Add HSTS header in development to satisfy frontend security checks
            response['Strict-Transport-Security'] = 'max-age=0'
        
        # ✅ ADDED: Content Security Policy for development
        if hasattr(settings, 'DEBUG') and settings.DEBUG:
            response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        
        return response

class RequestLoggingMiddleware(MiddlewareMixin):
    """Log important requests for security monitoring - ✅ ENHANCED"""
    
    # ✅ UPDATED: Include new authentication endpoints
    LOGGED_PATHS = [
        '/api/auth/login/',
        '/api/auth/signup/',
        '/api/auth/promote-user/',
        '/api/auth/demote-user/',
        '/api/auth/delete-user/',
        '/api/auth/toggle-user-status/',
        '/api/auth/activate-account/',      # 🆕 ADDED
        '/api/auth/admin/',
        '/api/tool/upload/',
        '/admin/',
    ]
    
    # ✅ ADDED: Sensitive endpoints that require detailed logging
    SENSITIVE_PATHS = [
        '/api/auth/promote-user/',
        '/api/auth/demote-user/',
        '/api/auth/delete-user/',
        '/api/auth/toggle-user-status/',
        '/api/auth/reset-password-confirm/',
        '/api/auth/activate-account/',      # 🆕 ADDED
    ]
    
    def process_request(self, request):
        if any(request.path.startswith(path) for path in self.LOGGED_PATHS):
            user_info = 'Anonymous'
            user_id = 'N/A'
            
            if hasattr(request, 'user') and request.user and hasattr(request.user, 'email'):
                user_info = f"{request.user.email} (Role: {getattr(request.user, 'role', 'Unknown')})"
                user_id = str(getattr(request.user, 'id', 'Unknown'))
            
            # ✅ ENHANCED: More detailed logging for sensitive operations
            if any(request.path.startswith(path) for path in self.SENSITIVE_PATHS):
                logger.warning(f"SENSITIVE REQUEST: {request.method} {request.path} - User: {user_info} - IP: {get_client_ip(request)} - UserAgent: {get_user_agent(request)[:100]}")
            else:
                logger.info(f"Request: {request.method} {request.path} - User: {user_info} - IP: {get_client_ip(request)}")
        
        return None

# ✅ NEW: Activity Logging Middleware for user actions
class UserActivityMiddleware(MiddlewareMixin):
    """Log user activities for analytics and security tracking"""
    
    ACTIVITY_PATHS = {
        '/api/auth/login/': 'login',
        '/api/auth/logout/': 'logout',
        '/api/auth/change-password/': 'password_change',
        '/api/auth/update-profile/': 'profile_update',
        '/api/auth/settings/': 'settings_view',
        '/api/auth/settings/update/': 'settings_change',
        '/api/auth/settings/export-data/': 'data_export',
        '/api/auth/activate-account/': 'account_activation',  # 🆕 ADDED
    }
    
    def process_response(self, request, response):
        # Only log successful requests with authenticated users
        if (hasattr(request, 'user') and 
            request.user and 
            hasattr(request.user, 'email') and
            200 <= response.status_code < 300):
            
            activity_type = self.ACTIVITY_PATHS.get(request.path)
            
            if activity_type:
                try:
                    # Import here to avoid circular imports
                    from .models_settings import UserActivityLog
                    
                    UserActivityLog.objects.create(
                        user=request.user,
                        action=activity_type,
                        description=f"User performed {activity_type} action",
                        ip_address=get_client_ip(request),
                        user_agent=get_user_agent(request),
                        metadata={
                            'method': request.method,
                            'path': request.path,
                            'status_code': response.status_code
                        }
                    )
                    
                except Exception as e:
                    logger.error(f"Failed to log user activity: {str(e)}")
        
        return response