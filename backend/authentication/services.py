
# backend/authentication/services.py - FIXED FOR DEPLOYMENT
from django.conf import settings
from django.core.mail import EmailMultiAlternatives, get_connection
from django.utils import timezone
from django.template.loader import render_to_string
import threading
import time
import logging

logger = logging.getLogger(__name__)

class EmailService:
    """Email service with lazy connection pooling (deployment-safe)"""
    
    # Class-level connection pool (shared across all instances)
    _connection_pool = None
    _pool_lock = threading.Lock()
    _last_used = None
    _warming_started = False
    
    def __init__(self):
        self.frontend_url = getattr(settings, 'FRONTEND_URL', 'https://soccentral.onrender.com')
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@soccentral.com')
        self.logo_url = "https://ucarecdn.com/5c1a846a-769c-4bc8-9f94-561f0c41c3e4/white.png"
        
        # ✅ FIXED: Don't warm connections during __init__ (prevents deployment timeout)
        # Connection warming will happen lazily on first email send
    
    @classmethod
    def _start_connection_warming(cls):
        """Start connection warming in background (non-blocking)"""
        if not cls._warming_started:
            cls._warming_started = True
            # Start warming in daemon thread (won't block deployment)
            threading.Thread(target=cls._warm_connection_pool, daemon=True).start()
    
    @classmethod
    def _warm_connection_pool(cls):
        """Pre-warm the SMTP connection in background (non-blocking)"""
        try:
            # ✅ Add delay to avoid blocking startup
            time.sleep(2)  # Let app start first
            
            logger.info("🔥 Starting background email connection warming...")
            start_time = time.time()
            
            with cls._pool_lock:
                # Check if we're in a deployment environment
                if getattr(settings, 'DEBUG', False) or not getattr(settings, 'EMAIL_HOST_PASSWORD', ''):
                    logger.info("⏭️ Skipping connection warming in dev/incomplete config")
                    return
                
                cls._connection_pool = get_connection(
                    host=getattr(settings, 'EMAIL_HOST', 'smtp.gmail.com'),
                    port=getattr(settings, 'EMAIL_PORT', 587),
                    username=getattr(settings, 'EMAIL_HOST_USER', ''),
                    password=getattr(settings, 'EMAIL_HOST_PASSWORD', ''),
                    use_tls=getattr(settings, 'EMAIL_USE_TLS', True),
                    timeout=5,  # ✅ FIXED: Shorter timeout to prevent hanging
                )
                
                # Actually open the connection to warm it up
                cls._connection_pool.open()
                cls._last_used = time.time()
            
            warm_time = time.time() - start_time
            logger.info(f"✅ Email connection pool warmed in {warm_time:.2f}s")
            
        except Exception as e:
            logger.warning(f"⚠️ Connection warming failed (will use fresh connections): {e}")
            cls._connection_pool = None
    
    @classmethod
    def _get_pooled_connection(cls):
        """Get a connection from the pool or create a fresh one"""
        # ✅ FIXED: Start warming on first use (lazy loading)
        if not cls._warming_started:
            cls._start_connection_warming()
        
        with cls._pool_lock:
            # Check if we have a warmed connection
            if cls._connection_pool is not None:
                # Check if connection is still fresh (less than 5 minutes old)
                if cls._last_used and (time.time() - cls._last_used) < 300:
                    try:
                        # Test if connection is still alive
                        if hasattr(cls._connection_pool, 'connection') and cls._connection_pool.connection:
                            cls._last_used = time.time()
                            return cls._connection_pool
                        else:
                            # Reopen existing connection
                            cls._connection_pool.open()
                            cls._last_used = time.time()
                            return cls._connection_pool
                    except Exception as e:
                        logger.warning(f"⚠️ Pooled connection failed, creating fresh: {e}")
                        cls._connection_pool = None
            
            # Create fresh connection if pool is empty or stale
            try:
                fresh_connection = get_connection(
                    host=getattr(settings, 'EMAIL_HOST', 'smtp.gmail.com'),
                    port=getattr(settings, 'EMAIL_PORT', 587),
                    username=getattr(settings, 'EMAIL_HOST_USER', ''),
                    password=getattr(settings, 'EMAIL_HOST_PASSWORD', ''),
                    use_tls=getattr(settings, 'EMAIL_USE_TLS', True),
                    timeout=5,  # ✅ FIXED: Shorter timeout for deployment stability
                )
                fresh_connection.open()
                cls._connection_pool = fresh_connection
                cls._last_used = time.time()
                logger.info("🔄 Created fresh email connection")
                return fresh_connection
            except Exception as e:
                logger.error(f"❌ Failed to create fresh connection: {e}")
                return None
    
    def _send_email(self, subject, text_content, html_content, to_email):
        """Optimized email sending with connection pooling"""
        start_time = time.time()
        
        try:
            logger.info(f"📧 Sending email to {to_email}: {subject}")
            
            # ✅ FIXED: Use shorter timeout and better error handling
            connection = None
            try:
                connection = self._get_pooled_connection()
            except Exception as e:
                logger.warning(f"⚠️ Connection pool failed: {e}")
                connection = None
            
            if connection is None:
                # ✅ FIXED: Improved fallback with timeout
                logger.info("🔄 Using fallback email method")
                try:
                    msg = EmailMultiAlternatives(
                        subject=subject,
                        body=text_content,
                        from_email=self.from_email,
                        to=[to_email],
                    )
                    msg.attach_alternative(html_content, "text/html")
                    sent_count = msg.send(fail_silently=False)
                except Exception as fallback_error:
                    logger.error(f"❌ Fallback email failed: {fallback_error}")
                    return False
            else:
                # Use pooled connection for fast sending
                msg = EmailMultiAlternatives(
                    subject=subject,
                    body=text_content,
                    from_email=self.from_email,
                    to=[to_email],
                    connection=connection
                )
                msg.attach_alternative(html_content, "text/html")
                sent_count = msg.send(fail_silently=False)
            
            send_time = time.time() - start_time
            
            if sent_count > 0:
                logger.info(f"✅ Email sent in {send_time:.2f}s to {to_email}")
                return True
            else:
                logger.error(f"❌ Email failed to send to {to_email}")
                return False
                
        except Exception as e:
            send_time = time.time() - start_time
            logger.error(f"❌ Email error after {send_time:.2f}s: {str(e)}")
            # ✅ FIXED: Don't let email failures crash the app
            return False
    
    # ✅ Keep all your existing email methods unchanged
    def send_signup_otp_email(self, email, otp_code, first_name=''):
        """Send OTP email for signup verification"""
        recipient_name = first_name or email.split('@')[0]
        otp_expiry = getattr(settings, 'OTP_EXPIRY_MINUTES', 10)
        
        subject = f"SOC Central - Verification Code: {otp_code}"
        
        # Plain text version
        text_content = f"""
Hello {recipient_name},

Welcome to SOC Central Security Platform!

Your verification code is: {otp_code}

This code expires in {otp_expiry} minutes.

Do not share this code with anyone.

Best regards,
SOC Central Team
        """.strip()
        
        # HTML version
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OTP Verification</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px; color: #333;">
  <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background: #1a1a1a; padding: 20px; text-align: center;">
      <img src="{self.logo_url}" alt="SOC Central Logo" style="max-width: 150px;">
    </div>
    <div style="padding: 20px;">
      <h2 style="color: #222;">Hello {recipient_name},</h2>
      <p>Welcome to <strong>SOC Central Security Platform</strong>!</p>
      <p>Your verification code is:</p>
      <div style="font-size: 28px; font-weight: bold; color: #0056d6; text-align: center; letter-spacing: 4px; margin: 20px 0;">
        {otp_code}
      </div>
      <p>This code expires in <strong>{otp_expiry} minutes</strong>.</p>
      <p style="color: #d9534f;"><strong>Do not share this code with anyone.</strong></p>
      <p>Best regards,<br>SOC Central Team</p>
    </div>
    <div style="background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777;">
      © {getattr(settings, 'CURRENT_YEAR', '2025')} SOC Central. All rights reserved.
    </div>
  </div>
</body>
</html>
        """.strip()
        
        return self._send_email(subject, text_content, html_content, email)
    
    def send_password_reset_email(self, user, token):
        """Send password reset email (for existing users who forgot password)"""
        # ✅ FIXED: Use reset-password route for existing users
        reset_link = f"{self.frontend_url}/reset-password/{token}"
        recipient_name = user.first_name or user.email.split('@')[0]
        
        subject = "SOC Central - Password Reset Request"
        
        # Plain text version
        text_content = f"""
Hello {recipient_name},

You have requested to reset your password for your SOC Central account.

To reset your password, click the link below:
{reset_link}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your account remains secure.

Best regards,
SOC Central Security Team

---
For support, contact: support@soccentral.com
        """.strip()
        
        # HTML version
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background: #1a1a1a; padding: 20px; text-align: center;">
      <img src="{self.logo_url}" alt="SOC Central Logo" style="max-width: 150px;">
    </div>
    <div style="padding: 30px;">
      <h2 style="color: #222;">Hello {recipient_name},</h2>
      <p>You have requested to reset your password for your <strong>SOC Central</strong> account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{reset_link}" 
           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; 
                  padding: 15px 30px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  font-weight: bold;
                  display: inline-block;
                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                Reset My Password
        </a>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>⚠️ Security Notice:</strong> This link will expire in <strong>1 hour</strong> for your security.
        </p>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        If you didn't request this password reset, please ignore this email. Your account remains secure.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #888;">
        Best regards,<br>
        SOC Central Security Team<br>
        For support: support@soccentral.com
      </p>
    </div>
    <div style="background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777;">
      If the button doesn't work, copy this link: <br>
      <a href="{reset_link}" style="color: #667eea; word-break: break-all;">{reset_link}</a>
    </div>
  </div>
</body>
</html>
        """.strip()
        
        return self._send_email(subject, text_content, html_content, user.email)
    
    def send_activation_email(self, user, created_by=None):
        """Send user activation email (for new users created by admin) - DEPLOYMENT SAFE"""
        start_time = time.time()
        
        try:
            from .models import PasswordResetToken
            
            logger.info(f"🚀 Starting activation email for {user.email}")
            
            # Create activation token
            activation_token = PasswordResetToken.objects.create(
                user=user,
                token_type='activation',
                created_by=created_by
            )
            
            # Use activate-account route for new users
            activation_link = f"{self.frontend_url}/activate-account/{activation_token.token}"
            recipient_name = user.first_name or user.email.split('@')[0]
            admin_name = created_by.get_full_name() if created_by else "Administrator"
            
            subject = "SOC Central - Welcome! Activate Your Account"
            
            # Simplified content for faster sending
            text_content = f"""
Hello {recipient_name},

Welcome to SOC Central! Your account has been created by {admin_name}.

Activate your account: {activation_link}

This link expires in 24 hours.

Best regards,
SOC Central Team
            """.strip()
            
            # Streamlined HTML for speed
            html_content = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Account Activation</title></head>
<body style="font-family: Arial, sans-serif; padding: 20px; background: #f7f9fc;">
  <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; padding: 30px;">
    <h2 style="color: #222;">Welcome to SOC Central!</h2>
    <p>Hello {recipient_name},</p>
    <p>Your account has been created by {admin_name}.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{activation_link}" 
         style="background: #28a745; color: white; padding: 15px 30px; 
                text-decoration: none; border-radius: 8px; font-weight: bold;
                display: inline-block;">
        🔓 Activate My Account
      </a>
    </div>
    
    <p><strong>⚠️ This link expires in 24 hours.</strong></p>
    <p>Best regards,<br>SOC Central Team</p>
    
    <hr style="margin: 20px 0;">
    <small>If the button doesn't work: {activation_link}</small>
  </div>
</body>
</html>
            """.strip()
            
            # Send with optimized connection pool
            success = self._send_email(subject, text_content, html_content, user.email)
            
            total_time = time.time() - start_time
            logger.info(f"🎉 Activation email completed in {total_time:.2f}s for {user.email}")
            
            return success
            
        except Exception as e:
            total_time = time.time() - start_time
            logger.error(f"💥 Activation email error after {total_time:.2f}s: {str(e)}")
            # ✅ FIXED: Don't crash on email failures
            return False
    
    def send_mfa_code_email(self, email, code, first_name=''):
        """Send MFA code email for login verification"""
        recipient_name = first_name or email.split('@')[0]
        
        subject = f"SOC Central - Login Verification Code: {code}"
        
        # Plain text version
        text_content = f"""
Hello {recipient_name},

Your login verification code is: {code}

This code expires in 10 minutes.

Do not share this code with anyone.

Best regards,
SOC Central Security Team
        """.strip()
        
        # HTML version
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Login Verification</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px; color: #333;">
  <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background: #1a1a1a; padding: 20px; text-align: center;">
      <img src="{self.logo_url}" alt="SOC Central Logo" style="max-width: 150px;">
    </div>
    <div style="padding: 20px;">
      <h2 style="color: #222;">Hello {recipient_name},</h2>
      <p>Your login verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; color: #0056d6; text-align: center; letter-spacing: 6px; margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
        {code}
      </div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p style="color: #d9534f;"><strong>Do not share this code with anyone.</strong></p>
      <p>Best regards,<br>SOC Central Security Team</p>
    </div>
    <div style="background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777;">
      © {getattr(settings, 'CURRENT_YEAR', '2025')} SOC Central. All rights reserved.
    </div>
  </div>
</body>
</html>
        """.strip()
        
        return self._send_email(subject, text_content, html_content, email)
    
    def send_password_change_confirmation_email(self, user):
        """Send password change confirmation email"""
        recipient_name = user.first_name or user.email.split('@')[0]
        
        subject = "SOC Central - Password Changed Successfully"
        
        # Plain text version
        text_content = f"""
Hello {recipient_name},

Your password for SOC Central has been successfully changed.

If you did not make this change, please contact our support team immediately at support@soccentral.com.

For your security:
- All existing sessions have been logged out
- You will need to log in again with your new password
- Keep your account secure with a strong password

Best regards,
SOC Central Security Team

---
This is an automated security notification.
If you have concerns, contact: support@soccentral.com
        """.strip()
        
        # HTML version
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Changed</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background: #1a1a1a; padding: 20px; text-align: center;">
      <img src="{self.logo_url}" alt="SOC Central Logo" style="max-width: 150px;">
    </div>
    <div style="padding: 30px;">
      <h2 style="color: #222;">Hello {recipient_name},</h2>
      <p>Your password for <strong>SOC Central</strong> has been successfully changed.</p>
      
      <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #155724;">
          <strong>✅ Security Update:</strong> Your password change was successful.
        </p>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #856404;">
          <strong>⚠️ Important:</strong> All existing sessions have been logged out for security. You'll need to log in again with your new password.
        </p>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        If you did not make this change, please contact our support team immediately.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #888;">
        Best regards,<br>
        SOC Central Security Team<br>
        For support: support@soccentral.com
      </p>
    </div>
    <div style="background: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #777;">
      This is an automated security notification.
    </div>
  </div>
</body>
</html>
        """.strip()
        
        return self._send_email(subject, text_content, html_content, user.email)
    
    def send_admin_access_request_email(self, super_admin, requesting_user, request_details):
        """Send admin access request notification to super admin"""
        
        subject = f"SOC Central - Admin Access Request from {requesting_user.get_full_name()}"
        
        # Plain text version
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

REQUEST DETAILS:
Request Time: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
Request IP: {request_details.get('request_ip', 'Unknown')}
User ID: {requesting_user.id}

ACTIONS REQUIRED:
1. Review the user's profile and justification
2. Log in to SOC Central admin panel
3. Navigate to User Management
4. Promote the user if appropriate

To access the admin panel:
{self.frontend_url}/admin/users

Best regards,
SOC Central System
        """.strip()
        
        # HTML version
        admin_url = f"{self.frontend_url}/admin/users"
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Admin Access Request</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f7f9fc; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
    <div style="background: #1a1a1a; padding: 20px; text-align: center;">
      <img src="{self.logo_url}" alt="SOC Central Logo" style="max-width: 150px;">
    </div>
    <div style="padding: 30px;">
      <h2 style="color: #222;">Hello {super_admin.get_full_name()},</h2>
      <p>A user has requested admin access to <strong>SOC Central</strong>.</p>
      
      <div style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #007bff;">👤 User Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px 0; font-weight: bold;">Name:</td><td>{requesting_user.get_full_name()}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: bold;">Email:</td><td>{requesting_user.email}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: bold;">Company:</td><td>{requesting_user.company_name}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: bold;">Job Title:</td><td>{requesting_user.job_title or 'Not specified'}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: bold;">Department:</td><td>{requesting_user.department or 'Not specified'}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: bold;">Current Role:</td><td><span style="background: #e3f2fd; padding: 2px 8px; border-radius: 4px;">{requesting_user.role}</span></td></tr>
          <tr><td style="padding: 5px 0; font-weight: bold;">Account Created:</td><td>{requesting_user.created_at.strftime('%Y-%m-%d %H:%M')}</td></tr>
          <tr><td style="padding: 5px 0; font-weight: bold;">Last Login:</td><td>{requesting_user.last_login.strftime('%Y-%m-%d %H:%M') if requesting_user.last_login else 'Never'}</td></tr>
        </table>
      </div>
      
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #856404;">📝 Justification</h4>
        <p style="margin: 0; font-style: italic;">{request_details.get('justification', 'No justification provided')}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{admin_url}" 
           style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); 
                  color: white; 
                  padding: 15px 30px; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  font-weight: bold;
                  display: inline-block;
                  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);">
                🛡️ Review in Admin Panel
        </a>
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0;">📋 Actions Required:</h4>
        <ol style="margin: 0; padding-left: 20px;">
          <li>Review the user's profile and justification</li>
          <li>Verify the user's identity and role requirements</li>
          <li>Navigate to User Management in the admin panel</li>
          <li>Promote the user if appropriate</li>
        </ol>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="font-size: 12px; color: #888;">
        <strong>Request Details:</strong><br>
        Request Time: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}<br>
        Request IP: {request_details.get('request_ip', 'Unknown')}<br>
        User ID: {requesting_user.id}
      </p>
    </div>
  </div>
</body>
</html>
        """.strip()
        
        return self._send_email(subject, text_content, html_content, super_admin.email)


# SMS Service Classes and Functions
# Production-ready SMS service for OTP delivery

from typing import Dict, Any

class SMSServiceError(Exception):
    """Custom exception for SMS service errors"""
    pass

class BaseSMSService:
    """Base class for SMS service providers"""
    
    def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS message. Must be implemented by subclasses."""
        raise NotImplementedError("Subclasses must implement send_sms method")

class TwilioSMSService(BaseSMSService):
    """Twilio SMS service implementation"""
    
    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.phone_number = settings.TWILIO_PHONE_NUMBER
        
        if not all([self.account_sid, self.auth_token, self.phone_number]):
            raise SMSServiceError(
                "Missing Twilio configuration. Please set TWILIO_ACCOUNT_SID, "
                "TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your environment."
            )
    
    def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS via Twilio"""
        try:
            from twilio.rest import Client
            
            # Initialize Twilio client
            client = Client(self.account_sid, self.auth_token)
            
            # Format phone number (ensure it starts with + for international format)
            if not phone_number.startswith('+'):
                phone_number = '+' + phone_number.lstrip('+')
            
            # Send SMS
            message_instance = client.messages.create(
                body=message,
                from_=self.phone_number,
                to=phone_number
            )
            
            logger.info(f"SMS sent successfully to {phone_number} - SID: {message_instance.sid}")
            
            return {
                'success': True,
                'message_sid': message_instance.sid,
                'status': message_instance.status,
                'provider': 'twilio',
                'cost': message_instance.price,
                'currency': message_instance.price_unit
            }
            
        except Exception as e:
            logger.error(f"Failed to send SMS via Twilio to {phone_number}: {str(e)}")
            raise SMSServiceError(f"Twilio SMS failed: {str(e)}")

class MockSMSService(BaseSMSService):
    """Mock SMS service for development/testing"""
    
    def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Mock SMS sending - just logs the message"""
        logger.info(f"MOCK SMS to {phone_number}: {message}")
        
        return {
            'success': True,
            'message_sid': 'mock_sid_12345',
            'status': 'sent',
            'provider': 'mock',
            'cost': '0.00',
            'currency': 'USD'
        }

def get_sms_service() -> BaseSMSService:
    """Factory function to get the configured SMS service"""
    
    if not getattr(settings, 'SMS_SERVICE_ENABLED', False):
        logger.info("SMS service is disabled, using mock service")
        return MockSMSService()
    
    provider = getattr(settings, 'SMS_SERVICE_PROVIDER', 'twilio').lower()
    
    if provider == 'twilio':
        return TwilioSMSService()
    else:
        raise SMSServiceError(f"Unsupported SMS provider: {provider}")

def send_otp_sms(phone_number: str, otp_code: str, user_name: str = "") -> Dict[str, Any]:
    """
    High-level function to send OTP SMS
    
    Args:
        phone_number: The phone number to send to
        otp_code: The OTP code to send
        user_name: Optional user name for personalization
    
    Returns:
        Dict with success status and details
    """
    try:
        sms_service = get_sms_service()
        
        # Create message
        greeting = f"Hi {user_name}, " if user_name else ""
        message = f"{greeting}Your SOC Central verification code is: {otp_code}. Valid for 10 minutes. Do not share this code with anyone."
        
        # Send SMS
        result = sms_service.send_sms(phone_number, message)
        
        logger.info(f"OTP SMS sent to {phone_number} via {result.get('provider')}")
        return result
        
    except Exception as e:
        logger.error(f"Failed to send OTP SMS to {phone_number}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'provider': 'unknown'
        }