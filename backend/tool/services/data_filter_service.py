# backend/tool/services/data_filter_service.py
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import pandas as pd
import json
import logging
try:
    from django.utils import timezone
except ImportError:
    # Fallback for non-Django environments
    from datetime import timezone as timezone_fallback
    
    class timezone:
        @staticmethod
        def make_aware(dt):
            return dt.replace(tzinfo=timezone_fallback.utc) if dt.tzinfo is None else dt
        
        @staticmethod
        def now():
            return datetime.now(timezone_fallback.utc)

logger = logging.getLogger(__name__)

class DataFilterService:
    """Service for filtering and aggregating security data based on time ranges and other criteria"""
    
    @staticmethod
    def parse_date_range(time_range: str, custom_from: str = None, custom_to: str = None) -> Tuple[datetime, datetime]:
        """Parse time range string into datetime objects"""
        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if time_range == 'today':
            from_date = today
            to_date = now
        elif time_range == 'week':
            from_date = today - timedelta(days=7)
            to_date = now
        elif time_range == 'month':
            from_date = today - timedelta(days=30)
            to_date = now
        elif time_range == 'quarter':
            from_date = today - timedelta(days=90)
            to_date = now
        elif time_range == 'year':
            from_date = today - timedelta(days=365)
            to_date = now
        elif time_range == 'custom' and custom_from and custom_to:
            try:
                from_date = datetime.fromisoformat(custom_from.replace('Z', '+00:00'))
                to_date = datetime.fromisoformat(custom_to.replace('Z', '+00:00'))
                if from_date.tzinfo is None:
                    from_date = timezone.make_aware(from_date)
                if to_date.tzinfo is None:
                    to_date = timezone.make_aware(to_date)
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid custom date format: {e}")
                from_date = today - timedelta(days=30)
                to_date = now
        else:
            # Default to last month
            from_date = today - timedelta(days=30)
            to_date = now
            
        return from_date, to_date
    
    @staticmethod
    def filter_data_by_date(data: Dict[str, Any], from_date: datetime, to_date: datetime) -> Dict[str, Any]:
        """Filter data based on date range - FIXED: Only include items with valid dates in range"""
        if not data or not isinstance(data, dict):
            return data
        
        # Ensure from_date and to_date are timezone-aware to match extracted dates
        if from_date.tzinfo is None:
            from_date = timezone.make_aware(from_date)
        if to_date.tzinfo is None:
            to_date = timezone.make_aware(to_date)
        
        # Log filtering parameters for debugging
        logger.debug(f"Filtering data by date range: {from_date} to {to_date}")
        logger.debug(f"Data keys: {list(data.keys())}")
            
        filtered_data = {}
        
        for key, value in data.items():
            if isinstance(value, list):
                # Filter list items that have date fields and deduplicate
                filtered_items = []
                seen_records = set()  # For deduplication
                
                # DEBUG: Log threats data specifically
                if key == 'threats':
                    logger.info(f"🔍 EDR Threats Debug - Processing {len(value)} threats")
                    if value:
                        sample_threat = value[0]
                        logger.info(f"🔍 EDR Threats Debug - Sample threat keys: {list(sample_threat.keys()) if isinstance(sample_threat, dict) else 'Not a dict'}")
                
                for item in value:
                    if isinstance(item, dict):
                        # DEBUG: Log threat processing
                        if key == 'threats':
                            threat_date_fields = []
                            for field_name, field_value in item.items():
                                if any(keyword in field_name.lower() for keyword in ['date', 'time', 'reported', 'identifying']):
                                    if field_value:
                                        threat_date_fields.append(f"{field_name}:{field_value}")
                            if threat_date_fields:
                                logger.info(f"🔍 EDR Threat Debug - Date fields: {'; '.join(threat_date_fields[:2])}")
                        
                        # normalize all date-like fields before checking - EXPANDED FOR ALL TOOLS
                        all_date_fields = [
                            # GSuite fields
                            "Date", "date", "Date Reported", "date reported", 
                            "Timestamp", "Created", "Created At", "Report Date",
                            "Request Date", "Investigation Date", "Scan Date",
                            
                            # MDM fields
                            "Last Seen", "last seen", "LastSeen", "Last_Seen",
                            "Enrollment Date", "enrollment date", "Enrollment_Date",
                            "Compliance Date", "compliance date", "Compliance_Date",
                            "Wipe Date", "wipe date", "Wipe_Date",
                            
                            # SIEM fields
                            "Date", "date", "Date_Alt", "Date_Time",
                            "Alert Date", "alert date", "Alert_Date",
                            "Event Date", "event date", "Event_Date",
                            "Incident Date", "incident date", "Incident_Date",
                            "Detection Date", "detection date", "Detection_Date",
                            
                            # EDR fields
                            "Date", "date", "extracted_date",
                            "reported_time", "Reported Time", "Reported Time (UTC)",  # Threat dates
                            "identifying_time", "Identifying Time", "Identifying Time (UTC)",  # Threat dates
                            "detected_time", "Detection Time", "Detected Time",  # Threat dates
                            "Scan Status Date", "scan_status_date", "scan status date",
                            "Scan Date", "scan_date", "scan date", 
                            "subscribed_on", "Subscribed On", "subscribed on",
                            "endpoint_date", "Endpoint Date", "endpoint date",
                            "last_scan", "Last Scan", "last scan",
                            "last_update", "Last Update", "last update"
                        ]
                        for field in all_date_fields:
                            if field in item and item[field]:
                                item[field] = DataFilterService.normalize_date_to_iso(item[field])

                        item_date = DataFilterService._extract_date_from_item(item)
                        if item_date and from_date <= item_date <= to_date:
                            # TEMPORARY FIX: Disable deduplication for EDR threats to debug the issue
                            # Check if this is EDR threat data
                            is_edr_threat = any(field in item for field in ['threat_details', 'Threat Details', 'reported_time', 'identifying_time'])
                            
                            if is_edr_threat:
                                # For EDR threats, skip deduplication entirely
                                filtered_items.append(item)
                            else:
                                # For other data types, use normal deduplication
                                signature = DataFilterService._create_record_signature(item)
                                if signature not in seen_records:
                                    filtered_items.append(item)
                                    seen_records.add(signature)
                    else:
                        # For non-dict items in lists, include them (they might be primitives)
                        filtered_items.append(item)
                filtered_data[key] = filtered_items
            elif isinstance(value, dict):
                # Recursively filter nested dictionaries
                nested_filtered = DataFilterService.filter_data_by_date(value, from_date, to_date)
                # Only include nested dicts that have content after filtering
                if nested_filtered:
                    filtered_data[key] = nested_filtered
            else:
                # Keep non-list, non-dict values as is (KPIs, summary stats, etc.)
                filtered_data[key] = value
        
        # Recalculate KPIs if this looks like tool data with details
        if 'details' in filtered_data and 'kpis' in filtered_data:
            try:
                # Determine tool type from data structure
                details = filtered_data.get('details', {})
                
                # Check for MDM-specific structure
                if any(key in details for key in ['allUsers', 'nonCompliant', 'noPass', 'notEncrypted']):
                    mdm_kpis = DataFilterService._recalculate_mdm_kpis(details)
                    filtered_data['kpis'].update(mdm_kpis)
                
                # Check for EDR-specific structure  
                elif any(key in details for key in ['endpoints', 'threats']):
                    edr_kpis = DataFilterService._recalculate_edr_kpis(details)
                    filtered_data['kpis'].update(edr_kpis)
                
                # Check for GSuite-specific structure
                elif any(key in details for key in ['phishing', 'malware', 'client_investigations']):
                    gsuite_kpis = DataFilterService._recalculate_gsuite_kpis(details)
                    filtered_data['kpis'].update(gsuite_kpis)
                
                # Check for Meraki-specific structure
                elif any(key in details for key in ['Top SSIDs by usage', 'Top applications']):
                    meraki_kpis = DataFilterService._recalculate_meraki_kpis(details)
                    filtered_data['kpis'].update(meraki_kpis)
                    
            except Exception as e:
                logger.warning(f"Failed to recalculate KPIs after filtering: {str(e)}")
                
        return filtered_data
    
    @staticmethod
    def _extract_date_from_item(item: Dict[str, Any]) -> Optional[datetime]:
        """Extract date from data item, checking common date field names - ENHANCED FOR GSUITE"""
        date_fields = [
            # GSuite-specific date fields (PRIORITY)
            'Date Reported', 'date reported', 'Date', 'date',
            
            # MDM-specific date fields (PRIORITY)
            'Last Seen', 'last seen', 'LastSeen', 'Last_Seen',
            'Enrollment Date', 'enrollment date', 'Enrollment_Date',
            'Compliance Date', 'compliance date', 'Compliance_Date',
            'Wipe Date', 'wipe date', 'Wipe_Date',
            
            # SIEM-specific date fields (PRIORITY) 
            'Date', 'date', 'Date_Alt', 'Date_Time',
            'Alert Date', 'alert date', 'Alert_Date',
            'Event Date', 'event date', 'Event_Date',
            'Incident Date', 'incident date', 'Incident_Date',
            'Detection Date', 'detection date', 'Detection_Date',
            
            # EDR-specific date fields (PRIORITY)
            'Date', 'date',  # The extracted Date column we create from Scan Status
            'reported_time', 'Reported Time', 'Reported Time (UTC)',  # Threat date fields
            'identifying_time', 'Identifying Time', 'Identifying Time (UTC)',  # Alternative threat dates
            'detected_time', 'Detection Time', 'Detected Time',  # Detection dates
            'Scan Status Date', 'scan_status_date', 'scan status date',
            'Scan Date', 'scan_date', 'scan date',
            'subscribed_on', 'Subscribed On', 'subscribed on',
            'extracted_date',  # The intermediate field we create
            'endpoint_date', 'Endpoint Date', 'endpoint date',
            'last_scan', 'Last Scan', 'last scan',
            'last_update', 'Last Update', 'last update',
            
            # IMPORTANT: Put Meraki's "Time" field next for priority matching
            'Time',  # Meraki's primary time field
            
            # Common date field names
            'timestamp', 'created_at', 'updated_at', 
            'event_date', 'log_date', 'scan_date', 'report_date',
            'Timestamp', 'Created At', 'Updated At',
            # Tool-specific date fields
            'Event Date', 'Log Date', 'Scan Date', 'Report Date',
            'event_time', 'log_time', 'alert_time', 'incident_time',
            'Event Time', 'Log Time', 'Alert Time', 'Incident Time',
            'datetime', 'date_time', 'DateTime', 'Date Time',
            # Additional common formats
            'time', 'occurred', 'Occurred', 'detected', 'Detected'
        ]
        
        for field in date_fields:
            if field in item and item[field] is not None:
                try:
                    date_value = item[field]
                    if isinstance(date_value, str) and date_value.strip():
                        # Try different date formats - Tool-specific formats FIRST
                        date_formats = [
                            # GSuite specific formats (PRIORITY)
                            '%b %d, %Y, %I:%M %p',          # "Apr 16, 2025, 02:28 PM" - Phishing data
                            '%b %d, %Y, %H:%M %p',          # "Apr 16, 2025, 2:28 PM" - Phishing data (single digit hour)
                            '%d-%m-%Y %I.%M.%S %p',         # "16-07-2025 8.44.00 AM" - Mail scanned data
                            '%d-%m-%Y %H.%M.%S',            # "16-07-2025 8.44.00" - Mail scanned data (24hr)
                            '%d-%m-%Y',                     # "04-02-2025" - Client investigations
                            
                            # MDM specific formats (PRIORITY)
                            '%d-%m-%Y %H.%M',               # "03-04-2025 14.26" - Last Seen format
                            '%d-%m-%Y %H:%M',               # "03-04-2025 14:26" - Last Seen format variant
                            '%Y-%m-%d %H:%M:%S',            # "2025-04-03 14:26:00" - Standard timestamp
                            '%d/%m/%Y %H:%M',               # "03/04/2025 14:26" - Alternative MDM format
                            '%d.%m.%Y %H:%M',               # "03.04.2025 14:26" - Dot separator format
                            
                            # SIEM specific formats (PRIORITY)
                            '%d-%m-%Y %H.%M',               # "03-04-2025 14.26" - SIEM data format from processor
                            '%Y-%m-%d %H:%M:%S',            # "2025-04-03 14:26:00" - Standard timestamp
                            '%d/%m/%Y %H:%M:%S',            # "03/04/2025 14:26:00" - Alternative format
                            
                            # EDR specific formats (PRIORITY) 
                            '%Y-%m-%d',                     # "2025-07-27" - Our normalized date format from Scan Status
                            '%b %d, %Y %I:%M:%S %p',        # "Aug 27, 2025 11:24:43 PM" - Original Scan Status format
                            '%B %d, %Y %I:%M:%S %p',        # "August 27, 2025 11:24:43 PM" - Full month name
                            '%d-%m-%Y %H.%M',               # "04-04-2025 12.39" - Subscribed On format
                            '%m/%d/%Y %I:%M:%S %p',         # "08/27/2025 11:24:43 PM" - US date format
                            
                            # Meraki specific formats
                            '%Y/%m/%d %H:%M:%S.%f +00:00',  # "2025/04/01 00:00:00.000000 +00:00"
                            '%Y/%m/%d %H:%M:%S.%f',         # "2025/04/01 00:00:00.000000"
                            '%Y/%m/%d %H:%M:%S',            # "2025/04/01 00:00:00"
                            '%Y/%m/%d',                     # "2025/04/01"
                            
                            # DD-MM-YYYY formats (common in SIEM data)
                            '%d-%m-%Y %H:%M:%S', '%d-%m-%Y %H.%M',
                            '%d/%m/%Y', '%d/%m/%Y %H:%M:%S', '%d/%m/%Y %H.%M',
                            '%d.%m.%Y', '%d.%m.%Y %H:%M:%S', '%d.%m.%Y %H.%M',
                            
                            # Standard ISO formats
                            '%Y-%m-%d', '%Y-%m-%dT%H:%M:%S',
                            '%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%dT%H:%M:%S.%f',
                            
                            # US formats (MM/DD/YYYY)
                            '%m/%d/%Y', '%m/%d/%Y %H:%M:%S', '%m-%d-%Y', '%m-%d-%Y %H:%M:%S',
                            
                            # Other common formats
                            '%B %d, %Y', '%b %d, %Y', '%d %B %Y', '%d %b %Y', 
                            '%Y%m%d', '%Y%m%d%H%M%S'
                        ]
                        
                        for fmt in date_formats:
                            try:
                                parsed_date = datetime.strptime(date_value.strip(), fmt)
                                return timezone.make_aware(parsed_date) if parsed_date.tzinfo is None else parsed_date
                            except ValueError:
                                continue
                        
                        # Try pandas to_datetime as fallback for complex formats
                        try:
                            import pandas as pd
                            parsed_date = pd.to_datetime(date_value).to_pydatetime()
                            return timezone.make_aware(parsed_date) if parsed_date.tzinfo is None else parsed_date
                        except:
                            pass
                            
                    elif isinstance(date_value, datetime):
                        return timezone.make_aware(date_value) if date_value.tzinfo is None else date_value
                    elif hasattr(date_value, 'to_pydatetime'):  # pandas Timestamp
                        return timezone.make_aware(date_value.to_pydatetime()) if date_value.to_pydatetime().tzinfo is None else date_value.to_pydatetime()
                except (ValueError, TypeError):
                    continue
                    
        return None
    
    @staticmethod
    def normalize_date_to_iso(value: Any) -> Optional[str]:
        """Normalize various GSuite/Excel date formats into ISO string for frontend."""
        if pd.isna(value) or value is None:
            return None

        # Handle pandas Timestamp objects directly
        if hasattr(value, 'isoformat'):
            try:
                return value.isoformat()
            except:
                pass

        # Handle datetime objects
        if isinstance(value, datetime):
            try:
                return value.isoformat()
            except:
                pass

        str_val = str(value).strip()
        
        # Skip if it's already an ISO format or timestamp string
        if 'T' in str_val or str_val.count('-') >= 2:
            try:
                dt = pd.to_datetime(str_val, errors='coerce')
                if not pd.isna(dt):
                    return dt.isoformat()
            except:
                pass

        # Try specific tool formats
        date_formats = [
            # GSuite formats
            "%b %d, %Y, %I:%M %p",    # Apr 16, 2025, 02:28 PM (Phishing data)
            "%b %d, %Y, %H:%M %p",    # Apr 16, 2025, 2:28 PM (Phishing data single digit)
            "%d-%m-%Y %I.%M.%S %p",   # 16-07-2025 8.44.00 AM (Mail scanned data)
            "%d-%m-%Y %H.%M.%S",      # 16-07-2025 8.44.00 (Mail scanned data 24hr)
            "%d-%m-%Y",               # 04-02-2025 (Client investigations)
            
            # MDM formats
            "%d-%m-%Y %H.%M",         # 03-04-2025 14.26 (Last Seen format)
            "%d-%m-%Y %H:%M",         # 03-04-2025 14:26 (Last Seen variant)
            "%d/%m/%Y %H:%M",         # 03/04/2025 14:26 (Alternative MDM)
            "%d.%m.%Y %H:%M",         # 03.04.2025 14:26 (Dot separator)
            
            # SIEM formats
            "%d-%m-%Y %H.%M",         # 03-04-2025 14.26 (SIEM format)
            "%Y-%m-%d %H:%M:%S",      # 2025-04-03 14:26:00 (Standard)
            "%d/%m/%Y %H:%M:%S",      # 03/04/2025 14:26:00 (Alternative)
            
            # Standard formats
            "%Y-%m-%d",               # 2025-07-16
            "%m/%d/%Y",               # 07/16/2025
        ]

        for fmt in date_formats:
            try:
                dt = datetime.strptime(str_val, fmt)
                return dt.isoformat()
            except Exception:
                continue

        # Final fallback with pandas - specify dayfirst=True for DD-MM-YYYY formats
        try:
            dt = pd.to_datetime(str_val, dayfirst=True, errors="coerce")
            if not pd.isna(dt):
                return dt.isoformat()
        except Exception:
            pass

        return None


    @staticmethod
    def _create_record_signature(item: Dict[str, Any]) -> str:
        """Create a unique signature for a record to detect duplicates"""
        # Use key fields to create a unique signature - handle different tool formats
        key_fields = [
            # Generic fields
            'title', 'Date', 'Username', 'Severity', 'Severity_Numeric', 'Alert Type',
            # GSuite specific fields
            'alert type', 'date reported', 'Date Reported', 'severity', 'phishing reported by user',
            'Subject', 'Message ID', 'Owner', 'Sender', 'Recipient',
            'email subject', 'sender', 'requested by',
            # SIEM/EDR fields
            'Event Type', 'Source IP', 'Destination IP', 'Process Name',
            # EDR threat-specific fields (ADDED TO FIX DEDUPLICATION)
            'threat_details', 'Threat Details', 'threat_name', 'Threat Name',
            'reported_time', 'Reported Time', 'Reported Time (UTC)',
            'identifying_time', 'Identifying Time', 'Identifying Time (UTC)',
            'endpoint', 'Endpoints', 'endpoints', 'device', 'Device',
            'confidence_level', 'Confidence Level', 'classification', 'Classification',
            'hash', 'Hash', 'file_path', 'Path', 'originating_process', 'Originating Process',
            # Meraki fields
            'Name', 'Clients', 'Usage (kB)',
            # MDM fields
            'Device Name', 'User', 'Platform', 'Enrollment', 'Compliance Status'
        ]
        signature_parts = []
        
        for field in key_fields:
            value = item.get(field)
            if value is not None:
                signature_parts.append(f"{field}:{str(value)}")
        
        # If no key fields found, use all fields to create signature
        if not signature_parts:
            for field, value in item.items():
                if value is not None:
                    signature_parts.append(f"{field}:{str(value)}")
        
        # Create a hash of the signature for efficient comparison
        import hashlib
        signature_string = "|".join(sorted(signature_parts))
        return hashlib.md5(signature_string.encode()).hexdigest()
    
    @staticmethod
    def aggregate_data(data: Dict[str, Any], aggregation: str = 'daily', include_weekends: bool = True) -> Dict[str, Any]:
        """Aggregate data based on time period"""
        if not data or aggregation not in ['daily', 'weekly', 'monthly']:
            return data
            
        aggregated_data = {}
        
        for key, value in data.items():
            if isinstance(value, list) and value:
                # Try to aggregate list data
                try:
                    df = pd.DataFrame(value)
                    
                    # Find date column
                    date_col = None
                    for col in df.columns:
                        if any(date_keyword in str(col).lower() for date_keyword in ['date', 'time', 'created', 'updated']):
                            try:
                                pd.to_datetime(df[col].dropna().iloc[0] if not df[col].dropna().empty else None)
                                date_col = col
                                break
                            except:
                                continue
                    
                    if date_col:
                        df[date_col] = df[date_col].dt.strftime("%Y-%m-%dT%H:%M:%S")
                        df = df.dropna(subset=[date_col])
                        
                        if not include_weekends:
                            df = df[df[date_col].dt.dayofweek < 5]  # Monday=0, Sunday=6
                        
                        # Group by time period
                        if aggregation == 'daily':
                            df['period'] = df[date_col].dt.date
                        elif aggregation == 'weekly':
                            df['period'] = df[date_col].dt.to_period('W').dt.start_time.dt.date
                        elif aggregation == 'monthly':
                            df['period'] = df[date_col].dt.to_period('M').dt.start_time.dt.date
                        
                        # Aggregate numeric columns
                        numeric_cols = df.select_dtypes(include=['number']).columns
                        if len(numeric_cols) > 0:
                            aggregated = df.groupby('period').agg({
                                **{col: 'sum' for col in numeric_cols},
                                date_col: 'count'  # Count of records per period
                            }).reset_index()
                            
                            aggregated['period'] = aggregated['period'].astype(str)
                            aggregated_data[key] = aggregated.to_dict('records')
                        else:
                            # Just count records per period
                            aggregated = df.groupby('period').size().reset_index(name='count')
                            aggregated['period'] = aggregated['period'].astype(str)
                            aggregated_data[key] = aggregated.to_dict('records')
                    else:
                        # No date column found, return original data
                        aggregated_data[key] = value
                        
                except Exception as e:
                    logger.warning(f"Failed to aggregate data for key {key}: {e}")
                    aggregated_data[key] = value
            else:
                aggregated_data[key] = value
                
        return aggregated_data
    
    @staticmethod
    def get_data_summary(data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary statistics for filtered data"""
        summary = {
            'total_records': 0,
            'data_sources': [],
            'date_range': {
                'earliest': None,
                'latest': None
            },
            'record_counts': {}
        }
        
        for key, value in data.items():
            if isinstance(value, list):
                summary['record_counts'][key] = len(value)
                summary['total_records'] += len(value)
                summary['data_sources'].append(key)
                
                # Find date range
                for item in value:
                    if isinstance(item, dict):
                        item_date = DataFilterService._extract_date_from_item(item)
                        if item_date:
                            if not summary['date_range']['earliest'] or item_date < summary['date_range']['earliest']:
                                summary['date_range']['earliest'] = item_date.isoformat()
                            if not summary['date_range']['latest'] or item_date > summary['date_range']['latest']:
                                summary['date_range']['latest'] = item_date.isoformat()
        
        return summary
    
    @staticmethod
    def apply_filters(data: Dict[str, Any], filters: Dict[str, Any]) -> Dict[str, Any]:
        """Apply all filters to data and recalculate KPIs for filtered data"""
        if not data or not filters:
            return data
            
        # Extract filter parameters
        time_range = filters.get('timeRange', 'month')
        # Support both dateRange structure and direct startDate/endDate
        custom_from = filters.get('dateRange', {}).get('from') or filters.get('startDate')
        custom_to = filters.get('dateRange', {}).get('to') or filters.get('endDate')
        data_source = filters.get('dataSource')
        aggregation = filters.get('aggregation', 'daily')
        include_weekends = filters.get('includeWeekends', True)
        
        logger.info(f"Applying filters: timeRange={time_range}, dataSource={data_source}")
        
        # Check if date filtering should be applied
        should_filter_by_date = time_range and time_range not in ['all', '']
        
        if should_filter_by_date:
            # Apply date range filter
            from_date, to_date = DataFilterService.parse_date_range(time_range, custom_from, custom_to)
            logger.info(f"Date range filtering: {from_date.strftime('%Y-%m-%d')} to {to_date.strftime('%Y-%m-%d')}")
            filtered_data = DataFilterService.filter_data_by_date(data, from_date, to_date)
        else:
            # No date filtering - show all data
            logger.info("No date filtering applied - showing all data")
            filtered_data = data
        
        # Log filtering results for debugging
        for tool, tool_data in filtered_data.items():
            if isinstance(tool_data, dict):
                details = tool_data.get('details', {})
                total_filtered = sum(len(sheet_data) if isinstance(sheet_data, list) else 0 
                                   for sheet_data in details.values())
                logger.info(f"{tool}: {total_filtered} records after date filtering")
        
        # Apply data source filter
        if data_source and data_source != 'all':
            filtered_data = {k: v for k, v in filtered_data.items() if k == data_source}
        
        # Recalculate KPIs and analytics for filtered data
        recalculated_data = DataFilterService._recalculate_metrics(filtered_data)
        
        # Apply aggregation
        aggregated_data = DataFilterService.aggregate_data(recalculated_data, aggregation, include_weekends)
        
        return aggregated_data
    
    @staticmethod
    def _recalculate_metrics(data: Dict[str, Any]) -> Dict[str, Any]:
        """Recalculate KPIs and analytics based on filtered data"""
        recalculated_data = {}
        
        for tool, tool_data in data.items():
            if not isinstance(tool_data, dict):
                recalculated_data[tool] = tool_data
                continue
                
            # Get filtered details
            details = tool_data.get('details', {})
            
            # Count filtered records by severity/priority for each tool
            filtered_counts = DataFilterService._count_by_severity(details)
            
            # Update KPIs with filtered counts
            updated_kpis = tool_data.get('kpis', {}).copy()
            
            if tool == 'siem':
                updated_kpis.update({
                    'totalEvents': filtered_counts['total'],
                    'criticalAlerts': filtered_counts['critical'],
                    'highSeverityEvents': filtered_counts['high'],
                    'mediumSeverityEvents': filtered_counts['medium'],
                    'lowSeverityEvents': filtered_counts['low'],
                    'infoEvents': filtered_counts.get('info', 0)
                })
            elif tool == 'edr':
                # Recalculate EDR-specific KPIs based on filtered data
                edr_kpis = DataFilterService._recalculate_edr_kpis(details)
                updated_kpis.update(edr_kpis)
            elif tool == 'mdm':
                # Recalculate MDM-specific KPIs based on filtered data
                mdm_kpis = DataFilterService._recalculate_mdm_kpis(details)
                updated_kpis.update(mdm_kpis)
            elif tool == 'gsuite':
                # Recalculate GSuite-specific KPIs based on filtered data
                gsuite_kpis = DataFilterService._recalculate_gsuite_kpis(details)
                updated_kpis.update(gsuite_kpis)
            elif tool == 'meraki':
                # Recalculate Meraki-specific KPIs based on filtered data
                meraki_kpis = DataFilterService._recalculate_meraki_kpis(details)
                updated_kpis.update(meraki_kpis)
            
            # Update analytics with filtered data
            updated_analytics = tool_data.get('analytics', {}).copy()
            if 'severityDistribution' in updated_analytics:
                updated_analytics['severityDistribution'] = {
                    'critical': filtered_counts['critical'],
                    'high': filtered_counts['high'],
                    'medium': filtered_counts['medium'],
                    'low': filtered_counts['low'],
                    'info': filtered_counts.get('info', 0)
                }
            
            recalculated_data[tool] = {
                **tool_data,
                'kpis': updated_kpis,
                'analytics': updated_analytics
            }
            
            logger.info(f"Recalculated {tool} metrics: total={filtered_counts['total']}, "
                       f"critical={filtered_counts['critical']}, high={filtered_counts['high']}")
        
        return recalculated_data
    
    @staticmethod
    def _recalculate_mdm_kpis(details: Dict[str, Any]) -> Dict[str, int]:
        """Recalculate MDM-specific KPIs based on filtered data"""
        kpis = {}
        
        # Calculate from allUsers (main dataset)
        all_users = details.get('allUsers', [])
        
        if all_users:
            total_devices = len(all_users)
            
            # Count enrolled devices
            enrolled_devices = 0
            compliant_devices = 0
            compromised_count = 0
            
            for device in all_users:
                if isinstance(device, dict):
                    # Check enrollment status
                    enrollment = str(device.get('Enrollment', '')).lower().strip()
                    if enrollment == 'enrolled':
                        enrolled_devices += 1
                    
                    # Check compliance status
                    compliance = str(device.get('Compliance Status', '')).lower().strip()
                    if compliance == 'compliant':
                        compliant_devices += 1
                    
                    # Check compromised status
                    compromised = str(device.get('Compromised', '')).upper().strip()
                    if compromised == 'Y':
                        compromised_count += 1
            
            # Count devices from other sheets
            wipe_pending_count = len(details.get('wipePending', []))
            no_pass_count = len(details.get('noPass', []))
            not_encrypted_count = len(details.get('notEncrypted', []))
            non_compliant_count = len(details.get('nonCompliant', []))
            
            # Calculate rates
            compliance_rate = (compliant_devices / total_devices * 100) if total_devices > 0 else 0
            enrollment_rate = (enrolled_devices / total_devices * 100) if total_devices > 0 else 0
            
            # Calculate security issues
            security_issues = compromised_count + no_pass_count + not_encrypted_count
            
            # Update KPIs with filtered counts
            kpis.update({
                'totalDevices': total_devices,
                'enrolledDevices': enrolled_devices,
                'compliantDevices': compliant_devices,
                'complianceRate': round(compliance_rate, 2),
                'compromisedDevices': compromised_count,
                'securityIssues': security_issues,
                'wipePendingDevices': wipe_pending_count,
                'devicesWithoutPassword': no_pass_count,
                'unencryptedDevices': not_encrypted_count,
                'nonCompliantDevices': non_compliant_count,
                'enrollmentRate': round(enrollment_rate, 2)
            })
        else:
            # When no data exists, return zero values for all KPIs
            kpis.update({
                'totalDevices': 0,
                'enrolledDevices': 0,
                'compliantDevices': 0,
                'complianceRate': 0.0,
                'compromisedDevices': 0,
                'securityIssues': 0,
                'wipePendingDevices': 0,
                'devicesWithoutPassword': 0,
                'unencryptedDevices': 0,
                'nonCompliantDevices': 0,
                'enrollmentRate': 0.0
            })
        
        return kpis
    
    @staticmethod
    def _recalculate_gsuite_kpis(details: Dict[str, Any]) -> Dict[str, int]:
        """Recalculate GSuite-specific KPIs based on filtered data"""
        kpis = {}
        
        # Count emails scanned from "total number of mail scanned" sheet
        mail_scanned_data = details.get('total number of mail scanned', [])
        if not mail_scanned_data:
            mail_scanned_data = details.get('totalEmailsScanned', [])
        emails_scanned = len(mail_scanned_data)
        
        # Count phishing attempts from "Phishing Attempted data" sheet
        phishing_data = details.get('Phishing Attempted data', [])
        if not phishing_data:
            phishing_data = details.get('phishingAttempted', [])
        phishing_attempted = len(phishing_data)
        
        # Count suspicious emails (subset of phishing)
        suspicious_emails = max(1, phishing_attempted // 3) if phishing_attempted > 0 else 0
        
        # Count whitelisted domains from "whitelisted domains" sheet
        whitelist_data = details.get('whitelisted domains', [])
        if not whitelist_data:
            whitelist_data = details.get('whitelistedDomains', [])
        
        valid_whitelist = []
        for item in whitelist_data:
            if isinstance(item, dict):
                # Check all possible domain field names
                domain = item.get('Whitelisted Domain', item.get('Domain', item.get('domain', ''))).strip()
                if domain and domain != '-' and domain.lower() != 'nan':
                    valid_whitelist.append(item)
        whitelisted_domain_count = len(valid_whitelist)
        
        # Count client investigations from "Client Coordinated email invest" sheet
        client_data = details.get('Client Coordinated email invest', [])
        if not client_data:
            client_data = details.get('clientInvestigations', [])
        client_investigations = len(client_data)
        
        # Update KPIs with filtered counts
        kpis.update({
            'emailsScanned': emails_scanned,
            'phishingAttempted': phishing_attempted,
            'suspiciousEmails': suspicious_emails,
            'whitelistRequests': whitelisted_domain_count,
            'clientInvestigations': client_investigations,
        })
        
        # Also update the filtered whitelist data
        if 'whitelisted domains' in details:
            details['whitelisted domains'] = valid_whitelist
        if 'whitelistedDomains' in details:
            details['whitelistedDomains'] = valid_whitelist
        
        return kpis
    
    @staticmethod
    def _recalculate_meraki_kpis(details: Dict[str, Any]) -> Dict[str, int]:
        """Recalculate Meraki-specific KPIs based on filtered data"""
        kpis = {}
        
        try:
            # Helper function to safely get numeric values
            def safe_int(value):
                try:
                    return int(float(value)) if value and str(value).strip() not in ['', 'nan', 'None'] else 0
                except:
                    return 0
            
            def safe_float(value):
                try:
                    return float(value) if value and str(value).strip() not in ['', 'nan', 'None'] else 0.0
                except:
                    return 0.0
            
            # Calculate KPIs from filtered data
            # Sheet 1: Top SSIDs by usage
            top_ssids = details.get("Top SSIDs by usage", [])
            if top_ssids:
                total_ssids = len([s for s in top_ssids if s and s.get('Name')])
                total_ssid_clients = sum(safe_int(s.get('Clients', 0)) for s in top_ssids if s)
                total_ssid_usage = sum(safe_float(s.get('Usage (kB)', 0)) for s in top_ssids if s)
                
                kpis.update({
                    "totalSSIDs": total_ssids,
                    "totalSSIDClients": total_ssid_clients,
                    "totalSSIDUsageKB": round(total_ssid_usage, 2),
                    "avgClientsPerSSID": round(total_ssid_clients / max(total_ssids, 1), 2)
                })
            
            # Sheet 2: Top devices
            top_devices = details.get("Top devices", [])
            if top_devices:
                total_devices = len([d for d in top_devices if d and d.get('Name')])
                total_device_clients = sum(safe_int(d.get('Clients', 0)) for d in top_devices if d)
                total_device_usage = sum(safe_float(d.get('Usage (kB)', 0)) for d in top_devices if d)
                
                kpis.update({
                    "totalDevices": total_devices,
                    "totalDeviceClients": total_device_clients,
                    "totalDeviceUsageKB": round(total_device_usage, 2),
                    "avgClientsPerDevice": round(total_device_clients / max(total_devices, 1), 2)
                })
            
            # Sheet 3: Top clients by usage
            top_clients = details.get("Top clients by usage", [])
            if top_clients:
                total_clients = len([c for c in top_clients if c])
                total_data_received = sum(safe_float(c.get('Data Received (kB)', 0)) for c in top_clients if c)
                total_data_sent = sum(safe_float(c.get('Data Sent (kB)', 0)) for c in top_clients if c)
                total_client_traffic = total_data_received + total_data_sent
                
                kpis.update({
                    "totalClients": total_clients,
                    "totalDataReceivedKB": round(total_data_received, 2),
                    "totalDataSentKB": round(total_data_sent, 2),
                    "totalClientTrafficKB": round(total_client_traffic, 2)
                })
            
        except Exception as e:
            logger = __import__('logging').getLogger(__name__)
            logger.error(f"Error recalculating Meraki KPIs: {str(e)}")
        
        return kpis
    
    @staticmethod
    def _recalculate_edr_kpis(details: Dict[str, Any]) -> Dict[str, int]:
        """Recalculate EDR-specific KPIs based on filtered data"""
        kpis = {}
        
        try:
            # Count endpoints
            endpoints = details.get('endpoints', [])
            total_endpoints = len(endpoints)
            
            # Count by network status
            connected_endpoints = 0
            disconnected_endpoints = 0
            
            # Count by update status
            up_to_date_endpoints = 0
            out_of_date_endpoints = 0
            
            # Count by scan status
            completed_scans = 0
            failed_scans = 0
            
            for endpoint in endpoints:
                if isinstance(endpoint, dict):
                    # Network status
                    network_status = str(endpoint.get('network_status', endpoint.get('Network Status', ''))).lower()
                    if 'connect' in network_status:
                        connected_endpoints += 1
                    elif 'disconnect' in network_status:
                        disconnected_endpoints += 1
                    
                    # Update status
                    update_status = str(endpoint.get('update_status', endpoint.get('Update Status', ''))).lower()
                    if 'up to date' in update_status or 'updated' in update_status:
                        up_to_date_endpoints += 1
                    elif 'out of date' in update_status or 'outdated' in update_status:
                        out_of_date_endpoints += 1
                    
                    # Scan status
                    scan_status = str(endpoint.get('scan_status', endpoint.get('Scan Status', ''))).lower()
                    if 'completed' in scan_status:
                        completed_scans += 1
                    elif 'failed' in scan_status or 'aborted' in scan_status:
                        failed_scans += 1
            
            # Count threats
            threats = details.get('threats', [])
            total_threats = len(threats)
            
            # Count threats by severity
            critical_threats = 0
            high_threats = 0
            medium_threats = 0
            low_threats = 0
            
            for threat in threats:
                if isinstance(threat, dict):
                    # Check various severity field names
                    severity = None
                    for field in ['severity', 'Severity', 'Confidence Level', 'confidence_level', 'Priority', 'priority']:
                        if field in threat and threat[field]:
                            severity = str(threat[field]).lower().strip()
                            break
                    
                    if severity:
                        if 'critical' in severity or 'malicious' in severity:
                            critical_threats += 1
                        elif 'high' in severity:
                            high_threats += 1
                        elif 'medium' in severity or 'suspicious' in severity:
                            medium_threats += 1
                        elif 'low' in severity or 'info' in severity:
                            low_threats += 1
            
            # Count detailed status
            detailed_status = details.get('detailedStatus', [])
            total_status_records = len(detailed_status)
            
            # Build KPIs - MATCH ORIGINAL EDR PROCESSOR FIELD NAMES
            kpis.update({
                # Endpoint KPIs (exact match with original processor)
                'totalEndpoints': int(total_endpoints),
                'connectedEndpoints': int(connected_endpoints),
                'disconnectedEndpoints': int(disconnected_endpoints),
                'upToDateEndpoints': int(up_to_date_endpoints),
                'outOfDateEndpoints': int(out_of_date_endpoints),
                'endpointAvailabilityRate': float(round((connected_endpoints / max(total_endpoints, 1)) * 100, 2)),
                'updateComplianceRate': float(round((up_to_date_endpoints / max(total_endpoints, 1)) * 100, 2)),
                
                # Scan KPIs (exact match with original processor)
                'completedScans': int(completed_scans),
                'failedScans': int(failed_scans),
                'scanSuccessRate': float(round((completed_scans / max(completed_scans + failed_scans, 1)) * 100, 2)),
                
                # Threat KPIs (exact match with original processor)
                'totalThreats': int(total_threats),
                'maliciousThreats': int(critical_threats),  # Map critical to malicious
                'suspiciousThreats': int(high_threats + medium_threats),  # Map high+medium to suspicious
                'resolvedThreats': int(total_threats - critical_threats),  # Assume non-critical are resolved
                'pendingThreats': int(critical_threats),  # Critical threats are pending
                'falsePositives': int(low_threats),  # Map low severity to false positives
                'threatResolutionRate': float(round(((total_threats - critical_threats) / max(total_threats, 1)) * 100, 2))
            })
            
            logger.info(f"Recalculated EDR KPIs: {total_endpoints} endpoints, {total_threats} threats")
            
        except Exception as e:
            logger.error(f"Error recalculating EDR KPIs: {str(e)}")
            # Fallback to basic counts
            kpis = {
                'totalEndpoints': len(details.get('endpoints', [])),
                'totalThreats': len(details.get('threats', [])),
                'totalStatusRecords': len(details.get('detailedStatus', []))
            }
        
        return kpis
    
    @staticmethod
    def _count_by_severity(details: Dict[str, Any]) -> Dict[str, int]:
        """Count records by severity/priority level from filtered details"""
        counts = {'total': 0, 'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'info': 0}
        
        for sheet_name, sheet_data in details.items():
            if not isinstance(sheet_data, list):
                continue
                
            counts['total'] += len(sheet_data)
            
            for item in sheet_data:
                if not isinstance(item, dict):
                    continue
                    
                # Check common severity field names (text and numeric)
                severity = None
                severity_numeric = None
                
                # First check for numeric severity field (preferred for SIEM data)
                if 'Severity_Numeric' in item and item['Severity_Numeric'] is not None:
                    severity_numeric = item['Severity_Numeric']
                
                # Then check text fields as fallback
                for field in ['Severity', 'severity', 'Priority', 'priority', 'Severity_Name', 'Level']:
                    if field in item and item[field] is not None:
                        severity = str(item[field]).lower().strip()
                        break
                
                # Classify by numeric value first (more accurate)
                if severity_numeric is not None:
                    if severity_numeric == 4:
                        counts['critical'] += 1
                    elif severity_numeric == 3:
                        counts['high'] += 1
                    elif severity_numeric == 2:
                        counts['medium'] += 1
                    elif severity_numeric == 1:
                        counts['low'] += 1
                    elif severity_numeric == 0:
                        counts['info'] += 1
                # Fallback to text classification
                elif severity:
                    if severity in ['critical', '4', 'emergency', 'severe']:
                        counts['critical'] += 1
                    elif severity in ['high', '3', 'major']:
                        counts['high'] += 1
                    elif severity in ['medium', '2', 'moderate']:
                        counts['medium'] += 1
                    elif severity in ['low', '1', 'minor']:
                        counts['low'] += 1
                    elif severity in ['info', '0', 'informational']:
                        counts['info'] += 1
        
        return counts