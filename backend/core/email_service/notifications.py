# core/email_service/notifications.py - Email Notification Services
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from django.contrib.auth import get_user_model
from django.contrib.gis.geoip2 import GeoIP2
from django.http import HttpRequest

from .base import email_service, EmailPriority, EmailCategory

User = get_user_model()
logger = logging.getLogger(__name__)

class NotificationService:
    """Professional notification service for SOC Central"""
    
    @staticmethod
    def get_location_from_ip(ip_address: str) -> str:
        """Get location from IP address"""
        try:
            from django.contrib.gis.geoip2 import GeoIP2
            g = GeoIP2()
            location_data = g.city(ip_address)
            city = location_data.get('city', '')
            country = location_data.get('country_name', '')
            
            if city and country:
                return f"{city}, {country}"
            elif country:
                return country
            else:
                return "Unknown Location"
        except Exception as e:
            logger.warning(f"Failed to get location from IP {ip_address}: {str(e)}")
            return "Unknown Location"
    
    @staticmethod
    def get_request_info(request: HttpRequest = None) -> Dict[str, str]:
        """Extract request information for security logging"""
        if not request:
            return {
                'ip_address': 'Unknown',
                'user_agent': 'Unknown',
                'location': 'Unknown Location'
            }
        
        # Get IP address
        ip_address = (
            request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or
            request.META.get('HTTP_X_REAL_IP', '').strip() or
            request.META.get('REMOTE_ADDR', 'Unknown')
        )
        
        # Get user agent
        user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
        
        # Get location
        location = NotificationService.get_location_from_ip(ip_address)
        
        return {
            'ip_address': ip_address,
            'user_agent': user_agent,
            'location': location
        }

class SecurityNotifications:
    """Security-related email notifications"""
    
    @staticmethod
    def password_changed(
        user: User,
        request: HttpRequest = None,
        user_initiated: bool = True
    ) -> bool:
        """Send password change notification"""
        try:
            # Get request information
            request_info = NotificationService.get_request_info(request)
            
            context = {
                'change_time': datetime.now(timezone.utc),
                'user_initiated': user_initiated,
                'ip_address': request_info['ip_address'],
                'location': request_info['location'],
                'user_agent': request_info['user_agent'],
            }
            
            priority = EmailPriority.HIGH if not user_initiated else EmailPriority.NORMAL
            subject = "Password Changed Successfully" if user_initiated else "Security Alert: Password Changed"
            
            success = email_service.send_notification_email(
                user=user,
                template_name='password_changed',
                subject=subject,
                context=context,
                priority=priority,
                category=EmailCategory.SECURITY
            )
            
            if success:
                logger.info(f"🔒 Password change notification sent to {user.email}")
            else:
                logger.error(f"❌ Failed to send password change notification to {user.email}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Password change notification error: {str(e)}")
            return False
    
    @staticmethod
    def login_alert(
        user: User,
        request: HttpRequest,
        is_suspicious: bool = False
    ) -> bool:
        """Send login alert notification"""
        try:
            # Get request information
            request_info = NotificationService.get_request_info(request)
            
            context = {
                'login_time': datetime.now(timezone.utc),
                'is_suspicious': is_suspicious,
                'ip_address': request_info['ip_address'],
                'location': request_info['location'],
                'user_agent': request_info['user_agent'],
            }
            
            priority = EmailPriority.HIGH if is_suspicious else EmailPriority.NORMAL
            subject = "Suspicious Login Detected" if is_suspicious else "New Login to Your Account"
            
            success = email_service.send_notification_email(
                user=user,
                template_name='login_alert',
                subject=subject,
                context=context,
                priority=priority,
                category=EmailCategory.SECURITY
            )
            
            if success:
                logger.info(f"🔐 Login alert sent to {user.email}")
            else:
                logger.error(f"❌ Failed to send login alert to {user.email}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Login alert notification error: {str(e)}")
            return False
    
    @staticmethod
    def account_lockout(
        user: User,
        request: HttpRequest = None,
        unlock_time: datetime = None,
        failed_attempts: int = 0
    ) -> bool:
        """Send account lockout notification"""
        try:
            # Get request information
            request_info = NotificationService.get_request_info(request)
            
            context = {
                'lockout_time': datetime.now(timezone.utc),
                'unlock_time': unlock_time,
                'failed_attempts': failed_attempts,
                'ip_address': request_info['ip_address'],
                'location': request_info['location'],
                'user_agent': request_info['user_agent'],
            }
            
            success = email_service.send_notification_email(
                user=user,
                template_name='account_lockout',
                subject="Account Temporarily Locked",
                context=context,
                priority=EmailPriority.HIGH,
                category=EmailCategory.SECURITY
            )
            
            if success:
                logger.info(f"🔒 Account lockout notification sent to {user.email}")
            else:
                logger.error(f"❌ Failed to send account lockout notification to {user.email}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Account lockout notification error: {str(e)}")
            return False

class UserManagementNotifications:
    """User management email notifications"""
    
    @staticmethod
    def welcome_email(user: User, temporary_password: str = None) -> bool:
        """Send welcome email to new user"""
        try:
            context = {
                'signup_time': datetime.now(timezone.utc),
                'temporary_password': temporary_password,
                'has_temp_password': bool(temporary_password),
                'login_url': f"{email_service.platform_url}/auth"
            }
            
            success = email_service.send_notification_email(
                user=user,
                template_name='welcome',
                subject="Welcome to SOC Central",
                context=context,
                priority=EmailPriority.NORMAL,
                category=EmailCategory.USER_MGMT
            )
            
            if success:
                logger.info(f"👋 Welcome email sent to {user.email}")
            else:
                logger.error(f"❌ Failed to send welcome email to {user.email}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Welcome email error: {str(e)}")
            return False
    
    @staticmethod
    def role_changed(
        user: User,
        old_role: str,
        new_role: str,
        changed_by: User,
        request: HttpRequest = None
    ) -> bool:
        """Send role change notification"""
        try:
            # Get request information
            request_info = NotificationService.get_request_info(request)
            
            context = {
                'change_time': datetime.now(timezone.utc),
                'old_role': old_role,
                'new_role': new_role,
                'changed_by': changed_by,
                'changed_by_name': changed_by.get_full_name() or changed_by.first_name or changed_by.email,
                'is_promotion': UserManagementNotifications._is_promotion(old_role, new_role),
                'ip_address': request_info['ip_address'],
                'location': request_info['location'],
            }
            
            role_prefix = "Role Promotion:" if context['is_promotion'] else "Role Change:"
            subject = f"{role_prefix} Your Role Has Been Updated"
            
            success = email_service.send_notification_email(
                user=user,
                template_name='role_changed',
                subject=subject,
                context=context,
                priority=EmailPriority.NORMAL,
                category=EmailCategory.USER_MGMT
            )
            
            if success:
                logger.info(f"👤 Role change notification sent to {user.email}")
            else:
                logger.error(f"❌ Failed to send role change notification to {user.email}")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Role change notification error: {str(e)}")
            return False
    
    @staticmethod
    def _is_promotion(old_role: str, new_role: str) -> bool:
        """Determine if role change is a promotion"""
        role_hierarchy = {
            'general': 1,
            'admin': 2,
            'super_admin': 3
        }
        
        old_level = role_hierarchy.get(old_role, 0)
        new_level = role_hierarchy.get(new_role, 0)
        
        return new_level > old_level

# Export notification services
security_notifications = SecurityNotifications()
user_management_notifications = UserManagementNotifications()