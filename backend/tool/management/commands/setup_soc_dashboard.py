# backend/tool/management/commands/setup_soc_dashboard.py
# Management command to set up the SOC dashboard with proper data structure

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from tool.models import SecurityDataUpload, DataNotification
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class Command(BaseCommand):
    help = 'Set up SOC Dashboard with enhanced data persistence features'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-sample-data',
            action='store_true',
            help='Create sample data for testing',
        )
        parser.add_argument(
            '--migrate-existing-data',
            action='store_true',
            help='Migrate existing uploads to new structure',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Setting up SOC Dashboard with enhanced features...')
        )

        try:
            with transaction.atomic():
                # 1. Create cache table for sessions
                self._create_cache_table()
                
                # 2. Migrate existing data if requested
                if options['migrate_existing_data']:
                    self._migrate_existing_data()
                
                # 3. Create sample data if requested
                if options['create_sample_data']:
                    self._create_sample_data()
                
                # 4. Set up initial notifications
                self._setup_notifications()
                
                self.stdout.write(
                    self.style.SUCCESS('✅ SOC Dashboard setup completed successfully!')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Setup failed: {str(e)}')
            )
            raise

    def _create_cache_table(self):
        """Create cache table for database-backed sessions"""
        from django.core.management import call_command
        
        self.stdout.write('📊 Creating cache table...')
        try:
            call_command('createcachetable')
            self.stdout.write(self.style.SUCCESS('  ✓ Cache table created'))
        except Exception as e:
            if 'already exists' in str(e):
                self.stdout.write(self.style.WARNING('  ⚠ Cache table already exists'))
            else:
                raise

    def _migrate_existing_data(self):
        """Migrate existing uploads to include company information"""
        self.stdout.write('🔄 Migrating existing upload data...')
        
        # Find uploads without company_name
        uploads_to_update = SecurityDataUpload.objects.filter(
            company_name__isnull=True
        ).select_related('uploaded_by')
        
        count = 0
        for upload in uploads_to_update:
            if upload.uploaded_by and upload.uploaded_by.company_name:
                upload.company_name = upload.uploaded_by.company_name
                upload.is_public_to_company = True
                upload.save()
                count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'  ✓ Migrated {count} existing uploads')
        )

    def _create_sample_data(self):
        """Create sample data for testing"""
        self.stdout.write('🧪 Creating sample data...')
        
        # Create sample company users if they don't exist
        companies = ['TechCorp Inc', 'SecureBase Ltd', 'DataGuard Systems']
        
        for company in companies:
            # Create admin user for each company
            admin_email = f'admin@{company.lower().replace(" ", "").replace("inc", "").replace("ltd", "").replace("systems", "")}.com'
            
            admin_user, created = User.objects.get_or_create(
                email=admin_email,
                defaults={
                    'first_name': 'Admin',
                    'last_name': 'User',
                    'company_name': company,
                    'role': 'admin',
                    'is_email_verified': True,
                }
            )
            
            if created:
                admin_user.set_password('admin123')
                admin_user.save()
                self.stdout.write(f'  ✓ Created admin user: {admin_email}')
            
            # Create general user for each company
            user_email = f'user@{company.lower().replace(" ", "").replace("inc", "").replace("ltd", "").replace("systems", "")}.com'
            
            general_user, created = User.objects.get_or_create(
                email=user_email,
                defaults={
                    'first_name': 'General',
                    'last_name': 'User', 
                    'company_name': company,
                    'role': 'general',
                    'is_email_verified': True,
                }
            )
            
            if created:
                general_user.set_password('user123')
                general_user.save()
                self.stdout.write(f'  ✓ Created general user: {user_email}')

    def _setup_notifications(self):
        """Set up initial notification system"""
        self.stdout.write('🔔 Setting up notification system...')
        
        # Create welcome notifications for all users
        users = User.objects.filter(is_email_verified=True)
        
        notifications_created = 0
        for user in users:
            # Check if user already has welcome notification
            existing = DataNotification.objects.filter(
                recipient=user,
                notification_type='welcome'
            ).exists()
            
            if not existing:
                DataNotification.objects.create(
                    recipient=user,
                    notification_type='data_uploaded',  # Using existing type
                    title='Welcome to SOC Dashboard! 🎉',
                    message=f'Your enhanced SOC Dashboard is ready. You now have real-time data synchronization across all security tools.',
                )
                notifications_created += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'  ✓ Created {notifications_created} welcome notifications')
        )

    def _print_setup_summary(self):
        """Print setup summary"""
        self.stdout.write(
            self.style.SUCCESS('\n' + '='*60)
        )
        self.stdout.write(
            self.style.SUCCESS('🎯 SOC DASHBOARD SETUP COMPLETE')
        )
        self.stdout.write(
            self.style.SUCCESS('='*60)
        )
        
        # Count statistics
        total_users = User.objects.count()
        total_uploads = SecurityDataUpload.objects.count()
        active_uploads = SecurityDataUpload.objects.filter(is_active=True).count()
        total_companies = User.objects.values('company_name').distinct().count()
        
        self.stdout.write(f'👥 Total Users: {total_users}')
        self.stdout.write(f'🏢 Companies: {total_companies}')
        self.stdout.write(f'📊 Total Uploads: {total_uploads}')
        self.stdout.write(f'🟢 Active Datasets: {active_uploads}')
        
        self.stdout.write('\n📋 Next Steps:')
        self.stdout.write('1. Run: python manage.py runserver')
        self.stdout.write('2. Login as admin and upload data')
        self.stdout.write('3. Data will be automatically shared with company users')
        self.stdout.write('4. Check real-time notifications and data sync')
        
        self.stdout.write(
            self.style.SUCCESS('\n🚀 Your SOC Dashboard is ready!')
        )