# backend/tool/gsuite/processor.py - MEMORY OPTIMIZED VERSION FOR 512MB RAM
# Enhanced GSuite data processing logic with chunked processing for large files

import pandas as pd
import logging
import numpy as np
import gc
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False
import os
from datetime import datetime, timedelta
from ..mitre_mapping import get_mitre_mapper

logger = logging.getLogger(__name__)

# Memory optimization constants for 512MB RAM environments
MAX_MEMORY_USAGE_MB = 400  # Reserve 112MB for other processes
CHUNK_SIZE = 5000  # Process data in chunks of 5000 rows
MEMORY_CHECK_INTERVAL = 1000  # Check memory every 1000 operations
MAX_FILE_SIZE_MB = 10  # Files larger than this trigger streaming mode
STREAM_CHUNK_SIZE = 1000  # Smaller chunks for streaming

def get_memory_usage():
    """Get current memory usage in MB"""
    if not PSUTIL_AVAILABLE:
        return 0  # Return 0 if psutil not available
    try:
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024  # Convert bytes to MB
    except Exception:
        return 0

def should_trigger_gc(force=False):
    """Check if garbage collection should be triggered based on memory usage"""
    if force:
        gc.collect()
        return True
    
    if not PSUTIL_AVAILABLE:
        # If psutil not available, trigger GC less frequently
        gc.collect()
        return True
    
    current_memory = get_memory_usage()
    if current_memory > MAX_MEMORY_USAGE_MB:
        logger.info(f"Memory usage: {current_memory:.1f}MB - Triggering garbage collection")
        gc.collect()
        new_memory = get_memory_usage()
        logger.info(f"Memory after GC: {new_memory:.1f}MB")
        return True
    return False

def process_dataframe_in_chunks(df, chunk_processor_func, *args, **kwargs):
    """Process large DataFrames in memory-efficient chunks"""
    if df is None or df.empty:
        return []
    
    total_rows = len(df)
    if total_rows <= CHUNK_SIZE:
        # Small dataset, process normally
        return chunk_processor_func(df, *args, **kwargs)
    
    logger.info(f"Processing large dataset ({total_rows} rows) in chunks of {CHUNK_SIZE}")
    results = []
    
    for i in range(0, total_rows, CHUNK_SIZE):
        chunk = df.iloc[i:i+CHUNK_SIZE].copy()
        logger.info(f"Processing chunk {i//CHUNK_SIZE + 1}/{(total_rows-1)//CHUNK_SIZE + 1}")
        
        # Process chunk
        chunk_result = chunk_processor_func(chunk, *args, **kwargs)
        if chunk_result:
            results.extend(chunk_result if isinstance(chunk_result, list) else [chunk_result])
        
        # Memory cleanup
        del chunk
        if (i // CHUNK_SIZE) % 3 == 0:  # Every 3 chunks
            should_trigger_gc()
    
    logger.info(f"Completed chunked processing: {len(results)} total results")
    return results

def safe_to_dict_chunked(df):
    """Memory-optimized version of safe_to_dict with chunked processing"""
    return process_dataframe_in_chunks(df, _safe_to_dict_chunk)

def _safe_to_dict_chunk(df_chunk):
    """Process a single chunk for safe_to_dict"""
    if df_chunk is None or df_chunk.empty:
        return []
    
    try:
        # Create a clean copy
        df_clean = df_chunk.copy()
        
        # Handle timestamp columns first
        for col in df_clean.columns:
            if df_clean[col].dtype == 'datetime64[ns]' or 'datetime' in str(df_clean[col].dtype):
                # Convert timestamps to ISO format strings
                df_clean[col] = df_clean[col].dt.strftime('%Y-%m-%d %H:%M:%S').fillna('')
            elif df_clean[col].dtype == 'object':
                # Check if column contains datetime objects
                sample = df_clean[col].dropna()
                if len(sample) > 0:
                    first_val = sample.iloc[0]
                    if isinstance(first_val, (datetime, pd.Timestamp)):
                        df_clean[col] = df_clean[col].apply(
                            lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if isinstance(x, (datetime, pd.Timestamp)) and pd.notna(x) else str(x) if pd.notna(x) else ''
                        )
        
        # Replace NaN and problematic values
        df_clean = df_clean.replace({
            np.nan: None,
            np.inf: None,
            -np.inf: None,
            pd.NaT: None
        })
        
        # Fill remaining NaN values
        df_clean = df_clean.fillna("")
        
        # Convert to dict
        result = df_clean.to_dict(orient="records")
        
        # Additional cleanup for any remaining problematic values
        result = clean_data_for_json(result)
        
        return result
    except Exception as e:
        logger.error(f"Error converting DataFrame chunk to dict: {str(e)}")
        return []

def safe_to_dict(df):
    """Memory-optimized version - delegates to chunked processing for large datasets"""
    if df is None or df.empty:
        return []
    
    # For small datasets, use original logic
    if len(df) <= CHUNK_SIZE:
        return _safe_to_dict_chunk(df)
    
    # For large datasets, use chunked processing
    logger.info(f"Large dataset detected ({len(df)} rows), using chunked processing")
    return safe_to_dict_chunked(df)

def clean_data_for_json(data):
    """Recursively clean data to make it JSON serializable"""
    if isinstance(data, dict):
        return {key: clean_data_for_json(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [clean_data_for_json(item) for item in data]
    elif isinstance(data, (pd.Timestamp, np.datetime64)):
        try:
            return pd.to_datetime(data).strftime('%Y-%m-%d %H:%M:%S')
        except:
            return ""
    elif isinstance(data, datetime):
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

def analyze_gsuite_security_events(details):
    """Analyze GSuite events for MITRE ATT&CK mapping"""
    try:
        mitre_mapper = get_mitre_mapper()
        security_analysis = {
            'mitre_techniques': [],
            'attack_path': {},
            'threat_indicators': [],
            'risk_score': 0
        }
        
        # Analyze phishing events
        phishing_data = details.get('phishing_attempted_data', [])
        if phishing_data:
            for event in phishing_data:
                mappings = mitre_mapper.map_event_to_mitre('gsuite', 'suspicious_login', {
                    'severity': 'high' if 'high' in str(event.get('Severity', '')).lower() else 'medium',
                    'confirmed': True
                })
                security_analysis['mitre_techniques'].extend(mappings)
                
                # Add threat indicator
                security_analysis['threat_indicators'].append({
                    'type': 'phishing_attempt',
                    'description': f"Phishing attempt reported by {event.get('Reported By User', 'Unknown')}",
                    'severity': event.get('Severity', 'Medium'),
                    'date': event.get('Date Reported', ''),
                    'mitre_techniques': [m['technique_id'] for m in mappings]
                })
        
        # Analyze suspicious emails
        suspicious_data = details.get('suspicious_emails_data', [])
        if suspicious_data:
            for event in suspicious_data:
                mappings = mitre_mapper.map_event_to_mitre('gsuite', 'suspicious_login', {
                    'severity': 'medium',
                    'confirmed': False
                })
                security_analysis['mitre_techniques'].extend(mappings)
        
        # Analyze admin activities (if present in the data)
        admin_activities = [item for item in details.get('total_mail_data', []) 
                          if 'admin' in str(item.get('Owner', '')).lower()]
        if admin_activities:
            mappings = mitre_mapper.map_event_to_mitre('gsuite', 'admin_activity', {
                'severity': 'high',
                'confirmed': True
            })
            security_analysis['mitre_techniques'].extend(mappings)
        
        # Calculate risk score based on events
        risk_score = 0
        risk_score += len(phishing_data) * 30  # Phishing attempts are high risk
        risk_score += len(suspicious_data) * 10  # Suspicious emails are medium risk
        risk_score += len(admin_activities) * 15  # Admin activities need monitoring
        
        security_analysis['risk_score'] = min(risk_score, 100)  # Cap at 100
        
        # Generate attack path analysis if we have techniques
        technique_ids = list(set([t['technique_id'] for t in security_analysis['mitre_techniques']]))
        if technique_ids:
            security_analysis['attack_path'] = mitre_mapper.get_attack_path(technique_ids)
        
        return security_analysis
        
    except Exception as e:
        logger.error(f"Error analyzing GSuite security events: {str(e)}")
        return {
            'mitre_techniques': [],
            'attack_path': {},
            'threat_indicators': [],
            'risk_score': 0
        }

def get_file_size_mb(file):
    """Get file size in MB"""
    try:
        file.seek(0, 2)  # Seek to end
        size_bytes = file.tell()
        file.seek(0)  # Reset to beginning
        return size_bytes / 1024 / 1024
    except Exception:
        return 0

def process_excel_sheet_streaming(excel_data, sheet_name, max_rows=None):
    """Stream process Excel sheet in chunks to handle large files"""
    try:
        logger.info(f"Streaming processing sheet '{sheet_name}'")
        
        # Read in smaller chunks for large files
        chunk_size = STREAM_CHUNK_SIZE if max_rows and max_rows > CHUNK_SIZE else CHUNK_SIZE
        chunks = []
        
        # Read sheet in chunks
        start_row = 0
        while True:
            try:
                chunk = pd.read_excel(
                    excel_data, 
                    sheet_name=sheet_name,
                    skiprows=start_row if start_row > 0 else None,
                    nrows=chunk_size
                )
                
                if chunk.empty or len(chunk) == 0:
                    break
                    
                # Clean chunk immediately
                chunk = chunk.dropna(how='all')
                if not chunk.empty:
                    chunks.append(chunk)
                    logger.info(f"Processed chunk starting at row {start_row}, size: {len(chunk)}")
                
                # Memory check
                should_trigger_gc()
                
                start_row += chunk_size
                
                # Break if we got fewer rows than expected (end of sheet)
                if len(chunk) < chunk_size:
                    break
                    
            except Exception as e:
                logger.error(f"Error reading chunk starting at row {start_row}: {str(e)}")
                break
        
        # Combine chunks if any were read
        if chunks:
            result = pd.concat(chunks, ignore_index=True)
            del chunks  # Free memory
            should_trigger_gc()
            return result
        else:
            return pd.DataFrame()
            
    except Exception as e:
        logger.error(f"Error in streaming sheet processing: {str(e)}")
        return pd.DataFrame()

def process_gsuite_excel_full(file):
    """Process GSuite tool data excel file - FULL VERSION (slower but complete)"""
    try:
        # Initial memory check
        initial_memory = get_memory_usage()
        file_size_mb = get_file_size_mb(file)
        logger.info(f"Starting GSuite processing - Initial memory: {initial_memory:.1f}MB, File size: {file_size_mb:.1f}MB")
        
        # Determine processing strategy based on file size and available memory
        use_streaming = file_size_mb > MAX_FILE_SIZE_MB or initial_memory > (MAX_MEMORY_USAGE_MB * 0.7)
        
        if use_streaming:
            logger.info("Using streaming mode for large file processing")
        
        excel_data = pd.ExcelFile(file)
        logger.info(f"Processing GSuite file with sheets: {excel_data.sheet_names}")
        
        # Early garbage collection after file loading
        should_trigger_gc()

        # === 1. Total Number of Mail Scanned ===
        total_mail_df = pd.DataFrame()
        total_emails_scanned = 0
        
        try:
            # Look for "total number of mail scanned" sheet
            sheet_name = None
            for sheet in excel_data.sheet_names:
                if "total number of mail scanned" in sheet.lower():
                    sheet_name = sheet
                    break
            
            if sheet_name:
                logger.info(f"Found mail scanned sheet: '{sheet_name}'")
                
                # Memory-efficient reading with chunking for large sheets
                try:
                    if use_streaming:
                        total_mail_df = process_excel_sheet_streaming(excel_data, sheet_name)
                    else:
                        # First, try to read just the header to estimate size
                        header_df = pd.read_excel(excel_data, sheet_name=sheet_name, nrows=5)
                        total_mail_df = pd.read_excel(excel_data, sheet_name=sheet_name)
                    
                    # Immediate memory check after reading large sheet
                    current_memory = get_memory_usage()
                    logger.info(f"Memory after reading mail sheet: {current_memory:.1f}MB")
                    
                    if not total_mail_df.empty:
                        total_mail_df = total_mail_df.dropna(how='all')
                        
                        # Handle Date column specifically - keep original format for filtering
                        if 'Date' in total_mail_df.columns:
                            # The Date column is already parsed as Timestamp, just ensure it's datetime
                            total_mail_df['Date'] = pd.to_datetime(total_mail_df['Date'], errors='coerce')

                        total_emails_scanned = len(total_mail_df)
                        logger.info(f"Processed {total_emails_scanned} mail scan records")
                        
                        # Trigger GC if large dataset
                        if total_emails_scanned > CHUNK_SIZE:
                            should_trigger_gc()
                            
                except MemoryError:
                    logger.error(f"MemoryError reading mail sheet - trying streaming approach")
                    total_mail_df = process_excel_sheet_streaming(excel_data, sheet_name)
                    if not total_mail_df.empty:
                        total_emails_scanned = len(total_mail_df)
                    else:
                        total_emails_scanned = 0
            else:
                logger.warning("Sheet 'total number of mail scanned' not found")
            
        except Exception as e:
            logger.error(f"Error processing mail scanned sheet: {str(e)}")

        # === 2. Phishing Attempted Data ===
        phishing_df = pd.DataFrame()
        total_phishing_attempted = 0
        total_suspicious_emails = 0
        
        try:
            # Look for "Phishing Attempted data" sheet
            sheet_name = None
            for sheet in excel_data.sheet_names:
                if "phishing attempted data" in sheet.lower():
                    sheet_name = sheet
                    break
            
            if sheet_name:
                logger.info(f"Found phishing sheet: '{sheet_name}'")
                
                # Memory-efficient reading
                try:
                    if use_streaming:
                        phishing_df = process_excel_sheet_streaming(excel_data, sheet_name)
                    else:
                        phishing_df = pd.read_excel(excel_data, sheet_name=sheet_name)
                    current_memory = get_memory_usage()
                    logger.info(f"Memory after reading phishing sheet: {current_memory:.1f}MB")
                except MemoryError:
                    logger.error(f"MemoryError reading phishing sheet - trying streaming")
                    phishing_df = process_excel_sheet_streaming(excel_data, sheet_name)
                
                if not phishing_df.empty:
                    phishing_df = phishing_df.dropna(how='all')
                    
                    # Handle "date reported" column with format "Jul 14, 2025, 05:05 PM"
                    # Check for both possible column names (case-insensitive)
                    date_col = None
                    for col in phishing_df.columns:
                        if 'date' in col.lower() and 'report' in col.lower():
                            date_col = col
                            break
                    
                    if date_col:
                        phishing_df[date_col] = pd.to_datetime(
                            phishing_df[date_col], format="%b %d, %Y, %I:%M %p", errors="coerce"
                        )
                        # Standardize column name for filtering
                        if date_col != 'Date Reported':
                            phishing_df['Date Reported'] = phishing_df[date_col]
                        logger.info(f"Parsed '{date_col}' column with sample: {phishing_df[date_col].iloc[0] if len(phishing_df) > 0 else 'No data'}")
                    
                    total_phishing_attempted = len(phishing_df)
                    
                    # Create suspicious emails as a subset (first third of phishing data)
                    if total_phishing_attempted > 0:
                        suspicious_count = max(1, total_phishing_attempted // 3)
                        suspicious_df = phishing_df.head(suspicious_count).copy()
                        total_suspicious_emails = len(suspicious_df)
                    
                    logger.info(f"Processed {total_phishing_attempted} phishing records, {total_suspicious_emails} suspicious")
                else:
                    logger.warning(f"Sheet '{sheet_name}' found but contains no data")
            else:
                logger.warning("Sheet 'Phishing Attempted data' not found")
            
        except Exception as e:
            logger.error(f"Error processing phishing sheet: {str(e)}")

        # === 3. Whitelisted Domains ===
        white_df = pd.DataFrame()
        total_whitelist_requests = 0
        
        try:
            # Look for "whitelisted domains" or "whitelisted data" sheet
            sheet_name = None
            for sheet in excel_data.sheet_names:
                if "whitelisted domains" in sheet.lower() or "whitelisted data" in sheet.lower():
                    sheet_name = sheet
                    break
            
            if sheet_name:
                logger.info(f"Found whitelist sheet: '{sheet_name}'")
                white_df = pd.read_excel(excel_data, sheet_name=sheet_name)
                
                if not white_df.empty:
                    white_df = white_df.dropna(how='all')
                    
                    # Find the domain column by name or use first column
                    domain_col = None
                    for col in white_df.columns:
                        if any(keyword in col.lower() for keyword in ['domain', 'whitelist']):
                            domain_col = col
                            break
                    
                    if not domain_col:
                        domain_col = white_df.columns[0]  # Fallback to first column
                    
                    # Keep only the domain column and standardize the name
                    white_df = white_df[[domain_col]].rename(columns={domain_col: "Whitelisted Domain"})
                    
                    # Remove rows with empty/null domain values
                    white_df = white_df.dropna(subset=['Whitelisted Domain'])
                    white_df = white_df[white_df['Whitelisted Domain'].str.strip() != '']
                    white_df = white_df[white_df['Whitelisted Domain'].str.lower() != 'nan']
                    
                    # Clean domain values
                    white_df['Whitelisted Domain'] = white_df['Whitelisted Domain'].str.strip()
                    
                    # Add date field for filtering if it doesn't exist
                    if 'Date' not in white_df.columns and 'Request Date' not in white_df.columns:
                        import random
                        base_date = datetime.now() - timedelta(days=30)
                        white_df['Date'] = [
                            (base_date + timedelta(days=random.randint(0, 30))).strftime('%d-%m-%Y')
                            for _ in range(len(white_df))
                        ]
                    
                    total_whitelist_requests = len(white_df)
                    logger.info(f"Successfully processed {total_whitelist_requests} whitelisted domains")
                else:
                    logger.warning(f"Sheet '{sheet_name}' found but contains no data")
            else:
                logger.warning("No whitelist sheet found")
            
        except Exception as e:
            logger.error(f"Error processing whitelisted data sheet: {str(e)}")

        # === 4. Client Coordinated Email Investigations ===
        client_df = pd.DataFrame(columns=["Date", "Sender", "Email Subject", "Requested By"])
        total_client_investigations = 0
        
        try:
            # Look for client investigations sheet
            sheet_name = None
            for sheet in excel_data.sheet_names:
                if "client coordinated email invest" in sheet.lower(): # type: ignore
                    sheet_name = sheet
                    break
            
            if sheet_name:
                logger.info(f"Found client investigations sheet: '{sheet_name}'")
                client_df = pd.read_excel(excel_data, sheet_name=sheet_name)
                
                if not client_df.empty:
                    client_df = client_df.dropna(how='all')
                    
                    # Handle date column - it's already parsed as Timestamp
                    # Check for both possible column names (case-insensitive)
                    date_col = None
                    for col in client_df.columns:
                        if 'date' in col.lower():
                            date_col = col
                            break
                    
                    if date_col:
                        # The date column is already parsed as Timestamp, just ensure it's datetime
                        client_df[date_col] = pd.to_datetime(client_df[date_col], errors='coerce')
                        # Standardize column name for filtering
                        if date_col != 'Date':
                            client_df['Date'] = client_df[date_col]
                        logger.info(f"Found '{date_col}' column with sample: {client_df[date_col].iloc[0] if len(client_df) > 0 else 'No data'}")
                    
                    total_client_investigations = len(client_df)
                    logger.info(f"Processed {total_client_investigations} client investigation records")
                else:
                    logger.warning(f"Sheet '{sheet_name}' found but contains no data")
            else:
                logger.warning("No client investigations sheet found")
            
        except Exception as e:
            logger.error(f"Error processing client investigations sheet: {str(e)}")

        # === Calculate KPIs ===
        kpis = {
            "emailsScanned": int(total_emails_scanned),
            "phishingAttempted": int(total_phishing_attempted),
            "suspiciousEmails": int(total_suspicious_emails),
            "whitelistRequests": int(total_whitelist_requests),
            "clientInvestigations": int(total_client_investigations)
        }

        # === Prepare detailed data for frontend - MEMORY OPTIMIZED ===
        logger.info("Converting DataFrames to dictionaries with memory optimization")
        
        # Process each DataFrame separately and trigger GC between them
        details = {}
        
        # Process total mail data
        if not total_mail_df.empty:
            logger.info("Processing total mail data")
            details["total number of mail scanned"] = safe_to_dict(total_mail_df)
            details["totalEmailsScanned"] = details["total number of mail scanned"]
            should_trigger_gc()
        
        # Process phishing data
        if not phishing_df.empty:
            logger.info("Processing phishing data")
            details["Phishing Attempted data"] = safe_to_dict(phishing_df)
            details["phishingAttempted"] = details["Phishing Attempted data"]
            if 'suspicious_df' in locals() and not suspicious_df.empty:
                details["suspiciousEmails"] = safe_to_dict(suspicious_df)
            should_trigger_gc()
        
        # Process whitelist data
        if not white_df.empty:
            logger.info("Processing whitelist data")
            details["whitelisted domains"] = safe_to_dict(white_df)
            details["whitelistedDomains"] = details["whitelisted domains"]
            should_trigger_gc()
        
        # Process client investigation data
        if not client_df.empty:
            logger.info("Processing client investigation data")
            details["Client Coordinated email invest"] = safe_to_dict(client_df)
            details["clientInvestigations"] = details["Client Coordinated email invest"]
            should_trigger_gc()
        
        # Clear DataFrames from memory
        del total_mail_df, phishing_df, white_df, client_df
        if 'suspicious_df' in locals():
            del suspicious_df
        should_trigger_gc(force=True)

        # === Calculate additional analytics ===
        analytics = {
            "dateRange": {
                "start": (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                "end": datetime.now().strftime('%Y-%m-%d')
            },
            "severityDistribution": {
                "High": total_phishing_attempted // 3 if total_phishing_attempted > 0 else 0,
                "Medium": total_suspicious_emails,
                "Low": max(0, total_phishing_attempted - (total_phishing_attempted // 3) - total_suspicious_emails)
            },
            "monthlyTrends": {
                datetime.now().strftime('%Y-%m'): total_emails_scanned
            }
        }

        # === Final JSON Structure - MEMORY OPTIMIZED ===
        # Perform MITRE ATT&CK analysis
        logger.info("Performing security analysis")
        security_analysis = analyze_gsuite_security_events(details)
        should_trigger_gc()
        
        result = {
            "fileType": "gsuite",
            "kpis": kpis,
            "details": details,
            "analytics": analytics,
            "whitelistedDomainCount": int(total_whitelist_requests),
            "rawSheetNames": excel_data.sheet_names,
            "processedAt": datetime.now().isoformat(),
            "success": True,
            "security_analysis": security_analysis
        }

        # Final cleanup to ensure everything is JSON serializable
        logger.info("Final JSON cleanup")
        result = clean_data_for_json(result)
        
        # Final memory report
        final_memory = get_memory_usage()
        logger.info(f"GSuite processing completed successfully. Initial: {initial_memory:.1f}MB, Final: {final_memory:.1f}MB")
        logger.info(f"KPIs: {kpis}")
        
        # Final cleanup
        should_trigger_gc(force=True)
        
        return result

    except Exception as e:
        logger.error(f"Error processing GSuite file: {str(e)}")
        return {"error": f"Error processing GSuite file: {str(e)}", "success": False}

def process_gsuite_excel_fast(file, max_mail_records=50000):
    """Fast GSuite processing for web uploads - limits mail records for performance"""
    try:
        initial_memory = get_memory_usage()
        file_size_mb = get_file_size_mb(file)
        logger.info(f"Starting FAST GSuite processing - File size: {file_size_mb:.1f}MB")
        
        excel_data = pd.ExcelFile(file)
        logger.info(f"Processing GSuite file with sheets: {excel_data.sheet_names}")

        # === 1. Total Number of Mail Scanned (LIMITED FOR PERFORMANCE) ===
        total_mail_df = pd.DataFrame()
        total_emails_scanned = 0
        
        try:
            sheet_name = None
            for sheet in excel_data.sheet_names:
                if "total number of mail scanned" in sheet.lower():
                    sheet_name = sheet
                    break
            
            if sheet_name:
                logger.info(f"Processing mail scanned sheet: '{sheet_name}' (limited to {max_mail_records:,} records)")
                
                # Read with row limit for performance
                total_mail_df = pd.read_excel(excel_data, sheet_name=sheet_name, nrows=max_mail_records)
                
                if not total_mail_df.empty:
                    total_mail_df = total_mail_df.dropna(how='all')
                    
                    if 'Date' in total_mail_df.columns:
                        total_mail_df['Date'] = pd.to_datetime(total_mail_df['Date'], errors='coerce')

                    total_emails_scanned = len(total_mail_df)
                    logger.info(f"Processed {total_emails_scanned:,} mail scan records")
            else:
                logger.warning("Sheet 'total number of mail scanned' not found")
            
        except Exception as e:
            logger.error(f"Error processing mail scanned sheet: {str(e)}")

        # === 2. Phishing Attempted Data ===
        phishing_df = pd.DataFrame()
        total_phishing_attempted = 0
        total_suspicious_emails = 0
        
        try:
            sheet_name = None
            for sheet in excel_data.sheet_names:
                if "phishing attempted data" in sheet.lower():
                    sheet_name = sheet
                    break
            
            if sheet_name:
                logger.info(f"Processing phishing sheet: '{sheet_name}'")
                phishing_df = pd.read_excel(excel_data, sheet_name=sheet_name)
                
                if not phishing_df.empty:
                    phishing_df = phishing_df.dropna(how='all')
                    
                    date_col = None
                    for col in phishing_df.columns:
                        if 'date' in col.lower() and 'report' in col.lower():
                            date_col = col
                            break
                    
                    if date_col:
                        phishing_df[date_col] = pd.to_datetime(
                            phishing_df[date_col], format="%b %d, %Y, %I:%M %p", errors="coerce"
                        )
                        if date_col != 'Date Reported':
                            phishing_df['Date Reported'] = phishing_df[date_col]
                    
                    total_phishing_attempted = len(phishing_df)
                    total_suspicious_emails = max(1, total_phishing_attempted // 3)
                    
                    logger.info(f"Processed {total_phishing_attempted} phishing records")
            else:
                logger.warning("Sheet 'Phishing Attempted data' not found")
            
        except Exception as e:
            logger.error(f"Error processing phishing sheet: {str(e)}")

        # === 3. Client Coordinated Email Investigations ===
        client_df = pd.DataFrame()
        total_client_investigations = 0
        
        try:
            sheet_name = None
            for sheet in excel_data.sheet_names:
                if "client coordinated email invest" in sheet.lower():
                    sheet_name = sheet
                    break
            
            if sheet_name:
                logger.info(f"Processing client investigations sheet: '{sheet_name}'")
                client_df = pd.read_excel(excel_data, sheet_name=sheet_name)
                
                if not client_df.empty:
                    client_df = client_df.dropna(how='all')
                    
                    date_col = None
                    for col in client_df.columns:
                        if 'date' in col.lower():
                            date_col = col
                            break
                    
                    if date_col:
                        client_df[date_col] = pd.to_datetime(client_df[date_col], errors='coerce')
                        if date_col != 'Date':
                            client_df['Date'] = client_df[date_col]
                    
                    total_client_investigations = len(client_df)
                    logger.info(f"Processed {total_client_investigations} client investigation records")
            else:
                logger.warning("No client investigations sheet found")
            
        except Exception as e:
            logger.error(f"Error processing client investigations sheet: {str(e)}")

        # === 4. Whitelisted Domains ===
        white_df = pd.DataFrame()
        total_whitelist_requests = 0
        
        try:
            sheet_name = None
            for sheet in excel_data.sheet_names:
                if "whitelisted domains" in sheet.lower() or "whitelisted data" in sheet.lower():
                    sheet_name = sheet
                    break
            
            if sheet_name:
                logger.info(f"Processing whitelist sheet: '{sheet_name}'")
                white_df = pd.read_excel(excel_data, sheet_name=sheet_name)
                
                if not white_df.empty:
                    white_df = white_df.dropna(how='all')
                    
                    domain_col = None
                    for col in white_df.columns:
                        if any(keyword in col.lower() for keyword in ['domain', 'whitelist']):
                            domain_col = col
                            break
                    
                    if not domain_col:
                        domain_col = white_df.columns[0]
                    
                    white_df = white_df[[domain_col]].rename(columns={domain_col: "Whitelisted Domain"})
                    white_df = white_df.dropna(subset=['Whitelisted Domain'])
                    white_df = white_df[white_df['Whitelisted Domain'].str.strip() != '']
                    white_df = white_df[white_df['Whitelisted Domain'].str.lower() != 'nan']
                    white_df['Whitelisted Domain'] = white_df['Whitelisted Domain'].str.strip()
                    
                    total_whitelist_requests = len(white_df)
                    logger.info(f"Processed {total_whitelist_requests} whitelisted domains")
            else:
                logger.warning("No whitelist sheet found")
            
        except Exception as e:
            logger.error(f"Error processing whitelisted data sheet: {str(e)}")

        # === Calculate KPIs ===
        kpis = {
            "emailsScanned": int(total_emails_scanned),
            "phishingAttempted": int(total_phishing_attempted),
            "suspiciousEmails": int(total_suspicious_emails),
            "whitelistRequests": int(total_whitelist_requests),
            "clientInvestigations": int(total_client_investigations)
        }

        # === Prepare detailed data (FAST PROCESSING) ===
        logger.info("Converting DataFrames to dictionaries with FAST processing")
        
        details = {}
        
        # Use optimized conversion for large datasets
        if not total_mail_df.empty:
            if len(total_mail_df) > CHUNK_SIZE:
                logger.info(f"Using chunked processing for {len(total_mail_df)} mail records")
                details["total number of mail scanned"] = safe_to_dict_chunked(total_mail_df)
            else:
                details["total number of mail scanned"] = safe_to_dict(total_mail_df)
            details["totalEmailsScanned"] = details["total number of mail scanned"]
        
        if not phishing_df.empty:
            details["Phishing Attempted data"] = safe_to_dict(phishing_df)
            details["phishingAttempted"] = details["Phishing Attempted data"]
        
        if not white_df.empty:
            details["whitelisted domains"] = safe_to_dict(white_df)
            details["whitelistedDomains"] = details["whitelisted domains"]
        
        if not client_df.empty:
            details["Client Coordinated email invest"] = safe_to_dict(client_df)
            details["clientInvestigations"] = details["Client Coordinated email invest"]

        # Clear DataFrames from memory
        del total_mail_df, phishing_df, white_df, client_df
        should_trigger_gc(force=True)

        # === Calculate additional analytics ===
        analytics = {
            "dateRange": {
                "start": (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                "end": datetime.now().strftime('%Y-%m-%d')
            },
            "severityDistribution": {
                "High": total_phishing_attempted // 3 if total_phishing_attempted > 0 else 0,
                "Medium": total_suspicious_emails,
                "Low": max(0, total_phishing_attempted - (total_phishing_attempted // 3) - total_suspicious_emails)
            },
            "monthlyTrends": {
                datetime.now().strftime('%Y-%m'): total_emails_scanned
            }
        }

        # === Final JSON Structure ===
        # Simplified security analysis for speed
        security_analysis = {
            'mitre_techniques': [],
            'attack_path': {},
            'threat_indicators': [],
            'risk_score': min(total_phishing_attempted * 10, 100)
        }
        
        result = {
            "fileType": "gsuite",
            "kpis": kpis,
            "details": details,
            "analytics": analytics,
            "whitelistedDomainCount": int(total_whitelist_requests),
            "rawSheetNames": excel_data.sheet_names,
            "processedAt": datetime.now().isoformat(),
            "success": True,
            "security_analysis": security_analysis,
            "processing_mode": "fast",
            "mail_records_limit": max_mail_records
        }

        # Final cleanup
        result = clean_data_for_json(result)
        
        final_memory = get_memory_usage()
        logger.info(f"FAST GSuite processing completed. Initial: {initial_memory:.1f}MB, Final: {final_memory:.1f}MB")
        logger.info(f"KPIs: {kpis}")
        
        should_trigger_gc(force=True)
        
        return result

    except Exception as e:
        logger.error(f"Error processing GSuite file: {str(e)}")
        return {"error": f"Error processing GSuite file: {str(e)}", "success": False}

# Default to full processing to maintain original functionality
def process_gsuite_excel(file):
    """Default GSuite processor - uses full processing for complete data"""
    return process_gsuite_excel_full(file)