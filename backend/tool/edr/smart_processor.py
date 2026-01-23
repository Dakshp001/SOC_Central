# backend/tool/edr/smart_processor.py
# Smart processor that automatically selects between dynamic and static processing

import pandas as pd
import logging
from typing import Dict, Any

try:
    from .processor import process_edr_excel
    from .dynamic_processor import process_edr_excel_dynamic
except ImportError:
    from backend.tool.edr.processor import process_edr_excel
    from backend.tool.edr.dynamic_processor import process_edr_excel_dynamic

logger = logging.getLogger(__name__)

def analyze_file_structure(file) -> Dict[str, Any]:
    """
    Analyze the file structure to determine which processor to use
    """
    try:
        excel_data = pd.ExcelFile(file)
        sheet_names = excel_data.sheet_names
        
        analysis = {
            'total_sheets': len(sheet_names),
            'sheet_names': sheet_names,
            'has_traditional_structure': False,
            'complexity_score': 0,
            'recommended_processor': 'dynamic'
        }
        
        # Check for traditional EDR structure
        traditional_sheets = {'endpoints', 'detailed status', 'threats'}
        found_traditional = sum(1 for sheet in sheet_names 
                               if any(traditional in sheet.lower() for traditional in traditional_sheets))
        
        if found_traditional >= 2:
            analysis['has_traditional_structure'] = True
            analysis['complexity_score'] += 2
        
        # Analyze first few sheets for column complexity
        for i, sheet_name in enumerate(sheet_names[:3]):  # Check first 3 sheets
            try:
                df = pd.read_excel(excel_data, sheet_name=sheet_name, nrows=5)  # Sample first 5 rows
                
                # Column count complexity
                col_count = len(df.columns)
                if col_count > 15:
                    analysis['complexity_score'] += 2
                elif col_count > 8:
                    analysis['complexity_score'] += 1
                
                # Check for non-standard column names
                standard_patterns = ['name', 'status', 'date', 'time', 'id', 'endpoint', 'user']
                non_standard_cols = 0
                for col in df.columns:
                    col_lower = str(col).lower()
                    if not any(pattern in col_lower for pattern in standard_patterns):
                        non_standard_cols += 1
                
                if non_standard_cols > col_count * 0.5:  # More than 50% non-standard
                    analysis['complexity_score'] += 3
                    
            except Exception as e:
                logger.warning(f"Error analyzing sheet {sheet_name}: {str(e)}")
                analysis['complexity_score'] += 1  # Unknown structure adds complexity
        
        # Determine processor recommendation
        if analysis['has_traditional_structure'] and analysis['complexity_score'] <= 3:
            analysis['recommended_processor'] = 'original'
        else:
            analysis['recommended_processor'] = 'dynamic'
            
        # Force dynamic for high complexity or non-traditional structure
        if analysis['complexity_score'] > 5 or not analysis['has_traditional_structure']:
            analysis['recommended_processor'] = 'dynamic'
        
        logger.info(f"File structure analysis: {analysis}")
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing file structure: {str(e)}")
        return {
            'total_sheets': 0,
            'sheet_names': [],
            'has_traditional_structure': False,
            'complexity_score': 10,  # High complexity for unknown
            'recommended_processor': 'dynamic',
            'analysis_error': str(e)
        }

def process_edr_excel_smart(file) -> Dict[str, Any]:
    """
    Smart processor that automatically chooses the best processing method
    """
    logger.info("Starting smart EDR processing...")
    
    # Reset file position
    file.seek(0)
    
    # Analyze file structure
    analysis = analyze_file_structure(file)
    processor_choice = analysis['recommended_processor']
    
    # Reset file position again
    file.seek(0)
    
    logger.info(f"Smart processor chose: {processor_choice}")
    
    try:
        if processor_choice == 'original' and analysis['has_traditional_structure']:
            logger.info("Using original static EDR processor...")
            result = process_edr_excel(file)
            
            # Validate result quality
            if not _validate_processing_result(result):
                logger.warning("Original processor failed validation, falling back to dynamic processor...")
                file.seek(0)
                result = process_edr_excel_dynamic(file)
                result['processor_used'] = 'dynamic_fallback'
            else:
                result['processor_used'] = 'original'
                
        else:
            logger.info("Using dynamic EDR processor...")
            result = process_edr_excel_dynamic(file)
            result['processor_used'] = 'dynamic'
        
        # Add analysis metadata to result
        result['structure_analysis'] = analysis
        
        return result
        
    except Exception as e:
        logger.error(f"Smart processor error with {processor_choice}: {str(e)}")
        
        # Final fallback attempt
        try:
            logger.info("Attempting fallback to dynamic processor...")
            file.seek(0)
            result = process_edr_excel_dynamic(file)
            result['processor_used'] = 'dynamic_fallback_final'
            result['structure_analysis'] = analysis
            result['fallback_reason'] = str(e)
            return result
        except Exception as final_error:
            logger.error(f"Final fallback also failed: {str(final_error)}")
            return {
                "error": f"All processors failed. Original: {str(e)}, Fallback: {str(final_error)}", 
                "success": False,
                "processor_used": "failed",
                "structure_analysis": analysis
            }

def _validate_processing_result(result: Dict[str, Any]) -> bool:
    """
    Validate that processing result meets minimum quality standards
    """
    try:
        # Check for error in result
        if result.get('error') or not result.get('success', True):
            return False
        
        # Check for basic structure
        if not isinstance(result.get('kpis'), dict):
            return False
        
        # Check that some data was processed
        kpis = result.get('kpis', {})
        total_records = (
            kpis.get('totalEndpoints', 0) + 
            kpis.get('totalThreats', 0) + 
            len(result.get('details', {}).get('endpoints', [])) +
            len(result.get('details', {}).get('threats', []))
        )
        
        if total_records == 0:
            return False
        
        return True
        
    except Exception as e:
        logger.warning(f"Error validating processing result: {str(e)}")
        return False

# Additional utility functions for compatibility
def get_processor_capabilities() -> Dict[str, Any]:
    """
    Return information about available processors and their capabilities
    """
    return {
        'available_processors': ['original', 'dynamic', 'smart'],
        'original': {
            'description': 'Static processor for standard EDR file formats',
            'requirements': ['Endpoints', 'Detailed Status', 'Threats sheets'],
            'best_for': 'Standard EDR exports with known structure'
        },
        'dynamic': {
            'description': 'Flexible processor that adapts to any data structure',
            'requirements': ['Any Excel file with tabular data'],
            'best_for': 'Non-standard formats, custom exports, varied structures'
        },
        'smart': {
            'description': 'Automatically selects best processor based on data analysis',
            'requirements': ['Any Excel file'],
            'best_for': 'Unknown or mixed data structures'
        }
    }

def process_with_specific_processor(file, processor_type: str = 'smart') -> Dict[str, Any]:
    """
    Process file with a specific processor type
    """
    file.seek(0)
    
    if processor_type == 'original':
        return process_edr_excel(file)
    elif processor_type == 'dynamic':
        return process_edr_excel_dynamic(file)
    elif processor_type == 'smart':
        return process_edr_excel_smart(file)
    else:
        raise ValueError(f"Unknown processor type: {processor_type}")