# backend/authentication/models_settings.py - User Settings Models
from django.db import models
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class UserSettings(models.Model):
    """User settings and preferences model"""
    
    # Theme choices
    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    ]
    
    # Language choices
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('es', 'Español'),
        ('fr', 'Français'),
        ('de', 'Deutsch'),
        ('it', 'Italiano'),
        ('pt', 'Português'),
        ('zh', '中文'),
        ('ja', '日本語'),
    ]
    
    # Date format choices
    DATE_FORMAT_CHOICES = [
        ('MM/DD/YYYY', 'MM/DD/YYYY'),
        ('DD/MM/YYYY', 'DD/MM/YYYY'),
        ('YYYY-MM-DD', 'YYYY-MM-DD'),
        ('DD-MM-YYYY', 'DD-MM-YYYY'),
        ('MM-DD-YYYY', 'MM-DD-YYYY'),
    ]
    
    # Default view choices
    DEFAULT_VIEW_CHOICES = [
        ('dashboard', 'Dashboard'),
        ('analytics', 'Analytics'),
        ('tools', 'Security Tools'),
        ('reports', 'Reports'),
    ]
    
    # Profile visibility choices
    PROFILE_VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('team', 'Team Only'),
        ('private', 'Private'),
    ]
    
    # Session timeout choices (in seconds for precise control)
    SESSION_TIMEOUT_CHOICES = [
        (10, '10 seconds'),
        (60, '1 minute'),
        (300, '5 minutes'),
        (600, '10 minutes'),
        (3600, '1 hour'),
        (7200, '2 hours'),
        (14400, '4 hours'),
        (28800, '8 hours'),
        (43200, '12 hours'),
        (86400, '24 hours'),
        (0, 'Custom'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings')
    
    # Notification Settings
    email_notifications = models.BooleanField(default=True, help_text="Receive email notifications")
    push_notifications = models.BooleanField(default=True, help_text="Receive push notifications")
    security_alerts = models.BooleanField(default=True, help_text="Receive security alerts")
    product_updates = models.BooleanField(default=False, help_text="Receive product update notifications")
    marketing_emails = models.BooleanField(default=False, help_text="Receive marketing emails")
    login_notifications = models.BooleanField(default=True, help_text="Get notified of new logins")
    
    # Privacy Settings
    profile_visibility = models.CharField(
        max_length=10, 
        choices=PROFILE_VISIBILITY_CHOICES, 
        default='team',
        help_text="Who can see your profile"
    )
    activity_tracking = models.BooleanField(default=True, help_text="Track activity for analytics")
    analytics_sharing = models.BooleanField(default=False, help_text="Share anonymized analytics data")
    
    # Preference Settings
    theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='system')
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    date_format = models.CharField(max_length=15, choices=DATE_FORMAT_CHOICES, default='MM/DD/YYYY')
    default_view = models.CharField(max_length=20, choices=DEFAULT_VIEW_CHOICES, default='dashboard')
    
    # Security Settings
    session_timeout = models.IntegerField(
        choices=SESSION_TIMEOUT_CHOICES, 
        default=3600,
        help_text="Session timeout in seconds"
    )
    custom_session_timeout = models.IntegerField(
        default=3600,
        help_text="Custom session timeout in seconds (used when session_timeout is 0)"
    )
    
    # Advanced Settings (JSON field for flexibility)
    advanced_settings = models.JSONField(default=dict, blank=True, help_text="Advanced user preferences")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_settings'
        verbose_name = 'User Settings'
        verbose_name_plural = 'User Settings'
    
    def __str__(self):
        return f"Settings for {self.user.email}"
    
    @classmethod
    def get_or_create_for_user(cls, user):
        """Get or create settings for a user with defaults"""
        settings, created = cls.objects.get_or_create(
            user=user,
            defaults={
                'email_notifications': True,
                'push_notifications': True,
                'security_alerts': True,
                'product_updates': False,
                'marketing_emails': False,
                'login_notifications': True,
                'profile_visibility': 'team',
                'activity_tracking': True,
                'analytics_sharing': False,
                'theme': 'system',
                'language': 'en',
                'timezone': 'UTC',
                'date_format': 'MM/DD/YYYY',
                'default_view': 'dashboard',
                'session_timeout': 300,  # Changed from 3600 seconds to 300 seconds (5 minutes)
                'custom_session_timeout': 300,  # Changed from 3600 seconds to 300 seconds (5 minutes)
                'advanced_settings': {}
            }
        )
        return settings
    
    def get_session_timeout_seconds(self):
        """Get the actual session timeout in seconds"""
        if self.session_timeout == 0:  # Custom
            return self.custom_session_timeout
        return self.session_timeout
    
    def to_dict(self):
        """Convert settings to dictionary for API responses"""
        return {
            'notifications': {
                'email': self.email_notifications,
                'push': self.push_notifications,
                'security': self.security_alerts,
                'updates': self.product_updates,
                'marketing': self.marketing_emails,
                'login': self.login_notifications,
            },
            'privacy': {
                'profileVisibility': self.profile_visibility,
                'activityTracking': self.activity_tracking,
                'analyticsSharing': self.analytics_sharing,
            },
            'preferences': {
                'theme': self.theme,
                'language': self.language,
                'timezone': self.timezone,
                'dateFormat': self.date_format,
                'defaultView': self.default_view,
            },
            'security': {
                'sessionTimeout': self.session_timeout,
                'customSessionTimeout': self.custom_session_timeout,
                'loginNotifications': self.login_notifications,
            },
            'advanced': self.advanced_settings,
            'metadata': {
                'createdAt': self.created_at.isoformat() if self.created_at else None,
                'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            }
        }
    
    def update_from_dict(self, data):
        """Update settings from dictionary"""
        # Update notifications
        if 'notifications' in data:
            notifications = data['notifications']
            self.email_notifications = notifications.get('email', self.email_notifications)
            self.push_notifications = notifications.get('push', self.push_notifications)
            self.security_alerts = notifications.get('security', self.security_alerts)
            self.product_updates = notifications.get('updates', self.product_updates)
            self.marketing_emails = notifications.get('marketing', self.marketing_emails)
            self.login_notifications = notifications.get('login', self.login_notifications)
        
        # Update privacy
        if 'privacy' in data:
            privacy = data['privacy']
            self.profile_visibility = privacy.get('profileVisibility', self.profile_visibility)
            self.activity_tracking = privacy.get('activityTracking', self.activity_tracking)
            self.analytics_sharing = privacy.get('analyticsSharing', self.analytics_sharing)
        
        # Update preferences
        if 'preferences' in data:
            preferences = data['preferences']
            self.theme = preferences.get('theme', self.theme)
            self.language = preferences.get('language', self.language)
            self.timezone = preferences.get('timezone', self.timezone)
            self.date_format = preferences.get('dateFormat', self.date_format)
            self.default_view = preferences.get('defaultView', self.default_view)
        
        # Update security
        if 'security' in data:
            security = data['security']
            self.session_timeout = security.get('sessionTimeout', self.session_timeout)
            self.custom_session_timeout = security.get('customSessionTimeout', self.custom_session_timeout)
            self.login_notifications = security.get('loginNotifications', self.login_notifications)
        
        # Update advanced settings
        if 'advanced' in data:
            self.advanced_settings.update(data['advanced'])
        
        self.save()


class UserActivityLog(models.Model):
    """Log user activities for analytics and security"""
    
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('settings_change', 'Settings Change'),
        ('password_change', 'Password Change'),
        ('profile_update', 'Profile Update'),
        ('data_export', 'Data Export'),
        ('data_import', 'Data Import'),
        ('security_event', 'Security Event'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_activity_log'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.action} at {self.timestamp}"