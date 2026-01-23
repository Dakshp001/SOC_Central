# backend/tool/views/universal.py - FIXED VERSION
# Universal views that handle multiple tools with proper routing

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
import logging
import pandas as pd
import json
import numpy as np
import hashlib
from datetime import datetime

from django.utils import timezone
from django.db import transaction
from django.db import models
from ..models import SecurityDataUpload, DataNotification, DataAccessLog

# Import shared utilities
try:
    from ..shared import get_file_type, validate_excel_file
    from ..shared.views import FileAnalysisView
except ImportError as e:
    print(f"Shared utilities import failed: {e}")
    # Define fallback functions
    def get_file_type(file):
        return 'unknown'
    def validate_excel_file(file):
        pass
    class FileAnalysisView(APIView):
        pass

# Import individual processors with error handling
processor_map = {}

# ENSURE GSuite processor is always available
def ensure_processors():
    """Ensure all processors are properly loaded"""
    print(f"ensure_processors called - current processor_map keys: {list(processor_map.keys())}")
    if 'gsuite' not in processor_map:
        print("GSuite not in processor_map, attempting import...")
        try:
            from ..gsuite.processor import process_gsuite_excel
            processor_map['gsuite'] = process_gsuite_excel
            print(f"GSuite processor imported successfully: {process_gsuite_excel}")
            print(f"processor_map after GSuite import: {list(processor_map.keys())}")
        except ImportError as e:
            print(f"GSuite processor import failed: {e}")
            import traceback
            traceback.print_exc()
        except Exception as e:
            print(f"GSuite processor unexpected error: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("GSuite already in processor_map")

# Always call this to ensure GSuite is loaded
ensure_processors()

try:
    from ..mdm.processor import process_mdm_excel
    processor_map['mdm'] = process_mdm_excel
except ImportError:
    print("MDM processor not available")

try:
    from ..seim.processor import process_siem_excel
    processor_map['siem'] = process_siem_excel
except ImportError:
    print("SIEM processor not available")

try:
    from ..edr.processor import process_edr_excel
    processor_map['edr'] = process_edr_excel
except ImportError:
    print("EDR processor not available")

try:
    from ..sonicwall.processor import process_sonicwall_excel
    processor_map['sonicwall'] = process_sonicwall_excel
except ImportError:
    print("SonicWall processor not available")

try:
    from ..meraki.processor import process_meraki_excel
    processor_map['meraki'] = process_meraki_excel
except ImportError:
    print("Meraki processor not available")

logger = logging.getLogger(__name__)

# Import AI service for chatbot functionality
try:
    from ..services.ai_service import SecureAIService
    from ..models import ChatConversation, ChatMessage
    import time
    import uuid
    AI_SERVICE_AVAILABLE = True
except ImportError as e:
    print(f"WARNING: AI Service not available: {e}")
    AI_SERVICE_AVAILABLE = False

def clean_gsuite_whitelist_data(data):
    """Clean GSuite whitelist data to remove empty domain records"""
    if not isinstance(data, dict) or data.get('fileType') != 'gsuite':
        return data
    
    # Create a copy to avoid modifying original data
    cleaned_data = data.copy()
    details = cleaned_data.get('details', {}).copy()
    
    # Clean whitelistedDomains (old format)
    whitelist_data = details.get('whitelistedDomains', [])
    if whitelist_data:
        valid_whitelist = []
        for item in whitelist_data:
            if isinstance(item, dict):
                domain = item.get('Whitelisted Domain', item.get('Domain', item.get('domain', ''))).strip()
                if domain and domain != '-' and domain.lower() != 'nan':
                    valid_whitelist.append(item)
        details['whitelistedDomains'] = valid_whitelist
    
    # Clean whitelisted domains (new format)
    whitelist_new = details.get('whitelisted domains', [])
    if whitelist_new:
        valid_whitelist_new = []
        for item in whitelist_new:
            if isinstance(item, dict):
                domain = item.get('Whitelisted Domain', item.get('Domain', item.get('domain', ''))).strip()
                if domain and domain != '-' and domain.lower() != 'nan':
                    valid_whitelist_new.append(item)
        details['whitelisted domains'] = valid_whitelist_new
    
    # Update KPIs to reflect cleaned data
    kpis = cleaned_data.get('kpis', {}).copy()
    total_valid_whitelist = len(details.get('whitelistedDomains', [])) + len(details.get('whitelisted domains', []))
    kpis['whitelistRequests'] = total_valid_whitelist
    
    cleaned_data['details'] = details
    cleaned_data['kpis'] = kpis
    
    return cleaned_data

def calculate_file_hash(file_content):
    """Calculate SHA-256 hash of file content for duplicate detection"""
    if isinstance(file_content, str):
        file_content = file_content.encode('utf-8')
    return hashlib.sha256(file_content).hexdigest()

def check_duplicate_file(file_hash, company_name, tool_type, uploaded_by):
    """Check if file with same hash already exists"""
    try:
        # Log the check for debugging
        logger.info(f"Checking for duplicate: hash={file_hash[:8]}..., company={company_name}, tool={tool_type}")
        
        # Only check if file_hash is not empty
        if not file_hash:
            logger.warning("Empty file hash provided for duplicate check")
            return {'is_duplicate': False}
        
        existing_upload = SecurityDataUpload.objects.filter(
            file_hash=file_hash,
            company_name=company_name,
            tool_type=tool_type
        ).first()
        
        if existing_upload:
            logger.info(f"Duplicate found: Upload ID {existing_upload.id}, file: {existing_upload.file_name}")
            return {
                'is_duplicate': True,
                'existing_upload': {
                    'id': existing_upload.id,
                    'file_name': existing_upload.file_name,
                    'uploaded_by': f"{existing_upload.uploaded_by.first_name} {existing_upload.uploaded_by.last_name}",
                    'uploaded_at': existing_upload.uploaded_at.isoformat(),
                    'is_active': existing_upload.is_active,
                    'record_count': existing_upload.record_count or 0
                }
            }
        
        logger.info("No duplicate found")
        return {'is_duplicate': False}
        
    except Exception as e:
        logger.error(f"Error checking duplicate file: {str(e)}")
        return {'is_duplicate': False, 'error': str(e)}

def validate_file_content(file, tool_type):
    """Enhanced file validation with detailed feedback"""
    try:
        # Reset file position
        file.seek(0)
        
        # Check file size (50MB limit)
        if file.size > 50 * 1024 * 1024:
            return {
                'valid': False,
                'error': f'File size ({file.size / (1024*1024):.1f}MB) exceeds 50MB limit',
                'error_code': 'FILE_TOO_LARGE'
            }
        
        # Check file extension
        allowed_extensions = ['.xlsx', '.xls', '.csv']
        file_ext = file.name.lower().split('.')[-1] if '.' in file.name else ''
        if f'.{file_ext}' not in allowed_extensions:
            return {
                'valid': False,
                'error': f'Unsupported file type: .{file_ext}. Allowed: {", ".join(allowed_extensions)}',
                'error_code': 'INVALID_FILE_TYPE'
            }
        
        # Try to read file structure
        try:
            if file.name.lower().endswith('.csv'):
                import csv
                file.seek(0)
                sample = file.read(1024).decode('utf-8')
                file.seek(0)
                csv.Sniffer().sniff(sample)
            else:
                import pandas as pd
                excel_file = pd.ExcelFile(file)
                if len(excel_file.sheet_names) == 0:
                    return {
                        'valid': False,
                        'error': 'Excel file contains no sheets',
                        'error_code': 'NO_SHEETS'
                    }
        except Exception as e:
            return {
                'valid': False,
                'error': f'File appears to be corrupted or invalid: {str(e)}',
                'error_code': 'CORRUPTED_FILE'
            }
        
        file.seek(0)
        return {'valid': True}
        
    except Exception as e:
        logger.error(f"File validation error: {str(e)}")
        return {
            'valid': False,
            'error': f'Validation failed: {str(e)}',
            'error_code': 'VALIDATION_ERROR'
        }

def clean_data_for_json(data):
    """Recursively clean data to make it JSON serializable"""
    if isinstance(data, dict):
        return {key: clean_data_for_json(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [clean_data_for_json(item) for item in data]
    elif isinstance(data, (pd.Timestamp, np.datetime64)):
        # Convert pandas timestamps to ISO string
        try:
            return pd.to_datetime(data).strftime('%Y-%m-%d %H:%M:%S')
        except:
            return ""
    elif isinstance(data, datetime):
        # Convert Python datetime to ISO string
        try:
            return data.strftime('%Y-%m-%d %H:%M:%S')
        except:
            return ""
    elif isinstance(data, (np.integer, np.floating)):
        if pd.isna(data) or np.isnan(data) or np.isinf(data):
            return None
        return float(data) if isinstance(data, np.floating) else int(data)
    elif isinstance(data, (float, int)):
        if isinstance(data, float) and (np.isnan(data) or np.isinf(data)):
            return None
        return data
    elif pd.isna(data) or data is pd.NaT:
        return None
    elif isinstance(data, str) and data.lower() in ['nan', 'none', '', 'inf', '-inf', 'nat']:
        return ""
    elif data is None:
        return None
    else:
        return data

def check_admin_permission(user):
    """Check if user has admin privileges (admin, master_admin or super admin).
    Robust to different casings and also honors Django superuser/staff flags.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        return False

    # Django-native privileges always allowed
    if getattr(user, 'is_superuser', False) or getattr(user, 'is_staff', False):
        return True

    # Check role-based permissions (case-insensitive, tolerant to spacing)
    user_role = getattr(user, 'role', '') or ''
    role_value = str(user_role).strip().lower()
    return role_value in ['admin', 'master_admin', 'super_admin', 'super admin']

class ProcessorDebugView(APIView):
    """Debug endpoint to check processor status"""
    
    def get(self, request):
        try:
            # Force reload processors
            ensure_processors()
            
            debug_info = {
                'processor_map_keys': list(processor_map.keys()),
                'processor_map_length': len(processor_map),
                'gsuite_in_map': 'gsuite' in processor_map,
                'processor_functions': {k: str(v) for k, v in processor_map.items()}
            }
            
            # Test GSuite import
            try:
                from ..gsuite.processor import process_gsuite_excel
                debug_info['gsuite_import_test'] = 'success'
                debug_info['gsuite_function'] = str(process_gsuite_excel)
            except Exception as e:
                debug_info['gsuite_import_test'] = f'failed: {str(e)}'
            
            return Response({
                'success': True,
                'debug_info': debug_info
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=500)

class UniversalUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    
    def post(self, request):
        # Ensure processors are loaded before each request
        ensure_processors()
        
        # Debug processor_map at request time
        print(f"=== UNIVERSAL UPLOAD REQUEST ===")
        print(f"Request method: {request.method}")
        print(f"Request path: {request.path}")
        print(f"Request data keys: {list(request.data.keys())}")
        print(f"Request FILES: {list(request.FILES.keys())}")
        print(f"Available processors: {list(processor_map.keys())}")
        print(f"processor_map length: {len(processor_map)}")
        print(f"processor_map contents: {processor_map}")
        logger.info(f"Available processors: {list(processor_map.keys())}")
        logger.info(f"processor_map length: {len(processor_map)}")
        logger.info(f"Request path: {request.path}")
        logger.info(f"processor_map contents: {processor_map}")
        
        try:
            file = request.FILES.get('file')
            tool_type = request.data.get('tool_type', '').lower()
            auto_activate = request.data.get('auto_activate', True)
            target_company = request.data.get('target_company', '').strip()
            
            if not file:
                return Response({
                    'success': False,
                    'message': 'No file provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check admin permission
            if not check_admin_permission(request.user):
                return Response({
                    'success': False,
                    'error': 'Admin privileges required for file uploads',
                    'user_role': getattr(request.user, 'role', 'unknown')
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Get user's company for data sharing
            user_company = getattr(request.user, 'company_name', 'default_company')
            if not user_company:
                user_company = 'default_company'
            
            # Use target company if provided and user has permission
            if target_company:
                user_role = getattr(request.user, 'role', 'user')
                if user_role == 'super_admin':
                    # Super admin can upload for any company
                    user_company = target_company
                elif user_role == 'admin' and target_company == user_company:
                    # Regular admin can only upload for their own company
                    user_company = target_company
                elif user_role == 'admin' and target_company != user_company:
                    return Response({
                        'success': False,
                        'message': 'You can only upload data for your own company',
                        'user_company': user_company,
                        'requested_company': target_company
                    }, status=status.HTTP_403_FORBIDDEN)
            else:
                # If super admin did not provide a target company, default to their own company
                # This allows both Admin and Super Admin to upload without forcing explicit target selection
                user_role = getattr(request.user, 'role', 'user')
                if user_role == 'super_admin':
                    # No-op: keep user_company as resolved above
                    pass
            
            logger.info(f"Processing {tool_type} file upload from {request.user.email} ({user_company})")
            
            # Reset file position to ensure clean read
            file.seek(0)
            
            # Detect file type if not provided
            if not tool_type:
                tool_type = get_file_type(file)
                file.seek(0)  # Reset after type detection
            
            # Route to appropriate processor - DYNAMIC LOOKUP
            print(f"Available processors BEFORE lookup: {list(processor_map.keys())}")
            print(f"Requested tool type: '{tool_type}'")
            logger.info(f"Available processors: {list(processor_map.keys())}")
            logger.info(f"Requested tool type: '{tool_type}'")
            
            # Get processor function with dynamic import fallback for GSuite
            processor_function = processor_map.get(tool_type)
            print(f"Initial processor lookup result: {processor_function}")
            
            # Special handling for GSuite - dynamic import if not in map
            if not processor_function and tool_type == 'gsuite':
                print("GSuite not found in processor_map, attempting dynamic import...")
                try:
                    from ..gsuite.processor import process_gsuite_excel
                    processor_function = process_gsuite_excel
                    processor_map['gsuite'] = process_gsuite_excel  # Add to map for future use
                    print(f"SUCCESS: GSuite processor imported dynamically: {processor_function}")
                    logger.info(f"GSuite processor imported dynamically")
                except ImportError as e:
                    print(f"FAILED: GSuite processor import error: {e}")
                    logger.error(f"Failed to import GSuite processor: {e}")
            
            print(f"Final processor_function: {processor_function}")
            print(f"Available processors AFTER dynamic import: {list(processor_map.keys())}")
            
            if not processor_function:
                print(f"ERROR: No processor found for tool_type='{tool_type}', available: {list(processor_map.keys())}")
                print(f"ERROR: processor_map contents: {processor_map}")
                print(f"ERROR: tool_type type: {type(tool_type)}, repr: {repr(tool_type)}")
                logger.error(f"No processor found for tool_type='{tool_type}', available: {list(processor_map.keys())}")
                logger.error(f"processor_map contents: {processor_map}")
                
                # Enhanced error message with debugging info
                error_details = {
                    'success': False,
                    'message': f'Unsupported tool type: {tool_type}',
                    'supported_types': list(processor_map.keys()),
                    'available_processors': len(processor_map),
                    'debug_info': {
                        'gsuite_in_map': 'gsuite' in processor_map,
                        'requested_type': tool_type,
                        'processor_map_keys': list(processor_map.keys()),
                        'processor_map_values': {k: str(v) for k, v in processor_map.items()},
                        'endpoint_used': 'UniversalUploadView',
                        'tool_type_repr': repr(tool_type),
                        'tool_type_type': str(type(tool_type))
                    }
                }
                
                # If GSuite specifically failed, add more debugging
                if tool_type == 'gsuite':
                    error_details['debug_info']['gsuite_import_attempted'] = True
                    try:
                        from ..gsuite.processor import process_gsuite_excel
                        error_details['debug_info']['gsuite_import_successful'] = True
                        error_details['debug_info']['gsuite_function'] = str(process_gsuite_excel)
                    except Exception as e:
                        error_details['debug_info']['gsuite_import_error'] = str(e)
                
                return Response(error_details, status=status.HTTP_400_BAD_REQUEST)
            
            # Enhanced file validation
            validation_result = validate_file_content(file, tool_type)
            if not validation_result['valid']:
                return Response({
                    'success': False,
                    'message': validation_result['error'],
                    'error_code': validation_result.get('error_code', 'VALIDATION_ERROR')
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Calculate file hash for duplicate detection
            file.seek(0)
            file_content = file.read()
            file_hash = calculate_file_hash(file_content)
            file.seek(0)
            
            # Check for duplicates
            enable_duplicate_check = True  # Duplicate detection enabled
            
            if enable_duplicate_check:
                duplicate_check = check_duplicate_file(file_hash, user_company, tool_type, request.user)
                if duplicate_check['is_duplicate']:
                    existing = duplicate_check['existing_upload']
                    return Response({
                        'success': False,
                        'message': 'Duplicate file detected',
                        'error_code': 'DUPLICATE_FILE',
                        'duplicate_info': {
                            'existing_file': existing['file_name'],
                            'uploaded_by': existing['uploaded_by'],
                            'uploaded_at': existing['uploaded_at'],
                            'is_currently_active': existing['is_active'],
                            'record_count': existing['record_count']
                        },
                        'suggestion': f"This exact file was already uploaded by {existing['uploaded_by']} on {existing['uploaded_at'][:10]}. Consider using the existing data or upload a different file."
                    }, status=status.HTTP_409_CONFLICT)
            else:
                logger.info(f"Duplicate detection disabled - allowing upload of file with hash {file_hash[:8]}...")

            # Process the file using the correct processor
            with transaction.atomic():
                logger.info(f"Using {tool_type} processor for file processing")
                processed_result = processor_function(file)
                
                if 'error' in processed_result:
                    logger.error(f"{tool_type} processing failed: {processed_result['error']}")
                    return Response({
                        'success': False,
                        'message': processed_result['error']
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Clean data for JSON serialization
                cleaned_result = clean_data_for_json(processed_result)
                
                # Test JSON serialization before saving
                try:
                    json.dumps(cleaned_result)
                    logger.info(f"JSON serialization test passed for {tool_type}")
                except Exception as json_error:
                    logger.error(f"JSON serialization failed for {tool_type}: {str(json_error)}")
                    return Response({
                        'success': False,
                        'message': f'Data processing error: {str(json_error)}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Save to database with enhanced metadata
                upload = SecurityDataUpload.objects.create(
                    tool_type=tool_type,
                    file_name=file.name,
                    file_size=file.size,
                    file_hash=file_hash,  # Store file hash
                    uploaded_by=request.user,
                    company_name=user_company,
                    processed_data=cleaned_result,
                    sheet_names=cleaned_result.get('rawSheetNames', []),
                    status='completed',
                    processed_at=timezone.now(),
                    is_public_to_company=False,
                    record_count=len(cleaned_result.get('data', [])) if isinstance(cleaned_result.get('data'), list) else 0
                )
                
                # Auto-activate if requested (default for admin uploads)
                if auto_activate and (request.user.role in ['admin', 'master_admin', 'super_admin']):
                    upload.activate(request.user)
                    
                    # Notify all company users about new active data
                    self._notify_company_users(upload, 'data_activated')
                
                # Log the upload
                DataAccessLog.objects.create(
                    upload=upload,
                    user=request.user,
                    access_type='view'
                )
                
                logger.info(f"Successfully saved {tool_type} data for {user_company}")
                
                return Response({
                    'success': True,
                    'message': 'File processed and saved successfully',
                    'data': {
                        'upload_id': upload.id,
                        'tool_type': upload.tool_type,
                        'file_name': upload.file_name,
                        'file_size': upload.file_size,
                        'record_count': upload.record_count,
                        'is_active': upload.is_active,
                        'processed_data': cleaned_result,
                        'uploaded_at': upload.uploaded_at.isoformat(),
                        'company_name': user_company,
                        'uploaded_by': {
                            'name': f"{request.user.first_name} {request.user.last_name}",
                            'email': request.user.email
                        }
                    }
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Upload error: {str(e)}")
            return Response({
                'success': False,
                'message': f'Upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _notify_company_users(self, upload, notification_type):
        """Notify all company users about data changes"""
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Get all users from the same company
            company_users = User.objects.filter(
                company_name=upload.company_name
            ).exclude(id=upload.uploaded_by.id)
            
            # Add is_email_verified filter only if the field exists
            if hasattr(User, 'is_email_verified'):
                company_users = company_users.filter(is_email_verified=True)
            
            notifications = []
            for user in company_users:
                notifications.append(DataNotification(
                    recipient=user,
                    notification_type=notification_type,
                    title=f"New {upload.tool_type.upper()} Data Available",
                    message=f"{upload.uploaded_by.first_name} {upload.uploaded_by.last_name} uploaded new {upload.tool_type} data",
                    upload=upload
                ))
            
            if notifications:
                DataNotification.objects.bulk_create(notifications)
                logger.info(f"Created {len(notifications)} notifications for company users")
        except Exception as e:
            logger.warning(f"Failed to create notifications: {str(e)}")

class ActiveDataView(APIView):
    """Get all active datasets for the user's company"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Resolve the effective company scope for this request
            resolved_company = getattr(request.user, 'company_name', 'default_company') or 'default_company'
            user_role = getattr(request.user, 'role', 'general')

            # Optional target company via query parameter
            target_company = request.GET.get('company', '').strip()

            if target_company:
                # Only super_admin can freely target any company; admins only their own
                if user_role == 'super_admin':
                    resolved_company = target_company
                elif user_role == 'admin' and target_company == resolved_company:
                    resolved_company = target_company
                else:
                    return Response({
                        'success': False,
                        'message': 'Not authorized to view data for the requested company'
                    }, status=status.HTTP_403_FORBIDDEN)
            else:
                # Guard: even super_admins default to their own company unless explicitly requested
                resolved_company = resolved_company
            
            # Get all active datasets for the selected company (no public/private concept)
            active_uploads = SecurityDataUpload.objects.filter(
                company_name=resolved_company,
                is_active=True,
                status='active'
            )
            
            # Build response data
            active_data = {}
            for upload in active_uploads:
                # Log access
                DataAccessLog.objects.create(
                    upload=upload,
                    user=request.user,
                    access_type='view'
                )
                
                # Clean GSuite whitelist data before sending to frontend
                processed_data = upload.processed_data
                if upload.tool_type == 'gsuite':
                    processed_data = clean_gsuite_whitelist_data(processed_data)
                
                active_data[upload.tool_type] = {
                    'upload_id': upload.id,
                    'data': processed_data,
                    'file_name': upload.file_name,
                    'uploaded_by': {
                        'name': f"{upload.uploaded_by.first_name} {upload.uploaded_by.last_name}",
                        'email': upload.uploaded_by.email
                    },
                    'uploaded_at': upload.uploaded_at.isoformat(),
                    'activated_at': upload.activated_at.isoformat() if upload.activated_at else None,
                    'activated_by': {
                        'name': f"{upload.activated_by.first_name} {upload.activated_by.last_name}",
                        'email': upload.activated_by.email
                    } if upload.activated_by else None
                }
            
            return Response({
                'success': True,
                'message': f'Active data for {resolved_company}',
                'data': active_data,
                'company_name': resolved_company,
                'total_active_tools': len(active_data)
            })
            
        except Exception as e:
            logger.error(f"Error fetching active data: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to fetch active data'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FilteredDataView(APIView):
    """Get filtered and aggregated data based on time range and other criteria"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            from ..services.data_filter_service import DataFilterService
            
            user_company = getattr(request.user, 'company_name', 'default_company')
            if not user_company:
                user_company = 'default_company'
            
            # Get filter parameters from request
            filters = request.data.get('filters', {})
            tool_types = request.data.get('tool_types', [])  # Specific tools to filter
            
            # Get active datasets for the user's company (no public/private concept)
            active_uploads = SecurityDataUpload.objects.filter(
                company_name=user_company,
                is_active=True,
                status='active'
            )
            
            if tool_types:
                active_uploads = active_uploads.filter(tool_type__in=tool_types)
            
            # Build raw data
            raw_data = {}
            for upload in active_uploads:
                # Log access
                DataAccessLog.objects.create(
                    upload=upload,
                    user=request.user,
                    access_type='analyze'
                )
                
                # Clean GSuite whitelist data before filtering
                processed_data = upload.processed_data
                if upload.tool_type == 'gsuite':
                    processed_data = clean_gsuite_whitelist_data(processed_data)
                
                raw_data[upload.tool_type] = processed_data
            
            if not raw_data:
                return Response({
                    'success': True,
                    'message': 'No active data found for filtering',
                    'data': {},
                    'summary': {
                        'total_records': 0,
                        'data_sources': [],
                        'filters_applied': filters
                    }
                })
            
            # Apply filters
            filtered_data = DataFilterService.apply_filters(raw_data, filters)
            
            # Generate summary
            summary = DataFilterService.get_data_summary(filtered_data)
            summary['filters_applied'] = filters
            summary['company_name'] = user_company
            
            logger.info(f"Filtered data request for {user_company}: {len(filtered_data)} tools, {summary['total_records']} records")
            
            return Response({
                'success': True,
                'message': f'Filtered data for {user_company}',
                'data': filtered_data,
                'summary': summary
            })
            
        except Exception as e:
            logger.error(f"Error filtering data: {str(e)}")
            return Response({
                'success': False,
                'message': f'Failed to filter data: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DataManagementView(APIView):
    """Manage datasets - activate, deactivate, delete"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Activate a dataset"""
        try:
            upload_id = request.data.get('upload_id')
            action = request.data.get('action')  # 'activate', 'deactivate', 'delete'
            
            if not upload_id or not action:
                return Response({
                    'success': False,
                    'message': 'upload_id and action are required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user has permission (admin only)
            if request.user.role not in ['admin', 'master_admin', 'super_admin']:
                return Response({
                    'success': False,
                    'message': 'Admin privileges required'
                }, status=status.HTTP_403_FORBIDDEN)
            
            try:
                # Super admins can manage datasets across all companies
                user_role = getattr(request.user, 'role', 'user')
                if user_role == 'super_admin':
                    upload = SecurityDataUpload.objects.get(id=upload_id)
                else:
                    upload = SecurityDataUpload.objects.get(
                        id=upload_id,
                        company_name=request.user.company_name
                    )
            except SecurityDataUpload.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Dataset not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            if action == 'activate':
                upload.activate(request.user)
                self._notify_company_users(upload, 'data_activated')
                message = f'{upload.tool_type} dataset activated successfully'
                
            elif action == 'deactivate':
                upload.is_active = False
                upload.save()
                message = f'{upload.tool_type} dataset deactivated successfully'
                
            elif action == 'delete':
                tool_type = upload.tool_type
                upload.delete()
                message = f'{tool_type} dataset deleted successfully'
            
            else:
                return Response({
                    'success': False,
                    'message': 'Invalid action'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'success': True,
                'message': message
            })
            
        except Exception as e:
            logger.error(f"Data management error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Operation failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _notify_company_users(self, upload, notification_type):
        """Same as UniversalUploadView._notify_company_users"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        company_users = User.objects.filter(
            company_name=upload.company_name
        ).exclude(id=upload.uploaded_by.id)
        
        # Add is_email_verified filter only if the field exists
        if hasattr(User, 'is_email_verified'):
            company_users = company_users.filter(is_email_verified=True)
        
        notifications = []
        for user in company_users:
            notifications.append(DataNotification(
                recipient=user,
                notification_type=notification_type,
                title=f"{upload.tool_type.upper()} Data Updated",
                message=f"Data has been updated by {upload.uploaded_by.first_name} {upload.uploaded_by.last_name}",
                upload=upload
            ))
        
        if notifications:
            DataNotification.objects.bulk_create(notifications)


class NotificationView(APIView):
    """Get user notifications - FIXED VERSION"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get all notifications for user (don't slice here)
            all_notifications = DataNotification.objects.filter(
                recipient=request.user
            ).order_by('-created_at')
            
            # Calculate unread count BEFORE slicing
            unread_count = all_notifications.filter(is_read=False).count()
            
            # Now slice for the response (take first 20)
            notifications = all_notifications[:20]
            
            return Response({
                'success': True,
                'notifications': [{
                    'id': n.id,
                    'type': n.notification_type,
                    'title': n.title,
                    'message': n.message,
                    'created_at': n.created_at.isoformat(),
                    'is_read': n.is_read,
                    'upload_id': n.upload.id if n.upload else None
                } for n in notifications],
                'unread_count': unread_count
            })
        except Exception as e:
            logger.error(f"Error fetching notifications: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to fetch notifications'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request):
        """Mark notification as read"""
        notification_id = request.data.get('notification_id')
        try:
            notification = DataNotification.objects.get(
                id=notification_id,
                recipient=request.user
            )
            notification.mark_as_read()
            return Response({'success': True})
        except DataNotification.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)


class ToolSpecificUploadView(APIView):
    """Tool-specific upload endpoint for forced processing"""
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, tool_type=None, *args, **kwargs):
        # ✅ Fix: Get tool_type from URL kwargs if not in parameters
        if tool_type is None:
            tool_type = kwargs.get('tool_type')
        
        # Check admin permission
        if not check_admin_permission(request.user):
            return Response({
                'success': False, 
                'error': 'Admin privileges required for file uploads',
                'user_role': getattr(request.user, 'role', 'unknown')
            }, status=status.HTTP_403_FORBIDDEN)
        
        logger.info(f"Tool-specific upload authorized for user: {request.user.email} (Role: {request.user.role})")
        
        try:
            uploaded_file = request.FILES.get("file")
            
            # Validate file
            validate_excel_file(uploaded_file)

            # Route to appropriate processor using the universal upload logic
            universal_view = UniversalUploadView()
            request.data = request.data.copy()
            request.data['tool_type'] = tool_type
            
            return universal_view.post(request)

        except ValueError as ve:
            logger.error(f"Validation error for {tool_type}: {str(ve)}")
            return Response(
                {"error": str(ve)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error processing {tool_type} file: {str(e)}")
            return Response(
                {"error": f"Error processing file: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FileTypeDetectionView(APIView):
    """Enhanced file type detection with support for all tools including EDR"""
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        try:
            uploaded_file = request.FILES.get("file")
            
            # Validate file
            validate_excel_file(uploaded_file)

            file_type = get_file_type(uploaded_file)
            
            # Get sheet names for debugging
            try:
                excel_data = pd.ExcelFile(uploaded_file)
                sheet_names = excel_data.sheet_names
                
                # Get basic file analysis
                sheet_analysis = {}
                for sheet in sheet_names[:5]:  # Analyze first 5 sheets
                    try:
                        df = pd.read_excel(uploaded_file, sheet_name=sheet, nrows=0)
                        sheet_analysis[sheet] = {
                            "columns": list(df.columns),
                            "columnCount": len(df.columns)
                        }
                    except Exception as se:
                        sheet_analysis[sheet] = {"error": str(se)}
                        
            except Exception as e:
                sheet_names = []
                sheet_analysis = {"error": str(e)}
            
            return Response({
                "fileType": file_type,
                "fileName": uploaded_file.name,
                "fileSize": uploaded_file.size,
                "fileSizeMB": round(uploaded_file.size / (1024*1024), 2),
                "sheetNames": sheet_names,
                "sheetCount": len(sheet_names),
                "sheetAnalysis": sheet_analysis,
                "supportedTypes": ["gsuite", "mdm", "siem", "edr", "meraki", "sonicwall"],
                "confidence": self._get_detection_confidence(file_type, sheet_names)
            }, status=status.HTTP_200_OK)

        except ValueError as ve:
            logger.error(f"Validation error in file type detection: {str(ve)}")
            return Response(
                {"error": str(ve)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error detecting file type: {str(e)}")
            return Response(
                {"error": f"Error detecting file type: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_detection_confidence(self, file_type, sheet_names):
        """Calculate confidence level for file type detection"""
        if file_type == 'unknown':
            return 0
        
        sheet_names_lower = [name.lower() for name in sheet_names]
        
        # EDR confidence scoring
        if file_type == 'edr':
            edr_sheets = ['endpoints', 'detailed status', 'threats']
            matches = sum(1 for sheet in edr_sheets if sheet in sheet_names_lower)
            return (matches / len(edr_sheets)) * 100
        
        # Basic confidence for other types
        confidence_keywords = {
            'gsuite': ['admin', 'user', 'accounts', 'organizational', 'security'],
            'mdm': ['mdm', 'device', 'mobile', 'wipe', 'compliance'],
            'siem': ['events', 'alerts', 'incidents', 'logs', 'security'],
            'meraki': ['network', 'access points', 'wireless', 'clients'],
            'sonicwall': ['firewall', 'vpn', 'gateway', 'intrusion']
        }
        
        keywords = confidence_keywords.get(file_type, [])
        if not keywords:
            return 50  # Default confidence
        
        matches = sum(1 for keyword in keywords 
                     if any(keyword in sheet.lower() for sheet in sheet_names))
        
        return min((matches / len(keywords)) * 100, 100)


class FileDebugView(FileAnalysisView):
    """Debug view to analyze file contents and sheet names"""
    
    def post(self, request, *args, **kwargs):
        try:
            uploaded_file = request.FILES.get("file")
            
            # Validate file
            validate_excel_file(uploaded_file)

            debug_info = self.analyze_file_contents(uploaded_file)
            
            # Add duplicate detection debug info
            uploaded_file.seek(0)
            file_content = uploaded_file.read()
            file_hash = calculate_file_hash(file_content)
            uploaded_file.seek(0)
            
            debug_info['duplicateCheck'] = {
                'file_hash': file_hash,
                'hash_length': len(file_hash),
                'existing_uploads_count': SecurityDataUpload.objects.count(),
                'existing_hashes': list(SecurityDataUpload.objects.values_list('file_hash', flat=True)[:5])
            }
            
            # Add EDR-specific analysis
            debug_info['edrAnalysis'] = self._analyze_edr_structure(uploaded_file)
            
            return Response(debug_info, status=status.HTTP_200_OK)

        except ValueError as ve:
            logger.error(f"Validation error in file debug: {str(ve)}")
            return Response(
                {"error": str(ve)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error analyzing file: {str(e)}")
            return Response(
                {"error": f"Error analyzing file: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _analyze_edr_structure(self, uploaded_file):
        """Analyze EDR-specific file structure"""
        try:
            excel_data = pd.ExcelFile(uploaded_file)
            edr_analysis = {
                "hasEndpointsSheet": "Endpoints" in excel_data.sheet_names,
                "hasDetailedStatusSheet": "Detailed Status" in excel_data.sheet_names,
                "hasThreatsSheet": "Threats" in excel_data.sheet_names,
                "edrScore": 0,
                "sheetMatches": []
            }
            
            # Check for EDR sheets and analyze structure
            expected_sheets = {
                "Endpoints": ["Endpoint", "Name", "Last Logged In User", "Serial Number", "OS", "Network Status"],
                "Detailed Status": ["Endpoint Name", "Status", "Detailed Status"],
                "Threats": ["Status", "Threat Details", "Confidence Level", "Endpoints", "Incident Status"]
            }
            
            for sheet_name, expected_columns in expected_sheets.items():
                if sheet_name in excel_data.sheet_names:
                    try:
                        df = pd.read_excel(uploaded_file, sheet_name=sheet_name, nrows=0)
                        actual_columns = list(df.columns)
                        
                        matches = sum(1 for col in expected_columns 
                                    if any(col.lower() in actual_col.lower() for actual_col in actual_columns))
                        
                        match_percentage = (matches / len(expected_columns)) * 100
                        
                        edr_analysis["sheetMatches"].append({
                            "sheetName": sheet_name,
                            "expectedColumns": expected_columns,
                            "actualColumns": actual_columns,
                            "matchedColumns": matches,
                            "matchPercentage": match_percentage
                        })
                        
                        edr_analysis["edrScore"] += match_percentage / len(expected_sheets)
                        
                    except Exception as se:
                        edr_analysis["sheetMatches"].append({
                            "sheetName": sheet_name,
                            "error": str(se)
                        })
            
            return edr_analysis
            
        except Exception as e:
            return {"error": f"Error analyzing EDR structure: {str(e)}"}


class HealthCheckView(APIView):
    """Enhanced health check with all endpoints including EDR"""
    
    def get(self, request, *args, **kwargs):
        return Response({
            "status": "healthy",
            "message": "Enhanced multi-tool processing backend is running with EDR support",
            "version": "2.0.0",
            "supportedTools": ["gsuite", "mdm", "siem", "edr", "meraki", "sonicwall"],
            "newFeatures": [
                "EDR (Endpoint Detection and Response) support",
                "Enhanced file type detection", 
                "Improved analytics and KPIs",
                "Security scoring and recommendations"
            ],
            "endpoints": {
                "universal_upload": "/api/universal/upload/",
                "gsuite_upload": "/api/gsuite/upload/",
                "mdm_upload": "/api/mdm/upload/",
                "siem_upload": "/api/siem/upload/",
                "edr_upload": "/api/edr/upload/",
                "meraki_upload": "/api/meraki/upload/",
                "sonicwall_upload": "/api/sonicwall/upload/",
                "tool_specific_upload": "/api/tool/{tool_type}/upload/",
                "file_type_detection": "/api/detect-type/",
                "file_debug": "/api/debug/",
                "health_check": "/api/health/"
            },
            "edrCapabilities": {
                "supportedSheets": ["Endpoints", "Detailed Status", "Threats"],
                "endpointMetrics": [
                    "Total endpoints", "Connected/Disconnected status", 
                    "Update compliance", "Network status", "OS distribution"
                ],
                "threatAnalytics": [
                    "Threat classification", "Confidence levels", "Resolution rates",
                    "Temporal analysis", "Action tracking"
                ],
                "securityScoring": [
                    "Endpoint availability scoring", "Update compliance scoring",
                    "Threat response efficiency", "Security recommendations"
                ]
            }
        }, status=status.HTTP_200_OK)


class ServiceChatbotView(APIView):
    """
    AI-powered chatbot integrated into universal views for better URL resolution
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if AI_SERVICE_AVAILABLE:
            self.ai_service = SecureAIService()
        else:
            self.ai_service = None

    def post(self, request):
        """Process chatbot queries with full application context and save to database"""
        if not AI_SERVICE_AVAILABLE:
            return Response({
                'error': 'AI service is currently unavailable. Please try again later.'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        start_time = time.time()
        session_id = None
        
        try:
            query = request.data.get('query', '').strip()
            session_id = request.data.get('session_id', str(uuid.uuid4()))
            
            if not query:
                return Response({
                    'error': 'Query is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            user = request.user
            company_name = getattr(user, 'company_name', 'Default Company')
            
            # Get or create conversation
            conversation = self._get_or_create_conversation(user, company_name, session_id, query)
            
            # Save user message
            user_message = ChatMessage.objects.create(
                conversation=conversation,
                message_type='user',
                content=query
            )
            
            # Get application context for the AI response
            context = self._get_application_context(company_name, user)
            
            # Generate AI response using the secure AI service
            ai_response = self.ai_service.generate_contextual_response(query, context)
            
            processing_time = time.time() - start_time
            
            # Save bot message with metadata
            bot_message = ChatMessage.objects.create(
                conversation=conversation,
                message_type='bot',
                content=ai_response,
                app_context_used=context,
                ai_model_used='gemini-1.5-flash',
                processing_time=processing_time
            )
            
            # Update conversation timestamp
            conversation.save()  # This will update the updated_at field
            
            return Response({
                'query': query,
                'response': ai_response,
                'session_id': session_id,
                'processing_time': round(processing_time, 2),
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Service chatbot error: {str(e)}")
            return Response({
                'error': 'I apologize, but I encountered a technical issue. Please try again or rephrase your question.',
                'session_id': session_id or str(uuid.uuid4()),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _get_or_create_conversation(self, user, company_name, session_id, query):
        """Get or create a conversation for the session"""
        conversation, created = ChatConversation.objects.get_or_create(
            user=user,
            company_name=company_name,
            session_id=session_id,
            defaults={
                'title': self._generate_conversation_title(query)
            }
        )
        return conversation

    def _generate_conversation_title(self, query):
        """Generate a conversation title from the first user message"""
        # Take first 50 characters and clean it up
        title = query[:50].strip()
        if len(query) > 50:
            title += "..."
        return title or "New Conversation"

    def _get_application_context(self, company_name, user):
        """Get complete application context for AI responses"""
        from ..models import SecurityDataUpload, AnomalyModel, AnomalyDetection
        from authentication.models import User
        
        context = {
            'user': {
                'name': user.username,
                'role': getattr(user, 'role', 'User'),
                'company': company_name,
                'is_admin': user.is_superuser
            },
            'security_tools': {},
            'ml_models': {},
            'recent_anomalies': [],
            'system_stats': {},
            'user_context': {
                'mfa_enabled': getattr(user, 'is_phone_verified', False)
            }
        }
        
        # Security tools context
        tools = ['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall']
        for tool in tools:
            upload = SecurityDataUpload.objects.filter(
                company_name=company_name,
                tool_type=tool,
                is_active=True
            ).first()
            
            context['security_tools'][tool] = {
                'active': upload is not None,
                'records': upload.record_count if upload else 0,
                'last_updated': upload.processed_at.isoformat() if upload and upload.processed_at else None
            }
        
        # ML models context
        models = AnomalyModel.objects.filter(company_name=company_name, is_active=True)
        for model in models:
            context['ml_models'][model.tool_type] = {
                'algorithm': model.algorithm,
                'features': len(model.feature_columns),
                'training_size': model.training_data_size,
                'trained_at': model.trained_at.isoformat() if model.trained_at else None
            }
        
        # Recent anomalies context
        recent_anomalies = AnomalyDetection.objects.filter(
            company_name=company_name
        ).order_by('-created_at')[:5]
        
        for anomaly in recent_anomalies:
            context['recent_anomalies'].append({
                'tool': anomaly.upload.tool_type,
                'severity': anomaly.severity,
                'date': anomaly.anomaly_date.isoformat(),
                'score': float(anomaly.anomaly_score)
            })
        
        # System stats
        context['system_stats'] = {
            'total_users': User.objects.filter(company_name=company_name).count(),
            'total_uploads': SecurityDataUpload.objects.filter(company_name=company_name).count(),
            'total_anomalies': AnomalyDetection.objects.filter(company_name=company_name).count(),
            'active_models': models.count()
        }
        
        return context
