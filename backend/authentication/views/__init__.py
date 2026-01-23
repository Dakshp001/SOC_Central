# backend/authentication/views/__init__.py
"""
Authentication Views Module
Refactored for better organization and maintainability
"""

# Import all view functions from their respective modules
from .auth_views import (
    signup_request,
    verify_signup_otp,
    resend_otp,
    login,
    verify_mfa_code,
    resend_mfa_code,
    logout,
    check_session_status,
    verify_token,
    auth_health_check,
)

# FIXED: Import from activation.py (not activation_views.py)
from .activation import (
    activate_account,
    validate_activation_token,
)

from .password_views import (
    request_password_reset_otp,
    verify_password_reset_otp,
    request_password_reset,
    reset_password_confirm,
    change_password,
)

from .profile_views import (
    user_profile,
    update_profile,
)

from .admin_views import (
    create_user_by_admin,
    update_user_by_admin,
    send_password_reset_by_admin,
    toggle_user_activation,
    delete_user_by_admin,
    request_admin_access,
)

from .user_management_views import (
    list_users,
    promote_user,
    demote_user,
    delete_user,
    toggle_user_status,
)

from .settings_views import (
    get_user_settings,
    update_user_settings,
    reset_user_settings,
    export_user_data,
    get_user_activity_logs,
    enable_two_factor_auth,
    disable_two_factor_auth,
)

from .debug_views import (
    debug_password_reset_system,
    test_password_reset_api,
    debug_system_info,
    debug_urls,
    test_reset_url_generation,
)

from .company_management_views import (
    list_companies,
    create_company,
    get_company_details,
    update_company,
    toggle_company_status,
    delete_company,
    get_company_tool_permissions,
    update_tool_permissions,
    remove_tool_permission,
    get_company_users,
    assign_user_to_company,
    get_available_tools,
    get_user_accessible_tools,
)



# Export all view functions
__all__ = [
    # Authentication views
    'signup_request',
    'verify_signup_otp',
    'resend_otp',
    'login',
    'verify_mfa_code',
    'resend_mfa_code',
    'logout',
    'check_session_status',
    'verify_token',
    'auth_health_check',
    
    # Account Activation views
    'activate_account',
    'validate_activation_token',
    
    # Password management views
    'request_password_reset_otp',
    'verify_password_reset_otp',
    'request_password_reset',
    'reset_password_confirm',
    'change_password',
    
    # Profile management views
    'user_profile',
    'update_profile',
    
    # Admin views
    'create_user_by_admin',
    'update_user_by_admin',
    'send_password_reset_by_admin',
    'toggle_user_activation',
    'delete_user_by_admin',
    'request_admin_access',
    
    # User management views
    'list_users',
    'promote_user',
    'demote_user',
    'delete_user',
    'toggle_user_status',
    
    # Settings views
    'get_user_settings',
    'update_user_settings',
    'reset_user_settings',
    'export_user_data',
    'get_user_activity_logs',
    'enable_two_factor_auth',
    'disable_two_factor_auth',
    
    # Debug views (remove in production)
    'debug_password_reset_system',
    'test_password_reset_api',
    'debug_system_info',
    'debug_urls',
    'test_reset_url_generation',

    # Company management views (Super Admin only)
    'list_companies',
    'create_company',
    'get_company_details',
    'update_company',
    'toggle_company_status',
    'delete_company',
    'get_company_tool_permissions',
    'update_tool_permissions',
    'remove_tool_permission',
    'get_company_users',
    'assign_user_to_company',
    'get_available_tools',
    'get_user_accessible_tools',
]

print("Views package initialized successfully with activation functions")