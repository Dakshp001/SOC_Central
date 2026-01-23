# backend/tool/mitre_mapping.py - MITRE ATT&CK Framework Integration

import json
import logging
from typing import Dict, List, Optional, Set
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

class MITREAttackMapper:
    """
    MITRE ATT&CK Framework integration for SOC Central
    Maps security events to MITRE ATT&CK tactics and techniques
    """
    
    def __init__(self):
        self.tactics = self._load_tactics()
        self.techniques = self._load_techniques()
        self.tool_mappings = self._load_tool_mappings()
    
    def _load_tactics(self) -> Dict[str, Dict]:
        """Load MITRE ATT&CK tactics"""
        return {
            'initial-access': {
                'name': 'Initial Access',
                'description': 'Adversary is trying to get into your network',
                'id': 'TA0001',
                'color': '#d32f2f'
            },
            'execution': {
                'name': 'Execution',
                'description': 'Adversary is trying to run malicious code',
                'id': 'TA0002',
                'color': '#f57c00'
            },
            'persistence': {
                'name': 'Persistence',
                'description': 'Adversary is trying to maintain their foothold',
                'id': 'TA0003',
                'color': '#388e3c'
            },
            'privilege-escalation': {
                'name': 'Privilege Escalation',
                'description': 'Adversary is trying to gain higher-level permissions',
                'id': 'TA0004',
                'color': '#7b1fa2'
            },
            'defense-evasion': {
                'name': 'Defense Evasion',
                'description': 'Adversary is trying to avoid being detected',
                'id': 'TA0005',
                'color': '#303f9f'
            },
            'credential-access': {
                'name': 'Credential Access',
                'description': 'Adversary is trying to steal account names and passwords',
                'id': 'TA0006',
                'color': '#0288d1'
            },
            'discovery': {
                'name': 'Discovery',
                'description': 'Adversary is trying to figure out your environment',
                'id': 'TA0007',
                'color': '#00796b'
            },
            'lateral-movement': {
                'name': 'Lateral Movement',
                'description': 'Adversary is trying to move through your environment',
                'id': 'TA0008',
                'color': '#689f38'
            },
            'collection': {
                'name': 'Collection',
                'description': 'Adversary is trying to gather data of interest',
                'id': 'TA0009',
                'color': '#afb42b'
            },
            'command-and-control': {
                'name': 'Command and Control',
                'description': 'Adversary is trying to communicate with compromised systems',
                'id': 'TA0011',
                'color': '#ff8f00'
            },
            'exfiltration': {
                'name': 'Exfiltration',
                'description': 'Adversary is trying to steal data',
                'id': 'TA0010',
                'color': '#f4511e'
            },
            'impact': {
                'name': 'Impact',
                'description': 'Adversary is trying to manipulate, interrupt, or destroy systems',
                'id': 'TA0040',
                'color': '#c62828'
            }
        }
    
    def _load_techniques(self) -> Dict[str, Dict]:
        """Load common MITRE ATT&CK techniques relevant to SOC tools"""
        return {
            # Initial Access Techniques
            'T1078': {
                'name': 'Valid Accounts',
                'tactic': 'initial-access',
                'description': 'Use of valid accounts to gain access',
                'subtechniques': ['T1078.001', 'T1078.002', 'T1078.003', 'T1078.004']
            },
            'T1566': {
                'name': 'Phishing',
                'tactic': 'initial-access',
                'description': 'Phishing attempts via email or other methods',
                'subtechniques': ['T1566.001', 'T1566.002', 'T1566.003']
            },
            'T1190': {
                'name': 'Exploit Public-Facing Application',
                'tactic': 'initial-access',
                'description': 'Exploitation of public-facing applications',
                'subtechniques': []
            },
            
            # Persistence Techniques
            'T1053': {
                'name': 'Scheduled Task/Job',
                'tactic': 'persistence',
                'description': 'Creation of scheduled tasks or jobs',
                'subtechniques': ['T1053.002', 'T1053.005']
            },
            'T1136': {
                'name': 'Create Account',
                'tactic': 'persistence',
                'description': 'Creation of new accounts',
                'subtechniques': ['T1136.001', 'T1136.002', 'T1136.003']
            },
            
            # Credential Access Techniques
            'T1110': {
                'name': 'Brute Force',
                'tactic': 'credential-access',
                'description': 'Brute force attacks against accounts',
                'subtechniques': ['T1110.001', 'T1110.002', 'T1110.003', 'T1110.004']
            },
            'T1555': {
                'name': 'Credentials from Password Stores',
                'tactic': 'credential-access',
                'description': 'Extraction of credentials from password stores',
                'subtechniques': ['T1555.001', 'T1555.002', 'T1555.003']
            },
            
            # Defense Evasion Techniques
            'T1562': {
                'name': 'Impair Defenses',
                'tactic': 'defense-evasion',
                'description': 'Attempts to impair security defenses',
                'subtechniques': ['T1562.001', 'T1562.002', 'T1562.004']
            },
            'T1070': {
                'name': 'Indicator Removal on Host',
                'tactic': 'defense-evasion',
                'description': 'Removal of indicators from compromised hosts',
                'subtechniques': ['T1070.001', 'T1070.002', 'T1070.003', 'T1070.004']
            },
            
            # Discovery Techniques
            'T1087': {
                'name': 'Account Discovery',
                'tactic': 'discovery',
                'description': 'Discovery of accounts on the system',
                'subtechniques': ['T1087.001', 'T1087.002', 'T1087.003', 'T1087.004']
            },
            'T1018': {
                'name': 'Remote System Discovery',
                'tactic': 'discovery',
                'description': 'Discovery of remote systems',
                'subtechniques': []
            },
            
            # Command and Control Techniques
            'T1071': {
                'name': 'Application Layer Protocol',
                'tactic': 'command-and-control',
                'description': 'Use of application layer protocols for C2',
                'subtechniques': ['T1071.001', 'T1071.002', 'T1071.003', 'T1071.004']
            },
            'T1105': {
                'name': 'Ingress Tool Transfer',
                'tactic': 'command-and-control',
                'description': 'Transfer of tools or files from external systems',
                'subtechniques': []
            }
        }
    
    def _load_tool_mappings(self) -> Dict[str, Dict]:
        """Load tool-specific MITRE technique mappings"""
        return {
            'gsuite': {
                'login_failure': ['T1110', 'T1078'],
                'account_creation': ['T1136'],
                'suspicious_login': ['T1078', 'T1110'],
                'admin_activity': ['T1078.003'],
                'data_export': ['T1567', 'T1041'],
                'permission_change': ['T1484'],
            },
            'mdm': {
                'device_compliance': ['T1562.001'],
                'app_installation': ['T1587.001'],
                'policy_violation': ['T1562'],
                'device_wipe': ['T1485'],
                'location_tracking': ['T1615'],
            },
            'siem': {
                'anomalous_login': ['T1078', 'T1110'],
                'privilege_escalation': ['T1548', 'T1068'],
                'lateral_movement': ['T1021', 'T1563'],
                'data_exfiltration': ['T1041', 'T1567'],
                'malware_detection': ['T1204', 'T1566'],
            },
            'edr': {
                'malware_execution': ['T1204', 'T1218'],
                'process_injection': ['T1055'],
                'defense_evasion': ['T1562', 'T1070'],
                'persistence': ['T1053', 'T1547'],
                'credential_dumping': ['T1003', 'T1555'],
            },
            'meraki': {
                'network_scan': ['T1046', 'T1018'],
                'suspicious_traffic': ['T1071', 'T1041'],
                'dns_tunneling': ['T1071.004'],
                'bandwidth_anomaly': ['T1048'],
                'connection_attempt': ['T1043'],
            },
            'sonicwall': {
                'blocked_connection': ['T1043', 'T1105'],
                'malware_blocked': ['T1204', 'T1566'],
                'intrusion_attempt': ['T1190', 'T1110'],
                'policy_violation': ['T1562.004'],
            }
        }
    
    def map_event_to_mitre(self, tool_type: str, event_type: str, 
                          event_data: Dict = None) -> List[Dict]:
        """
        Map a security event to MITRE ATT&CK techniques
        
        Args:
            tool_type: Type of security tool (gsuite, mdm, siem, etc.)
            event_type: Type of event (login_failure, malware_detection, etc.)
            event_data: Additional event data for context
            
        Returns:
            List of MITRE technique mappings
        """
        try:
            mappings = []
            
            # Get technique IDs for this tool and event type
            tool_mapping = self.tool_mappings.get(tool_type, {})
            technique_ids = tool_mapping.get(event_type, [])
            
            for technique_id in technique_ids:
                technique_data = self.techniques.get(technique_id)
                if technique_data:
                    tactic_data = self.tactics.get(technique_data['tactic'])
                    
                    mapping = {
                        'technique_id': technique_id,
                        'technique_name': technique_data['name'],
                        'technique_description': technique_data['description'],
                        'tactic_id': tactic_data['id'] if tactic_data else '',
                        'tactic_name': tactic_data['name'] if tactic_data else '',
                        'tactic_description': tactic_data['description'] if tactic_data else '',
                        'color': tactic_data['color'] if tactic_data else '#666666',
                        'confidence': self._calculate_confidence(tool_type, event_type, technique_id, event_data)
                    }
                    mappings.append(mapping)
            
            return mappings
            
        except Exception as e:
            logger.error(f"Error mapping event to MITRE: {str(e)}")
            return []
    
    def _calculate_confidence(self, tool_type: str, event_type: str, 
                            technique_id: str, event_data: Dict = None) -> float:
        """Calculate confidence score for MITRE mapping"""
        try:
            # Base confidence based on tool reliability
            base_confidence = {
                'edr': 0.9,
                'siem': 0.8,
                'gsuite': 0.7,
                'mdm': 0.7,
                'meraki': 0.6,
                'sonicwall': 0.6
            }.get(tool_type, 0.5)
            
            # Adjust based on event type specificity
            specific_events = ['malware_execution', 'credential_dumping', 'process_injection']
            if event_type in specific_events:
                base_confidence += 0.1
            
            # Adjust based on additional context
            if event_data:
                if event_data.get('severity') == 'high':
                    base_confidence += 0.1
                if event_data.get('confirmed', False):
                    base_confidence += 0.2
            
            return min(base_confidence, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {str(e)}")
            return 0.5
    
    def get_attack_path(self, technique_ids: List[str]) -> Dict:
        """
        Analyze attack path based on multiple techniques
        
        Args:
            technique_ids: List of MITRE technique IDs
            
        Returns:
            Attack path analysis with kill chain progression
        """
        try:
            tactics_involved = set()
            techniques_data = []
            
            for technique_id in technique_ids:
                technique = self.techniques.get(technique_id)
                if technique:
                    tactics_involved.add(technique['tactic'])
                    techniques_data.append({
                        'id': technique_id,
                        'name': technique['name'],
                        'tactic': technique['tactic']
                    })
            
            # Determine attack progression
            tactic_order = [
                'initial-access', 'execution', 'persistence', 'privilege-escalation',
                'defense-evasion', 'credential-access', 'discovery', 'lateral-movement',
                'collection', 'command-and-control', 'exfiltration', 'impact'
            ]
            
            progression = []
            for tactic in tactic_order:
                if tactic in tactics_involved:
                    tactic_data = self.tactics.get(tactic)
                    if tactic_data:
                        progression.append({
                            'tactic': tactic,
                            'name': tactic_data['name'],
                            'description': tactic_data['description'],
                            'techniques': [t for t in techniques_data if t['tactic'] == tactic]
                        })
            
            return {
                'tactics_count': len(tactics_involved),
                'techniques_count': len(techniques_data),
                'progression': progression,
                'severity': self._assess_attack_severity(tactics_involved),
                'recommendations': self._get_mitigation_recommendations(tactics_involved)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing attack path: {str(e)}")
            return {}
    
    def _assess_attack_severity(self, tactics: Set[str]) -> str:
        """Assess attack severity based on tactics involved"""
        high_severity_tactics = {'impact', 'exfiltration', 'command-and-control'}
        medium_severity_tactics = {'lateral-movement', 'privilege-escalation', 'persistence'}
        
        if tactics.intersection(high_severity_tactics):
            return 'critical'
        elif len(tactics) >= 5 or tactics.intersection(medium_severity_tactics):
            return 'high'
        elif len(tactics) >= 3:
            return 'medium'
        else:
            return 'low'
    
    def _get_mitigation_recommendations(self, tactics: Set[str]) -> List[str]:
        """Get mitigation recommendations based on tactics"""
        recommendations = []
        
        if 'initial-access' in tactics:
            recommendations.append("Implement email security and user training against phishing")
            recommendations.append("Enable multi-factor authentication on all accounts")
        
        if 'persistence' in tactics:
            recommendations.append("Monitor and restrict scheduled task creation")
            recommendations.append("Implement account creation monitoring")
        
        if 'credential-access' in tactics:
            recommendations.append("Implement account lockout policies")
            recommendations.append("Monitor for credential dumping activities")
        
        if 'lateral-movement' in tactics:
            recommendations.append("Implement network segmentation")
            recommendations.append("Monitor for unusual network connections")
        
        if 'exfiltration' in tactics:
            recommendations.append("Implement data loss prevention (DLP) controls")
            recommendations.append("Monitor for unusual data transfer patterns")
        
        return recommendations
    
    def get_coverage_matrix(self, active_tools: List[str]) -> Dict:
        """
        Generate MITRE ATT&CK coverage matrix for active security tools
        
        Args:
            active_tools: List of active security tools
            
        Returns:
            Coverage matrix showing which techniques are covered
        """
        try:
            coverage = {}
            
            # Initialize all tactics
            for tactic_id, tactic_data in self.tactics.items():
                coverage[tactic_id] = {
                    'name': tactic_data['name'],
                    'techniques': {},
                    'coverage_percentage': 0
                }
            
            # Map techniques to tactics and check coverage
            for technique_id, technique_data in self.techniques.items():
                tactic = technique_data['tactic']
                if tactic in coverage:
                    # Check which tools can detect this technique
                    detecting_tools = []
                    for tool in active_tools:
                        tool_mapping = self.tool_mappings.get(tool, {})
                        for event_type, techniques in tool_mapping.items():
                            if technique_id in techniques:
                                detecting_tools.append(tool)
                    
                    coverage[tactic]['techniques'][technique_id] = {
                        'name': technique_data['name'],
                        'covered': len(detecting_tools) > 0,
                        'detecting_tools': list(set(detecting_tools))
                    }
            
            # Calculate coverage percentages
            for tactic_id, tactic_info in coverage.items():
                total_techniques = len(tactic_info['techniques'])
                covered_techniques = sum(1 for t in tactic_info['techniques'].values() if t['covered'])
                
                if total_techniques > 0:
                    coverage[tactic_id]['coverage_percentage'] = round(
                        (covered_techniques / total_techniques) * 100, 1
                    )
            
            return coverage
            
        except Exception as e:
            logger.error(f"Error generating coverage matrix: {str(e)}")
            return {}

# Singleton instance
mitre_mapper = MITREAttackMapper()

def get_mitre_mapper() -> MITREAttackMapper:
    """Get the MITRE ATT&CK mapper instance"""
    return mitre_mapper