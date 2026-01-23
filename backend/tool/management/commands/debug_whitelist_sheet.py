# backend/tool/management/commands/debug_whitelist_sheet.py
from django.core.management.base import BaseCommand
from tool.models import SecurityDataUpload
import pandas as pd
import os

class Command(BaseCommand):
    help = 'Debug what is actually in the whitelisted data sheet'

    def handle(self, *args, **options):
        self.stdout.write('Debug Whitelist Sheet Content')
        self.stdout.write('=' * 50)
        
        # Get the GSuite file info
        upload = SecurityDataUpload.objects.filter(tool_type='gsuite', company_name='SOC Central').first()
        
        if not upload:
            self.stdout.write(self.style.ERROR('No GSuite upload found'))
            return
            
        self.stdout.write(f'File: {upload.file_name}')
        self.stdout.write(f'Sheet names: {upload.sheet_names}')
        
        # We can't directly read the original file since it's not stored
        # But we can check if there's a way to access it
        self.stdout.write('\nSince the original file is not stored, let me check what was processed...')
        
        # Check all the details to see if any contain actual domain data
        data = upload.processed_data
        details = data.get('details', {})
        
        for key, value in details.items():
            if isinstance(value, list) and value:
                self.stdout.write(f'\n{key}: {len(value)} records')
                sample = value[0] if len(value) > 0 else {}
                if isinstance(sample, dict):
                    self.stdout.write(f'  Fields: {list(sample.keys())}')
                    
                    # Look for any field that might contain domain data
                    for field_name, field_value in sample.items():
                        if any(keyword in field_name.lower() for keyword in ['domain', 'url', 'site', 'host']):
                            self.stdout.write(f'    {field_name}: "{field_value}"')
        
        self.stdout.write('\nTo properly fix this, you may need to:')
        self.stdout.write('1. Re-upload the GSuite Excel file with the updated processor')
        self.stdout.write('2. Or check if the "whitelisted data" sheet actually contains domains in your Excel file')
        
        self.stdout.write('\n' + '=' * 50)
        self.stdout.write('Debug completed!')