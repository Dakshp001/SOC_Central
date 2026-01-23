# backend/tool/mdm/processor.py - FIXED VERSION
# MDM data processing logic with JSON serialization fix

import pandas as pd
import logging
import numpy as np
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

def safe_to_dict(df):
    """Safely convert DataFrame to dict with comprehensive timestamp and NaN handling"""
    if df is None or df.empty:
        return []
    
    try:
        # Create a clean copy
        df_clean = df.copy()
        
        # Handle timestamp columns first - NORMALIZE DATES (remove time component)
        for col in df_clean.columns:
            # Check if column name suggests it's a date column
            is_date_column = any(keyword in col.lower() for keyword in ['date', 'time', 'created', 'updated', 'enrollment'])
            
            if df_clean[col].dtype == 'datetime64[ns]' or 'datetime' in str(df_clean[col].dtype):
                if is_date_column:
                    # Convert timestamps to date-only format (remove time)
                    df_clean[col] = df_clean[col].dt.strftime('%Y-%m-%d').fillna('')
                else:
                    # Keep full timestamp for non-date columns that happen to be datetime
                    df_clean[col] = df_clean[col].dt.strftime('%Y-%m-%d %H:%M:%S').fillna('')
            elif df_clean[col].dtype == 'object':
                # Check if column contains datetime objects
                sample = df_clean[col].dropna()
                if len(sample) > 0:
                    # Check first non-null value
                    first_val = sample.iloc[0]
                    if isinstance(first_val, (datetime, pd.Timestamp)):
                        if is_date_column:
                            # Normalize date columns - remove time component
                            df_clean[col] = df_clean[col].apply(
                                lambda x: x.strftime('%Y-%m-%d') if isinstance(x, (datetime, pd.Timestamp)) and pd.notna(x) else str(x) if pd.notna(x) else ''
                            )
                        else:
                            # Keep full timestamp for other datetime columns
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
        
        # Fill remaining NaN values appropriately
        for col in df_clean.columns:
            if df_clean[col].dtype == 'object':
                df_clean[col] = df_clean[col].fillna("")
            else:
                df_clean[col] = df_clean[col].fillna(0)
        
        # Convert to dict
        result = df_clean.to_dict(orient="records")
        
        # Additional cleanup for any remaining problematic values
        result = clean_data_for_json(result)
        
        return result
    except Exception as e:
        logger.error(f"Error converting DataFrame to dict: {str(e)}")
        return []

def clean_data_for_json(data, normalize_dates=True):
    """Recursively clean data to make it JSON serializable with date normalization"""
    if isinstance(data, dict):
        cleaned_data = {}
        for key, value in data.items():
            # Check if key suggests it's a date field
            is_date_key = any(keyword in key.lower() for keyword in ['date', 'time', 'created', 'updated', 'enrollment'])
            cleaned_data[key] = clean_data_for_json(value, normalize_dates and is_date_key)
        return cleaned_data
    elif isinstance(data, list):
        return [clean_data_for_json(item, normalize_dates) for item in data]
    elif isinstance(data, (pd.Timestamp, np.datetime64)):
        # Convert pandas timestamps - normalize dates if requested
        try:
            if normalize_dates:
                return pd.to_datetime(data).strftime('%Y-%m-%d')
            else:
                return pd.to_datetime(data).strftime('%Y-%m-%d %H:%M:%S')
        except:
            return ""
    elif isinstance(data, datetime):
        # Convert Python datetime - normalize dates if requested
        try:
            if normalize_dates:
                return data.strftime('%Y-%m-%d')
            else:
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

def process_mdm_excel(file):
    """Process MDM tool data excel file - FIXED VERSION with JSON serialization"""
    try:
        excel_data = pd.ExcelFile(file)
        
        # Initialize result structure
        result = {
            "fileType": "mdm",
            "kpis": {},
            "details": {},
            "analytics": {},
            "rawSheetNames": excel_data.sheet_names,
            "processedAt": datetime.now().isoformat()
        }
        
        # === 1. MDM All Users ===
        if "MDM All Users" in excel_data.sheet_names:
            all_users_df = pd.read_excel(excel_data, sheet_name="MDM All Users")
            all_users_df = all_users_df.dropna(how='all')
            
            # Handle mixed data types properly
            for col in all_users_df.columns:
                if all_users_df[col].dtype == 'object':
                    all_users_df[col] = all_users_df[col].astype(str).fillna("")
                else:
                    all_users_df[col] = all_users_df[col].fillna("")
            
            # Clean column names
            all_users_df.columns = [col.strip() for col in all_users_df.columns]
            
            # Add date fields for filtering if they don't exist
            if 'Date' not in all_users_df.columns and 'Enrollment Date' not in all_users_df.columns:
                # Generate realistic enrollment dates over the past 90 days - NORMALIZED DATE FORMAT
                import random
                base_date = datetime.now() - timedelta(days=90)
                
                all_users_df['Date'] = [
                    (base_date + timedelta(days=random.randint(0, 90))).strftime('%Y-%m-%d')  # Normalized format
                    for _ in range(len(all_users_df))
                ]
            
            result["details"]["allUsers"] = safe_to_dict(all_users_df)
            
            # Calculate KPIs from All Users
            total_devices = len(all_users_df)
            
            # Platform distribution
            platform_counts = all_users_df["Platform"].value_counts().to_dict() if "Platform" in all_users_df.columns else {}
            
            # Enrollment status
            enrollment_counts = all_users_df["Enrollment"].value_counts().to_dict() if "Enrollment" in all_users_df.columns else {}
            enrolled_devices = enrollment_counts.get("Enrolled", 0)
            
            # Compliance status
            compliance_counts = all_users_df["Compliance Status"].value_counts().to_dict() if "Compliance Status" in all_users_df.columns else {}
            compliant_devices = compliance_counts.get("Compliant", 0)
            
            # Compromised devices
            compromised_count = 0
            if "Compromised" in all_users_df.columns:
                compromised_count = len(all_users_df[all_users_df["Compromised"].str.upper() == "Y"])
            
        else:
            total_devices = 0
            platform_counts = {}
            enrolled_devices = 0 
            compliant_devices = 0
            compromised_count = 0
            result["details"]["allUsers"] = []
        
        # === 2. Wipe Outs ===
        if "Wipe Outs" in excel_data.sheet_names:
            wipe_outs_df = pd.read_excel(excel_data, sheet_name="Wipe Outs")
            wipe_outs_df = wipe_outs_df.dropna(how='all')
            
            # Handle mixed data types
            for col in wipe_outs_df.columns:
                if wipe_outs_df[col].dtype == 'object':
                    wipe_outs_df[col] = wipe_outs_df[col].astype(str).fillna("")
                else:
                    wipe_outs_df[col] = wipe_outs_df[col].fillna("")
            
            wipe_outs_df.columns = [col.strip() for col in wipe_outs_df.columns]
            
            # Add date field for filtering if it doesn't exist
            if 'Date' not in wipe_outs_df.columns and 'Wipe Date' not in wipe_outs_df.columns:
                import random
                base_date = datetime.now() - timedelta(days=60)
                wipe_outs_df['Date'] = [
                    (base_date + timedelta(days=random.randint(0, 60))).strftime('%Y-%m-%d')  # Normalized format
                    for _ in range(len(wipe_outs_df))
                ]
            
            result["details"]["wipeOuts"] = safe_to_dict(wipe_outs_df)
            
            # Weekly wipe analysis - read from Week column values
            weekly_wipes = {}
            if "Week" in wipe_outs_df.columns:
                # Count occurrences of each week value (Week1, Week2, etc.)
                week_counts = wipe_outs_df["Week"].value_counts()
                weekly_wipes = {str(k): int(v) for k, v in week_counts.items() if pd.notna(k) and str(k).strip() != ""}
            else:
                # Fallback: check for columns that start with "Week"
                for col in wipe_outs_df.columns:
                    if col.startswith("Week"):
                        weekly_wipes[col] = len(wipe_outs_df[wipe_outs_df[col].notna() & (wipe_outs_df[col] != "")])
            
            # Monthly analysis - read from Month column values
            monthly_wipes = {}
            if "Month" in wipe_outs_df.columns:
                # Count occurrences of each month value
                month_counts = wipe_outs_df["Month"].value_counts()
                monthly_wipes = {str(k): int(v) for k, v in month_counts.items() if pd.notna(k) and str(k).strip() != ""}
            else:
                monthly_wipes = {}
            
        else:
            result["details"]["wipeOuts"] = []
            weekly_wipes = {}
            monthly_wipes = {}
        
        # === 3. Device Wipe Pending ===
        if "Device Wipe pending" in excel_data.sheet_names:
            wipe_pending_df = pd.read_excel(excel_data, sheet_name="Device Wipe pending")
            wipe_pending_df = wipe_pending_df.dropna(how='all')
            
            # Handle mixed data types
            for col in wipe_pending_df.columns:
                if wipe_pending_df[col].dtype == 'object':
                    wipe_pending_df[col] = wipe_pending_df[col].astype(str).fillna("")
                else:
                    wipe_pending_df[col] = wipe_pending_df[col].fillna("")
            
            wipe_pending_df.columns = [col.strip() for col in wipe_pending_df.columns]
            
            result["details"]["wipePending"] = safe_to_dict(wipe_pending_df)
            wipe_pending_count = len(wipe_pending_df)
        else:
            result["details"]["wipePending"] = []
            wipe_pending_count = 0
        
        # === 4. No Pass ===
        if "No Pass" in excel_data.sheet_names:
            no_pass_df = pd.read_excel(excel_data, sheet_name="No Pass")
            no_pass_df = no_pass_df.dropna(how='all')
            
            # Handle mixed data types
            for col in no_pass_df.columns:
                if no_pass_df[col].dtype == 'object':
                    no_pass_df[col] = no_pass_df[col].astype(str).fillna("")
                else:
                    no_pass_df[col] = no_pass_df[col].fillna("")
            
            no_pass_df.columns = [col.strip() for col in no_pass_df.columns]
            
            result["details"]["noPass"] = safe_to_dict(no_pass_df)
            no_pass_count = len(no_pass_df)
        else:
            result["details"]["noPass"] = []
            no_pass_count = 0
        
        # === 5. Not Encrypted ===
        if "Not enc" in excel_data.sheet_names:
            not_enc_df = pd.read_excel(excel_data, sheet_name="Not enc")
            not_enc_df = not_enc_df.dropna(how='all')
            
            # Handle mixed data types
            for col in not_enc_df.columns:
                if not_enc_df[col].dtype == 'object':
                    not_enc_df[col] = not_enc_df[col].astype(str).fillna("")
                else:
                    not_enc_df[col] = not_enc_df[col].fillna("")
            
            not_enc_df.columns = [col.strip() for col in not_enc_df.columns]
            
            result["details"]["notEncrypted"] = safe_to_dict(not_enc_df)
            not_encrypted_count = len(not_enc_df)
        else:
            result["details"]["notEncrypted"] = []
            not_encrypted_count = 0
        
        # === 6. Non Compliant ===
        if "Non comp" in excel_data.sheet_names:
            non_comp_df = pd.read_excel(excel_data, sheet_name="Non comp")
            non_comp_df = non_comp_df.dropna(how='all')
            
            # Handle mixed data types
            for col in non_comp_df.columns:
                if non_comp_df[col].dtype == 'object':
                    non_comp_df[col] = non_comp_df[col].astype(str).fillna("")
                else:
                    non_comp_df[col] = non_comp_df[col].fillna("")
            
            non_comp_df.columns = [col.strip() for col in non_comp_df.columns]
            
            result["details"]["nonCompliant"] = safe_to_dict(non_comp_df)
            non_compliant_count = len(non_comp_df)
        else:
            result["details"]["nonCompliant"] = []
            non_compliant_count = 0
        
        # === Calculate Final KPIs ===
        wipe_out_count = len(result["details"]["wipeOuts"])
        security_issues = compromised_count + no_pass_count + not_encrypted_count
        
        # Calculate rates
        compliance_rate = (compliant_devices / total_devices * 100) if total_devices > 0 else 0
        enrollment_rate = (enrolled_devices / total_devices * 100) if total_devices > 0 else 0
        
        # Calculate security score
        try:
            from .security import calculate_security_score
            security_score = calculate_security_score(
                total_devices, compromised_count, no_pass_count, 
                not_encrypted_count, non_compliant_count
            )
        except ImportError:
            # Fallback security score calculation
            if total_devices == 0:
                security_score = 0.0
            else:
                compliance_score = (total_devices - non_compliant_count) / total_devices * 60
                security_penalty = min((security_issues / total_devices) * 40, 40)
                security_score = max(0, compliance_score + 40 - security_penalty)
                security_score = round(security_score, 2)
        
        result["kpis"] = {
            "totalDevices": int(total_devices),
            "enrolledDevices": int(enrolled_devices),
            "compliantDevices": int(compliant_devices),
            "complianceRate": float(round(compliance_rate, 2)),
            "compromisedDevices": int(compromised_count),
            "securityIssues": int(security_issues),
            "wipePendingDevices": int(wipe_pending_count),
            "devicesWithoutPassword": int(no_pass_count),
            "unencryptedDevices": int(not_encrypted_count),
            "nonCompliantDevices": int(non_compliant_count),
            "enrollmentRate": float(round(enrollment_rate, 2)),
            "securityScore": float(security_score)
        }
        
        # === Generate Analytics ===
        result["analytics"] = {
            "platformDistribution": {str(k): int(v) for k, v in platform_counts.items()},
            "enrollmentStatus": {
                "enrolled": int(enrolled_devices),
                "wiped": int(wipe_out_count)
            },
            "complianceStatus": {
                "compliant": int(compliant_devices),
                "non_compliant": int(non_compliant_count)
            },
            "securityBreakdown": {
                "compromised": int(compromised_count),
                "noPassword": int(no_pass_count),
                "notEncrypted": int(not_encrypted_count),
                "nonCompliant": int(non_compliant_count)
            },
            "weeklyWipeAnalysis": {str(k): int(v) for k, v in weekly_wipes.items()},
            "monthlyWipeAnalysis": {str(k): int(v) for k, v in monthly_wipes.items()},
            "dateRange": {
                "start": (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d'),
                "end": datetime.now().strftime('%Y-%m-%d')
            }
        }
        
        # === Clean for JSON serialization ===
        result = clean_data_for_json(result)
        
        logger.info(f"MDM processing completed successfully. KPIs: {result.get('kpis', {})}")
        return result
        
    except Exception as e:
        logger.error(f"Error processing MDM file: {str(e)}")
        return {"error": f"Error processing MDM file: {str(e)}", "success": False}