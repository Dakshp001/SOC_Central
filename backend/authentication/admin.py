from django.contrib import admin
from .models import User, Company, CompanyToolPermission, UserSession, PasswordResetToken, OTPVerification

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'is_active', 'user_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'display_name', 'email_domain']
    readonly_fields = ['created_at', 'updated_at', 'user_count', 'admin_count']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'display_name', 'description', 'is_active')
        }),
        ('Contact Information', {
            'fields': ('email_domain', 'primary_contact_email', 'phone_number', 'address')
        }),
        ('Tool Permissions', {
            'fields': ('enabled_tools',)
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at', 'user_count', 'admin_count'),
            'classes': ('collapse',)
        }),
    )

    def user_count(self, obj):
        return obj.get_user_count()
    user_count.short_description = 'Users'

    def admin_count(self, obj):
        return obj.get_admin_count()
    admin_count.short_description = 'Admins'

@admin.register(CompanyToolPermission)
class CompanyToolPermissionAdmin(admin.ModelAdmin):
    list_display = ['company', 'tool_type', 'is_enabled', 'can_view', 'can_upload', 'can_analyze', 'can_export', 'can_manage']
    list_filter = ['tool_type', 'is_enabled', 'can_view', 'can_upload', 'can_analyze', 'can_export', 'can_manage']
    search_fields = ['company__name', 'tool_type']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('company', 'tool_type', 'is_enabled')
        }),
        ('Permissions', {
            'fields': ('can_view', 'can_upload', 'can_analyze', 'can_export', 'can_manage')
        }),
        ('Limits & Settings', {
            'fields': ('data_retention_days', 'max_upload_size_mb', 'max_records_per_upload')
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'last_name', 'company_display', 'role', 'is_active', 'is_email_verified', 'created_at']
    list_filter = ['role', 'is_active', 'is_email_verified', 'company', 'created_at']
    search_fields = ['email', 'first_name', 'last_name', 'company_name']
    readonly_fields = ['created_at', 'updated_at', 'last_login', 'company_display', 'available_tools']

    fieldsets = (
        ('Basic Information', {
            'fields': ('email', 'first_name', 'last_name', 'role')
        }),
        ('Company Information', {
            'fields': ('company', 'company_name', 'company_display', 'job_title', 'department')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'country_code', 'is_phone_verified')
        }),
        ('Status & Access', {
            'fields': ('is_active', 'is_email_verified', 'available_tools')
        }),
        ('System Information', {
            'fields': ('created_by', 'created_at', 'updated_at', 'last_login'),
            'classes': ('collapse',)
        }),
    )

    def company_display(self, obj):
        return obj.get_company_display_name()
    company_display.short_description = 'Company'

    def available_tools(self, obj):
        return ', '.join(obj.get_available_tools())
    available_tools.short_description = 'Available Tools'

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'is_active', 'created_at', 'last_activity']
    list_filter = ['is_active', 'created_at', 'last_activity']
    search_fields = ['user__email', 'ip_address']
    readonly_fields = ['created_at', 'last_activity']

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token_type', 'is_used', 'created_at', 'expires_at']
    list_filter = ['token_type', 'is_used', 'created_at']
    search_fields = ['user__email', 'token']
    readonly_fields = ['token', 'created_at', 'used_at']

@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'purpose', 'delivery_method', 'is_used', 'attempts', 'created_at', 'expires_at']
    list_filter = ['purpose', 'delivery_method', 'is_used', 'created_at']
    search_fields = ['user__email', 'otp_code']
    readonly_fields = ['otp_code', 'created_at', 'expires_at']
