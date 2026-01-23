# backend/tool/shared/data_utils.py
# Shared utilities for data cleaning and processing

import pandas as pd
import numpy as np
import math
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def clean_data_for_json(data):
    """Clean data to make it JSON serializable by handling NaN values and inf values"""
    if isinstance(data, dict):
        return {key: clean_data_for_json(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [clean_data_for_json(item) for item in data]
    elif isinstance(data, (np.integer, np.floating)):
        if pd.isna(data) or np.isnan(data) or np.isinf(data):
            return None
        return float(data) if isinstance(data, np.floating) else int(data)
    elif isinstance(data, (float, int)):
        # Handle Python native float/int that might be NaN or inf
        if isinstance(data, float) and (math.isnan(data) or math.isinf(data)):
            return None
        return data
    elif pd.isna(data):
        return None
    elif isinstance(data, str) and data.lower() in ['nan', 'none', '', 'inf', '-inf']:
        return None
    elif data is None:
        return None
    else:
        return data

def safe_to_dict(df):
    """Safely convert DataFrame to dict with comprehensive NaN handling"""
    if df is None or df.empty:
        return []
    
    # Replace all problematic values
    df_clean = df.copy()
    
    # Replace various forms of NaN and inf
    df_clean = df_clean.replace({
        np.nan: None, 
        np.inf: None, 
        -np.inf: None,
        'NaN': None, 
        'nan': None, 
        'inf': None,
        '-inf': None,
        '': None,
        'null': None,
        'NULL': None
    })
    
    try:
        result = df_clean.to_dict(orient="records")
        # Clean the result recursively
        return clean_data_for_json(result)
    except Exception as e:
        logger.error(f"Error converting DataFrame to dict: {str(e)}")
        return []

def safe_float(value, default=0.0):
    """Safely convert value to float, handling NaN and inf"""
    try:
        if value is None or pd.isna(value):
            return default
        
        float_val = float(value)
        
        if math.isnan(float_val) or math.isinf(float_val):
            return default
            
        return float_val
    except (ValueError, TypeError, OverflowError):
        return default

def safe_int(value, default=0):
    """Safely convert value to int, handling NaN and inf"""
    try:
        if value is None or pd.isna(value):
            return default
        
        if isinstance(value, (int, np.integer)):
            return int(value)
        
        float_val = float(value)
        
        if math.isnan(float_val) or math.isinf(float_val):
            return default
            
        return int(float_val)
    except (ValueError, TypeError, OverflowError):
        return default

def safe_percentage(numerator, denominator, default=0.0):
    """Safely calculate percentage, handling division by zero and NaN"""
    try:
        num = safe_float(numerator, 0)
        den = safe_float(denominator, 1)
        
        if den == 0:
            return default
        
        result = (num / den) * 100
        
        if math.isnan(result) or math.isinf(result):
            return default
            
        return round(result, 2)
    except:
        return default

def parse_date(date_val):
    """Parse various date formats with NaN handling"""
    if pd.isna(date_val) or date_val is None:
        return None
    
    if isinstance(date_val, (pd.Timestamp, datetime)):
        return date_val
    
    date_str = str(date_val).strip()
    if not date_str or date_str.lower() in ['nan', 'none', '', 'nat']:
        return None
    
    # Try multiple date formats
    date_formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%d',
        '%d/%m/%Y %H:%M:%S',
        '%d/%m/%Y',
        '%m/%d/%Y %H:%M:%S',
        '%m/%d/%Y',
        '%d-%m-%Y %H:%M:%S',
        '%d-%m-%Y'
    ]
    
    for fmt in date_formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    # If all else fails, try pandas
    try:
        parsed = pd.to_datetime(date_str)
        if pd.isna(parsed):
            return None
        return parsed.to_pydatetime()
    except:
        logger.warning(f"Could not parse date: {date_str}")
        return None