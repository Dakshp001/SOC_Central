# backend/tool/utils.py
# Main utils file - Entry point for all tool processors

import logging
from .shared import get_file_type
from .seim import process_siem_excel
from .mdm import process_mdm_excel
from .gsuite import process_gsuite_excel
from .edr import process_edr_excel
from .sonicwall import process_sonicwall_excel
from .meraki import process_meraki_excel
from .models import SecurityDataUpload, ProcessingLog
from django.utils import timezone

logger = logging.getLogger(__name__)

def process_file(file):
    """
    Main entry point for processing security tool files.
    Automatically detects file type and routes to appropriate processor.
    """
    try:
        # Detect file type
        file_type = get_file_type(file)
        logger.info(f"Detected file type: {file_type}")
        
        # Route to appropriate processor
        if file_type == "gsuite":
            return process_gsuite_excel(file)
        elif file_type == "mdm":
            return process_mdm_excel(file)
        elif file_type == "siem":
            return process_siem_excel(file)
        elif file_type == "edr":
            return process_edr_excel(file)
        elif file_type == "sonicwall":
            return process_sonicwall_excel(file)
        elif file_type == "meraki":
            return process_meraki_excel(file)
        else:
            logger.warning(f"Unknown file type: {file_type}")
            return {
                "error": f"Unknown file type: {file_type}",
                "fileType": "unknown",
                "supportedTypes": ["gsuite", "mdm", "siem", "edr", "sonicwall", "meraki"]
            }
    
    except Exception as e:
        logger.error(f"Error processing file: {str(e)}")
        return {
            "error": f"Error processing file: {str(e)}",
            "fileType": "error"
        }

def save_processed_data(file, tool_type, processed_data, sheet_names=None, status='completed', error_message=''):
    """Save processed data to database"""
    upload = None
    try:
        upload = SecurityDataUpload.objects.create(
            tool_type=tool_type,
            file_name=file.name,
            file_size=file.size,
            processed_data=processed_data,
            sheet_names=sheet_names or [],
            status=status,
            error_message=error_message,
            processed_at=timezone.now() if status == 'completed' else None
        )
        
        # Log the processing
        ProcessingLog.objects.create(
            upload=upload,
            level='INFO',
            message=f'Successfully processed {tool_type} file: {file.name}'
        )
        
        return upload
    
    except Exception as e:
        if upload:
            ProcessingLog.objects.create(
                upload=upload,
                level='ERROR',
                message=f'Failed to save processed data: {str(e)}'
            )
        else:
            # Log without a DB reference (fallback)
            logger.error(f'Failed to save processed data: {str(e)}')
        raise

    
# Export main function and shared utilities for backward compatibility
__all__ = [
    'process_file',
    'get_file_type',
    'process_gsuite_excel',
    'process_mdm_excel', 
    'process_siem_excel',
    'process_edr_excel',
    'process_sonicwall_excel',
    'process_meraki_excel'
]