# backend/authentication/management/commands/cleanup_expired_tokens.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from authentication.models import PasswordResetToken, OTPVerification, UserSession

class Command(BaseCommand):
    help = 'Clean up expired password reset tokens, OTP verifications, and inactive sessions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write('🧪 DRY RUN - No data will be deleted')
        
        # Clean up expired password reset tokens
        expired_tokens = PasswordResetToken.objects.filter(
            expires_at__lt=timezone.now()
        )
        token_count = expired_tokens.count()
        
        if token_count > 0:
            if not dry_run:
                expired_tokens.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'🗑️ Deleted {token_count} expired password reset tokens')
                )
            else:
                self.stdout.write(f'Would delete {token_count} expired password reset tokens')
        else:
            self.stdout.write('✅ No expired password reset tokens found')
        
        # Clean up expired OTP verifications
        expired_otps = OTPVerification.objects.filter(
            expires_at__lt=timezone.now()
        )
        otp_count = expired_otps.count()
        
        if otp_count > 0:
            if not dry_run:
                expired_otps.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'🗑️ Deleted {otp_count} expired OTP verifications')
                )
            else:
                self.stdout.write(f'Would delete {otp_count} expired OTP verifications')
        else:
            self.stdout.write('✅ No expired OTP verifications found')
        
        # Clean up used tokens older than 30 days
        old_used_tokens = PasswordResetToken.objects.filter(
            is_used=True,
            used_at__lt=timezone.now() - timezone.timedelta(days=30)
        )
        old_token_count = old_used_tokens.count()
        
        if old_token_count > 0:
            if not dry_run:
                old_used_tokens.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'🗑️ Deleted {old_token_count} old used tokens')
                )
            else:
                self.stdout.write(f'Would delete {old_token_count} old used tokens')
        else:
            self.stdout.write('✅ No old used tokens found')
        
        # Clean up expired user sessions (older than 7 days inactive)
        session_threshold = timezone.now() - timezone.timedelta(days=7)
        expired_user_sessions = UserSession.objects.filter(
            last_activity__lt=session_threshold,
            is_active=False
        )
        session_count = expired_user_sessions.count()
        
        if session_count > 0:
            if not dry_run:
                expired_user_sessions.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'🗑️ Deleted {session_count} old inactive user sessions')
                )
            else:
                self.stdout.write(f'Would delete {session_count} old inactive user sessions')
        else:
            self.stdout.write('✅ No old inactive sessions found')
        
        # Also clean up very old active sessions (older than 30 days)
        old_active_sessions = UserSession.objects.filter(
            last_activity__lt=timezone.now() - timezone.timedelta(days=30),
            is_active=True
        )
        old_active_count = old_active_sessions.count()
        
        if old_active_count > 0:
            if not dry_run:
                old_active_sessions.update(is_active=False)
                self.stdout.write(
                    self.style.WARNING(f'⚠️ Deactivated {old_active_count} very old active sessions')
                )
            else:
                self.stdout.write(f'Would deactivate {old_active_count} very old active sessions')
        else:
            self.stdout.write('✅ No very old active sessions found')
        
        total_cleaned = token_count + otp_count + old_token_count + session_count + old_active_count
        
        if not dry_run and total_cleaned > 0:
            self.stdout.write(
                self.style.SUCCESS(f'🎉 Cleanup completed! Total items removed/updated: {total_cleaned}')
            )
        elif dry_run and total_cleaned > 0:
            self.stdout.write(f'Dry run completed. Would remove/update {total_cleaned} items total.')
        else:
            self.stdout.write('✨ Database is clean - no expired items found')