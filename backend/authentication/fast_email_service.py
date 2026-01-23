# backend/authentication/fast_email_service.py - Optimized Email Service
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
import logging
import time

logger = logging.getLogger(__name__)

class FastEmailService:
    """Simplified, fast email service without complex pooling"""
    
    def __init__(self):
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'https://soccentral.onrender.com')
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@soccentral.com')
        self.logo_url = "https://ucarecdn.com/5c1a846a-769c-4bc8-9f94-561f0c41c3e4/white.png"
    
    def _send_email_fast(self, subject, text_content, html_content, to_email):
        """Fast email sending without connection pooling"""
        start_time = time.time()
        
        try:
            logger.info(f"Sending email to {to_email}: {subject}")
            
            # Create and send email directly
            msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=self.from_email,
                to=[to_email],
            )
            msg.attach_alternative(html_content, "text/html")
            
            # Send with timeout
            sent_count = msg.send(fail_silently=False)
            
            send_time = time.time() - start_time
            
            if sent_count > 0:
                logger.info(f"Email sent successfully in {send_time:.2f}s to {to_email}")
                return True
            else:
                logger.error(f"Email failed to send to {to_email}")
                return False
                
        except Exception as e:
            send_time = time.time() - start_time
            logger.error(f"Email error after {send_time:.2f}s: {str(e)}")
            return False
    
    def send_password_reset_email(self, user, token):
        """Send password reset email quickly"""
        reset_link = f"{self.frontend_url}/reset-password/{token}"
        recipient_name = user.first_name or user.email.split('@')[0]
        
        subject = "SOC Central - Password Reset Request"
        
        # Simple text version
        text_content = f"""
Hello {recipient_name},

You requested a password reset for your SOC Central account.

Reset your password: {reset_link}

This link expires in 1 hour for security.

If you didn't request this, please ignore this email.

Best regards,
SOC Central Security Team
        """.strip()
        
        # Simple HTML version
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - SOC Central</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
            <img src="{self.logo_url}" alt="SOC Central" style="height: 40px;">
            <h1 style="color: #333; margin: 10px 0;">SOC Central</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 0;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">
                Hello <strong>{recipient_name}</strong>,
            </p>
            <p style="color: #666; line-height: 1.6;">
                You requested a password reset for your SOC Central account.
            </p>
            
            <!-- Reset Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" 
                   style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Reset Password
                </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
                This link expires in <strong>1 hour</strong> for security.
            </p>
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
                If you didn't request this password reset, please ignore this email.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #888; font-size: 12px;">
            Best regards,<br>
            SOC Central Security Team
        </div>
        
        <!-- Link Fallback -->
        <div style="background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777; margin-top: 10px;">
            If the button doesn't work, copy this link:<br>
            <a href="{reset_link}" style="color: #667eea; word-break: break-all;">{reset_link}</a>
        </div>
    </div>
</body>
</html>
        """.strip()
        
        return self._send_email_fast(subject, text_content, html_content, user.email)
    
    def send_admin_access_request_email(self, super_admin, requesting_user, request_details):
        """Send admin access request notification to super admin"""
        from django.utils import timezone
        
        subject = f"SOC Central - Admin Access Request from {requesting_user.get_full_name()}"
        
        # Simple text version
        text_content = f"""
Hello {super_admin.get_full_name()},

A user has requested admin access to SOC Central.

USER DETAILS:
Name: {requesting_user.get_full_name()}
Email: {requesting_user.email}
Company: {requesting_user.company_name}
Job Title: {requesting_user.job_title or 'Not specified'}
Department: {requesting_user.department or 'Not specified'}
Current Role: {requesting_user.role}
Account Created: {requesting_user.created_at.strftime('%Y-%m-%d %H:%M')}
Last Login: {requesting_user.last_login.strftime('%Y-%m-%d %H:%M') if requesting_user.last_login else 'Never'}

JUSTIFICATION:
{request_details.get('justification', 'No justification provided')}

To access the admin panel:
{self.frontend_url}/admin/users

Best regards,
SOC Central System
        """.strip()
        
        # Simple HTML version
        admin_url = f"{self.frontend_url}/admin/users"
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Admin Access Request</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h2 style="color: #333;">Admin Access Request</h2>
        <p>Hello <strong>{super_admin.get_full_name()}</strong>,</p>
        <p>A user has requested admin access to SOC Central.</p>
        
        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>User Details</h3>
            <p><strong>Name:</strong> {requesting_user.get_full_name()}</p>
            <p><strong>Email:</strong> {requesting_user.email}</p>
            <p><strong>Company:</strong> {requesting_user.company_name}</p>
            <p><strong>Current Role:</strong> {requesting_user.role}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h4>Justification:</h4>
            <p>{request_details.get('justification', 'No justification provided')}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{admin_url}" 
               style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Review in Admin Panel
            </a>
        </div>
        
        <p style="font-size: 12px; color: #666;">
            Request Time: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}<br>
            User ID: {requesting_user.id}
        </p>
    </div>
</body>
</html>
        """.strip()
        
        return self._send_email_fast(subject, text_content, html_content, super_admin.email)
    
    def send_activation_email(self, user, created_by=None):
        """Send user activation email quickly"""
        try:
            from .models import PasswordResetToken
            
            logger.info(f"Starting activation email for {user.email}")
            
            # Create activation token
            activation_token = PasswordResetToken.objects.create(
                user=user,
                token_type='activation',
                created_by=created_by
            )
            
            activation_link = f"{self.frontend_url}/activate-account/{activation_token.token}"
            recipient_name = user.first_name or user.email.split('@')[0]
            admin_name = created_by.get_full_name() if created_by else "Administrator"
            
            subject = "SOC Central - Welcome! Activate Your Account"
            
            # Simple text content
            text_content = f"""
Hello {recipient_name},

Welcome to SOC Central! Your account has been created by {admin_name}.

Activate your account: {activation_link}

This link expires in 24 hours.

Best regards,
SOC Central Team
            """.strip()
            
            # Simple HTML content
            html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SOC Central</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
            <img src="{self.logo_url}" alt="SOC Central" style="height: 40px;">
            <h1 style="color: #333; margin: 10px 0;">Welcome to SOC Central</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 0;">
            <p style="color: #666; line-height: 1.6;">
                Hello <strong>{recipient_name}</strong>,
            </p>
            <p style="color: #666; line-height: 1.6;">
                Welcome to SOC Central! Your account has been created by <strong>{admin_name}</strong>.
            </p>
            
            <!-- Activation Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="{activation_link}" 
                   style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Activate Account
                </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
                This link expires in <strong>24 hours</strong>.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #888; font-size: 12px;">
            Best regards,<br>
            SOC Central Team
        </div>
        
        <!-- Link Fallback -->
        <div style="background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777; margin-top: 10px;">
            If the button doesn't work, copy this link:<br>
            <a href="{activation_link}" style="color: #28a745; word-break: break-all;">{activation_link}</a>
        </div>
    </div>
</body>
</html>
            """.strip()
            
            result = self._send_email_fast(subject, text_content, html_content, user.email)
            
            if result:
                logger.info(f"Activation email sent successfully to {user.email}")
            else:
                logger.error(f"Failed to send activation email to {user.email}")
            
            return result
            
        except Exception as e:
            logger.error(f"Activation email error: {str(e)}")
            return False
    
    def send_password_reset_otp_email(self, user, otp_code):
        """Send OTP for password reset verification"""
        recipient_name = user.first_name or user.email.split('@')[0]
        
        subject = "SOC Central - Password Reset Verification Code"
        
        # Simple text version
        text_content = f"""
Hello {recipient_name},

You requested a password reset for your SOC Central account.

Your verification code is: {otp_code}

This code expires in 10 minutes for security.

If you didn't request this, please ignore this email.

Best regards,
SOC Central Security Team
        """.strip()
        
        # Simple HTML version
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Verification - SOC Central</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #eee;">
            <img src="{self.logo_url}" alt="SOC Central" style="height: 40px;">
            <h1 style="color: #333; margin: 10px 0;">SOC Central</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px 0;">
            <h2 style="color: #333;">Password Reset Verification</h2>
            <p style="color: #666; line-height: 1.6;">
                Hello <strong>{recipient_name}</strong>,
            </p>
            <p style="color: #666; line-height: 1.6;">
                You requested a password reset for your SOC Central account.
            </p>
            
            <!-- OTP Code Box -->
            <div style="text-align: center; margin: 30px 0;">
                <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; display: inline-block;">
                    <p style="color: #333; margin: 0 0 10px 0; font-size: 14px;">Your verification code:</p>
                    <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                        {otp_code}
                    </div>
                </div>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
                This code expires in <strong>10 minutes</strong> for security.
            </p>
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
                If you didn't request this password reset, please ignore this email.
            </p>
        </div>
        
        <!-- Footer -->
        <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #888; font-size: 12px;">
            Best regards,<br>
            SOC Central Security Team
        </div>
    </div>
</body>
</html>
        """.strip()
        
        return self._send_email_fast(subject, text_content, html_content, user.email)
    
    def send_admin_access_request_email(self, super_admin, requesting_user, request_details):
        """Send admin access request notification to super admin"""
        from django.utils import timezone
        
        subject = f"SOC Central - Admin Access Request from {requesting_user.get_full_name()}"
        
        # Simple text version
        text_content = f"""
Hello {super_admin.get_full_name()},

A user has requested admin access to SOC Central.

USER DETAILS:
Name: {requesting_user.get_full_name()}
Email: {requesting_user.email}
Company: {requesting_user.company_name}
Job Title: {requesting_user.job_title or 'Not specified'}
Department: {requesting_user.department or 'Not specified'}
Current Role: {requesting_user.role}
Account Created: {requesting_user.created_at.strftime('%Y-%m-%d %H:%M')}
Last Login: {requesting_user.last_login.strftime('%Y-%m-%d %H:%M') if requesting_user.last_login else 'Never'}

JUSTIFICATION:
{request_details.get('justification', 'No justification provided')}

To access the admin panel:
{self.frontend_url}/admin/users

Best regards,
SOC Central System
        """.strip()
        
        # Simple HTML version
        admin_url = f"{self.frontend_url}/admin/users"
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Admin Access Request</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h2 style="color: #333;">Admin Access Request</h2>
        <p>Hello <strong>{super_admin.get_full_name()}</strong>,</p>
        <p>A user has requested admin access to SOC Central.</p>
        
        <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>User Details</h3>
            <p><strong>Name:</strong> {requesting_user.get_full_name()}</p>
            <p><strong>Email:</strong> {requesting_user.email}</p>
            <p><strong>Company:</strong> {requesting_user.company_name}</p>
            <p><strong>Current Role:</strong> {requesting_user.role}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h4>Justification:</h4>
            <p>{request_details.get('justification', 'No justification provided')}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{admin_url}" 
               style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Review in Admin Panel
            </a>
        </div>
        
        <p style="font-size: 12px; color: #666;">
            Request Time: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}<br>
            User ID: {requesting_user.id}
        </p>
    </div>
</body>
</html>
        """.strip()
        
        return self._send_email_fast(subject, text_content, html_content, super_admin.email)