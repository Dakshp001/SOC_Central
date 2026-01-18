# core/email_service/base.py - Professional Email Service Infrastructure
import logging
import smtplib
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)

class EmailPriority:
    """Email priority levels"""
    LOW = 'low'
    NORMAL = 'normal'
    HIGH = 'high'
    CRITICAL = 'critical'

class EmailCategory:
    """Email categories for tracking and filtering"""
    SECURITY = 'security'
    AUTH = 'authentication'
    USER_MGMT = 'user_management'
    SYSTEM = 'system'
    PLATFORM = 'platform'
    ADMIN = 'admin'

class SOCEmailService:
    """Professional email service for SOC Central"""
    
    def __init__(self):
        self.from_email = settings.DEFAULT_FROM_EMAIL
        self.company_name = "SOC Central"
        self.platform_url = getattr(settings, 'FRONTEND_URL', 'https://soccentral.onrender.com')
        
    def _get_base_context(self) -> Dict[str, Any]:
        """Get base template context"""
        return {
            'company_name': self.company_name,
            'platform_url': self.platform_url,
            'support_email': self.from_email,
            'current_year': datetime.now().year,
            'timestamp': datetime.now(timezone.utc),
        }
    
    def _send_email(
        self,
        to_emails: List[str],
        subject: str,
        html_content: str,
        text_content: str = None,
        priority: str = EmailPriority.NORMAL,
        category: str = EmailCategory.SYSTEM,
        attachments: List[Dict] = None
    ) -> bool:
        """Send email with professional formatting"""
        try:
            # Create email message
            msg = EmailMultiAlternatives(
                subject=f"[{self.company_name}] {subject}",
                body=text_content or strip_tags(html_content),
                from_email=self.from_email,
                to=to_emails
            )
            
            # Add HTML version
            if html_content:
                msg.attach_alternative(html_content, "text/html")
            
            # Set priority headers
            if priority == EmailPriority.HIGH:
                msg.extra_headers['X-Priority'] = '2'
                msg.extra_headers['X-MSMail-Priority'] = 'High'
            elif priority == EmailPriority.CRITICAL:
                msg.extra_headers['X-Priority'] = '1'
                msg.extra_headers['X-MSMail-Priority'] = 'High'
                msg.extra_headers['Importance'] = 'high'
            
            # Add category header for tracking
            msg.extra_headers['X-Category'] = category
            msg.extra_headers['X-SOC-Central-Type'] = 'notification'
            
            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    msg.attach(
                        attachment.get('filename', 'attachment'),
                        attachment.get('content', ''),
                        attachment.get('mimetype', 'application/octet-stream')
                    )
            
            # Send email
            result = msg.send()
            
            logger.info(f"📧 Email sent successfully: {subject} to {', '.join(to_emails)}")
            return result > 0
            
        except Exception as e:
            logger.error(f"❌ Email send failed: {subject} to {', '.join(to_emails)} - Error: {str(e)}")
            return False
    
    def send_notification_email(
        self,
        user: User,
        template_name: str,
        subject: str,
        context: Dict[str, Any] = None,
        priority: str = EmailPriority.NORMAL,
        category: str = EmailCategory.SYSTEM
    ) -> bool:
        """Send notification email using template"""
        if not user.email:
            logger.warning(f"⚠️ No email address for user {user.id}")
            return False
        
        # Merge base context with provided context
        email_context = self._get_base_context()
        email_context.update({
            'user': user,
            'user_name': user.get_full_name() or user.first_name or 'User',
            'user_email': user.email,
        })
        
        if context:
            email_context.update(context)
        
        try:
            # Render HTML template
            html_content = render_to_string(f'emails/{template_name}.html', email_context)
            
            # Try to render text template, fallback to HTML stripped
            try:
                text_content = render_to_string(f'emails/{template_name}.txt', email_context)
            except:
                text_content = strip_tags(html_content)
            
            return self._send_email(
                to_emails=[user.email],
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                priority=priority,
                category=category
            )
            
        except Exception as e:
            logger.error(f"❌ Email template rendering failed: {template_name} - Error: {str(e)}")
            return False

# Global email service instance
email_service = SOCEmailService()