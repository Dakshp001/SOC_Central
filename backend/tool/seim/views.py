# backend/tool/siem/views.py
# SIEM-specific views with enhanced analytics logging

import pandas as pd
import logging
from rest_framework.response import Response
from rest_framework import status

# Import the base view class
try:
    from ..shared.views import BaseToolUploadView
except ImportError:
    from backend.tool.shared.views import BaseToolUploadView

# Import the processor function
try:
    from .processor import process_siem_excel
except ImportError:
    from backend.tool.seim.processor import process_siem_excel

logger = logging.getLogger(__name__)

class SIEMUploadView(BaseToolUploadView):
    """Enhanced SIEM upload view with new analytics features and robust error handling"""
    tool_name = "SIEM"
    processor_function = staticmethod(process_siem_excel)  # Make it a static method

    def post_process_result(self, result, uploaded_file):
        """SIEM-specific post-processing with enhanced logging"""
        
        # Validate critical data exists with proper type checking
        kpis = result.get("kpis")
        analytics = result.get("analytics")
        
        if not isinstance(kpis, dict) or not isinstance(analytics, dict):
            logger.warning(f"SIEM processing incomplete for {uploaded_file.name}: Missing or invalid critical data")
            raise ValueError("Processing incomplete: Missing critical analytics data")
        
        # Enhanced logging for new features with safe type checking
        try:
            self._log_siem_processing_details(result, uploaded_file.name)
        except Exception as log_error:
            logger.warning(f"Error in logging SIEM processing details: {str(log_error)}")
        
        # Final validation - ensure result is JSON serializable
        try:
            import json
            json.dumps(result, default=str)  # Test serialization
        except (TypeError, ValueError) as json_error:
            logger.error(f"Result is not JSON serializable: {str(json_error)}")
            raise ValueError("Data processing error: Result contains invalid values")
        
        return result

    def _log_siem_processing_details(self, result, file_name):
        """Log detailed SIEM processing information"""
        kpis = result.get("kpis", {})
        analytics = result.get("analytics", {})
        
        # Safely extract data with type checking
        total_alerts = analytics.get('totalAlertsCount', 0)
        total_events = kpis.get('totalEvents', 0)
        processed_events = result.get('processedEvents', 0)
        unique_users = kpis.get('uniqueUsers', 0)
        
        # Safe extraction of nested dictionaries
        top_alerts_by_severity = analytics.get('topAlertsBySeverity', {})
        top_users_by_severity = analytics.get('topUsersBySeverity', {})
        date_range = result.get('dateRange', {})
        
        # Type-safe counting
        top_alerts_severity_count = len(top_alerts_by_severity) if isinstance(top_alerts_by_severity, dict) else 0
        top_users_severity_count = len(top_users_by_severity) if isinstance(top_users_by_severity, dict) else 0
        
        # Type-safe date range extraction
        start_date = date_range.get('start', 'N/A') if isinstance(date_range, dict) else 'N/A'
        end_date = date_range.get('end', 'N/A') if isinstance(date_range, dict) else 'N/A'
        
        # Convert to safe integer values
        total_alerts = int(total_alerts) if isinstance(total_alerts, (int, float)) and not pd.isna(total_alerts) else 0
        total_events = int(total_events) if isinstance(total_events, (int, float)) and not pd.isna(total_events) else 0
        processed_events = int(processed_events) if isinstance(processed_events, (int, float)) and not pd.isna(processed_events) else 0
        unique_users = int(unique_users) if isinstance(unique_users, (int, float)) and not pd.isna(unique_users) else 0
        
        logger.info(f"SIEM processing complete for {file_name}:")
        logger.info(f"  - Total Events Processed: {processed_events}")
        logger.info(f"  - Total Events in KPIs: {total_events}")
        logger.info(f"  - Total Alerts Count: {total_alerts}")
        logger.info(f"  - Severity Levels with Top Alerts: {top_alerts_severity_count}")
        logger.info(f"  - Severity Levels with Top Users: {top_users_severity_count}")
        logger.info(f"  - Unique Users: {unique_users}")
        logger.info(f"  - Date Range: {start_date} to {end_date}")
        
        # Log enhanced features status with safe comparisons
        has_enhanced_features = (
            total_alerts > 0 and 
            top_alerts_severity_count > 0 and 
            top_users_severity_count > 0
        )
        
        if has_enhanced_features:
            logger.info("✅ Enhanced SIEM analytics features successfully activated")
            
            # Log sample data for verification with safe type checking
            if isinstance(top_alerts_by_severity, dict) and isinstance(top_users_by_severity, dict):
                for severity in ['critical', 'high', 'medium', 'low', 'info']:
                    # Safe extraction of severity data
                    severity_alerts = top_alerts_by_severity.get(severity, [])
                    severity_users = top_users_by_severity.get(severity, [])
                    
                    alerts_count = len(severity_alerts) if isinstance(severity_alerts, list) else 0
                    users_count = len(severity_users) if isinstance(severity_users, list) else 0
                    
                    if alerts_count > 0 or users_count > 0:
                        logger.info(f"  - {severity.capitalize()}: {alerts_count} top alerts, {users_count} top users")
        else:
            logger.warning("⚠️ Enhanced SIEM analytics features not fully activated - limited data available")