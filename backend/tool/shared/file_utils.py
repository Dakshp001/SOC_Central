# backend/tool/shared/file_utils.py - ENHANCED VERSION
# File detection with improved surface/deep sheet filtering

import pandas as pd
import logging

logger = logging.getLogger(__name__)

def validate_excel_file(uploaded_file):
    """Validate uploaded Excel file"""
    if not uploaded_file:
        raise ValueError("No file provided")
    
    if not uploaded_file.name.endswith(('.xlsx', '.xls')):
        raise ValueError("Invalid file format. Please upload an Excel file.")
    
    # Check file size (max 50MB)
    max_size = 50 * 1024 * 1024  # 50MB
    if uploaded_file.size > max_size:
        raise ValueError("File too large. Maximum size is 50MB.")
    
    return True

def filter_working_sheets(sheet_names):
    """Filter out surface, deep, and similar sheets from sheet names"""
    
    # Define patterns to ignore (case-insensitive)
    ignore_patterns = [
        'surface',
        'deep', 
        'surface 1',
        'surface 2', 
        'surface 3',
        'deep 1',
        'deep 2',
        'deep 3'
    ]
    
    working_sheets = []
    ignored_sheets = []
    
    for sheet in sheet_names:
        sheet_lower = sheet.lower().strip()
        
        # Check if sheet should be ignored
        should_ignore = False
        for pattern in ignore_patterns:
            if sheet_lower == pattern:
                should_ignore = True
                break
        
        if should_ignore:
            ignored_sheets.append(sheet)
        else:
            working_sheets.append(sheet)
    
    logger.info(f"Filtered sheets - Working: {working_sheets}, Ignored: {ignored_sheets}")
    
    return {
        'working_sheets': working_sheets,
        'ignored_sheets': ignored_sheets
    }

def get_file_type(file):
    """Enhanced file type detection - filters out surface/deep sheets"""
    try:
        excel_data = pd.ExcelFile(file)
        all_sheet_names = excel_data.sheet_names
        
        # Filter working sheets
        sheet_filter_result = filter_working_sheets(all_sheet_names)
        working_sheet_names = sheet_filter_result['working_sheets']
        ignored_sheets = sheet_filter_result['ignored_sheets']
        
        # Convert to lowercase for analysis
        sheet_names = [str(name).lower().strip() for name in working_sheet_names]
        
        logger.info(f"Detecting file type. All sheets: {all_sheet_names}")
        logger.info(f"Working with sheets (after filtering): {working_sheet_names}")
        logger.info(f"Ignored sheets: {ignored_sheets}")
        logger.info(f"Sheet names for analysis: {sheet_names}")
        
        # GSuite exact sheet matches (case-insensitive)
        gsuite_sheets = [
            "total number of mail scanned",
            "phishing attempted data", 
            "whitelisted data",
            "client coordinated email invest"
        ]
        
        # MDM exact sheet matches (case-insensitive)  
        mdm_sheets = [
            "mdm all users",
            "wipe outs",
            "device wipe pending", 
            "no pass",
            "not enc",
            "non comp"
        ]
        
        # EDR exact sheet matches (case-insensitive)
        edr_sheets = [
            "endpoints",
            "detailed status", 
            "threats"
        ]
        
        # Count exact matches
        gsuite_matches = sum(1 for sheet in gsuite_sheets if sheet in sheet_names)
        mdm_matches = sum(1 for sheet in mdm_sheets if sheet in sheet_names)
        edr_matches = sum(1 for sheet in edr_sheets if sheet in sheet_names)
        
        logger.info(f"GSuite matches: {gsuite_matches}, MDM matches: {mdm_matches}, EDR matches: {edr_matches}")
        
        # Prioritize matches - require strong confidence
        if edr_matches >= 3:  # All 3 EDR sheets present
            logger.info("Detected as EDR file (all 3 sheets present)")
            return "edr"
        elif gsuite_matches >= 2:  # At least 2 GSuite sheets
            logger.info("Detected as GSuite file")
            return "gsuite"
        elif mdm_matches >= 3:  # At least 3 MDM sheets
            logger.info("Detected as MDM file")
            return "mdm"
        elif edr_matches >= 2:  # At least 2 EDR sheets
            logger.info("Detected as EDR file (partial match)")
            return "edr"
        
        # If no clear match, check for SIEM patterns
        siem_patterns = ['siem', 'raw', 'data', 'events', 'april', 'jan', 'jul', 'oct', 'quarter']
        siem_matches = sum(1 for pattern in siem_patterns for sheet in sheet_names if pattern in sheet)
        
        if siem_matches > 0:
            logger.info("Detected as SIEM file")
            return "siem"
        
        # Check for other tool patterns
        sonicwall_patterns = ['firewall', 'block', 'deny', 'policy', 'vpn']
        meraki_patterns = ['network', 'device', 'access', 'bandwidth']
        
        sonicwall_matches = sum(1 for pattern in sonicwall_patterns for sheet in sheet_names if pattern in sheet)
        meraki_matches = sum(1 for pattern in meraki_patterns for sheet in sheet_names if pattern in sheet)
        
        if sonicwall_matches > 0:
            logger.info("Detected as SonicWall file")
            return "sonicwall"
        elif meraki_matches > 0:
            logger.info("Detected as Meraki file")
            return "meraki"
            
        # Final fallback
        logger.info("Could not detect file type, defaulting to unknown")
        return "unknown"
        
    except Exception as e:
        logger.error(f"Error detecting file type: {str(e)}")
        return "unknown"

def get_working_sheet_names(file):
    """Get sheet names excluding surface and deep sheets"""
    try:
        excel_data = pd.ExcelFile(file)
        all_sheets = excel_data.sheet_names

        sheet_filter_result = filter_working_sheets(all_sheets)

        return {
            'all_sheets': all_sheets,
            'working_sheets': sheet_filter_result['working_sheets'],
            'ignored_sheets': sheet_filter_result['ignored_sheets']
        }
    except Exception as e:
        logger.error(f"Error getting sheet names: {str(e)}")
        return {
            'all_sheets': [],
            'working_sheets': [],
            'ignored_sheets': []
        }

def validate_sheet_format(df, sheet_name, tool_type, required_keywords=None):
    """
    Validate sheet format for proper column headers and data quality.

    Args:
        df: DataFrame to validate
        sheet_name: Name of the sheet being validated
        tool_type: Type of tool (e.g., 'SIEM', 'EDR', 'GSuite')
        required_keywords: Optional list of keywords that should be present in sheet name

    Returns:
        dict: {'valid': bool, 'error': str or None}
    """
    # Check 1: Verify sheet name contains required keywords (if provided)
    if required_keywords:
        sheet_name_lower = sheet_name.lower()
        has_required_keyword = any(keyword.lower() in sheet_name_lower for keyword in required_keywords)
        if not has_required_keyword:
            error_msg = (
                f"Invalid file: Sheet '{sheet_name}' does not contain expected keywords "
                f"({', '.join(required_keywords)}). "
                f"Please upload a file with sheet names matching the {tool_type} format "
                f"(e.g., '{required_keywords[0]} Data', '{required_keywords[0]} January', etc.)."
            )
            logger.error(error_msg)
            return {'valid': False, 'error': error_msg}

    # Check 2: Validate column headers - check for excessive unnamed columns
    unnamed_col_count = sum(1 for col in df.columns if 'Unnamed:' in str(col))
    total_cols = len(df.columns)
    unnamed_percentage = (unnamed_col_count / total_cols) * 100 if total_cols > 0 else 100

    if unnamed_percentage > 50:
        error_msg = (
            f"Invalid file format: Sheet '{sheet_name}' has {unnamed_percentage:.0f}% unnamed columns "
            f"({unnamed_col_count} out of {total_cols}). "
            f"Please ensure the file contains proper column headers "
            f"and matches the expected {tool_type} data format."
        )
        logger.error(error_msg)
        return {'valid': False, 'error': error_msg}

    # Check 3: Ensure sheet has some actual data (not all empty)
    if len(df) == 0:
        error_msg = (
            f"Invalid file: Sheet '{sheet_name}' contains no data rows. "
            f"Please upload a file with actual {tool_type} data."
        )
        logger.warning(error_msg)
        return {'valid': False, 'error': error_msg}

    return {'valid': True, 'error': None}