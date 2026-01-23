# backend/authentication/serializers.py - MERGED VERSION
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from .models import User, Company, CompanyToolPermission
from .utils import clean_and_validate_email


class UserSerializer(serializers.ModelSerializer):
    """Enhanced user serializer for API responses"""
    
    full_name = serializers.SerializerMethodField()
    display_info = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'company_name',
            'job_title', 'department', 'phone_number', 'role', 
            'is_email_verified', 'is_active', 'created_at', 'last_login',
            'full_name', 'display_info'
        ]
        read_only_fields = ['id', 'created_at', 'last_login', 'is_email_verified']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_display_info(self, obj):
        return obj.get_display_info()
    
    def validate_email(self, value):
        cleaned_email = clean_and_validate_email(value)
        if not cleaned_email:
            raise serializers.ValidationError("Invalid email format")
        return cleaned_email
    
    def validate_first_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("First name must be at least 2 characters long")
        return value.strip().title()
    
    def validate_last_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Last name must be at least 2 characters long")
        return value.strip().title()
    
    def validate_company_name(self, value):
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Company name must be at least 2 characters long")
        return value.strip()


class SignupSerializer(serializers.Serializer):
    """Enhanced serializer for user signup with company information"""
    
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=50, min_length=2)
    last_name = serializers.CharField(max_length=50, min_length=2)
    company_name = serializers.CharField(max_length=100, min_length=2)
    job_title = serializers.CharField(max_length=100, required=False, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)
    terms_accepted = serializers.BooleanField()
    
    def validate_email(self, value):
        cleaned_email = clean_and_validate_email(value)
        if not cleaned_email:
            raise serializers.ValidationError("Invalid email format")
        
        # Check if email already exists
        if User.objects.filter(email=cleaned_email).exists():
            raise serializers.ValidationError("An account with this email already exists")
        
        return cleaned_email
    
    def validate_first_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("First name must be at least 2 characters long")
        if not value.replace(' ', '').replace('-', '').replace("'", '').isalpha():
            raise serializers.ValidationError("First name can only contain letters, spaces, hyphens, and apostrophes")
        return value.title()
    
    def validate_last_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Last name must be at least 2 characters long")
        if not value.replace(' ', '').replace('-', '').replace("'", '').isalpha():
            raise serializers.ValidationError("Last name can only contain letters, spaces, hyphens, and apostrophes")
        return value.title()
    
    def validate_company_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Company name must be at least 2 characters long")
        return value
    
    def validate_phone_number(self, value):
        if value:
            # Remove all non-digit characters for validation
            digits_only = ''.join(filter(str.isdigit, value))
            if len(digits_only) < 10:
                raise serializers.ValidationError("Phone number must have at least 10 digits")
        return value
    
    def validate_password(self, value):
        validate_password(value)
        
        # Additional custom validations
        if value.lower() in ['password', '12345678', 'qwerty123', 'password123']:
            raise serializers.ValidationError("Password is too common")
        
        return value
    
    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the terms and conditions")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        
        # Check if password contains email or company name
        if attrs['email'].split('@')[0].lower() in attrs['password'].lower():
            raise serializers.ValidationError({"password": "Password should not contain parts of your email"})
        
        if attrs['company_name'].lower() in attrs['password'].lower():
            raise serializers.ValidationError({"password": "Password should not contain your company name"})
        
        return attrs


# Helper functions for user creation (standalone functions)
def create_user_from_pending_data(pending_data):
    """Create a User instance from pending signup data dictionary"""
    from .models import User
    
    # Validate required fields exist
    required_fields = ['email', 'first_name', 'last_name', 'company_name', 'password']
    for field in required_fields:
        if not pending_data.get(field):
            raise ValueError(f"Missing required field: {field}")
    
    try:
        user = User.objects.create_user(
            username=pending_data['email'],
            email=pending_data['email'],
            first_name=pending_data['first_name'],
            last_name=pending_data['last_name'],
            password=pending_data['password'],  # Raw password - create_user will hash it
            company_name=pending_data['company_name'],
            job_title=pending_data.get('job_title', ''),
            department=pending_data.get('department', ''),
            phone_number=pending_data.get('phone_number', ''),
            is_active=True,
            is_email_verified=True,
            role='general'
        )
        return user
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to create user from pending data: {str(e)}")
        raise


def validate_pending_signup_data(data):
    """Validate pending signup data structure"""
    
    required_fields = {
        'email': str,
        'first_name': str,
        'last_name': str,
        'company_name': str,
        'password': str,
        'created_at': str,
        'ip_address': str,
        'user_agent': str
    }
    
    optional_fields = {
        'job_title': str,
        'department': str,
        'phone_number': str
    }
    
    # Check required fields
    for field, expected_type in required_fields.items():
        if field not in data:
            raise ValueError(f"Missing required field: {field}")
        if not isinstance(data[field], expected_type):
            raise ValueError(f"Field {field} must be of type {expected_type.__name__}")
        if not str(data[field]).strip():  # Check for empty strings
            raise ValueError(f"Field {field} cannot be empty")
    
    # Validate optional fields if present
    for field, expected_type in optional_fields.items():
        if field in data and data[field] is not None:
            if not isinstance(data[field], expected_type):
                raise ValueError(f"Field {field} must be of type {expected_type.__name__}")
    
    return True


class UserManagementSerializer(serializers.ModelSerializer):
    """Enhanced serializer for admin user management"""
    
    full_name = serializers.SerializerMethodField()
    last_activity = serializers.SerializerMethodField()
    session_count = serializers.SerializerMethodField()
    display_info = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'company_name', 'job_title', 'department', 'phone_number',
            'role', 'is_email_verified', 'is_active', 'created_at', 
            'last_login', 'last_activity', 'session_count', 'display_info'
        ]
        read_only_fields = ['id', 'created_at', 'last_login']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_display_info(self, obj):
        return obj.get_display_info()
    
    def get_last_activity(self, obj):
        last_session = obj.user_sessions.filter(is_active=True).order_by('-last_activity').first()
        return last_session.last_activity if last_session else None
    
    def get_session_count(self, obj):
        return obj.user_sessions.filter(is_active=True).count()


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password"""
    
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
    confirm_password = serializers.CharField(min_length=8)
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value
    
    def validate_new_password(self, value):
        validate_password(value)
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "New passwords do not match"})
        
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError({"new_password": "New password must be different from current password"})
        
        return attrs


class OTPVerificationSerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    
    user_id = serializers.CharField()  # Can be UUID or temporary ID
    otp_code = serializers.CharField(max_length=6, min_length=6)
    purpose = serializers.ChoiceField(
        choices=['signup', 'login', 'password_reset', 'email_change'],
        default='signup'
    )
    
    def validate_otp_code(self, value):
        """Validate OTP code format"""
        if not value.isdigit():
            raise serializers.ValidationError("OTP code must contain only digits")
        
        if len(value) != 6:
            raise serializers.ValidationError("OTP code must be exactly 6 digits")
        
        return value
    
    def validate_user_id(self, value):
        """Validate user ID format"""
        # Check if it's a valid UUID (for temporary IDs or real user IDs)
        try:
            import uuid
            uuid.UUID(str(value))
            return str(value)
        except ValueError:
            raise serializers.ValidationError("Invalid user ID format")


class ResendOTPSerializer(serializers.Serializer):
    """Serializer for resending OTP"""
    
    user_id = serializers.CharField()
    purpose = serializers.ChoiceField(
        choices=['signup', 'login', 'password_reset', 'email_change'],
        default='signup'
    )
    
    def validate_user_id(self, value):
        """Validate user ID format"""
        try:
            import uuid
            uuid.UUID(str(value))
            return str(value)
        except ValueError:
            raise serializers.ValidationError("Invalid user ID format")


class MFACodeSerializer(serializers.Serializer):
    """Serializer for MFA code verification"""
    
    user_id = serializers.CharField()
    code = serializers.CharField(max_length=4, min_length=4)
    
    def validate_code(self, value):
        """Validate MFA code format"""
        if not value.isdigit():
            raise serializers.ValidationError("MFA code must contain only digits")
        
        if len(value) != 4:
            raise serializers.ValidationError("MFA code must be exactly 4 digits")
        
        return value
    
    def validate_user_id(self, value):
        """Validate user ID format"""
        try:
            import uuid
            uuid.UUID(str(value))
            return str(value)
        except ValueError:
            raise serializers.ValidationError("Invalid user ID format")


class ResendMFASerializer(serializers.Serializer):
    """Serializer for resending MFA code"""
    
    user_id = serializers.CharField()
    
    def validate_user_id(self, value):
        """Validate user ID format"""
        try:
            import uuid
            uuid.UUID(str(value))
            return str(value)
        except ValueError:
            raise serializers.ValidationError("Invalid user ID format")


class CompanyToolPermissionSerializer(serializers.ModelSerializer):
    """Serializer for company tool permissions"""

    tool_type_display = serializers.SerializerMethodField()

    class Meta:
        model = CompanyToolPermission
        fields = [
            'id', 'tool_type', 'tool_type_display', 'is_enabled',
            'can_view', 'can_upload', 'can_analyze', 'can_export', 'can_manage',
            'data_retention_days', 'max_upload_size_mb', 'max_records_per_upload',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_tool_type_display(self, obj):
        return obj.get_tool_type_display()


class CompanySerializer(serializers.ModelSerializer):
    """Enhanced serializer for company management"""

    tool_permissions = CompanyToolPermissionSerializer(many=True, read_only=True)
    enabled_tools_display = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()
    admin_count = serializers.SerializerMethodField()
    master_admin_count = serializers.SerializerMethodField()
    remaining_user_slots = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id', 'name', 'display_name', 'description',
            'email_domain', 'primary_contact_email', 'phone_number', 'address',
            'enabled_tools', 'enabled_tools_display', 'max_users', 'is_active',
            'user_count', 'admin_count', 'master_admin_count', 'remaining_user_slots', 'tool_permissions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_count', 'admin_count', 'master_admin_count', 'remaining_user_slots']

    def get_enabled_tools_display(self, obj):
        return obj.get_enabled_tools_display()

    def get_user_count(self, obj):
        return obj.get_user_count()

    def get_admin_count(self, obj):
        return obj.get_admin_count()

    def get_master_admin_count(self, obj):
        return obj.get_master_admin_count()

    def get_remaining_user_slots(self, obj):
        return obj.get_remaining_user_slots()

    def validate_name(self, value):
        """Validate company name"""
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Company name must be at least 2 characters long")

        # Check if company name already exists (case-insensitive)
        if Company.objects.filter(name__iexact=value).exists():
            if not self.instance or self.instance.name.lower() != value.lower():
                raise serializers.ValidationError("A company with this name already exists")

        return value

    def validate_email_domain(self, value):
        """Validate email domain format"""
        if value:
            value = value.lower().strip()
            if not value.replace('.', '').replace('-', '').isalnum():
                raise serializers.ValidationError("Invalid email domain format")
        return value

    def validate_enabled_tools(self, value):
        """Validate enabled tools list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Enabled tools must be a list")

        valid_tools = [choice[0] for choice in Company.TOOL_CHOICES]
        for tool in value:
            if tool not in valid_tools:
                raise serializers.ValidationError(f"Invalid tool: {tool}")

        return value

    def validate_max_users(self, value):
        """Validate max_users"""
        if value is not None and value < 1:
            raise serializers.ValidationError("Maximum users must be at least 1")
        if value is not None and value > 10000:
            raise serializers.ValidationError("Maximum users cannot exceed 10,000")

        # If updating an existing company, check that new max_users is not less than current user count
        if self.instance and value is not None:
            current_user_count = self.instance.get_user_count()
            if value < current_user_count:
                raise serializers.ValidationError(
                    f"Cannot set maximum users to {value}. Company currently has {current_user_count} active users. "
                    f"Please deactivate or remove users first."
                )

        return value


class CompanyCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating companies with tool permissions"""

    tools_config = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of tool configurations with permissions"
    )

    class Meta:
        model = Company
        fields = [
            'name', 'display_name', 'description',
            'email_domain', 'primary_contact_email', 'phone_number', 'address',
            'enabled_tools', 'max_users', 'tools_config'
        ]

    def validate_name(self, value):
        """Validate company name"""
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Company name must be at least 2 characters long")

        # Check if company name already exists (case-insensitive)
        if Company.objects.filter(name__iexact=value).exists():
            raise serializers.ValidationError("A company with this name already exists")

        return value

    def validate_tools_config(self, value):
        """Validate tools configuration"""
        if not value:
            return []

        valid_tools = [choice[0] for choice in Company.TOOL_CHOICES]

        for tool_config in value:
            if 'tool_type' not in tool_config:
                raise serializers.ValidationError("Each tool config must have a 'tool_type' field")

            if tool_config['tool_type'] not in valid_tools:
                raise serializers.ValidationError(f"Invalid tool type: {tool_config['tool_type']}")

        return value

    def validate_max_users(self, value):
        """Validate max_users"""
        if value is not None and value < 1:
            raise serializers.ValidationError("Maximum users must be at least 1")
        if value is not None and value > 10000:
            raise serializers.ValidationError("Maximum users cannot exceed 10,000")
        return value

    def create(self, validated_data):
        """Create company with tool permissions"""
        tools_config = validated_data.pop('tools_config', [])
        enabled_tools = validated_data.get('enabled_tools', [])

        # Create the company
        company = Company.objects.create(**validated_data)

        # Create tool permissions for each enabled tool
        for tool_type in enabled_tools:
            # Find specific config for this tool
            tool_config = next((config for config in tools_config if config['tool_type'] == tool_type), {})

            CompanyToolPermission.objects.create(
                company=company,
                tool_type=tool_type,
                is_enabled=tool_config.get('is_enabled', True),
                can_view=tool_config.get('can_view', True),
                can_upload=tool_config.get('can_upload', True),
                can_analyze=tool_config.get('can_analyze', True),
                can_export=tool_config.get('can_export', True),
                can_manage=tool_config.get('can_manage', False),
                data_retention_days=tool_config.get('data_retention_days', 365),
                max_upload_size_mb=tool_config.get('max_upload_size_mb', 100),
                max_records_per_upload=tool_config.get('max_records_per_upload', 100000),
                created_by=self.context.get('request').user if self.context.get('request') else None
            )

        return company


class UserWithCompanySerializer(serializers.ModelSerializer):
    """Enhanced user serializer with company information"""

    full_name = serializers.SerializerMethodField()
    company_info = serializers.SerializerMethodField()
    available_tools = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'company', 'company_name', 'company_info', 'job_title', 'department',
            'phone_number', 'role', 'is_email_verified', 'is_active',
            'available_tools', 'created_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'last_login', 'is_email_verified', 'available_tools']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_company_info(self, obj):
        if obj.company:
            return {
                'id': str(obj.company.id),
                'name': obj.company.name,
                'display_name': obj.company.display_name,
                'enabled_tools': obj.company.enabled_tools
            }
        return {
            'name': obj.company_name,
            'legacy': True
        }

    def get_available_tools(self, obj):
        return obj.get_available_tools()