# backend/tool/management/commands/verify_data_storage.py
# Management command to verify data storage and sharing

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tool.models import SecurityDataUpload, DataNotification, DataAccessLog
from django.utils import timezone
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Verify data storage and cross-user sharing for SOC Dashboard'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check-uploads',
            action='store_true',
            help='Check all uploads in database',
        )
        parser.add_argument(
            '--check-active',
            action='store_true',
            help='Check active datasets',
        )
        parser.add_argument(
            '--check-users',
            action='store_true',
            help='Check users and their companies',
        )
        parser.add_argument(
            '--fix-company-data',
            action='store_true',
            help='Fix company data for existing uploads',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🔍 SOC Dashboard Data Verification')
        )
        self.stdout.write('=' * 60)

        if options['check_users']:
            self._check_users()
            
        if options['check_uploads']:
            self._check_uploads()
            
        if options['check_active']:
            self._check_active_datasets()
            
        if options['fix_company_data']:
            self._fix_company_data()

        self._check_data_sharing()

    def _check_users(self):
        self.stdout.write('\n📊 USER ANALYSIS')
        self.stdout.write('-' * 40)
        
        users = User.objects.all()
        companies = {}
        
        for user in users:
            company = user.company_name or 'NO COMPANY'
            if company not in companies:
                companies[company] = {'admins': [], 'users': []}
            
            if user.role in ['admin', 'super_admin']:
                companies[company]['admins'].append(user)
            else:
                companies[company]['users'].append(user)
        
        for company, data in companies.items():
            self.stdout.write(f'\n🏢 Company: {company}')
            
            self.stdout.write(f'   👨‍💼 Admins ({len(data["admins"])}):')
            for admin in data['admins']:
                self.stdout.write(f'      • {admin.email} (ID: {admin.id})')
            
            self.stdout.write(f'   👤 Users ({len(data["users"])}):')
            for user in data['users']:
                self.stdout.write(f'      • {user.email} (ID: {user.id})')

    def _check_uploads(self):
        self.stdout.write('\n📁 UPLOAD ANALYSIS')
        self.stdout.write('-' * 40)
        
        uploads = SecurityDataUpload.objects.all().order_by('-uploaded_at')
        
        if not uploads:
            self.stdout.write(self.style.WARNING('❌ NO UPLOADS FOUND IN DATABASE'))
            return
        
        self.stdout.write(f'📊 Total Uploads: {uploads.count()}')
        
        for upload in uploads:
            status_emoji = "🟢" if upload.is_active else "⚪"
            self.stdout.write(f'\n{status_emoji} Upload ID: {upload.id}')
            self.stdout.write(f'   📄 File: {upload.file_name}')
            self.stdout.write(f'   🔧 Tool: {upload.tool_type}')
            self.stdout.write(f'   👤 Uploaded by: {upload.uploaded_by.email} (ID: {upload.uploaded_by.id})')
            self.stdout.write(f'   🏢 Company: {upload.company_name or "NOT SET"}')
            self.stdout.write(f'   📅 Uploaded: {upload.uploaded_at}')
            self.stdout.write(f'   ✅ Status: {upload.status}')
            self.stdout.write(f'   🟢 Active: {upload.is_active}')
            self.stdout.write(f'   🌐 Public to Company: {upload.is_public_to_company}')
            
            if upload.processed_data:
                kpis = upload.processed_data.get('kpis', {})
                self.stdout.write(f'   📊 Data: {len(kpis)} KPIs found')
                if 'emailsScanned' in kpis:
                    self.stdout.write(f'      • Emails Scanned: {kpis["emailsScanned"]}')

    def _check_active_datasets(self):
        self.stdout.write('\n🟢 ACTIVE DATASETS')
        self.stdout.write('-' * 40)
        
        active_uploads = SecurityDataUpload.objects.filter(is_active=True)
        
        if not active_uploads:
            self.stdout.write(self.style.WARNING('❌ NO ACTIVE DATASETS FOUND'))
            return
        
        companies = {}
        for upload in active_uploads:
            company = upload.company_name or 'NO COMPANY'
            if company not in companies:
                companies[company] = []
            companies[company].append(upload)
        
        for company, uploads in companies.items():
            self.stdout.write(f'\n🏢 {company}:')
            for upload in uploads:
                self.stdout.write(f'   🟢 {upload.tool_type}: {upload.file_name}')
                self.stdout.write(f'      Uploaded by: {upload.uploaded_by.email}')
                self.stdout.write(f'      Activated: {upload.activated_at}')

    def _fix_company_data(self):
        self.stdout.write('\n🔧 FIXING COMPANY DATA')
        self.stdout.write('-' * 40)
        
        uploads_without_company = SecurityDataUpload.objects.filter(
            company_name__isnull=True
        ) | SecurityDataUpload.objects.filter(company_name='')
        
        fixed_count = 0
        for upload in uploads_without_company:
            if upload.uploaded_by and upload.uploaded_by.company_name:
                upload.company_name = upload.uploaded_by.company_name
                upload.is_public_to_company = True
                upload.save()
                fixed_count += 1
                self.stdout.write(f'✅ Fixed upload {upload.id}: {upload.company_name}')
        
        self.stdout.write(f'🔧 Fixed {fixed_count} uploads')

    def _check_data_sharing(self):
        self.stdout.write('\n🔄 DATA SHARING VERIFICATION')
        self.stdout.write('-' * 40)
        
        # Check each company's data sharing
        companies = User.objects.values_list('company_name', flat=True).distinct()
        
        for company in companies:
            if not company:
                continue
                
            self.stdout.write(f'\n🏢 Testing data sharing for: {company}')
            
            # Get users in this company
            company_users = User.objects.filter(company_name=company)
            admins = company_users.filter(role__in=['admin', 'super_admin'])
            general_users = company_users.filter(role='general')
            
            # Get active data for this company
            active_data = SecurityDataUpload.objects.filter(
                company_name=company,
                is_active=True
            )
            
            self.stdout.write(f'   👨‍💼 Admins: {admins.count()}')
            self.stdout.write(f'   👤 General Users: {general_users.count()}')
            self.stdout.write(f'   📊 Active Datasets: {active_data.count()}')
            
            if active_data.count() > 0 and general_users.count() > 0:
                self.stdout.write('   ✅ Data should be visible to general users')
                
                # Test API endpoint simulation
                for dataset in active_data:
                    self.stdout.write(f'      📄 {dataset.tool_type}: {dataset.file_name}')
                    self.stdout.write(f'         Uploaded by: {dataset.uploaded_by.email}')
                    self.stdout.write(f'         Should be visible to: {[u.email for u in general_users]}')
            else:
                if active_data.count() == 0:
                    self.stdout.write('   ❌ No active data found')
                if general_users.count() == 0:
                    self.stdout.write('   ❌ No general users found')

        # Final summary
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('📋 SUMMARY')
        self.stdout.write('=' * 60)
        
        total_uploads = SecurityDataUpload.objects.count()
        active_uploads = SecurityDataUpload.objects.filter(is_active=True).count()
        total_users = User.objects.count()
        total_companies = User.objects.values('company_name').distinct().count()
        
        self.stdout.write(f'📊 Total Uploads: {total_uploads}')
        self.stdout.write(f'🟢 Active Datasets: {active_uploads}')
        self.stdout.write(f'👥 Total Users: {total_users}')
        self.stdout.write(f'🏢 Companies: {total_companies}')
        
        if active_uploads > 0:
            self.stdout.write(self.style.SUCCESS('\n✅ Data persistence is working'))
        else:
            self.stdout.write(self.style.ERROR('\n❌ No active data found - check upload process'))

        # Provide troubleshooting steps
        self.stdout.write('\n🔧 TROUBLESHOOTING STEPS:')
        self.stdout.write('1. Run: python manage.py verify_data_storage --check-uploads')
        self.stdout.write('2. Check: Are admin and general user in same company?')
        self.stdout.write('3. Check: Is uploaded data marked as active?')
        self.stdout.write('4. Check: Frontend API calls to /api/tool/active-data/')
        self.stdout.write('5. Check: Browser network tab for API responses')