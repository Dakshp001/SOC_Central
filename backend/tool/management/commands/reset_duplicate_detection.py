# backend/tool/management/commands/reset_duplicate_detection.py
from django.core.management.base import BaseCommand
from django.db import transaction
from tool.models import SecurityDataUpload

class Command(BaseCommand):
    help = 'Reset duplicate detection system - clear all file hashes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm the reset operation',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    'This will reset all file hashes. Use --confirm to proceed.'
                )
            )
            return

        total_uploads = SecurityDataUpload.objects.count()
        
        if total_uploads == 0:
            self.stdout.write(self.style.SUCCESS('No uploads found in database.'))
            return

        self.stdout.write(f'Found {total_uploads} uploads in database')
        
        with transaction.atomic():
            # Reset all file hashes and record counts
            updated = SecurityDataUpload.objects.update(
                file_hash='',
                record_count=0
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully reset file hashes for {updated} uploads. '
                    'Duplicate detection is now disabled until new files are uploaded.'
                )
            )
            
        # Show current state
        uploads_with_hash = SecurityDataUpload.objects.exclude(file_hash='').count()
        self.stdout.write(f'Uploads with file hash: {uploads_with_hash}')
        self.stdout.write(f'Uploads without file hash: {total_uploads - uploads_with_hash}')