# backend/tool/management/commands/debug_date_filters.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from tool.models import SecurityDataUpload
from tool.services.data_filter_service import DataFilterService
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug date filter functionality for all tools'

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
        
        self.stdout.write(f'Testing date filters for company: {company}')
        self.stdout.write(f'Time range: {time_range}')
        self.stdout.write('-' * 50)
        
        # Get active datasets
        active_uploads = SecurityDataUpload.get_all_active_data(company)
        
        if not active_uploads.exists():
            self.stdout.write(self.style.WARNING(f'No active data found for company: {company}'))
            return
        
        # Build raw data
        raw_data = {}
        for upload in active_uploads:
            raw_data[upload.tool_type] = upload.processed_data
        
        self.stdout.write(f'Found {len(raw_data)} tools with data:')
        for tool, tool_data in raw_data.items():
            if isinstance(tool_data, dict):
                details = tool_data.get('details', {})
                total_records = sum(len(sheet_data) if isinstance(sheet_data, list) else 0 
                                  for sheet_data in details.values())
                self.stdout.write(f'  - {tool}: {total_records} records')
                
                # Check for date fields in each sheet
                for sheet_name, sheet_data in details.items():
                    if isinstance(sheet_data, list) and sheet_data:
                        sample_record = sheet_data[0]
                        if isinstance(sample_record, dict):
                            date_fields = []
                            for field_name in sample_record.keys():
                                field_lower = str(field_name).lower()
                                if any(date_keyword in field_lower for date_keyword in 
                                      ['date', 'time', 'created', 'updated', 'reported']):
                                    date_fields.append(field_name)
                            
                            if date_fields:
                                self.stdout.write(f'    {sheet_name}: Date fields found: {date_fields}')
                            else:
                                self.stdout.write(f'    {sheet_name}: No date fields found')
        
        self.stdout.write('-' * 50)
        self.stdout.write('Testing date filtering...')
        
        # Test date filtering
        filters = {
            'timeRange': time_range,
            'dataSource': 'all'
        }
        
        try:
            filtered_data = DataFilterService.apply_filters(raw_data, filters)
            
            self.stdout.write(f'After filtering with {time_range}:')
            for tool, tool_data in filtered_data.items():
                if isinstance(tool_data, dict):
                    details = tool_data.get('details', {})
                    total_filtered = sum(len(sheet_data) if isinstance(sheet_data, list) else 0 
                                       for sheet_data in details.values())
                    
                    original_count = sum(len(sheet_data) if isinstance(sheet_data, list) else 0 
                                       for sheet_data in raw_data[tool].get('details', {}).values())
                    
                    self.stdout.write(f'  - {tool}: {total_filtered}/{original_count} records')
                    
                    if total_filtered != original_count:
                        self.stdout.write(self.style.SUCCESS(f'    ✅ Date filtering working for {tool}'))
                    else:
                        self.stdout.write(self.style.WARNING(f'    ⚠️ No filtering effect for {tool}'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during filtering: {str(e)}'))
        
        self.stdout.write('-' * 50)
        self.stdout.write('Debug completed')