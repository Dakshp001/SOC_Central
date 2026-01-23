# backend/tool/management/commands/populate_file_hashes.py
from django.core.management.base import BaseCommand
from django.db import transaction
from tool.models import SecurityDataUpload
import hashlib
import json

class Command(BaseCommand):
    help = 'Populate file_hash field for existing uploads'

    def handle(self, *args, **options):
        uploads_without_hash = SecurityDataUpload.objects.filter(file_hash='')
        
        self.stdout.write(f'Found {uploads_without_hash.count()} uploads without file hash')
        
        updated_count = 0
        
        with transaction.atomic():
            for upload in uploads_without_hash:
                try:
                    # Generate hash from processed_data if available
                    if upload.processed_data:
                        data_str = json.dumps(upload.processed_data, sort_keys=True)
                        file_hash = hashlib.sha256(data_str.encode('utf-8')).hexdigest()
                        upload.file_hash = file_hash
                        
                        # Also update record_count if not set
                        if upload.record_count == 0 and isinstance(upload.processed_data, dict):
                            data = upload.processed_data.get('data', [])
                            if isinstance(data, list):
                                upload.record_count = len(data)
                        
                        upload.save(update_fields=['file_hash', 'record_count'])
                        updated_count += 1
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'Failed to update upload {upload.id}: {e}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} uploads with file hashes')
        )