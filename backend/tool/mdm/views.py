# backend/tool/mdm/views.py
# MDM-specific views

import logging

# Import the base view class
try:
    from ..shared.views import BaseToolUploadView
except ImportError:
    from backend.tool.shared.views import BaseToolUploadView

# Import the processor function
try:
    from .processor import process_mdm_excel
except ImportError:
    from backend.tool.mdm.processor import process_mdm_excel

logger = logging.getLogger(__name__)

class MDMUploadView(BaseToolUploadView):
    """MDM upload view with device management analytics"""
    tool_name = "MDM"
    processor_function = staticmethod(process_mdm_excel)  # Make it a static method

    def post_process_result(self, result, uploaded_file):
        """MDM-specific post-processing with device analytics logging"""
        
        # Validate MDM-specific data
        kpis = result.get("kpis", {})
        analytics = result.get("analytics", {})
        
        if not isinstance(kpis, dict) or not isinstance(analytics, dict):
            logger.warning(f"MDM processing incomplete for {uploaded_file.name}: Missing analytics data")
            raise ValueError("Processing incomplete: Missing MDM analytics data")
        
        # Log MDM-specific metrics
        try:
            self._log_mdm_processing_details(result, uploaded_file.name)
        except Exception as log_error:
            logger.warning(f"Error in logging MDM processing details: {str(log_error)}")
        
        return result

    def _log_mdm_processing_details(self, result, file_name):
        """Log detailed MDM processing information"""
        kpis = result.get("kpis", {})
        analytics = result.get("analytics", {})
        
        total_devices = kpis.get('totalDevices', 0)
        enrolled_devices = kpis.get('enrolledDevices', 0)
        compliant_devices = kpis.get('compliantDevices', 0)
        security_score = kpis.get('securityScore', 0)
        security_issues = kpis.get('securityIssues', 0)
        
        platform_distribution = analytics.get('platformDistribution', {})
        security_breakdown = analytics.get('securityBreakdown', {})
        
        logger.info(f"MDM processing complete for {file_name}:")
        logger.info(f"  - Total Devices: {total_devices}")
        logger.info(f"  - Enrolled Devices: {enrolled_devices}")
        logger.info(f"  - Compliant Devices: {compliant_devices}")
        logger.info(f"  - Security Score: {security_score}%")
        logger.info(f"  - Security Issues: {security_issues}")
        
        if platform_distribution:
            logger.info(f"  - Platform Distribution: {platform_distribution}")
        
        if security_breakdown:
            logger.info(f"  - Security Breakdown: {security_breakdown}")
        
        # Calculate and log compliance rate
        compliance_rate = (compliant_devices / total_devices * 100) if total_devices > 0 else 0
        logger.info(f"  - Compliance Rate: {compliance_rate:.1f}%")