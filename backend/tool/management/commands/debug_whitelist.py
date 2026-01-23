# backend/tool/management/commands/debug_whitelist.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tool.models import SecurityDataUpload
from tool.services.data_filter_service import DataFilterService
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug whitelist domain data specifically'

    def add_arguments(self, parser):
        parser.add_argument(
            '--company',
            type=str,
            help='Company name to test',
            default='SOC Central'
        )

    def handle(self, *args, **options):
        company = options['company']
        
        self.stdout.write(f'Debug Whitelist Domain Data')
        self.stdout.write(f'Company: {company}')
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
            
            # Check whitelist data
            whitelist_data = details.get('whitelistedDomains', [])
            self.stdout.write(f'\nWhitelist Data Analysis:')
            self.stdout.write(f'Total records: {len(whitelist_data)}')
            
            if whitelist_data:
                self.stdout.write(f'First 5 records:')
                for i, record in enumerate(whitelist_data[:5]):
                    self.stdout.write(f'  {i+1}: {record}')
                
                first_record = whitelist_data[0]
                if isinstance(first_record, dict):
                    self.stdout.write(f'Available fields: {list(first_record.keys())}')
                    
                    # Check for domain fields
                    domain_value = None
                    for field in ['Whitelisted Domain', 'Domain', 'domain']:
                        if field in first_record:
                            domain_value = first_record[field]
                            self.stdout.write(f'Domain field "{field}": {domain_value}')
                            break
                    
                    if not domain_value:
                        self.stdout.write('No domain field found!')
                else:
                    self.stdout.write(f'Record type: {type(first_record)}')
            
            # Check KPIs
            kpis = gsuite_data.get('kpis', {})
            self.stdout.write(f'\nKPIs:')
            self.stdout.write(f'whitelistRequests: {kpis.get("whitelistRequests", 0)}')
            
            # Test filtering
            self.stdout.write(f'\nTesting filtering...')
            
            raw_data = {'gsuite': gsuite_data}
            filters = {
                'timeRange': 'year',
                'dataSource': 'gsuite'
            }
            
            try:
                filtered_data = DataFilterService.apply_filters(raw_data, filters)
                gsuite_filtered = filtered_data.get('gsuite', {})
                filtered_details = gsuite_filtered.get('details', {})
                filtered_kpis = gsuite_filtered.get('kpis', {})
                
                filtered_whitelist = filtered_details.get('whitelistedDomains', [])
                
                self.stdout.write(f'After filtering:')
                self.stdout.write(f'Whitelist records: {len(filtered_whitelist)}')
                self.stdout.write(f'whitelistRequests KPI: {filtered_kpis.get("whitelistRequests", 0)}')
                
                if filtered_whitelist:
                    self.stdout.write(f'First 3 filtered records:')
                    for i, record in enumerate(filtered_whitelist[:3]):
                        self.stdout.write(f'  {i+1}: {record}')
                        
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Filtering failed: {str(e)}'))
        
        self.stdout.write(f'\n' + '=' * 60)
        self.stdout.write('Debug completed!')