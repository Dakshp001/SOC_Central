# backend/tool/edr/views.py
# EDR-specific views

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# Import the base view class
try:
    from ..shared.views import BaseToolUploadView
except ImportError:
    from backend.tool.shared.views import BaseToolUploadView

# Import the processor functions
try:
    from .processor import process_edr_excel
    from .dynamic_processor import process_edr_excel_dynamic
    from .smart_processor import process_edr_excel_smart
except ImportError:
    from backend.tool.edr.processor import process_edr_excel
    from backend.tool.edr.dynamic_processor import process_edr_excel_dynamic
    from backend.tool.edr.smart_processor import process_edr_excel_smart

# Import security utilities
try:
    from .security import get_security_recommendations
except ImportError:
    from backend.tool.edr.security import get_security_recommendations

# Import Wazuh API service
try:
    from .wazuh_api_service import get_wazuh_service
except ImportError:
    from backend.tool.edr.wazuh_api_service import get_wazuh_service

logger = logging.getLogger(__name__)

class EDRUploadView(BaseToolUploadView):
    """EDR upload view with endpoint detection and response analytics"""
    tool_name = "EDR"
    processor_function = staticmethod(process_edr_excel_smart)  # Use smart processor that auto-selects

    def post_process_result(self, result, uploaded_file):
        """EDR-specific post-processing with endpoint analytics logging"""
        
        # Validate EDR-specific data
        kpis = result.get("kpis", {})
        analytics = result.get("analytics", {})
        details = result.get("details", {})
        metadata = result.get("metadata", {})
        
        if not isinstance(kpis, dict) or not isinstance(analytics, dict):
            logger.warning(f"EDR processing incomplete for {uploaded_file.name}: Missing analytics data")
            raise ValueError("Processing incomplete: Missing EDR analytics data")
        
        # Log which processor was used
        processor_used = result.get('processor_used', 'unknown')
        logger.info(f"EDR file processed using: {processor_used}")
        
        # For dynamic/smart processor, validation is more flexible
        if metadata and "detectedStructure" in metadata:
            logger.info(f"EDR processing detected {metadata.get('totalSheets', 0)} sheets")
            # Log detected structure
            for sheet_name, structure in metadata.get("detectedStructure", {}).items():
                entity_type = structure.get("primary_entities", {}).get("type", "unknown")
                logger.info(f"Sheet '{sheet_name}' detected as: {entity_type}")
        
        # Log structure analysis if available
        structure_analysis = result.get('structure_analysis', {})
        if structure_analysis:
            logger.info(f"File structure analysis: {structure_analysis.get('recommended_processor', 'unknown')} recommended")
        else:
            # Original processor validation - check for required sheets
            required_details = ["endpoints", "detailedStatus", "threats"]
            missing_sheets = []
            for detail_type in required_details:
                if detail_type not in details:
                    missing_sheets.append(detail_type)
            
            if missing_sheets:
                logger.warning(f"EDR processing note for {uploaded_file.name}: Some traditional sheets not found: {missing_sheets}")
                logger.info("This may be normal if using dynamic processing with different data structure")
        
        # Add security recommendations
        try:
            recommendations = get_security_recommendations(kpis)
            result["recommendations"] = recommendations
        except Exception as rec_error:
            logger.warning(f"Error generating security recommendations: {str(rec_error)}")
            result["recommendations"] = []
        
        # Log EDR-specific metrics
        try:
            self._log_edr_processing_details(result, uploaded_file.name)
        except Exception as log_error:
            logger.warning(f"Error in logging EDR processing details: {str(log_error)}")
        
        return result

    def _log_edr_processing_details(self, result, file_name):
        """Log detailed EDR processing information"""
        kpis = result.get("kpis", {})
        analytics = result.get("analytics", {})
        details = result.get("details", {})
        
        # Extract key metrics
        total_endpoints = kpis.get('totalEndpoints', 0)
        connected_endpoints = kpis.get('connectedEndpoints', 0)
        up_to_date_endpoints = kpis.get('upToDateEndpoints', 0)
        total_threats = kpis.get('totalThreats', 0)
        resolved_threats = kpis.get('resolvedThreats', 0)
        malicious_threats = kpis.get('maliciousThreats', 0)
        security_score = kpis.get('securityScore', 0)
        availability_rate = kpis.get('endpointAvailabilityRate', 0)
        compliance_rate = kpis.get('updateComplianceRate', 0)
        
        # Extract analytics data
        os_distribution = analytics.get('osDistribution', {})
        network_status = analytics.get('networkStatusDistribution', {})
        threat_classification = analytics.get('classificationDistribution', {})
        
        # Extract details counts
        endpoints_count = len(details.get('endpoints', []))
        status_count = len(details.get('detailedStatus', []))
        threats_count = len(details.get('threats', []))
        
        logger.info(f"EDR processing complete for {file_name}:")
        logger.info(f"  - File contains {len(result.get('rawSheetNames', []))} sheets")
        logger.info(f"  - Processed {endpoints_count} endpoints, {status_count} status records, {threats_count} threat records")
        
        # Endpoint metrics
        logger.info(f"  - Total Endpoints: {total_endpoints}")
        logger.info(f"  - Connected Endpoints: {connected_endpoints}")
        logger.info(f"  - Up-to-date Endpoints: {up_to_date_endpoints}")
        logger.info(f"  - Endpoint Availability: {availability_rate:.1f}%")
        logger.info(f"  - Update Compliance: {compliance_rate:.1f}%")
        
        # Threat metrics
        logger.info(f"  - Total Threats: {total_threats}")
        logger.info(f"  - Resolved Threats: {resolved_threats}")
        logger.info(f"  - Malicious Threats: {malicious_threats}")
        logger.info(f"  - Threat Resolution Rate: {kpis.get('threatResolutionRate', 0):.1f}%")
        
        # Security metrics
        logger.info(f"  - Security Score: {security_score:.1f}%")
        logger.info(f"  - Scan Success Rate: {kpis.get('scanSuccessRate', 0):.1f}%")
        
        # Distribution analytics
        if os_distribution:
            logger.info(f"  - OS Distribution: {dict(list(os_distribution.items())[:3])}...")
        
        if network_status:
            logger.info(f"  - Network Status: {network_status}")
        
        if threat_classification:
            logger.info(f"  - Threat Classifications: {dict(list(threat_classification.items())[:3])}...")
        
        # Security recommendations count
        recommendations_count = len(result.get('recommendations', []))
        if recommendations_count > 0:
            logger.info(f"  - Generated {recommendations_count} security recommendations")
            
            # Log high priority recommendations
            high_priority_recs = [r for r in result.get('recommendations', []) if r.get('priority') == 'Critical']
            if high_priority_recs:
                logger.warning(f"  - {len(high_priority_recs)} critical security recommendations generated")
        
        # Log potential issues
        if availability_rate < 90:
            logger.warning(f"  - LOW AVAILABILITY: Only {availability_rate:.1f}% endpoints connected")
        
        if compliance_rate < 85:
            logger.warning(f"  - LOW COMPLIANCE: Only {compliance_rate:.1f}% endpoints up-to-date")
        
        if total_threats > 0 and (malicious_threats / total_threats) > 0.15:
            logger.warning(f"  - HIGH THREAT LEVEL: {malicious_threats}/{total_threats} threats are malicious")
        
        # Calculate threat resolution efficiency
        if total_threats > 0:
            resolution_rate = resolved_threats / total_threats * 100
            if resolution_rate < 80:
                logger.warning(f"  - LOW RESOLUTION RATE: Only {resolution_rate:.1f}% threats resolved")


class WazuhLiveDataView(APIView):
    """
    Endpoint to fetch live data from Wazuh API instead of PDF upload

    GET /api/tools/edr/live-data/

    Optional query parameters:
    - date_from: Start date (YYYY-MM-DD format)
    - date_to: End date (YYYY-MM-DD format)

    Returns data in the same format as EDR PDF processing

    NOTE: This feature is disabled in production by default.
    Set WAZUH_API_ENABLED=True in backend settings to enable.
    """

    def get(self, request, *args, **kwargs):
        """Fetch and return live Wazuh data"""
        # Check if Wazuh API is enabled
        from django.conf import settings

        if not getattr(settings, 'WAZUH_API_ENABLED', False):
            logger.warning("Wazuh API access denied - feature is disabled in settings")
            return Response(
                {
                    "error": "Wazuh API is currently disabled",
                    "message": "This feature is not available in production. Contact your administrator for more information."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Get date range parameters (optional)
            date_from = request.query_params.get('date_from', None)
            date_to = request.query_params.get('date_to', None)

            logger.info(f"Fetching live Wazuh data (date_from={date_from}, date_to={date_to})")

            # Get Wazuh service instance
            wazuh_service = get_wazuh_service()

            # Fetch and process live data
            result = wazuh_service.process_live_data(
                date_from=date_from,
                date_to=date_to
            )

            # Add security recommendations (same as PDF processing)
            try:
                kpis = result.get("kpis", {})
                recommendations = get_security_recommendations(kpis)
                result["recommendations"] = recommendations
                logger.info(f"Generated {len(recommendations)} security recommendations")
            except Exception as rec_error:
                logger.warning(f"Error generating security recommendations: {str(rec_error)}")
                result["recommendations"] = []

            logger.info(f"Successfully fetched Wazuh live data: {result['kpis']['totalEndpoints']} endpoints, {result['kpis']['totalThreats']} threats")

            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching Wazuh live data: {str(e)}")
            return Response(
                {
                    "error": "Failed to fetch live data from Wazuh API",
                    "details": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )