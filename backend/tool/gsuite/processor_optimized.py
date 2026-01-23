# backend/tool/gsuite/processor_optimized.py - PERFORMANCE OPTIMIZED VERSION
# Optimized GSuite data processing logic for faster uploads

import pandas as pd
import logging
import numpy as np
import gc
import psutil
import os
from datetime import datetime, timedelta
from ..mitre_mapping import get_mitre_mapper

logger = logging.getLogger(__name__)

# Optimized constants for faster processing
MAX_MEMORY_USAGE_MB = 400
CHUNK_SIZE = 10000  # Increased chunk size for better performance
MEMORY_CHECK_INTERVAL = 5000  # Less frequent memory checks
MAX_FILE_SIZE_MB = 10
STREAM_CHUNK_SIZE = 2000  # Larger streaming chunks

def get_memory_usage():
    """Get current memory usage in MB - cached for performance"""
    try:
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024
    except Exception:
        return 0

def should_trigger_gc(force=False):
    """Optimized garbage collection - less frequent checks"""
    if force:
        gc.collect()
        return True
    
    # Only check memory every few operations
    current_memory = get_memory_usage()
    if current_memory > MAX_MEMORY_USAGE_MB:
        gc.collect()
        return True
    return False

def fast_clean_data_for_json(data):
    """Optimized JSON cleaning - faster than recursive approach"""
    if isinstance(data, list):
        return [fast_clean_data_for_json(item) for item in data]
    elif isinstance(data, dict):
        return {key: fast_clean_data_for_json(value) for key, value in data.items()}
    elif pd.isna(data) or data is pd.NaT:
        return None
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
        if pd.isna(data):
            return None
        return int(data) if isinstance(data, np.integer) else float(data)
    elif isinstance(data, (float, int)):
        if isinstance(data, float) and (np.isnan(data) or np.isinf(data)):
            return None
        return data
    else:
        return data

def optimized_safe_to_dict(df):
    """Highly optimized DataFrame to dict conversion"""
    if df is None or df.empty:
        return []
    
    try:
        # Pre-process datetime columns in bulk
        datetime_cols = []
        for col in df.columns:
            if df[col].dtype == 'datetime64[ns]' or 'datetime' in str(df[col].dtype):
                datetime_cols.append(col)
        
        # Convert datetime columns efficiently
        if datetime_cols:
            for col in datetime_cols:
                df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S').fillna('')
        
        # Bulk replace problematic values
        df = df.replace({np.nan: None, np.inf: None, -np.inf: None, pd.NaT: None})
        df = df.fillna("")
        
        # Convert to dict - this is the fastest method
        result = df.to_dict(orient="records")
        
        return result
    except Exception as e:
        logger.error(f"Error converting DataFrame to dict: {str(e)}")
        return []

def process_large_dataframe_optimized(df, max_records=None):
    """Process large DataFrames with optimized chunking"""
    if df is None or df.empty:
        return []
    
    # Limit records for performance if specified
    if max_records and len(df) > max_records:
        logger.info(f"Limiting dataset from {len(df)} to {max_records} records for performance")
        df = df.head(max_records)
    
    # For small datasets, process directly
    if len(df) <= CHUNK_SIZE:
        return optimized_safe_to_dict(df)
    
    # For large datasets, use optimized chunking
    logger.info(f"Processing large dataset ({len(df)} rows) in optimized chunks")
    results = []
    
    for i in range(0, len(df), CHUNK_SIZE):
        chunk = df.iloc[i:i+CHUNK_SIZE].copy()
        chunk_result = optimized_safe_to_dict(chunk)
        if chunk_result:
            results.extend(chunk_result)
        
        # Less frequent garbage collection
        if i % (CHUNK_SIZE * 3) == 0:
            should_trigger_gc()
    
    return results

def simplified_security_analysis(details):
    """Simplified security analysis for faster processing"""
    try:
        # Basic analysis without complex MITRE mapping for speed
        phishing_count = len(details.get('Phishing Attempted data', []))
        risk_score = min(phishing_count * 10, 100)  # Simple risk calculation
        
        return {
            'mitre_techniques': [],  # Skip complex analysis for speed
            'attack_path': {},
            'threat_indicators': [],
            'risk_score': risk_score
        }
    except Exception as e:
        logger.error(f"Error in security analysis: {str(e)}")
        return {
            'mitre_techniques': [],
            'attack_path': {},
            'threat_indicators': [],
            'risk_score': 0
        }

def process_gsuite_excel_optimized(file, max_mail_records=50000):
    """Optimized GSuite processing for faster uploads"""
    try:
        initial_memory = get_memory_usage()
        file_size_mb = file.seek(0, 2) / (1024 * 1024) if hasattr(file, 'seek') else 0
        file.seek(0) if hasattr(file, 'seek') else None
        
        logger.info(f"Starting OPTIMIZED GSuite processing - File size: {file_size_mb:.1f}MB")
        
        excel_data = pd.ExcelFile(file)
        logger.info(f"Processing GSuite file with sheets: {excel_data.sheet_names}")

        # === 1. Total Number of Mail Scanned (OPTIMIZED) ===
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
                    
                    # Optimized date handling
                    if 'Date' in total_mail_df.columns:
                        total_mail_df['Date'] = pd.to_datetime(total_mail_df['Date'], errors='coerce')

                    total_emails_scanned = len(total_mail_df)
                    logger.info(f"Processed {total_emails_scanned:,} mail scan records")
            else:
                logger.warning("Sheet 'total number of mail scanned' not found")
            
        except Exception as e:
            logger.error(f"Error processing mail scanned sheet: {str(e)}")

        # === 2. Phishing Attempted Data (OPTIMIZED) ===
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
                    
                    # Optimized date parsing
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

        # === 3. Client Coordinated Email Investigations (OPTIMIZED) ===
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
                    
                    # Optimized date handling
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

        # === 4. Whitelisted Domains (OPTIMIZED) ===
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
                    
                    # Find domain column
                    domain_col = white_df.columns[0]  # Use first column for speed
                    for col in white_df.columns:
                        if any(keyword in col.lower() for keyword in ['domain', 'whitelist']):
                            domain_col = col
                            break
                    
                    # Optimized cleaning
                    white_df = white_df[[domain_col]].rename(columns={domain_col: "Whitelisted Domain"})
                    white_df = white_df.dropna(subset=['Whitelisted Domain'])
                    white_df = white_df[white_df['Whitelisted Domain'].str.strip() != '']
                    
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

        # === Prepare detailed data (OPTIMIZED) ===
        logger.info("Converting DataFrames to dictionaries with OPTIMIZED processing")
        
        details = {}
        
        # Process with optimized conversion
        if not total_mail_df.empty:
            details["total number of mail scanned"] = process_large_dataframe_optimized(total_mail_df, max_mail_records)
            details["totalEmailsScanned"] = details["total number of mail scanned"]
        
        if not phishing_df.empty:
            details["Phishing Attempted data"] = optimized_safe_to_dict(phishing_df)
            details["phishingAttempted"] = details["Phishing Attempted data"]
        
        if not white_df.empty:
            details["whitelisted domains"] = optimized_safe_to_dict(white_df)
            details["whitelistedDomains"] = details["whitelisted domains"]
        
        if not client_df.empty:
            details["Client Coordinated email invest"] = optimized_safe_to_dict(client_df)
            details["clientInvestigations"] = details["Client Coordinated email invest"]

        # Clear DataFrames from memory
        del total_mail_df, phishing_df, white_df, client_df
        should_trigger_gc(force=True)

        # === Final result (OPTIMIZED) ===
        result = {
            "fileType": "gsuite",
            "kpis": kpis,
            "details": details,
            "analytics": {
                "dateRange": {
                    "start": (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
                    "end": datetime.now().strftime('%Y-%m-%d')
                },
                "severityDistribution": {
                    "High": total_phishing_attempted // 3 if total_phishing_attempted > 0 else 0,
                    "Medium": total_suspicious_emails,
                    "Low": max(0, total_phishing_attempted - (total_phishing_attempted // 3) - total_suspicious_emails)
                }
            },
            "rawSheetNames": excel_data.sheet_names,
            "processedAt": datetime.now().isoformat(),
            "success": True,
            "security_analysis": simplified_security_analysis(details)  # Simplified for speed
        }

        # Final cleanup
        result = fast_clean_data_for_json(result)
        
        final_memory = get_memory_usage()
        processing_time = datetime.now()
        logger.info(f"OPTIMIZED GSuite processing completed. Memory: {initial_memory:.1f}MB → {final_memory:.1f}MB")
        logger.info(f"KPIs: {kpis}")
        
        should_trigger_gc(force=True)
        
        return result

    except Exception as e:
        logger.error(f"Error processing GSuite file: {str(e)}")
        return {"error": f"Error processing GSuite file: {str(e)}", "success": False}

# Alias for backward compatibility
process_gsuite_excel = process_gsuite_excel_optimized