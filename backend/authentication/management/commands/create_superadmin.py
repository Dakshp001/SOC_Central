# backend/authentication/management/commands/create_superadmin.py
from django.core.management.base import BaseCommand
from django.conf import settings
from authentication.models import User

class Command(BaseCommand):
    help = 'Create a super admin user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email for the super admin',
            default=getattr(settings, 'SUPER_ADMIN_EMAIL', 'admin@soccentral.com')
        )
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the super admin',
            default=getattr(settings, 'SUPER_ADMIN_PASSWORD', 'SuperAdmin123!')
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if user exists',
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        force = options['force']

        # Check if super admin already exists
        if User.objects.filter(email=email).exists():
            if not force:
                self.stdout.write(
                    self.style.WARNING(f'Super admin with email {email} already exists. Use --force to recreate.')
                )
                return
            else:
                # Delete existing user
                User.objects.filter(email=email).delete()
                self.stdout.write(
                    self.style.WARNING(f'Deleted existing user with email {email}')
                )

        # Create super admin
        try:
            super_admin = User.objects.create_user(
                username=email,
                email=email,
                first_name='Super',
                last_name='Admin',
                company_name='SOC Central',
                job_title='System Administrator',
                department='IT Security',
                phone_number='+1-555-0123',
                country_code='+1',
                password=password,
                role='super_admin',
                is_email_verified=True,
                is_phone_verified=False,
                is_active=True,
                is_staff=True,
                is_superuser=True
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Super admin created successfully!')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Email: {email}')
            )
            self.stdout.write(
                self.style.SUCCESS(f'Password: {password}')
            )
            self.stdout.write(
                self.style.WARNING('IMPORTANT: Change the password after first login!')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Failed to create super admin: {str(e)}')
            )