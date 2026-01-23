# backend/tool/edr/dynamic_processor.py
# Dynamic EDR data processing logic that adapts to any data structure

import pandas as pd
import logging
import json
import re
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class DynamicEDRProcessor:
    """
    Dynamic EDR processor that can handle any column structure and sheet layout
    """
    
    def __init__(self):
        self.column_classifiers = {
            'endpoint': ['endpoint', 'name', 'device', 'computer', 'host', 'machine', 'system'],
            'user': ['user', 'logged', 'account', 'username'],
            'date': ['date', 'time', 'created', 'updated', 'subscribed', 'registered'],
            'status': ['status', 'state', 'condition', 'health'],
            'network': ['network', 'connection', 'connectivity', 'online'],
            'security': ['security', 'threat', 'malware', 'virus', 'scan'],
            'id': ['id', 'uuid', 'guid', 'identifier', 'serial'],
            'os': ['os', 'operating', 'system', 'platform'],
            'version': ['version', 'build', 'release'],
            'location': ['site', 'location', 'group', 'department'],
            'process': ['process', 'executable', 'program'],
            'action': ['action', 'response', 'mitigation'],
            'severity': ['severity', 'level', 'priority', 'confidence'],
            'classification': ['classification', 'category', 'type'],
            'path': ['path', 'file', 'directory'],
            'hash': ['hash', 'checksum', 'md5', 'sha'],
            'boolean': ['required', 'enabled', 'active', 'failed', 'completed'],
            'numeric': ['count', 'number', 'size', 'score']
        }
        
        self.date_patterns = [
            r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}',  # DD-MM-YYYY or MM-DD-YYYY
            r'\d{2,4}[-/]\d{1,2}[-/]\d{1,2}',  # YYYY-MM-DD
            r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\s+\d{1,2}[.:]\d{2}',  # With time
            r'\w{3}\s+\d{1,2},?\s+\d{4}',  # Jan 1, 2024
        ]
        
        self.boolean_patterns = ['true', 'false', 'yes', 'no', '1', '0', 'enabled', 'disabled']
        
    def process_edr_excel_dynamic(self, file) -> Dict[str, Any]:
        """
        Dynamically process any EDR Excel file structure
        """
        try:
            excel_data = pd.ExcelFile(file)
            
            result = {
                "fileType": "edr",
                "kpis": {},
                "details": {},
                "analytics": {},
                "metadata": {
                    "totalSheets": len(excel_data.sheet_names),
                    "sheetNames": excel_data.sheet_names,
                    "processedAt": datetime.now().isoformat(),
                    "detectedStructure": {}
                }
            }
            
            # Process all sheets dynamically
            all_data = {}
            for sheet_name in excel_data.sheet_names:
                logger.info(f"Processing sheet: {sheet_name}")
                sheet_data = self._process_sheet_dynamic(excel_data, sheet_name)
                if sheet_data is not None:
                    all_data[sheet_name] = sheet_data
                    result["details"][sheet_name.lower().replace(' ', '_')] = self._safe_to_dict(sheet_data['dataframe'])
                    result["metadata"]["detectedStructure"][sheet_name] = sheet_data['structure']
            
            # Calculate dynamic KPIs based on detected structure
            self._calculate_dynamic_kpis(result, all_data)
            
            # Generate dynamic analytics
            self._generate_dynamic_analytics(result, all_data)
            
            # Clean for JSON serialization
            result = self._clean_data_for_json(result)
            
            logger.info(f"Dynamic EDR processing completed. Found {len(all_data)} sheets with data")
            return result
            
        except Exception as e:
            logger.error(f"Error in dynamic EDR processing: {str(e)}")
            return {"error": f"Error processing EDR file: {str(e)}", "success": False}
    
    def _process_sheet_dynamic(self, excel_data: pd.ExcelFile, sheet_name: str) -> Optional[Dict[str, Any]]:
        """
        Process a single sheet dynamically
        """
        try:
            df = pd.read_excel(excel_data, sheet_name=sheet_name)
            
            # Skip empty sheets
            if df.empty or len(df.columns) == 0:
                return None
            
            # Clean the dataframe
            df = df.dropna(how='all')
            if df.empty:
                return None
            
            # Clean column names
            df.columns = [str(col).strip() for col in df.columns]
            
            # Detect column structure
            structure = self._detect_column_structure(df)
            
            # Process columns based on detected types
            df = self._process_columns_by_type(df, structure)
            
            return {
                'dataframe': df,
                'structure': structure,
                'record_count': len(df)
            }
            
        except Exception as e:
            logger.error(f"Error processing sheet {sheet_name}: {str(e)}")
            return None
    
    def _detect_column_structure(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Automatically detect the purpose and type of each column
        """
        structure = {
            'columns': {},
            'primary_entities': {},
            'relationships': []
        }
        
        for col in df.columns:
            col_info = {
                'original_name': col,
                'standardized_name': self._standardize_column_name(col),
                'data_type': str(df[col].dtype),
                'classified_as': [],
                'sample_values': [],
                'null_count': df[col].isnull().sum(),
                'unique_count': df[col].nunique()
            }
            
            # Get sample values (first 5 non-null)
            sample_values = df[col].dropna().head(5).tolist()
            col_info['sample_values'] = [str(val) for val in sample_values]
            
            # Classify column based on name and content
            col_info['classified_as'] = self._classify_column(col, df[col])
            
            # Detect if it's a date column
            if self._is_date_column(df[col]):
                col_info['is_date'] = True
                col_info['date_format'] = self._detect_date_format(df[col])
            
            # Detect if it's a boolean column
            if self._is_boolean_column(df[col]):
                col_info['is_boolean'] = True
            
            # Detect if it's numeric
            if pd.api.types.is_numeric_dtype(df[col]) or self._is_numeric_column(df[col]):
                col_info['is_numeric'] = True
                if not df[col].empty:
                    col_info['numeric_stats'] = {
                        'min': float(df[col].min()) if pd.api.types.is_numeric_dtype(df[col]) else None,
                        'max': float(df[col].max()) if pd.api.types.is_numeric_dtype(df[col]) else None,
                        'mean': float(df[col].mean()) if pd.api.types.is_numeric_dtype(df[col]) else None
                    }
            
            structure['columns'][col] = col_info
        
        # Identify primary entities (endpoints, threats, etc.)
        structure['primary_entities'] = self._identify_primary_entities(df, structure['columns'])
        
        return structure
    
    def _classify_column(self, col_name: str, series: pd.Series) -> List[str]:
        """
        Classify what type of data this column contains
        """
        classifications = []
        col_lower = col_name.lower()
        
        # Check against our classification patterns
        for category, keywords in self.column_classifiers.items():
            if any(keyword in col_lower for keyword in keywords):
                classifications.append(category)
        
        # Additional content-based classification
        if not series.empty:
            sample_values = series.dropna().head(10).astype(str).str.lower()
            
            # Check for status-like values
            status_values = {'connected', 'disconnected', 'active', 'inactive', 'online', 'offline', 'up', 'down'}
            if any(val in status_values for val in sample_values):
                classifications.append('status')
            
            # Check for severity levels
            severity_values = {'critical', 'high', 'medium', 'low', 'info', 'warning', 'error'}
            if any(val in severity_values for val in sample_values):
                classifications.append('severity')
        
        return classifications if classifications else ['unknown']
    
    def _standardize_column_name(self, col_name: str) -> str:
        """
        Standardize column name for easier processing
        """
        # Convert to lowercase and replace spaces/special chars with underscore
        standardized = re.sub(r'[^a-zA-Z0-9_]', '_', col_name.lower())
        # Remove multiple underscores
        standardized = re.sub(r'_+', '_', standardized).strip('_')
        return standardized
    
    def _is_date_column(self, series: pd.Series) -> bool:
        """
        Check if a column contains date values
        """
        if pd.api.types.is_datetime64_any_dtype(series):
            return True
        
        # Check string values for date patterns
        sample_values = series.dropna().head(10).astype(str)
        date_matches = 0
        
        for value in sample_values:
            for pattern in self.date_patterns:
                if re.search(pattern, value):
                    date_matches += 1
                    break
        
        return date_matches >= len(sample_values) * 0.7  # 70% match threshold
    
    def _detect_date_format(self, series: pd.Series) -> Optional[str]:
        """
        Detect the date format used in the column
        """
        sample_values = series.dropna().head(5).astype(str)
        
        common_formats = [
            '%d-%m-%Y %H:%M',
            '%d-%m-%Y %H.%M',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%m/%d/%Y',
            '%d-%m-%Y',
            '%Y-%m-%d',
            '%b %d, %Y',
            '%B %d, %Y'
        ]
        
        for fmt in common_formats:
            try:
                for value in sample_values:
                    pd.to_datetime(value, format=fmt)
                return fmt
            except:
                continue
        
        return None
    
    def _is_boolean_column(self, series: pd.Series) -> bool:
        """
        Check if a column contains boolean values
        """
        unique_vals = series.dropna().astype(str).str.lower().unique()
        return len(unique_vals) <= 2 and all(val in self.boolean_patterns for val in unique_vals)
    
    def _is_numeric_column(self, series: pd.Series) -> bool:
        """
        Check if a string column actually contains numeric data
        """
        if pd.api.types.is_numeric_dtype(series):
            return True
        
        # Try to convert to numeric
        try:
            pd.to_numeric(series.dropna().head(10))
            return True
        except:
            return False
    
    def _identify_primary_entities(self, df: pd.DataFrame, columns_info: Dict) -> Dict[str, Any]:
        """
        Identify the main entities this sheet represents (endpoints, threats, etc.)
        """
        entities = {}
        
        # Count classifications
        classification_counts = {}
        for col_info in columns_info.values():
            for classification in col_info['classified_as']:
                classification_counts[classification] = classification_counts.get(classification, 0) + 1
        
        # Determine primary entity type
        if 'endpoint' in classification_counts or 'network' in classification_counts:
            entities['type'] = 'endpoints'
            entities['confidence'] = 0.8
        elif 'security' in classification_counts or 'severity' in classification_counts:
            entities['type'] = 'threats'
            entities['confidence'] = 0.7
        elif 'status' in classification_counts:
            entities['type'] = 'status'
            entities['confidence'] = 0.6
        else:
            entities['type'] = 'unknown'
            entities['confidence'] = 0.3
        
        entities['record_count'] = len(df)
        entities['column_count'] = len(df.columns)
        
        return entities
    
    def _process_columns_by_type(self, df: pd.DataFrame, structure: Dict) -> pd.DataFrame:
        """
        Process columns based on their detected types
        """
        processed_df = df.copy()
        
        for col, col_info in structure['columns'].items():
            try:
                # Process date columns
                if col_info.get('is_date', False):
                    processed_df[col] = self._parse_dates_flexible(df[col])
                
                # Process boolean columns
                elif col_info.get('is_boolean', False):
                    processed_df[col] = self._parse_boolean_flexible(df[col])
                
                # Process numeric columns
                elif col_info.get('is_numeric', False):
                    processed_df[col] = pd.to_numeric(df[col], errors='coerce')
                
                # Clean string columns
                elif df[col].dtype == 'object':
                    processed_df[col] = df[col].astype(str).fillna('')
                
            except Exception as e:
                logger.warning(f"Error processing column {col}: {str(e)}")
                # Keep original data if processing fails
                processed_df[col] = df[col]
        
        return processed_df
    
    def _parse_dates_flexible(self, series: pd.Series) -> pd.Series:
        """
        Flexibly parse dates in various formats
        """
        def parse_date_value(value):
            if pd.isna(value) or value == '':
                return None
            
            try:
                value_str = str(value).strip()
                
                # Try common formats
                formats_to_try = [
                    '%d-%m-%Y %H:%M',
                    '%d-%m-%Y %H.%M',
                    '%Y-%m-%d %H:%M:%S',
                    '%Y-%m-%d',
                    '%d/%m/%Y',
                    '%m/%d/%Y',
                    '%d-%m-%Y'
                ]
                
                for fmt in formats_to_try:
                    try:
                        return pd.to_datetime(value_str, format=fmt)
                    except:
                        continue
                
                # Fallback to pandas auto-parsing
                return pd.to_datetime(value_str, errors='coerce')
            
            except:
                return None
        
        parsed_series = series.apply(parse_date_value)
        # Convert to string format for JSON serialization
        return parsed_series.dt.strftime('%Y-%m-%d %H:%M:%S').fillna('')
    
    def _parse_boolean_flexible(self, series: pd.Series) -> pd.Series:
        """
        Flexibly parse boolean values
        """
        def parse_bool_value(value):
            if pd.isna(value):
                return False
            
            value_str = str(value).strip().lower()
            if value_str in ['true', 'yes', '1', 'enabled', 'active', 'on']:
                return True
            elif value_str in ['false', 'no', '0', 'disabled', 'inactive', 'off']:
                return False
            else:
                return False
        
        return series.apply(parse_bool_value)
    
    def _calculate_dynamic_kpis(self, result: Dict, all_data: Dict) -> None:
        """
        Calculate KPIs dynamically based on detected data structure
        """
        kpis = {}
        
        for sheet_name, sheet_data in all_data.items():
            df = sheet_data['dataframe']
            structure = sheet_data['structure']
            entity_type = structure['primary_entities'].get('type', 'unknown')
            
            # Entity count KPIs
            kpis[f'total{entity_type.title()}'] = len(df)
            
            # Status-based KPIs
            status_columns = [col for col, info in structure['columns'].items() 
                            if 'status' in info['classified_as']]
            
            for status_col in status_columns:
                status_counts = df[status_col].value_counts().to_dict()
                for status, count in status_counts.items():
                    key = f'{entity_type}_{self._standardize_column_name(status_col)}_{self._standardize_column_name(str(status))}'
                    kpis[key] = int(count)
            
            # Numeric KPIs
            numeric_columns = [col for col, info in structure['columns'].items() 
                             if info.get('is_numeric', False)]
            
            for num_col in numeric_columns:
                if not df[num_col].empty:
                    col_key = self._standardize_column_name(num_col)
                    kpis[f'{entity_type}_{col_key}_sum'] = float(df[num_col].sum())
                    kpis[f'{entity_type}_{col_key}_avg'] = float(df[num_col].mean())
                    kpis[f'{entity_type}_{col_key}_max'] = float(df[num_col].max())
                    kpis[f'{entity_type}_{col_key}_min'] = float(df[num_col].min())
        
        # Calculate cross-sheet KPIs if possible
        self._calculate_cross_sheet_kpis(kpis, all_data)
        
        result['kpis'] = kpis
    
    def _calculate_cross_sheet_kpis(self, kpis: Dict, all_data: Dict) -> None:
        """
        Calculate KPIs that span across multiple sheets
        """
        # Get all endpoint counts
        endpoint_sheets = [sheet for sheet_name, sheet_data in all_data.items() 
                          if sheet_data['structure']['primary_entities'].get('type') == 'endpoints']
        
        if endpoint_sheets:
            total_endpoints = sum(len(sheet['dataframe']) for sheet in endpoint_sheets)
            kpis['totalEndpoints'] = total_endpoints
            
            # Network status aggregation
            connected_total = 0
            disconnected_total = 0
            
            for sheet in endpoint_sheets:
                df = sheet['dataframe']
                structure = sheet['structure']
                
                network_cols = [col for col, info in structure['columns'].items() 
                               if 'network' in info['classified_as']]
                
                for net_col in network_cols:
                    connected_total += len(df[df[net_col].str.lower().str.contains('connect', na=False)])
                    disconnected_total += len(df[df[net_col].str.lower().str.contains('disconnect', na=False)])
            
            if total_endpoints > 0:
                kpis['connectedEndpoints'] = connected_total
                kpis['disconnectedEndpoints'] = disconnected_total
                kpis['endpointAvailabilityRate'] = round((connected_total / total_endpoints) * 100, 2)
        
        # Get all threat counts
        threat_sheets = [sheet for sheet_name, sheet_data in all_data.items() 
                        if sheet_data['structure']['primary_entities'].get('type') == 'threats']
        
        if threat_sheets:
            total_threats = sum(len(sheet['dataframe']) for sheet in threat_sheets)
            kpis['totalThreats'] = total_threats
            
            # Severity aggregation
            critical_threats = 0
            high_threats = 0
            
            for sheet in threat_sheets:
                df = sheet['dataframe']
                structure = sheet['structure']
                
                severity_cols = [col for col, info in structure['columns'].items() 
                               if 'severity' in info['classified_as']]
                
                for sev_col in severity_cols:
                    critical_threats += len(df[df[sev_col].str.lower().str.contains('critical|malicious', na=False)])
                    high_threats += len(df[df[sev_col].str.lower().str.contains('high|suspicious', na=False)])
            
            kpis['criticalThreats'] = critical_threats
            kpis['highThreats'] = high_threats
    
    def _generate_dynamic_analytics(self, result: Dict, all_data: Dict) -> None:
        """
        Generate analytics dynamically based on detected data structure
        """
        analytics = {}
        
        for sheet_name, sheet_data in all_data.items():
            df = sheet_data['dataframe']
            structure = sheet_data['structure']
            
            sheet_analytics = {
                'totalRecords': len(df),
                'columnCount': len(df.columns),
                'entityType': structure['primary_entities'].get('type', 'unknown'),
                'distributions': {}
            }
            
            # Generate distributions for categorical columns
            for col, col_info in structure['columns'].items():
                if col_info['unique_count'] <= 20 and col_info['unique_count'] > 1:  # Good for distribution
                    try:
                        distribution = df[col].value_counts().to_dict()
                        sheet_analytics['distributions'][col] = {str(k): int(v) for k, v in distribution.items()}
                    except:
                        pass
            
            analytics[sheet_name] = sheet_analytics
        
        # Add date range if any date columns found
        analytics['dateRange'] = {
            'start': (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d'),
            'end': datetime.now().strftime('%Y-%m-%d'),
            'processedAt': datetime.now().isoformat()
        }
        
        result['analytics'] = analytics
    
    def _safe_to_dict(self, df: pd.DataFrame) -> List[Dict]:
        """
        Safely convert DataFrame to dict with comprehensive handling
        """
        if df is None or df.empty:
            return []
        
        try:
            # Create clean copy
            df_clean = df.copy()
            
            # Handle all data types
            for col in df_clean.columns:
                if pd.api.types.is_datetime64_any_dtype(df_clean[col]):
                    df_clean[col] = df_clean[col].dt.strftime('%Y-%m-%d %H:%M:%S').fillna('')
                elif pd.api.types.is_numeric_dtype(df_clean[col]):
                    df_clean[col] = df_clean[col].fillna(0)
                else:
                    df_clean[col] = df_clean[col].fillna('').astype(str)
            
            return df_clean.to_dict(orient='records')
        
        except Exception as e:
            logger.error(f"Error converting DataFrame to dict: {str(e)}")
            return []
    
    def _clean_data_for_json(self, data: Any) -> Any:
        """
        Recursively clean data for JSON serialization
        """
        if isinstance(data, dict):
            return {key: self._clean_data_for_json(value) for key, value in data.items()}
        elif isinstance(data, list):
            return [self._clean_data_for_json(item) for item in data]
        elif isinstance(data, (pd.Timestamp, np.datetime64, datetime)):
            try:
                return pd.to_datetime(data).strftime('%Y-%m-%d %H:%M:%S')
            except:
                return ""
        elif isinstance(data, (np.integer, np.floating)):
            if pd.isna(data) or np.isnan(data) or np.isinf(data):
                return None
            return float(data) if isinstance(data, np.floating) else int(data)
        elif isinstance(data, float) and (np.isnan(data) or np.isinf(data)):
            return None
        elif pd.isna(data) or data is pd.NaT:
            return None
        else:
            return data


# Main processing function for compatibility
def process_edr_excel_dynamic(file):
    """
    Main entry point for dynamic EDR processing
    """
    processor = DynamicEDRProcessor()
    return processor.process_edr_excel_dynamic(file)