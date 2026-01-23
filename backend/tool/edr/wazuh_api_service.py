# backend/tool/edr/wazuh_api_service.py
# Wazuh API Service - Fetches live data from Wazuh Indexer (OpenSearch)

import requests
import logging
import urllib3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)


class WazuhAPIService:
    """Service to fetch and process data from Wazuh Indexer API with connection pooling"""

    def __init__(self):
        # API Configuration from documentation
        self.base_url = "https://192.168.3.11:9200"
        self.username = "SOC_Central"
        self.password = "CSUSOCAPI123"
        self.auth = (self.username, self.password)
        self.verify_ssl = False  # Self-signed certificate

        # Index names
        self.alerts_index = "wazuh-alerts-*"
        self.monitoring_index = "wazuh-monitoring-*"

        # Connection pooling - reuse HTTP connections
        self.session = requests.Session()
        self.session.auth = self.auth
        self.session.verify = self.verify_ssl

        # Configure connection pool
        adapter = requests.adapters.HTTPAdapter(
            pool_connections=10,  # Number of connection pools to cache
            pool_maxsize=20,       # Maximum number of connections to save in pool
            max_retries=3,         # Retry failed requests
            pool_block=False       # Don't block when pool is full
        )
        self.session.mount('https://', adapter)
        self.session.mount('http://', adapter)

        logger.info("Wazuh API Service initialized with connection pooling (pool_size=20, connections=10)")

    def _make_request(self, url: str, body: Optional[Dict] = None) -> Dict:
        """Make HTTP request to Wazuh API with error handling using connection pool"""
        try:
            # Use session for connection pooling
            if body:
                response = self.session.post(
                    url,
                    json=body,
                    timeout=30
                )
            else:
                response = self.session.get(
                    url,
                    timeout=30
                )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Error making request to {url}: {str(e)}")
            logger.error(f"Response content: {e.response.text if hasattr(e, 'response') else 'N/A'}")
            raise Exception(f"Failed to fetch data from Wazuh API: {str(e)}")

    def _fetch_all_pages(self, url: str, base_body: Dict, max_results: int = 10000) -> List[Dict]:
        """
        Fetch all pages of results using OpenSearch scroll API for pagination

        Args:
            url: The OpenSearch endpoint URL
            base_body: Base query body
            max_results: Maximum total results to fetch

        Returns:
            List of all hits from all pages
        """
        all_hits = []

        # Use scroll API for efficient pagination
        scroll_time = "2m"  # Keep scroll context alive for 2 minutes

        # Initial search request with scroll
        initial_body = base_body.copy()
        initial_body["size"] = min(1000, max_results)  # Fetch 1000 per page

        try:
            # First request
            response = self.session.post(
                f"{url}?scroll={scroll_time}",
                json=initial_body,
                timeout=30
            )
            response.raise_for_status()
            data = response.json()

            scroll_id = data.get('_scroll_id')
            hits = data.get('hits', {}).get('hits', [])
            all_hits.extend(hits)

            logger.info(f"Fetched initial page: {len(hits)} records (scroll_id: {scroll_id[:20]}...)")

            # Continue fetching pages using scroll
            while len(hits) > 0 and len(all_hits) < max_results:
                scroll_body = {
                    "scroll": scroll_time,
                    "scroll_id": scroll_id
                }

                response = self.session.post(
                    f"{self.base_url}/_search/scroll",
                    json=scroll_body,
                    timeout=30
                )
                response.raise_for_status()
                data = response.json()

                scroll_id = data.get('_scroll_id')
                hits = data.get('hits', {}).get('hits', [])
                all_hits.extend(hits)

                logger.info(f"Fetched page: {len(hits)} records, total: {len(all_hits)}")

                if len(hits) == 0:
                    break

            # Clean up scroll context
            if scroll_id:
                try:
                    self.session.delete(
                        f"{self.base_url}/_search/scroll",
                        json={"scroll_id": scroll_id},
                        timeout=10
                    )
                    logger.info(f"Cleared scroll context")
                except Exception as e:
                    logger.warning(f"Failed to clear scroll context: {e}")

            logger.info(f"Total records fetched: {len(all_hits)}")
            return all_hits[:max_results]  # Ensure we don't exceed max_results

        except Exception as e:
            logger.error(f"Error during pagination: {str(e)}")
            # Return what we have so far
            return all_hits

    def get_alerts(self, size: int = 1000, date_from: Optional[str] = None, date_to: Optional[str] = None, use_pagination: bool = True) -> Dict:
        """
        Fetch alerts from wazuh-alerts-* index with optional pagination

        Args:
            size: Number of results to return (or max if pagination enabled)
            date_from: Start date in format YYYY-MM-DD
            date_to: End date in format YYYY-MM-DD
            use_pagination: Use scroll API for >1000 records

        Returns:
            Dict with 'hits' containing all results
        """
        url = f"{self.base_url}/{self.alerts_index}/_search"

        # Build OpenSearch query body - use 'timestamp' not '@timestamp'
        body = {
            "sort": [
                {"timestamp": {"order": "desc"}}
            ]
        }

        # Add date filter if provided
        if date_from and date_to:
            body["query"] = {
                "range": {
                    "timestamp": {
                        "gte": f"{date_from}T00:00:00",
                        "lte": f"{date_to}T23:59:59"
                    }
                }
            }

        logger.info(f"Fetching alerts from Wazuh API (size={size}, pagination={use_pagination})")

        # Use pagination for large result sets
        if use_pagination and size > 1000:
            all_hits = self._fetch_all_pages(url, body, max_results=size)
            return {
                'hits': {
                    'hits': all_hits,
                    'total': {'value': len(all_hits)}
                }
            }
        else:
            # Standard request for small result sets
            body["size"] = min(size, 1000)
            return self._make_request(url, body)

    def get_monitoring_data(self, size: int = 1000, use_pagination: bool = True) -> Dict:
        """
        Fetch monitoring data from wazuh-monitoring-* index with optional pagination

        Args:
            size: Number of results to return (or max if pagination enabled)
            use_pagination: Use scroll API for >1000 records

        Returns:
            Dict with 'hits' containing all results
        """
        url = f"{self.base_url}/{self.monitoring_index}/_search"

        # Build OpenSearch query body - use 'timestamp' not '@timestamp'
        body = {
            "sort": [
                {"timestamp": {"order": "desc"}}
            ]
        }

        logger.info(f"Fetching monitoring data from Wazuh API (size={size}, pagination={use_pagination})")

        # Use pagination for large result sets
        if use_pagination and size > 1000:
            all_hits = self._fetch_all_pages(url, body, max_results=size)
            return {
                'hits': {
                    'hits': all_hits,
                    'total': {'value': len(all_hits)}
                }
            }
        else:
            # Standard request for small result sets
            body["size"] = min(size, 1000)
            return self._make_request(url, body)

    def process_live_data(self, date_from: Optional[str] = None, date_to: Optional[str] = None, max_records: int = 5000) -> Dict:
        """
        Fetch and process live Wazuh data into EDR dashboard format with pagination support

        Args:
            date_from: Start date in format YYYY-MM-DD
            date_to: End date in format YYYY-MM-DD
            max_records: Maximum records to fetch per index (default 5000, supports >1000 via pagination)

        Returns data structure compatible with EDR dashboard:
        {
            "fileType": "edr",
            "dataSource": "wazuh_api",
            "kpis": {...},
            "details": {
                "endpoints": [...],
                "threats": [...],
                "detailedStatus": [...]
            },
            "analytics": {...},
            "processedAt": "..."
        }
        """
        try:
            logger.info(f"Starting Wazuh live data processing (max_records={max_records}, pagination=enabled)...")

            # Fetch data from both indices with pagination support
            monitoring_response = self.get_monitoring_data(size=max_records, use_pagination=True)
            alerts_response = self.get_alerts(size=max_records, date_from=date_from, date_to=date_to, use_pagination=True)

            # Extract hits
            monitoring_hits = monitoring_response.get('hits', {}).get('hits', [])
            alerts_hits = alerts_response.get('hits', {}).get('hits', [])

            logger.info(f"Fetched {len(monitoring_hits)} monitoring records and {len(alerts_hits)} alerts")

            # Process endpoints from monitoring data
            endpoints_data = self._process_endpoints(monitoring_hits)

            # Process threats from alerts data
            threats_data = self._process_threats(alerts_hits)

            # Generate detailed status
            status_data = self._process_detailed_status(monitoring_hits)

            # Calculate KPIs
            kpis = self._calculate_kpis(endpoints_data, threats_data)

            # Generate analytics
            analytics = self._generate_analytics(endpoints_data, threats_data)

            # Build result structure
            result = {
                "fileType": "edr",
                "dataSource": "wazuh_api",
                "kpis": kpis,
                "details": {
                    "endpoints": endpoints_data,
                    "threats": threats_data,
                    "detailedStatus": status_data
                },
                "analytics": analytics,
                "processedAt": datetime.now().isoformat(),
                "metadata": {
                    "totalMonitoringRecords": len(monitoring_hits),
                    "totalAlerts": len(alerts_hits),
                    "maxRecordsPerIndex": max_records,
                    "paginationEnabled": max_records > 1000,
                    "connectionPooling": True,
                    "dateRange": {
                        "from": date_from or "all",
                        "to": date_to or "all"
                    }
                }
            }

            logger.info(f"Successfully processed Wazuh live data: {len(endpoints_data)} endpoints, {len(threats_data)} threats")
            return result

        except Exception as e:
            logger.error(f"Error processing Wazuh live data: {str(e)}")
            raise

    def _process_endpoints(self, monitoring_hits: List[Dict]) -> List[Dict]:
        """Process monitoring data into endpoints format"""
        endpoints = []

        # Group by agent ID to get latest status for each agent
        agents_map = {}

        for hit in monitoring_hits:
            source = hit.get('_source', {})
            agent_id = source.get('id', source.get('agent', {}).get('id', 'unknown'))

            # Keep only the latest record for each agent
            if agent_id not in agents_map:
                timestamp = source.get('timestamp', '')

                endpoint = {
                    'name': source.get('name', f'Agent-{agent_id}'),
                    'agent_uuid': agent_id,
                    'os': source.get('os', {}).get('name', 'Unknown') if isinstance(source.get('os'), dict) else source.get('os', 'Unknown'),
                    'network_status': 'Connected' if source.get('status') == 'active' else 'Disconnected',
                    'scan_status': source.get('status', 'unknown'),
                    'ip_address': source.get('ip', 'N/A'),
                    'last_keep_alive': source.get('lastKeepAlive', source.get('last_keep_alive', timestamp)),
                    'version': source.get('version', 'N/A'),
                    'manager': source.get('manager', 'N/A'),
                    'Date': timestamp[:10] if timestamp else datetime.now().strftime('%Y-%m-%d'),
                    'status_code': source.get('status_code', 0),
                    'node_name': source.get('node_name', 'N/A')
                }

                agents_map[agent_id] = endpoint

        endpoints = list(agents_map.values())
        logger.info(f"Processed {len(endpoints)} unique endpoints")

        return endpoints

    def _process_threats(self, alerts_hits: List[Dict]) -> List[Dict]:
        """Process alerts data into threats format"""
        threats = []

        for hit in alerts_hits:
            source = hit.get('_source', {})

            # Extract rule information
            rule = source.get('rule', {})
            agent = source.get('agent', {})

            # Get raw groups for classification
            raw_groups = rule.get('groups', [])

            # Create human-readable classification
            classification = self._get_human_readable_classification(raw_groups)

            # Create comprehensive threat details
            threat_name = rule.get('description', 'Unknown Threat')
            rule_id = rule.get('id', 'N/A')
            rule_level = rule.get('level', 0)

            # Build detailed threat information
            threat_details_parts = [f"{threat_name}"]

            # Add MITRE information if available
            mitre_techniques = rule.get('mitre', {}).get('technique', []) if rule.get('mitre') else []
            mitre_ids = rule.get('mitre', {}).get('id', []) if rule.get('mitre') else []
            if mitre_techniques:
                mitre_info = [f"{tid}: {tname}" for tid, tname in zip(mitre_ids, mitre_techniques)]
                threat_details_parts.append(f"MITRE Tactics: {', '.join(mitre_info)}")

            # Add rule details
            threat_details_parts.append(f"Rule ID: {rule_id} (Level {rule_level})")

            # Add classification context
            if classification != 'Security Event':
                threat_details_parts.append(f"Category: {classification}")

            threat_details = " | ".join(threat_details_parts)

            threat = {
                'threat_id': hit.get('_id', 'unknown'),
                'threat_name': threat_name,
                'threat_details': threat_details,  # Added comprehensive details field
                'details': threat_details,  # Alternative field name for compatibility
                'classification': classification,
                'classification_raw': ', '.join(raw_groups) if raw_groups else 'Unknown',  # Keep raw data
                'threat_type': classification,  # Use classification as threat type for filtering
                'severity': self._map_severity(rule_level),
                'confidence_level': 'Malicious' if rule_level >= 10 else 'Suspicious' if rule_level >= 5 else 'Low',
                'status': 'Detected',
                'endpoint': agent.get('name', 'Unknown'),
                'endpoints': agent.get('name', 'Unknown'),  # Alternative field name
                'agent_id': agent.get('id', 'N/A'),
                'reported_time': source.get('timestamp', datetime.now().isoformat()),
                'Date': source.get('timestamp', datetime.now().isoformat())[:10],
                'rule_id': rule_id,
                'rule_level': rule_level,
                'rule_description': rule.get('description', 'N/A'),
                'full_log': source.get('full_log', 'N/A'),
                'mitre_technique': ', '.join(mitre_techniques) if mitre_techniques else 'N/A',
                'mitre_id': ', '.join(mitre_ids) if mitre_ids else 'N/A',
                'mitre_tactic': ', '.join(rule.get('mitre', {}).get('tactic', [])) if rule.get('mitre', {}).get('tactic') else 'N/A',
                'decoder': source.get('decoder', {}).get('name', 'N/A') if isinstance(source.get('decoder'), dict) else 'N/A',
                'location': source.get('location', 'N/A')
            }

            threats.append(threat)

        logger.info(f"Processed {len(threats)} threats")
        return threats

    def _process_detailed_status(self, monitoring_hits: List[Dict]) -> List[Dict]:
        """Process monitoring data into detailed status format"""
        status_records = []

        for hit in monitoring_hits:
            source = hit.get('_source', {})

            status = {
                'endpoint_name': source.get('name', 'Unknown'),
                'agent_id': source.get('id', 'unknown'),
                'status': source.get('status', 'unknown'),
                'os_name': source.get('os', {}).get('name', 'Unknown') if isinstance(source.get('os'), dict) else 'Unknown',
                'os_version': source.get('os', {}).get('version', 'N/A') if isinstance(source.get('os'), dict) else 'N/A',
                'last_keep_alive': source.get('lastKeepAlive', 'N/A'),
                'ip': source.get('ip', 'N/A'),
                'version': source.get('version', 'N/A'),
                'manager': source.get('manager', 'N/A')
            }

            status_records.append(status)

        return status_records

    def _map_severity(self, level: int) -> str:
        """Map Wazuh rule level to severity"""
        if level >= 12:
            return 'Critical'
        elif level >= 7:
            return 'High'
        elif level >= 4:
            return 'Medium'
        else:
            return 'Low'

    def _get_human_readable_classification(self, groups: List[str]) -> str:
        """
        Convert technical Wazuh rule groups to human-readable classification labels

        Args:
            groups: List of Wazuh rule groups

        Returns:
            Human-readable classification string
        """
        if not groups:
            return 'Security Event'

        # Priority-based classification mapping
        # Higher priority categories are checked first
        classification_map = {
            # Authentication & Access
            'authentication': 'Authentication Event',
            'authentication_failed': 'Failed Authentication',
            'authentication_failures': 'Failed Authentication',
            'authentication_success': 'Successful Authentication',
            'login': 'User Login',
            'logout': 'User Logout',
            'access_control': 'Access Control',
            'access_denied': 'Access Denied',
            'invalid_login': 'Invalid Login Attempt',

            # Malware & Threats
            'malware': 'Malware Detection',
            'virus': 'Virus Detection',
            'trojan': 'Trojan Detection',
            'rootkit': 'Rootkit Detection',
            'ransomware': 'Ransomware Detection',
            'exploit': 'Exploit Attempt',
            'attack': 'Attack Detected',

            # Network Security
            'ids': 'Intrusion Detection',
            'intrusion_detection': 'Intrusion Detection',
            'firewall': 'Firewall Event',
            'network': 'Network Activity',
            'web': 'Web Activity',
            'squid': 'Web Proxy Event',
            'apache': 'Web Server Event',
            'nginx': 'Web Server Event',

            # System Events
            'syslog': 'System Log Event',
            'ossec': 'System Security Event',
            'windows': 'Windows System Event',
            'linux': 'Linux System Event',
            'service': 'Service Event',
            'process': 'Process Activity',
            'startup': 'System Startup',
            'shutdown': 'System Shutdown',

            # File & Configuration
            'syscheck': 'File Integrity Change',
            'file_integrity': 'File Integrity Change',
            'config_changed': 'Configuration Change',
            'pci_dss': 'PCI DSS Compliance',
            'gpg13': 'GPG13 Compliance',
            'gdpr': 'GDPR Compliance',
            'hipaa': 'HIPAA Compliance',

            # Application Specific
            'ssh': 'SSH Activity',
            'sshd': 'SSH Server Event',
            'sudo': 'Privilege Escalation',
            'su': 'User Switch',
            'adduser': 'User Account Created',
            'account_changed': 'Account Modified',
            'group_changed': 'Group Modified',

            # Vulnerabilities
            'vulnerability': 'Vulnerability Detected',
            'vulnerability-detector': 'Vulnerability Scan Result',
            'cve': 'CVE Detected',

            # Policy & Compliance
            'policy_violation': 'Policy Violation',
            'compliance': 'Compliance Event',
            'audit': 'Audit Event',

            # Errors & System Issues
            'errors': 'System Error',
            'error': 'Error Event',
            'critical': 'Critical System Event',
            'invalid': 'Invalid Operation',
            'spam': 'Spam Detection',
            'phishing': 'Phishing Attempt'
        }

        # Check groups in order of priority
        # First, check for high-priority security events
        high_priority = [
            'malware', 'ransomware', 'trojan', 'rootkit', 'exploit', 'attack',
            'authentication_failed', 'invalid_login', 'access_denied', 'vulnerability'
        ]

        for group in groups:
            if group.lower() in high_priority:
                return classification_map.get(group.lower(), 'Security Event')

        # Then check all other groups
        for group in groups:
            group_lower = group.lower()
            if group_lower in classification_map:
                return classification_map[group_lower]

        # If no specific match, create a readable label from the first group
        first_group = groups[0].replace('_', ' ').title()
        return f"{first_group} Event"

    def _calculate_kpis(self, endpoints: List[Dict], threats: List[Dict]) -> Dict:
        """Calculate KPIs from processed data"""
        total_endpoints = len(endpoints)

        # Endpoint metrics
        connected = sum(1 for e in endpoints if e.get('network_status') == 'Connected')
        disconnected = total_endpoints - connected

        # Scan status metrics
        active = sum(1 for e in endpoints if e.get('scan_status') == 'active')

        # Threat metrics
        total_threats = len(threats)
        critical_threats = sum(1 for t in threats if t.get('severity') == 'Critical')
        high_threats = sum(1 for t in threats if t.get('severity') == 'High')
        malicious = sum(1 for t in threats if t.get('confidence_level') == 'Malicious')

        # Calculate rates
        availability_rate = (connected / total_endpoints * 100) if total_endpoints > 0 else 0
        compliance_rate = (active / total_endpoints * 100) if total_endpoints > 0 else 0

        # Calculate security score
        security_score = self._calculate_security_score(
            total_endpoints, connected, active, total_threats, malicious
        )

        return {
            # Endpoint KPIs
            "totalEndpoints": total_endpoints,
            "connectedEndpoints": connected,
            "disconnectedEndpoints": disconnected,
            "upToDateEndpoints": active,
            "outOfDateEndpoints": total_endpoints - active,
            "endpointAvailabilityRate": round(availability_rate, 2),
            "updateComplianceRate": round(compliance_rate, 2),

            # Scan KPIs
            "completedScans": active,
            "failedScans": total_endpoints - active,
            "scanSuccessRate": round(compliance_rate, 2),

            # Threat KPIs
            "totalThreats": total_threats,
            "maliciousThreats": malicious,
            "suspiciousThreats": total_threats - malicious,
            "criticalThreats": critical_threats,
            "highThreats": high_threats,
            "falsePositives": 0,

            # Security Score
            "securityScore": security_score
        }

    def _calculate_security_score(self, total_endpoints: int, connected: int, active: int,
                                   total_threats: int, malicious: int) -> float:
        """Calculate overall security score (0-100)"""
        if total_endpoints == 0:
            return 0.0

        # Component scores
        availability_score = (connected / total_endpoints) * 30  # 30% weight
        compliance_score = (active / total_endpoints) * 30  # 30% weight

        threat_score = 40  # Base 40% for threats
        if total_threats > 0:
            # Score is reduced based on the proportion of malicious threats
            threat_impact = (malicious / total_threats)
            threat_score = threat_score * (1 - threat_impact)

        total_score = availability_score + compliance_score + threat_score
        return round(total_score, 2)

    def _generate_analytics(self, endpoints: List[Dict], threats: List[Dict]) -> Dict:
        """Generate analytics data"""
        analytics = {}

        # OS Distribution
        os_dist = defaultdict(int)
        for endpoint in endpoints:
            os_name = endpoint.get('os', 'Unknown')
            os_dist[os_name] += 1
        analytics['osDistribution'] = dict(os_dist)

        # Network Status Distribution
        network_dist = defaultdict(int)
        for endpoint in endpoints:
            status = endpoint.get('network_status', 'Unknown')
            network_dist[status] += 1
        analytics['networkStatusDistribution'] = dict(network_dist)

        # Threat Classification Distribution
        classification_dist = defaultdict(int)
        for threat in threats:
            classification = threat.get('classification', 'Unknown')
            classification_dist[classification] += 1
        analytics['classificationDistribution'] = dict(classification_dist)

        # Severity Distribution
        severity_dist = defaultdict(int)
        for threat in threats:
            severity = threat.get('severity', 'Unknown')
            severity_dist[severity] += 1
        analytics['severityDistribution'] = dict(severity_dist)

        # Confidence Level Distribution
        confidence_dist = defaultdict(int)
        for threat in threats:
            confidence = threat.get('confidence_level', 'Unknown')
            confidence_dist[confidence] += 1
        analytics['confidenceLevelDistribution'] = dict(confidence_dist)

        # Threat Type Distribution
        threat_type_dist = defaultdict(int)
        for threat in threats:
            threat_type = threat.get('threat_type', 'Unknown')
            threat_type_dist[threat_type] += 1
        analytics['threatTypeDistribution'] = dict(threat_type_dist)

        return analytics


# Singleton instance
_wazuh_service = None

def get_wazuh_service() -> WazuhAPIService:
    """Get or create Wazuh API service instance"""
    global _wazuh_service
    if _wazuh_service is None:
        _wazuh_service = WazuhAPIService()
    return _wazuh_service
