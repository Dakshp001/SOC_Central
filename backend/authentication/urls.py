# Simplified authentication/urls.py to fix import issue
from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

@api_view(['GET'])
@permission_classes([AllowAny])
def auth_health_check(request):
    return Response({
        "success": True,
        "status": "ok", 
        "service": "Authentication API",
        "message": "Authentication service is running"
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def api_info(request):
    return Response({
        "success": True,
        "message": "SOC Central Authentication API",
        "version": "2.0.0",
        "available_endpoints": [
            "/api/auth/health/",
            "/api/auth/info/",
            "/api/auth/login/",
            "/api/auth/signup/"
        ],
        "timestamp": timezone.now().isoformat()
    }, status=status.HTTP_200_OK)

# Start with basic patterns
urlpatterns = [
    path('health/', auth_health_check, name='auth-health'),
    path('info/', api_info, name='api-info'),
    path('', api_info, name='auth-root'),
]

# Add authentication views
from . import views

# Import ActivityLogView and ActivityStatsView
from .views.activity_logs import ActivityLogView, ActivityStatsView

# Core authentication patterns
auth_patterns = [
    # Core authentication flows
    path('signup/', views.signup_request, name='signup'),
    path('verify-signup/', views.verify_signup_otp, name='verify-signup'),
    path('resend-otp/', views.resend_otp, name='resend-otp'),
    path('login/', views.login, name='login'),
    path('verify-mfa/', views.verify_mfa_code, name='verify-mfa'),
    path('resend-mfa/', views.resend_mfa_code, name='resend-mfa'),
    path('logout/', views.logout, name='logout'),
    path('session-status/', views.check_session_status, name='session-status'),
    path('verify-token/', views.verify_token, name='verify-token'),
    
    # Password management endpoints
    path('request-password-reset-otp/', views.request_password_reset_otp, name='request-password-reset-otp'),
    path('verify-password-reset-otp/', views.verify_password_reset_otp, name='verify-password-reset-otp'),
    path('request-password-reset/', views.request_password_reset, name='request-password-reset'),
    path('reset-password-confirm/', views.reset_password_confirm, name='reset-password-confirm'),
    path('change-password/', views.change_password, name='change-password'),
    
    # Account activation endpoints
    path('activate-account/', views.activate_account, name='activate-account'),
    path('validate-activation-token/<str:token>/', views.validate_activation_token, name='validate-activation-token'),
    
    # User profile endpoints
    path('profile/', views.user_profile, name='user-profile'),
    path('update-profile/', views.update_profile, name='update-profile'),
    
    # User settings endpoints
    path('settings/', views.get_user_settings, name='get-user-settings'),
    path('settings/update/', views.update_user_settings, name='update-user-settings'),
    path('settings/reset/', views.reset_user_settings, name='reset-user-settings'),
    path('settings/export-data/', views.export_user_data, name='export-user-data'),
    path('activity-logs/', ActivityLogView.as_view(), name='activity-logs'),
    path('activity-stats/', ActivityStatsView.as_view(), name='activity-stats'),

    
    # Admin user management endpoints
    path('admin/create-user/', views.create_user_by_admin, name='admin-create-user'),
    path('admin/update-user/<uuid:user_id>/', views.update_user_by_admin, name='admin-update-user'),
    path('admin/reset-password/<uuid:user_id>/', views.send_password_reset_by_admin, name='admin-reset-password'),
    path('admin/toggle-activation/<uuid:user_id>/', views.toggle_user_activation, name='admin-toggle-activation'),
    path('admin/delete-user/<uuid:user_id>/', views.delete_user_by_admin, name='admin-delete-user'),
    path('request-admin-access/', views.request_admin_access, name='request-admin-access'),
    
    # Super admin user management endpoints
    path('users/', views.list_users, name='list-users'),
    path('promote-user/', views.promote_user, name='promote-user'),
    path('demote-user/', views.demote_user, name='demote-user'),
    path('delete-user/', views.delete_user, name='delete-user'),
    path('toggle-user-status/', views.toggle_user_status, name='toggle-user-status'),

    # Company management endpoints (Super Admin only)
    path('companies/', views.list_companies, name='list-companies'),
    path('companies/create/', views.create_company, name='create-company'),
    path('companies/<uuid:company_id>/', views.get_company_details, name='get-company-details'),
    path('companies/<uuid:company_id>/update/', views.update_company, name='update-company'),
    path('companies/<uuid:company_id>/toggle-status/', views.toggle_company_status, name='toggle-company-status'),
    path('companies/<uuid:company_id>/delete/', views.delete_company, name='delete-company'),

    # Company tool permissions management
    path('companies/<uuid:company_id>/tools/', views.get_company_tool_permissions, name='get-company-tool-permissions'),
    path('companies/<uuid:company_id>/tools/update/', views.update_tool_permissions, name='update-tool-permissions'),
    path('companies/<uuid:company_id>/tools/<str:tool_type>/remove/', views.remove_tool_permission, name='remove-tool-permission'),

    # Company users management
    path('companies/<uuid:company_id>/users/', views.get_company_users, name='get-company-users'),
    path('companies/<uuid:company_id>/users/assign/', views.assign_user_to_company, name='assign-user-to-company'),

    # Utility endpoints
    path('tools/available/', views.get_available_tools, name='get-available-tools'),
    path('tools/accessible/', views.get_user_accessible_tools, name='get-user-accessible-tools'),
]

# Debug endpoints (only in development)
debug_patterns = [
    path('debug/system-info/', views.debug_system_info, name='debug-system-info'),
    path('debug/urls/', views.debug_urls, name='debug-urls'),
    path('debug/test-reset-url/', views.test_reset_url_generation, name='test-reset-url'),
    path('debug/password-reset-system/', views.debug_password_reset_system, name='debug-password-reset-system'),
    path('debug/test-password-reset-api/', views.test_password_reset_api, name='test-password-reset-api'),
]

urlpatterns.extend(auth_patterns)

# Add debug endpoints only in development
from django.conf import settings
if getattr(settings, 'DEBUG', False):
    urlpatterns.extend(debug_patterns)
    print(f"Debug endpoints added: {len(debug_patterns)} endpoints")

# Add JWT refresh endpoint
try:
    from rest_framework_simplejwt.views import TokenRefreshView
    urlpatterns.append(path('refresh/', TokenRefreshView.as_view(), name='token-refresh'))
    print("JWT refresh endpoint added")
except ImportError as e:
    print(f"JWT refresh not available: {e}")

print(f"Authentication URLs loaded: {len(urlpatterns)} total endpoints")
print("Core endpoints: health, info, signup, login, logout, verify-token, users, profile, settings, companies")