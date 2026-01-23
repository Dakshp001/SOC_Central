# backend/tool/management/commands/debug_gsuite_filters.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tool.models import SecurityDataUpload
from tool.services.data_filter_service import DataFilterService
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug GSuite date filter functionality specifically'

    def add_arguments(self, parser):
        parser.add_argument(
            '--company',
            type=str,
            help='Company name to test',
            default='default_company'
        )
        parser.add_argument(
            '--time-range',
            type=str,
            help='Time range to test (today, week, month, quarter, year)',
            default='month'
        )

    def handle(self, *args, **options):
        company = options['company']
        time_range = options['time_range']
        
        self.stdout.write(f'Debug GSuite Date Filtering')
        self.stdout.write(f'Company: {company}')
        self.stdout.write(f'Time range: {time_range}')
        self.stdout.write('=' * 60)
        
        # Get GSuite data specifically
        gsuite_uploads = SecurityDataUpload.get_all_active_data(company).filter(tool_type='gsuite')
        
        if not gsuite_uploads.exists():
            self.stdout.write(self.style.WARNING(f'No GSuite data found for company: {company}'))
            return
        
        for upload in gsuite_uploads:
            self.stdout.write(f'\nGSuite Upload: {upload.file_name}')
            
            gsuite_data = upload.processed_data
            if not gsuite_data or not isinstance(gsuite_data, dict):
                self.stdout.write(self.style.ERROR('No processed data found'))
                continue
                
            details = gsuite_data.get('details', {})
            
            # Check each sheet (both new and old formats)
            sheets_info = [
                # New format (preferred)
                ('total number of mail scanned', 'Date'),
                ('Phishing Attempted data', 'date reported', 'Date Reported'),  
                ('whitelisted domains', 'Date', 'Request Date'),
                ('Client Coordinated email invest', 'date', 'Date'),
                # Old format (backward compatibility)
                ('totalEmailsScanned', 'Date'),
                ('phishingAttempted', 'date reported', 'Date Reported'),
                ('whitelistedDomains', 'Domain', 'Date'),
                ('clientInvestigations', 'date', 'Date')
            ]
            
            for sheet_info in sheets_info:
                sheet_name = sheet_info[0]
                date_fields = sheet_info[1:]
                
                sheet_data = details.get(sheet_name, [])
                self.stdout.write(f'\n  Sheet: "{sheet_name}"')
                self.stdout.write(f'      Records: {len(sheet_data)}')
                
                if sheet_data and isinstance(sheet_data, list) and len(sheet_data) > 0:
                    sample = sheet_data[0]
                    if isinstance(sample, dict):
                        self.stdout.write(f'      Available fields: {list(sample.keys())}')
                        
                        # Check for date fields
                        found_date_field = None
                        for date_field in date_fields:
                            if date_field in sample:
                                found_date_field = date_field
                                sample_date = sample.get(date_field)
                                self.stdout.write(f'      Date field "{date_field}": {sample_date}')
                                break
                        
                        if not found_date_field:
                            self.stdout.write(f'      No date fields found from: {date_fields}')
                else:
                    self.stdout.write(f'      No data in sheet')
            
            # Test filtering
            self.stdout.write(f'\nTesting filtering with {time_range}...')
            
            raw_data = {'gsuite': gsuite_data}
            filters = {
                'timeRange': time_range,
                'dataSource': 'gsuite'
            }
            
            try:
                filtered_data = DataFilterService.apply_filters(raw_data, filters)
                gsuite_filtered = filtered_data.get('gsuite', {})
                filtered_details = gsuite_filtered.get('details', {})
                
                self.stdout.write(f'\nFiltering Results:')
                # Check both new and old sheet names
                sheet_names_to_check = [
                    ('total number of mail scanned', 'totalEmailsScanned'),
                    ('Phishing Attempted data', 'phishingAttempted'), 
                    ('whitelisted domains', 'whitelistedDomains'),
                    ('Client Coordinated email invest', 'clientInvestigations')
                ]
                
                for new_name, old_name in sheet_names_to_check:
                    # Try new name first, fallback to old name
                    original_data = details.get(new_name, details.get(old_name, []))
                    filtered_data = filtered_details.get(new_name, filtered_details.get(old_name, []))
                    
                    original_count = len(original_data)
                    filtered_count = len(filtered_data)
                    sheet_display_name = new_name if new_name in details else old_name
                    
                    if original_count != filtered_count:
                        self.stdout.write(self.style.SUCCESS(f'  {sheet_display_name}: {original_count} -> {filtered_count} (filtering worked!)'))
                    else:
                        self.stdout.write(self.style.WARNING(f'  {sheet_display_name}: {original_count} -> {filtered_count} (no change)'))
                
                # Check KPIs
                original_kpis = gsuite_data.get('kpis', {})
                filtered_kpis = gsuite_filtered.get('kpis', {})
                
                self.stdout.write(f'\nKPI Changes:')
                for kpi_name in ['emailsScanned', 'phishingAttempted', 'whitelistRequests', 'clientInvestigations']:
                    original_val = original_kpis.get(kpi_name, 0)
                    filtered_val = filtered_kpis.get(kpi_name, 0)
                    
                    if original_val != filtered_val:
                        self.stdout.write(self.style.SUCCESS(f'  {kpi_name}: {original_val} -> {filtered_val}'))
                    else:
                        self.stdout.write(f'  - {kpi_name}: {original_val} (no change)')
                        
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Filtering failed: {str(e)}'))
        
        self.stdout.write(f'\n' + '=' * 60)
        self.stdout.write('Debug completed!')