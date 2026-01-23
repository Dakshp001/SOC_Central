# backend/authentication/decorators.py
"""
Authentication and Authorization Decorators
Provides decorators for checking user permissions and tool access
"""

from functools import wraps
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

def require_admin_or_superuser(view_func):
    """Decorator to require admin or superuser access"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'message': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Check if user is admin or superuser
        if not (request.user.is_staff or request.user.is_superuser):
            logger.warning(f"Non-admin user {request.user.id} attempted to access admin endpoint")
            return Response({
                'success': False,
                'message': 'Admin privileges required'
            }, status=status.HTTP_403_FORBIDDEN)

        return view_func(request, *args, **kwargs)

    return wrapper

def require_tool_access(tool_type):
    """
    Decorator to check if user has access to a specific tool

    Args:
        tool_type (str): The tool type to check access for

    Returns:
        function: Decorated function that checks tool access
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user is authenticated
            if not request.user or not request.user.is_authenticated:
                return Response({
                    'success': False,
                    'message': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)

            # Check if user has access to the tool
            if not request.user.has_tool_access(tool_type):
                return Response({
                    'success': False,
                    'message': f'Access denied - You do not have permission to access {tool_type.upper()} tool',
                    'tool_type': tool_type,
                    'user_tools': request.user.get_available_tools()
                }, status=status.HTTP_403_FORBIDDEN)

            # User has access, proceed with the view
            return view_func(request, *args, **kwargs)

        return wrapper
    return decorator

def require_super_admin(view_func):
    """
    Decorator to require Super Admin access

    Args:
        view_func: The view function to decorate

    Returns:
        function: Decorated function that checks super admin access
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return Response({
                'success': False,
                'message': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Check if user is super admin
        if not request.user.can_manage_users():
            return Response({
                'success': False,
                'message': 'Permission denied - Super Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        # User is super admin, proceed with the view
        return view_func(request, *args, **kwargs)

    return wrapper

def require_admin_or_above(view_func):
    """
    Decorator to require Admin or Super Admin access

    Args:
        view_func: The view function to decorate

    Returns:
        function: Decorated function that checks admin access
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return Response({
                'success': False,
                'message': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Check if user has admin or super admin role
        if not request.user.can_write():
            return Response({
                'success': False,
                'message': 'Permission denied - Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)

        # User has admin access, proceed with the view
        return view_func(request, *args, **kwargs)

    return wrapper

def require_verified_user(view_func):
    """
    Decorator to require verified user (email verified)

    Args:
        view_func: The view function to decorate

    Returns:
        function: Decorated function that checks user verification
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return Response({
                'success': False,
                'message': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Check if user has read access (email verified)
        if not request.user.can_read():
            return Response({
                'success': False,
                'message': 'Email verification required'
            }, status=status.HTTP_403_FORBIDDEN)

        # User is verified, proceed with the view
        return view_func(request, *args, **kwargs)

    return wrapper

def log_tool_access(tool_type):
    """
    Decorator to log tool access for audit purposes

    Args:
        tool_type (str): The tool type being accessed

    Returns:
        function: Decorated function that logs tool access
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Log the access attempt
            logger.info(
                f"Tool access: {request.user.email if request.user.is_authenticated else 'anonymous'} "
                f"accessing {tool_type} from {request.META.get('REMOTE_ADDR', 'unknown')}"
            )

            # Execute the view
            response = view_func(request, *args, **kwargs)

            # Log success/failure
            if hasattr(response, 'status_code'):
                if response.status_code < 400:
                    logger.info(f"Tool access successful: {tool_type} by {request.user.email}")
                else:
                    logger.warning(
                        f"Tool access failed: {tool_type} by {request.user.email} "
                        f"(status: {response.status_code})"
                    )

            return response

        return wrapper
    return decorator

def combined_tool_access(tool_type, require_admin=False):
    """
    Combined decorator for tool access checking with optional admin requirement

    Args:
        tool_type (str): The tool type to check access for
        require_admin (bool): Whether to require admin access

    Returns:
        function: Decorated function with combined checks
    """
    def decorator(view_func):
        # Apply decorators in order
        decorated_func = view_func

        # Add tool access logging
        decorated_func = log_tool_access(tool_type)(decorated_func)

        # Add tool access requirement
        decorated_func = require_tool_access(tool_type)(decorated_func)

        # Add admin requirement if needed
        if require_admin:
            decorated_func = require_admin_or_above(decorated_func)
        else:
            decorated_func = require_verified_user(decorated_func)

        return decorated_func
    return decorator

# Convenience decorators for specific tools
def require_gsuite_access(view_func):
    """Decorator to require G Suite tool access"""
    return combined_tool_access('gsuite')(view_func)

def require_mdm_access(view_func):
    """Decorator to require MDM tool access"""
    return combined_tool_access('mdm')(view_func)

def require_siem_access(view_func):
    """Decorator to require SIEM tool access"""
    return combined_tool_access('siem')(view_func)

def require_edr_access(view_func):
    """Decorator to require EDR tool access"""
    return combined_tool_access('edr')(view_func)

def require_meraki_access(view_func):
    """Decorator to require Meraki tool access"""
    return combined_tool_access('meraki')(view_func)

def require_sonicwall_access(view_func):
    """Decorator to require SonicWall tool access"""
    return combined_tool_access('sonicwall')(view_func)

# Admin version decorators for tool management
def require_gsuite_admin(view_func):
    """Decorator to require G Suite tool admin access"""
    return combined_tool_access('gsuite', require_admin=True)(view_func)

def require_mdm_admin(view_func):
    """Decorator to require MDM tool admin access"""
    return combined_tool_access('mdm', require_admin=True)(view_func)

def require_siem_admin(view_func):
    """Decorator to require SIEM tool admin access"""
    return combined_tool_access('siem', require_admin=True)(view_func)

def require_edr_admin(view_func):
    """Decorator to require EDR tool admin access"""
    return combined_tool_access('edr', require_admin=True)(view_func)

def require_meraki_admin(view_func):
    """Decorator to require Meraki tool admin access"""
    return combined_tool_access('meraki', require_admin=True)(view_func)

def require_sonicwall_admin(view_func):
    """Decorator to require SonicWall tool admin access"""
    return combined_tool_access('sonicwall', require_admin=True)(view_func)