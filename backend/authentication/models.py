# backend/authentication/models.py - MERGED VERSION
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
import random
import string
import uuid

class Company(models.Model):
    """Company/Organization model with tool permissions"""

    TOOL_CHOICES = [
        ('gsuite', 'G Suite'),
        ('mdm', 'MDM'),
        ('siem', 'SIEM'),
        ('edr', 'EDR'),
        ('meraki', 'Meraki'),
        ('sonicwall', 'SonicWall'),
    ]

    # Basic company information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True, help_text="Company name")
    display_name = models.CharField(max_length=255, help_text="Display name for the company")
    description = models.TextField(blank=True, help_text="Company description")

    # Contact information
    email_domain = models.CharField(max_length=255, blank=True, help_text="Company email domain (e.g., company.com)")
    primary_contact_email = models.EmailField(blank=True, help_text="Primary contact email")
    phone_number = models.CharField(max_length=20, blank=True, help_text="Company phone number")
    address = models.TextField(blank=True, help_text="Company address")

    # Tool permissions - which tools this company has access to
    enabled_tools = models.JSONField(default=list, help_text="List of enabled tools for this company")

    # User limit
    max_users = models.IntegerField(default=10, help_text="Maximum number of users allowed for this company")

    # System fields
    is_active = models.BooleanField(default=True, help_text="Company is active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_companies')

    class Meta:
        db_table = 'companies'
        verbose_name_plural = 'Companies'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
            models.Index(fields=['email_domain']),
        ]

    def __str__(self):
        return self.display_name or self.name

    def save(self, *args, **kwargs):
        # Auto-generate display_name if not provided
        if not self.display_name:
            self.display_name = self.name
        # Ensure enabled_tools is a list
        if not isinstance(self.enabled_tools, list):
            self.enabled_tools = []
        super().save(*args, **kwargs)

    def add_tool_permission(self, tool_type):
        """Add tool permission to company"""
        if tool_type in dict(self.TOOL_CHOICES) and tool_type not in self.enabled_tools:
            self.enabled_tools.append(tool_type)
            self.save()
            return True
        return False

    def remove_tool_permission(self, tool_type):
        """Remove tool permission from company"""
        if tool_type in self.enabled_tools:
            self.enabled_tools.remove(tool_type)
            self.save()
            return True
        return False

    def has_tool_permission(self, tool_type):
        """Check if company has permission for specific tool"""
        return tool_type in self.enabled_tools

    def get_enabled_tools_display(self):
        """Get display names of enabled tools"""
        tool_dict = dict(self.TOOL_CHOICES)
        return [tool_dict.get(tool, tool) for tool in self.enabled_tools]

    def get_user_count(self):
        """Get number of users in this company"""
        return User.objects.filter(company=self, is_active=True).count()

    def get_admin_count(self):
        """Get number of admin users in this company (excludes master_admin and super_admin)"""
        return User.objects.filter(
            company=self,
            role='admin',
            is_active=True
        ).count()

    def get_master_admin_count(self):
        """Get number of master admin users in this company"""
        return User.objects.filter(
            company=self,
            role='master_admin',
            is_active=True
        ).count()

    def get_all_admin_count(self):
        """Get total number of admin and master_admin users (excludes super_admin)"""
        return User.objects.filter(
            company=self,
            role__in=['admin', 'master_admin'],
            is_active=True
        ).count()

    def can_add_admin(self, requesting_user):
        """
        Check if company can add more admins based on who is requesting.
        - Super Admin: unlimited
        - Master Admin: max 3 admins total (not counting master_admin themselves)
        """
        if requesting_user.role == 'super_admin':
            return True, None  # No limit for super admin

        if requesting_user.role == 'master_admin':
            current_admin_count = self.get_admin_count()
            if current_admin_count >= 3:
                return False, f"Maximum of 3 admins allowed per company. Currently: {current_admin_count}"
            return True, None

        return False, "Only Master Admin or Super Admin can create admins"

    def can_add_users(self, count=1):
        """Check if company can add more users"""
        current_count = self.get_user_count()
        return (current_count + count) <= self.max_users

    def get_remaining_user_slots(self):
        """Get remaining user slots available"""
        current_count = self.get_user_count()
        return max(0, self.max_users - current_count)


class CompanyToolPermission(models.Model):
    """Detailed tool permissions with additional settings"""

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='tool_permissions')
    tool_type = models.CharField(max_length=20, choices=Company.TOOL_CHOICES)
    is_enabled = models.BooleanField(default=True)

    # Permission levels
    can_view = models.BooleanField(default=True, help_text="Can view tool data")
    can_upload = models.BooleanField(default=True, help_text="Can upload data")
    can_analyze = models.BooleanField(default=True, help_text="Can run analysis")
    can_export = models.BooleanField(default=True, help_text="Can export data")
    can_manage = models.BooleanField(default=False, help_text="Can manage tool settings")

    # Data retention and limits
    data_retention_days = models.IntegerField(default=365, help_text="Days to retain data (0 = unlimited)")
    max_upload_size_mb = models.IntegerField(default=100, help_text="Maximum upload size in MB")
    max_records_per_upload = models.IntegerField(default=100000, help_text="Maximum records per upload")

    # Audit trail
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tool_permissions')

    class Meta:
        unique_together = ['company', 'tool_type']
        db_table = 'company_tool_permissions'
        indexes = [
            models.Index(fields=['company', 'tool_type']),
            models.Index(fields=['is_enabled']),
        ]

    def __str__(self):
        return f"{self.company.name} - {self.get_tool_type_display()}"


class User(AbstractUser):
    """Enhanced User model with company information and role-based access"""
    
    USER_ROLES = [
        ('general', 'General User'),
        ('admin', 'Admin'),
        ('master_admin', 'Master Admin'),
        ('super_admin', 'Super Admin'),
    ]
    
    # Override the default id field
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Required fields
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    
    # Company and business information with proper defaults
    company = models.ForeignKey(Company, on_delete=models.CASCADE, null=True, blank=True, related_name='users', help_text="Associated company")
    company_name = models.CharField(max_length=100, default='', help_text="Name of the company/organization (legacy field)")
    job_title = models.CharField(max_length=100, default='', blank=True, help_text="User's job title")
    department = models.CharField(max_length=100, default='', blank=True, help_text="Department/Division")
    phone_number = models.CharField(max_length=20, default='', blank=True, help_text="Contact phone number with country code")
    country_code = models.CharField(max_length=5, default='', blank=True, help_text="Country code (e.g., +1, +44)")
    is_phone_verified = models.BooleanField(default=False, help_text="Phone number verification status")
    
    # System fields
    role = models.CharField(max_length=20, choices=USER_ROLES, default='general')
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_otp_request = models.DateTimeField(null=True, blank=True)
    otp_attempts = models.PositiveIntegerField(default=0)
    
    # Admin-managed authentication fields
    created_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='created_users')
    password_reset_required = models.BooleanField(default=False, help_text="User must reset password on next login")
    last_password_reset = models.DateTimeField(null=True, blank=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    is_active = models.BooleanField(default=True, help_text="User can log in")
    
    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'company_name']
    
    class Meta:
        db_table = 'auth_users'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['is_email_verified']),
            models.Index(fields=['company_name']),
        ]
    
    def save(self, *args, **kwargs):
        # Set username to email if not set
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)
    
    def can_read(self):
        """All verified users can read"""
        return self.is_email_verified
    
    def can_write(self):
        """Admin, Master Admin and Super Admin can write"""
        return self.role in ['admin', 'master_admin', 'super_admin'] and self.is_email_verified

    def can_manage_users(self):
        """Super Admin and Master Admin can manage users"""
        return self.role in ['super_admin', 'master_admin'] and self.is_email_verified

    def can_promote_to_admin(self):
        """Master Admin and Super Admin can promote users to admin"""
        return self.role in ['master_admin', 'super_admin'] and self.is_email_verified

    def can_manage_company_users(self):
        """Master Admin can manage users within their company, Super Admin can manage all"""
        return self.role in ['master_admin', 'super_admin'] and self.is_email_verified
    
    def get_full_name(self):
        """Return the user's full name"""
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_display_info(self):
        """Return formatted display information"""
        return {
            'name': self.get_full_name(),
            'email': self.email,
            'company': self.get_company_name(),
            'role': self.get_role_display(),
            'department': self.department or 'Not specified'
        }
    
    def promote_to_admin(self, promoted_by_user):
        """Promote user to admin (only by super admin)"""
        if promoted_by_user.can_manage_users() and self.role == 'general':
            self.role = 'admin'
            self.save()
            return True
        return False
    
    def demote_to_general(self, demoted_by_user):
        """Demote admin to general user (only by super admin)"""
        if demoted_by_user.can_manage_users() and self.role == 'admin':
            self.role = 'general'
            self.save()
            return True
        return False
    
    def can_request_otp(self):
        """Check if user can request new OTP (rate limiting)"""
        if not self.last_otp_request:
            return True
        
        time_diff = timezone.now() - self.last_otp_request
        return time_diff.total_seconds() >= (getattr(settings, 'OTP_RATE_LIMIT_MINUTES', 2) * 60)
    
    def increment_otp_attempts(self):
        """Increment OTP attempts counter"""
        self.otp_attempts += 1
        self.save()
    
    def reset_otp_attempts(self):
        """Reset OTP attempts counter"""
        self.otp_attempts = 0
        self.save()
    
    def is_otp_attempts_exceeded(self):
        """Check if max OTP attempts exceeded"""
        max_attempts = getattr(settings, 'MAX_OTP_ATTEMPTS', 5)
        return self.otp_attempts >= max_attempts
    
    def create_password_reset_token(self, token_type='reset', created_by=None):
        """Create a password reset token for this user"""
        # Invalidate existing tokens of the same type
        self.password_reset_tokens.filter(
            token_type=token_type,
            is_used=False
        ).update(is_used=True, used_at=timezone.now())
        
        # Create new token
        token = PasswordResetToken.objects.create(
            user=self,
            token_type=token_type,
            created_by=created_by
        )
        return token
    
    def send_activation_email(self, created_by=None):
        """Send account activation email to user"""
        token = self.create_password_reset_token(token_type='activation', created_by=created_by)
        
        # Import here to avoid circular imports
        from .services import EmailService
        email_service = EmailService()
        
        return email_service.send_activation_email(self, created_by=created_by)
    
    def send_password_reset_email(self, created_by=None):
        """Send password reset email to user"""
        token = self.create_password_reset_token(token_type='reset', created_by=created_by)
        
        # Import here to avoid circular imports
        from .services import EmailService
        email_service = EmailService()
        
        return email_service.send_password_reset_email(self, token.token)
    
    def can_be_managed_by(self, admin_user):
        """Check if this user can be managed by the given admin"""
        if not admin_user.can_write():
            return False

        # Super admin can manage all users
        if admin_user.role == 'super_admin':
            return True

        # Regular admin can only manage users in their company
        if admin_user.role == 'admin':
            # Check both new company FK and legacy company_name
            if self.company and admin_user.company:
                return self.company == admin_user.company
            return self.company_name == admin_user.company_name

        return False

    def get_company_name(self):
        """Get company name (prioritize Company FK over legacy field)"""
        if self.company:
            return self.company.name
        return self.company_name

    def get_company_display_name(self):
        """Get company display name"""
        if self.company:
            return self.company.display_name
        return self.company_name

    def has_tool_access(self, tool_type):
        """Check if user has access to specific tool through their company"""
        if self.role == 'super_admin':
            return True  # Super admins have access to all tools

        if self.company:
            # Check CompanyToolPermission for granular control
            permission = self.company.tool_permissions.filter(
                tool_type=tool_type,
                is_enabled=True
            ).first()
            if permission:
                return True
            # Fallback to company enabled_tools
            return self.company.has_tool_permission(tool_type)

        # Fallback for users with company_name but no company FK
        if hasattr(self, 'company_name') and self.company_name:
            try:
                company = Company.objects.get(name=self.company_name)
                permission = company.tool_permissions.filter(
                    tool_type=tool_type,
                    is_enabled=True
                ).first()
                if permission:
                    return True
                return company.has_tool_permission(tool_type)
            except Company.DoesNotExist:
                pass

        # Legacy users without company have no access by default (security first)
        return False

    def get_available_tools(self):
        """Get list of tools available to this user"""
        if self.role == 'super_admin':
            # Super admins see all available tools
            return [choice[0] for choice in Company.TOOL_CHOICES]

        if self.company:
            # Get tools from CompanyToolPermission model for granular control
            enabled_permissions = self.company.tool_permissions.filter(
                is_enabled=True
            )
            if enabled_permissions.exists():
                return [perm.tool_type for perm in enabled_permissions]
            # Fallback to enabled_tools if no detailed permissions exist
            return self.company.enabled_tools

        # Fallback for users with company_name but no company FK
        if hasattr(self, 'company_name') and self.company_name:
            try:
                company = Company.objects.get(name=self.company_name)
                # Auto-link user to company if found
                self.company = company
                self.save(update_fields=['company'])
                
                enabled_permissions = company.tool_permissions.filter(
                    is_enabled=True
                )
                if enabled_permissions.exists():
                    return [perm.tool_type for perm in enabled_permissions]
                return company.enabled_tools
            except Company.DoesNotExist:
                # Auto-create company for legacy users if they have a company_name
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Auto-creating company for legacy user {self.email}: {self.company_name}")
                
                company = Company.objects.create(
                    name=self.company_name,
                    display_name=self.company_name,
                    description=f"Auto-created company for legacy user {self.email}",
                    enabled_tools=['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall'],
                    is_active=True
                )
                
                # Create detailed tool permissions
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
                
                # Link user to the new company
                self.company = company
                self.save(update_fields=['company'])
                
                return company.enabled_tools

        # Users without any company info have no tools by default (security first)
        return []

    def can_manage_company_tools(self):
        """Check if user can manage company tool permissions"""
        return self.role == 'super_admin'
    
    def validate_phone_number(self):
        """Validate phone number format with country code"""
        import re
        if not self.phone_number or not self.country_code:
            return False
        
        # Basic validation - phone should have country code format
        phone_pattern = r'^[\+]?[1-9]\d{1,14}$'
        return bool(re.match(phone_pattern, self.phone_number.replace(' ', '').replace('-', '')))
    
    def get_formatted_phone(self):
        """Get formatted phone number"""
        if self.country_code and self.phone_number:
            return f"{self.country_code} {self.phone_number}"
        return self.phone_number or ''
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()}) - {self.get_company_name()}"


class OTPVerification(models.Model):
    """OTP verification model"""
    
    PURPOSE_CHOICES = [
        ('signup', 'Signup Verification'),
        ('login', 'Login Verification'), 
        ('password_reset', 'Password Reset'),
        ('email_change', 'Email Change'),
    ]
    
    DELIVERY_CHOICES = [
        ('email', 'Email'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_verifications')
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    delivery_method = models.CharField(max_length=10, choices=DELIVERY_CHOICES, default='email')
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = 'otp_verifications'
        indexes = [
            models.Index(fields=['user', 'purpose', 'is_used']),
            models.Index(fields=['otp_code']),
            models.Index(fields=['expires_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.otp_code:
            self.otp_code = ''.join(random.choices(string.digits, k=6))
        if not self.expires_at:
            expiry_minutes = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
            self.expires_at = timezone.now() + timezone.timedelta(minutes=expiry_minutes)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if OTP is valid and not expired"""
        max_attempts = getattr(settings, 'MAX_OTP_ATTEMPTS', 5)
        return (
            not self.is_used and 
            timezone.now() < self.expires_at and 
            self.attempts < max_attempts
        )
    
    def increment_attempts(self):
        """Increment verification attempts"""
        self.attempts += 1
        self.save()
    
    def mark_as_used(self):
        """Mark OTP as used"""
        self.is_used = True
        self.save()
    
    def send_otp(self):
        """Send OTP via email or SMS based on delivery method"""
        try:
            if self.delivery_method == 'email':
                return self.send_otp_email()
            elif self.delivery_method == 'sms':
                return self.send_otp_sms()
            return False
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send OTP to {self.user.email}: {str(e)}")
            return False

    def send_otp_email(self):
        """Send OTP via email using EmailService"""
        try:
            from .services import EmailService
            email_service = EmailService()
            
            return email_service.send_signup_otp_email(
                email=self.user.email,
                otp_code=self.otp_code,
                first_name=self.user.first_name
            )
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send OTP email to {self.user.email}: {str(e)}")
            return False
    
    def send_otp_sms(self):
        """Send OTP via SMS using production SMS service"""
        try:
            phone = self.phone_number or self.user.get_formatted_phone()
            if not phone:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"No phone number available for user {self.user.email}")
                return False
            
            from .services import send_otp_sms, SMSServiceError
            import logging
            logger = logging.getLogger(__name__)
            
            user_name = self.user.get_full_name() or self.user.first_name
            result = send_otp_sms(
                phone_number=phone,
                otp_code=self.otp_code,
                user_name=user_name
            )
            
            if result['success']:
                logger.info(f"SMS OTP sent successfully to {phone} for user {self.user.email}")
                return True
            else:
                logger.error(f"Failed to send SMS OTP to {phone}: {result.get('error')}")
                return False
                
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Unexpected error sending SMS OTP to {self.phone_number}: {str(e)}")
            return False
    
    def __str__(self):
        return f"OTP for {self.user.email} - {self.purpose} - {'Used' if self.is_used else 'Active'}"


class PasswordResetToken(models.Model):
    """Enhanced password reset token model for admin-managed authentication"""
    
    TOKEN_TYPES = [
        ('activation', 'Account Activation'),
        ('reset', 'Password Reset'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=64, unique=True)
    token_type = models.CharField(max_length=20, choices=TOKEN_TYPES, default='reset')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    is_used = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tokens')
    
    class Meta:
        db_table = 'password_reset_tokens'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['user', 'token_type', 'is_used']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.token:
            import secrets
            self.token = secrets.token_urlsafe(32)
        if not self.expires_at:
            if self.token_type == 'activation':
                self.expires_at = timezone.now() + timezone.timedelta(hours=24)
            else:
                self.expires_at = timezone.now() + timezone.timedelta(hours=1)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if token is valid and not expired"""
        return not self.is_used and timezone.now() < self.expires_at
    
    def mark_as_used(self):
        """Mark token as used"""
        self.is_used = True
        self.used_at = timezone.now()
        self.save()
    
    def get_reset_url(self, base_url=None):
        """Generate password reset URL"""
        if not base_url:
            base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
        return f"{base_url}/reset-password/{self.token}"
    
    @classmethod
    def cleanup_expired_tokens(cls):
        """Remove expired tokens"""
        expired_count = cls.objects.filter(expires_at__lt=timezone.now()).delete()[0]
        return expired_count
    
    def __str__(self):
        return f"{self.get_token_type_display()} token for {self.user.email} - {'Used' if self.is_used else 'Active'}"


class UserSession(models.Model):
    """Track user sessions for security"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_sessions')
    session_key = models.CharField(max_length=128, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'user_sessions'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['session_key']),
            models.Index(fields=['last_activity']),
        ]
    
    def __str__(self):
        return f"Session for {self.user.email} - {self.ip_address}"


class MFACode(models.Model):
    """MFA verification code for login"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mfa_codes')
    code = models.CharField(max_length=4)
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    last_sent_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'mfa_codes'
        indexes = [
            models.Index(fields=['user', 'is_used']),
            models.Index(fields=['code']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['last_sent_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = ''.join(random.choices(string.digits, k=4))
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=10)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if MFA code is valid and not expired"""
        max_attempts = getattr(settings, 'MAX_MFA_ATTEMPTS', 3)
        return (
            not self.is_used and 
            timezone.now() < self.expires_at and 
            self.attempts < max_attempts
        )
    
    def increment_attempts(self):
        """Increment verification attempts"""
        self.attempts += 1
        self.save()
    
    def mark_as_used(self):
        """Mark MFA code as used"""
        self.is_used = True
        self.save()
    
    def can_resend(self):
        """Check if user can request a new MFA code (2-minute cooldown)"""
        time_diff = timezone.now() - self.last_sent_at
        return time_diff.total_seconds() >= 120
    
    def send_mfa_email(self):
        """Send MFA code via email"""
        try:
            from .services import EmailService
            email_service = EmailService()
            
            return email_service.send_mfa_code_email(
                email=self.user.email,
                code=self.code,
                first_name=self.user.first_name
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Failed to send MFA email to {self.user.email}: {str(e)}")
            return False
    
    def __str__(self):
        return f"MFA code for {self.user.email} - {'Used' if self.is_used else 'Active'}"


# Import settings models conditionally to avoid import errors
try:
    from .models_settings import UserSettings, UserActivityLog
except ImportError:
    # Handle the case where models_settings doesn't exist yet
    pass