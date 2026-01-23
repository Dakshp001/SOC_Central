# backend/authentication/tasks.py
"""
Asynchronous tasks for authentication operations
Makes email sending non-blocking for faster response times
"""

import logging
from django.core.mail import send_mail
from django.conf import settings
from threading import Thread

logger = logging.getLogger(__name__)


def send_email_async(subject, message, recipient_list, html_message=None):
    """
    Send email asynchronously in a separate thread
    Returns immediately without waiting for email to be sent
    """
    def _send():
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"Email sent successfully to {recipient_list}")
        except Exception as e:
            logger.error(f"Failed to send email to {recipient_list}: {str(e)}")

    # Start thread and return immediately
    thread = Thread(target=_send)
    thread.daemon = True
    thread.start()

    return True  # Return immediately, don't wait for email


def send_otp_email_async(email, otp_code, first_name=''):
    """Send OTP email asynchronously"""
    subject = f'{settings.EMAIL_SUBJECT_PREFIX}Your Verification Code'

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .otp-box {{ background: #f4f4f4; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }}
            .otp-code {{ font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #3b82f6; }}
            .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Verify Your Email</h2>
            <p>Hi {first_name or 'there'},</p>
            <p>Your verification code is:</p>
            <div class="otp-box">
                <div class="otp-code">{otp_code}</div>
            </div>
            <p>This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
            <div class="footer">
                <p>This is an automated message from SOC Central.</p>
            </div>
        </div>
    </body>
    </html>
    """

    message = f"Your verification code is: {otp_code}\n\nThis code will expire in {settings.OTP_EXPIRY_MINUTES} minutes."

    return send_email_async(subject, message, [email], html_message)


def send_login_notification_async(email, first_name, ip_address, user_agent):
    """Send login notification asynchronously"""
    subject = f'{settings.EMAIL_SUBJECT_PREFIX}New Login to Your Account'

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .info-box {{ background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>New Login Detected</h2>
            <p>Hi {first_name},</p>
            <p>We detected a new login to your account:</p>
            <div class="info-box">
                <p><strong>IP Address:</strong> {ip_address}</p>
                <p><strong>Device:</strong> {user_agent[:100]}</p>
            </div>
            <p>If this wasn't you, please contact support immediately.</p>
        </div>
    </body>
    </html>
    """

    message = f"New login detected from IP: {ip_address}"

    return send_email_async(subject, message, [email], html_message)
