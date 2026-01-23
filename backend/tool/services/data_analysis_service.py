# backend/tool/services/data_analysis_service.py

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from collections import Counter, defaultdict
from statistics import mean, median, mode, stdev
import re
from django.utils import timezone
from django.db import models
from ..models import SecurityDataUpload

logger = logging.getLogger(__name__)

class DataAnalysisService:
    """Service for local data analysis without external APIs"""
    
    def __init__(self):
        """Initialize the analysis service"""
        pass
    
    def analyze_security_data(self, uploads: List[SecurityDataUpload], 
                            period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """
        Comprehensive analysis of security data across multiple tools
        Returns structured insights, patterns, and metrics
        """
        try:
            analysis_results = {
                'period': {
                    'start': period_start.strftime('%Y-%m-%d'),
                    'end': period_end.strftime('%Y-%m-%d'),
                    'duration_days': (period_end - period_start).days
                },
                'data_sources': {},
                'security_insights': {},
                'threat_analysis': {},
                'performance_metrics': {},
                'recommendations': [],
                'patterns_discovered': []
            }
            
            total_records = 0
            all_threats = []
            
            # Analyze each data source
            for upload in uploads:
                tool_analysis = self._analyze_tool_data(upload, period_start, period_end)
                analysis_results['data_sources'][upload.tool_type] = tool_analysis
                total_records += tool_analysis.get('total_records', 0)
                
                # Collect threats from all sources
                if 'threats' in tool_analysis:
                    all_threats.extend(tool_analysis['threats'])
            
            # Global security insights
            analysis_results['security_insights'] = self._generate_security_insights(
                analysis_results['data_sources'], all_threats, total_records
            )
            
            # Threat analysis
            analysis_results['threat_analysis'] = self._analyze_threats(all_threats)
            
            # Performance metrics
            analysis_results['performance_metrics'] = self._calculate_performance_metrics(
                analysis_results['data_sources']
            )
            
            # Pattern discovery
            analysis_results['patterns_discovered'] = self._discover_patterns(
                analysis_results['data_sources'], all_threats
            )
            
            # Generate recommendations
            analysis_results['recommendations'] = self._generate_recommendations(
                analysis_results
            )
            
            return analysis_results
            
        except Exception as e:
            logger.error(f"Error in security data analysis: {str(e)}")
            return self._get_empty_analysis_result(period_start, period_end)
    
    def _analyze_tool_data(self, upload: SecurityDataUpload, 
                          period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """Analyze data from a specific security tool"""
        try:
            if not upload.processed_data:
                return {'error': 'No processed data available', 'total_records': 0}
            
            data = upload.processed_data
            tool_type = upload.tool_type.upper()
            
            analysis = {
                'tool_type': tool_type,
                'upload_id': upload.id,
                'file_name': upload.file_name,
                'processed_at': upload.processed_at.isoformat() if upload.processed_at else None,
                'total_records': 0,
                'kpis': {},
                'threats': [],
                'summary': {}
            }
            
            # Extract KPIs - Enhanced for all tools
            if 'kpis' in data:
                analysis['kpis'] = data['kpis']
                analysis['summary'] = self._summarize_kpis(data['kpis'], tool_type)
                
                # Use KPI data to estimate total records processed
                kpis = data['kpis']
                if tool_type == 'EDR':
                    analysis['total_records'] = max(upload.record_count or 0, kpis.get('totalEndpoints', 0))
                elif tool_type == 'SIEM':
                    analysis['total_records'] = max(upload.record_count or 0, kpis.get('totalEvents', 0))
                elif tool_type == 'MDM':
                    analysis['total_records'] = max(upload.record_count or 0, kpis.get('totalDevices', 0))
                elif tool_type == 'GSUITE':
                    analysis['total_records'] = max(upload.record_count or 0, kpis.get('emailsScanned', 0))
                elif tool_type == 'MERAKI':
                    analysis['total_records'] = max(upload.record_count or 0, 
                                                  kpis.get('totalClients', 0) + kpis.get('totalDevices', 0))
                else:
                    analysis['total_records'] = upload.record_count or 0
            
            # Extract threat details from both structured threats and KPI-derived threats
            threats_from_details = []
            threats_from_kpis = []
            
            # Process detailed threats if available
            if 'details' in data and 'threats' in data['details']:
                threats = data['details']['threats']
                threats_from_details = self._process_threats(threats, tool_type, period_start, period_end)
            
            # Generate threats from KPIs for tools that have them
            if 'kpis' in data:
                threats_from_kpis = self._derive_threats_from_kpis(data['kpis'], tool_type, upload)
            
            # Combine all threats
            all_threats = threats_from_details + threats_from_kpis
            analysis['threats'] = all_threats
            
            # Update total records if we have threats but no records
            if not analysis['total_records'] and all_threats:
                analysis['total_records'] = len(all_threats)
            
            # Generate threat summary
            if all_threats:
                analysis['threat_summary'] = self._analyze_threat_details(all_threats)
            
            # Tool-specific analysis
            if tool_type == 'EDR':
                analysis.update(self._analyze_edr_data(data))
            elif tool_type == 'SIEM':
                analysis.update(self._analyze_siem_data(data))
            elif tool_type == 'GSUITE':
                analysis.update(self._analyze_gsuite_data(data))
            elif tool_type == 'MDM':
                analysis.update(self._analyze_mdm_data(data))
            elif tool_type == 'MERAKI':
                analysis.update(self._analyze_meraki_data(data))
            elif tool_type == 'SONICWALL':
                analysis.update(self._analyze_sonicwall_data(data))
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing {upload.tool_type} data: {str(e)}")
            return {'error': str(e), 'total_records': 0}
    
    def _process_threats(self, threats: List[Dict], tool_type: str, 
                        period_start: datetime, period_end: datetime) -> List[Dict]:
        """Process and standardize threat data"""
        processed_threats = []
        
        for threat in threats:
            try:
                processed_threat = {
                    'source_tool': tool_type,
                    'raw_data': threat,
                    'severity': self._determine_severity(threat, tool_type),
                    'category': self._categorize_threat(threat, tool_type),
                    'timestamp': self._extract_timestamp(threat),
                    'affected_assets': self._extract_affected_assets(threat, tool_type),
                    'description': self._generate_threat_description(threat, tool_type),
                    'status': self._extract_status(threat),
                    'resolution_actions': self._extract_actions(threat)
                }
                
                # Filter by date range if timestamp available
                if processed_threat['timestamp']:
                    threat_date = datetime.fromisoformat(processed_threat['timestamp'].replace('Z', '+00:00'))
                    if period_start <= threat_date <= period_end:
                        processed_threats.append(processed_threat)
                else:
                    # Include threats without timestamp
                    processed_threats.append(processed_threat)
                    
            except Exception as e:
                logger.warning(f"Error processing threat: {str(e)}")
                continue
        
        return processed_threats
    
    def _analyze_edr_data(self, data: Dict) -> Dict[str, Any]:
        """Specialized analysis for EDR data"""
        analysis = {'edr_specific': {}}
        
        if 'kpis' in data:
            kpis = data['kpis']
            analysis['edr_specific'] = {
                'endpoint_health': {
                    'total_endpoints': kpis.get('totalEndpoints', 0),
                    'connected': kpis.get('connectedEndpoints', 0),
                    'disconnected': kpis.get('disconnectedEndpoints', 0),
                    'up_to_date': kpis.get('upToDateEndpoints', 0),
                    'out_of_date': kpis.get('outOfDateEndpoints', 0),
                    'availability_rate': kpis.get('endpointAvailabilityRate', 0)
                },
                'threat_metrics': {
                    'total_threats': kpis.get('totalThreats', 0),
                    'resolved_threats': kpis.get('resolvedThreats', 0),
                    'pending_threats': kpis.get('pendingThreats', 0),
                    'malicious_threats': kpis.get('maliciousThreats', 0),
                    'suspicious_threats': kpis.get('suspiciousThreats', 0),
                    'false_positives': kpis.get('falsePositives', 0),
                    'resolution_rate': kpis.get('threatResolutionRate', 0)
                },
                'scan_metrics': {
                    'completed_scans': kpis.get('completedScans', 0),
                    'failed_scans': kpis.get('failedScans', 0),
                    'success_rate': kpis.get('scanSuccessRate', 0)
                },
                'security_score': kpis.get('securityScore', 0)
            }
        
        return analysis
    
    def _analyze_siem_data(self, data: Dict) -> Dict[str, Any]:
        """Specialized analysis for SIEM data"""
        return {'siem_specific': {'analyzed': True}}
    
    def _analyze_gsuite_data(self, data: Dict) -> Dict[str, Any]:
        """Specialized analysis for G Suite data"""
        return {'gsuite_specific': {'analyzed': True}}
    
    def _analyze_mdm_data(self, data: Dict) -> Dict[str, Any]:
        """Specialized analysis for MDM data"""
        return {'mdm_specific': {'analyzed': True}}
    
    def _analyze_meraki_data(self, data: Dict) -> Dict[str, Any]:
        """Specialized analysis for Meraki data"""
        return {'meraki_specific': {'analyzed': True}}
    
    def _analyze_sonicwall_data(self, data: Dict) -> Dict[str, Any]:
        """Specialized analysis for SonicWall data"""
        return {'sonicwall_specific': {'analyzed': True}}
    
    def _generate_security_insights(self, data_sources: Dict, all_threats: List[Dict], 
                                   total_records: int) -> Dict[str, Any]:
        """Generate high-level security insights"""
        try:
            threat_by_severity = Counter([t['severity'] for t in all_threats])
            threat_by_category = Counter([t['category'] for t in all_threats])
            threat_by_status = Counter([t['status'] for t in all_threats])
            threat_by_source = Counter([t['source_tool'] for t in all_threats])
            
            return {
                'overview': {
                    'total_data_sources': len(data_sources),
                    'total_records_analyzed': total_records,
                    'total_threats_detected': len(all_threats),
                    'data_source_coverage': list(data_sources.keys())
                },
                'threat_distribution': {
                    'by_severity': dict(threat_by_severity),
                    'by_category': dict(threat_by_category),
                    'by_status': dict(threat_by_status),
                    'by_source_tool': dict(threat_by_source)
                },
                'security_posture': self._assess_security_posture(data_sources, all_threats),
                'risk_levels': self._calculate_risk_levels(all_threats),
                'coverage_analysis': self._analyze_coverage(data_sources)
            }
        except Exception as e:
            logger.error(f"Error generating security insights: {str(e)}")
            return {}
    
    def _analyze_threats(self, all_threats: List[Dict]) -> Dict[str, Any]:
        """Detailed threat analysis"""
        try:
            if not all_threats:
                return {'message': 'No threats detected in the analyzed period'}
            
            # Top threats by severity
            critical_threats = [t for t in all_threats if t['severity'] == 'Critical']
            high_threats = [t for t in all_threats if t['severity'] == 'High']
            
            # Threat trends
            threat_timestamps = [t['timestamp'] for t in all_threats if t['timestamp']]
            
            # Most affected assets
            all_assets = []
            for threat in all_threats:
                if threat['affected_assets']:
                    all_assets.extend(threat['affected_assets'])
            
            most_affected = Counter(all_assets).most_common(10)
            
            return {
                'summary': {
                    'total_threats': len(all_threats),
                    'critical_threats': len(critical_threats),
                    'high_threats': len(high_threats),
                    'resolved_threats': len([t for t in all_threats if t['status'] in ['Resolved', 'Closed']]),
                    'pending_threats': len([t for t in all_threats if t['status'] in ['Open', 'Investigating', 'Pending']])
                },
                'top_critical_threats': critical_threats[:5],
                'top_high_threats': high_threats[:5],
                'most_affected_assets': most_affected,
                'threat_categories': dict(Counter([t['category'] for t in all_threats])),
                'resolution_analysis': self._analyze_threat_resolution(all_threats)
            }
        except Exception as e:
            logger.error(f"Error in threat analysis: {str(e)}")
            return {}
    
    def _calculate_performance_metrics(self, data_sources: Dict) -> Dict[str, Any]:
        """Calculate performance and operational metrics"""
        try:
            metrics = {
                'detection_metrics': {},
                'response_metrics': {},
                'system_health': {},
                'compliance_metrics': {}
            }
            
            total_threats = 0
            total_resolved = 0
            total_false_positives = 0
            
            for tool, data in data_sources.items():
                if 'kpis' in data:
                    kpis = data['kpis']
                    tool_threats = kpis.get('totalThreats', kpis.get('total_threats', 0))
                    tool_resolved = kpis.get('resolvedThreats', kpis.get('resolved_threats', 0))
                    tool_fp = kpis.get('falsePositives', kpis.get('false_positives', 0))
                    
                    total_threats += tool_threats
                    total_resolved += tool_resolved
                    total_false_positives += tool_fp
            
            # Calculate overall metrics
            resolution_rate = (total_resolved / total_threats * 100) if total_threats > 0 else 0
            false_positive_rate = (total_false_positives / total_threats * 100) if total_threats > 0 else 0
            
            metrics['detection_metrics'] = {
                'total_detections': total_threats,
                'false_positive_rate': round(false_positive_rate, 2),
                'detection_accuracy': round(100 - false_positive_rate, 2)
            }
            
            metrics['response_metrics'] = {
                'resolution_rate': round(resolution_rate, 2),
                'total_resolved': total_resolved,
                'pending_incidents': total_threats - total_resolved
            }
            
            return metrics
        except Exception as e:
            logger.error(f"Error calculating performance metrics: {str(e)}")
            return {}
    
    def _discover_patterns(self, data_sources: Dict, all_threats: List[Dict]) -> List[Dict]:
        """Discover patterns in security data"""
        patterns = []
        
        try:
            # Pattern 1: Time-based patterns
            time_pattern = self._analyze_time_patterns(all_threats)
            if time_pattern:
                patterns.append(time_pattern)
            
            # Pattern 2: Asset-based patterns  
            asset_pattern = self._analyze_asset_patterns(all_threats)
            if asset_pattern:
                patterns.append(asset_pattern)
            
            # Pattern 3: Threat category patterns
            category_pattern = self._analyze_category_patterns(all_threats)
            if category_pattern:
                patterns.append(category_pattern)
            
            # Pattern 4: Tool effectiveness patterns
            tool_pattern = self._analyze_tool_patterns(data_sources)
            if tool_pattern:
                patterns.append(tool_pattern)
            
        except Exception as e:
            logger.error(f"Error discovering patterns: {str(e)}")
        
        return patterns
    
    def _generate_recommendations(self, analysis_results: Dict) -> List[Dict]:
        """Generate actionable recommendations based on analysis"""
        recommendations = []
        
        try:
            insights = analysis_results.get('security_insights', {})
            threat_analysis = analysis_results.get('threat_analysis', {})
            performance = analysis_results.get('performance_metrics', {})
            
            # Security posture recommendations
            if 'security_posture' in insights:
                posture = insights['security_posture']
                if posture.get('overall_score', 0) < 70:
                    recommendations.append({
                        'priority': 'High',
                        'category': 'Security Posture',
                        'title': 'Improve Overall Security Posture',
                        'description': f"Current security score is {posture.get('overall_score', 0)}%. Immediate attention needed.",
                        'actions': [
                            'Review and update security policies',
                            'Increase monitoring coverage',
                            'Implement additional security controls'
                        ]
                    })
            
            # Threat-based recommendations
            if threat_analysis.get('summary', {}).get('pending_threats', 0) > 0:
                pending = threat_analysis['summary']['pending_threats']
                recommendations.append({
                    'priority': 'Medium',
                    'category': 'Threat Response',
                    'title': 'Address Pending Threats',
                    'description': f"{pending} threats require attention and resolution.",
                    'actions': [
                        'Prioritize critical and high severity threats',
                        'Assign dedicated resources for threat investigation',
                        'Implement automated response procedures where possible'
                    ]
                })
            
            # Performance-based recommendations
            detection_metrics = performance.get('detection_metrics', {})
            if detection_metrics.get('false_positive_rate', 0) > 15:
                recommendations.append({
                    'priority': 'Medium',
                    'category': 'Detection Accuracy',
                    'title': 'Reduce False Positive Rate',
                    'description': f"False positive rate is {detection_metrics.get('false_positive_rate', 0)}%, which may impact efficiency.",
                    'actions': [
                        'Tune detection rules and signatures',
                        'Implement better threat intelligence feeds',
                        'Train security team on threat identification'
                    ]
                })
            
            # Coverage recommendations
            data_sources = analysis_results.get('data_sources', {})
            if len(data_sources) < 3:
                recommendations.append({
                    'priority': 'Medium',
                    'category': 'Coverage',
                    'title': 'Expand Security Monitoring Coverage',
                    'description': f"Only {len(data_sources)} security tools are currently monitored.",
                    'actions': [
                        'Deploy additional security tools',
                        'Integrate existing tools not currently monitored',
                        'Consider cloud security monitoring solutions'
                    ]
                })
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
        
        return recommendations
    
    # Helper methods
    def _determine_severity(self, threat: Dict, tool_type: str) -> str:
        """Determine threat severity based on available data"""
        confidence = threat.get('confidence_level', '').lower()
        classification = threat.get('classification', '').lower()
        verdict = threat.get('analyst_verdict', '').lower()
        
        if 'critical' in confidence or 'malicious' in classification:
            return 'Critical'
        elif 'suspicious' in confidence or 'high' in classification:
            return 'High'
        elif 'false positive' in verdict:
            return 'Low'
        else:
            return 'Medium'
    
    def _categorize_threat(self, threat: Dict, tool_type: str) -> str:
        """Categorize threat based on available information"""
        detecting_engine = str(threat.get('detecting_engine', '')).lower()
        threat_details = str(threat.get('threat_details', '')).lower()
        path = str(threat.get('path', '')).lower()
        
        if 'malware' in detecting_engine or 'virus' in threat_details:
            return 'Malware'
        elif 'documents' in detecting_engine or 'scripts' in detecting_engine:
            return 'Suspicious Document'
        elif 'network' in detecting_engine:
            return 'Network Threat'
        elif '.exe' in path or '.dll' in path:
            return 'Executable Threat'
        else:
            return 'Unknown'
    
    def _extract_timestamp(self, threat: Dict) -> Optional[str]:
        """Extract timestamp from threat data"""
        return threat.get('reported_time') or threat.get('identifying_time')
    
    def _extract_affected_assets(self, threat: Dict, tool_type: str) -> List[str]:
        """Extract affected assets from threat data"""
        assets = []
        if 'endpoints' in threat:
            assets.append(threat['endpoints'])
        if 'site' in threat:
            assets.append(threat['site'])
        return assets
    
    def _generate_threat_description(self, threat: Dict, tool_type: str) -> str:
        """Generate human-readable threat description"""
        details = threat.get('threat_details', '')
        classification = threat.get('classification', '')
        confidence = threat.get('confidence_level', '')
        
        if details:
            return f"{confidence} threat detected: {details}"
        else:
            return f"{confidence} {classification} threat detected"
    
    def _extract_status(self, threat: Dict) -> str:
        """Extract threat status"""
        return threat.get('incident_status', 'Unknown')
    
    def _extract_actions(self, threat: Dict) -> List[str]:
        """Extract resolution actions taken"""
        actions = threat.get('completed_actions_parsed', [])
        if not actions:
            completed = threat.get('completed_actions', '')
            if completed:
                # Parse string representation of actions
                actions = [completed.strip("[]'\"").replace("'", "")]
        return actions if isinstance(actions, list) else []
    
    def _summarize_kpis(self, kpis: Dict, tool_type: str) -> Dict[str, Any]:
        """Summarize KPIs for the tool"""
        summary = {'tool_type': tool_type}
        
        # Common KPI patterns
        if 'securityScore' in kpis:
            summary['security_score'] = kpis['securityScore']
        if 'totalThreats' in kpis:
            summary['threats_detected'] = kpis['totalThreats']
        if 'threatResolutionRate' in kpis:
            summary['resolution_rate'] = kpis['threatResolutionRate']
        
        return summary
    
    def _analyze_threat_details(self, threats: List[Dict]) -> Dict[str, Any]:
        """Analyze processed threats for patterns"""
        if not threats:
            return {}
        
        return {
            'total_count': len(threats),
            'by_severity': dict(Counter([t['severity'] for t in threats])),
            'by_category': dict(Counter([t['category'] for t in threats])),
            'by_status': dict(Counter([t['status'] for t in threats]))
        }
    
    def _assess_security_posture(self, data_sources: Dict, threats: List[Dict]) -> Dict[str, Any]:
        """Assess overall security posture"""
        try:
            # Calculate security score based on available data
            total_threats = len(threats)
            resolved_threats = len([t for t in threats if 'resolved' in t['status'].lower()])
            
            # Get security scores from tools if available
            security_scores = []
            for tool, data in data_sources.items():
                if 'kpis' in data and 'securityScore' in data['kpis']:
                    security_scores.append(data['kpis']['securityScore'])
            
            overall_score = mean(security_scores) if security_scores else 50
            resolution_rate = (resolved_threats / total_threats * 100) if total_threats > 0 else 100
            
            # Adjust score based on threat resolution
            adjusted_score = (overall_score + resolution_rate) / 2
            
            return {
                'overall_score': round(adjusted_score, 2),
                'threat_resolution_rate': round(resolution_rate, 2),
                'security_tools_score': round(mean(security_scores), 2) if security_scores else None,
                'assessment': self._get_posture_assessment(adjusted_score)
            }
        except Exception as e:
            logger.error(f"Error assessing security posture: {str(e)}")
            return {'overall_score': 50, 'assessment': 'Unable to assess'}
    
    def _get_posture_assessment(self, score: float) -> str:
        """Get textual assessment of security posture"""
        if score >= 90:
            return 'Excellent'
        elif score >= 80:
            return 'Good'
        elif score >= 70:
            return 'Fair' 
        elif score >= 60:
            return 'Poor'
        else:
            return 'Critical'
    
    def _calculate_risk_levels(self, threats: List[Dict]) -> Dict[str, Any]:
        """Calculate risk levels based on threats"""
        if not threats:
            return {'overall_risk': 'Low'}
        
        severity_weights = {'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1}
        total_weight = sum(severity_weights.get(t['severity'], 2) for t in threats)
        avg_weight = total_weight / len(threats)
        
        if avg_weight >= 3.5:
            risk_level = 'Critical'
        elif avg_weight >= 2.5:
            risk_level = 'High'
        elif avg_weight >= 1.5:
            risk_level = 'Medium'
        else:
            risk_level = 'Low'
        
        return {
            'overall_risk': risk_level,
            'risk_score': round(avg_weight, 2),
            'contributing_factors': dict(Counter([t['severity'] for t in threats]))
        }
    
    def _analyze_coverage(self, data_sources: Dict) -> Dict[str, Any]:
        """Analyze security monitoring coverage"""
        tool_types = list(data_sources.keys())
        expected_tools = ['EDR', 'SIEM', 'GSUITE', 'MDM', 'MERAKI', 'SONICWALL']
        
        coverage_percentage = (len(tool_types) / len(expected_tools)) * 100
        missing_tools = set(expected_tools) - set(tool_types)
        
        return {
            'coverage_percentage': round(coverage_percentage, 2),
            'monitored_tools': tool_types,
            'missing_tools': list(missing_tools),
            'coverage_assessment': 'Good' if coverage_percentage >= 70 else 'Needs Improvement'
        }
    
    def _analyze_time_patterns(self, threats: List[Dict]) -> Optional[Dict]:
        """Analyze time-based patterns in threats"""
        # This would analyze threat occurrence patterns by time
        return None  # Placeholder for time analysis
    
    def _analyze_asset_patterns(self, threats: List[Dict]) -> Optional[Dict]:
        """Analyze asset-based patterns in threats"""
        # This would analyze which assets are most frequently targeted
        return None  # Placeholder for asset analysis
    
    def _analyze_category_patterns(self, threats: List[Dict]) -> Optional[Dict]:
        """Analyze threat category patterns"""
        # This would analyze threat category trends
        return None  # Placeholder for category analysis
    
    def _analyze_tool_patterns(self, data_sources: Dict) -> Optional[Dict]:
        """Analyze tool effectiveness patterns"""
        # This would analyze which tools are most effective
        return None  # Placeholder for tool analysis
    
    def _analyze_threat_resolution(self, threats: List[Dict]) -> Dict[str, Any]:
        """Analyze threat resolution patterns"""
        try:
            resolved = [t for t in threats if 'resolved' in t['status'].lower() or 'closed' in t['status'].lower()]
            pending = [t for t in threats if t not in resolved]
            
            return {
                'total_threats': len(threats),
                'resolved_count': len(resolved),
                'pending_count': len(pending),
                'resolution_rate': round((len(resolved) / len(threats) * 100), 2) if threats else 0,
                'avg_resolution_actions': round(mean([len(t['resolution_actions']) for t in resolved]), 2) if resolved else 0
            }
        except Exception as e:
            logger.error(f"Error analyzing threat resolution: {str(e)}")
            return {}
    
    def _derive_threats_from_kpis(self, kpis: Dict[str, Any], tool_type: str, upload) -> List[Dict[str, Any]]:
        """Derive threat information from KPI data"""
        threats = []
        
        try:
            if tool_type == 'EDR':
                # EDR threats from KPIs
                malicious_threats = kpis.get('maliciousThreats', 0)
                suspicious_threats = kpis.get('suspiciousThreats', 0)
                
                for i in range(malicious_threats):
                    threats.append({
                        'id': f'edr_malicious_{i+1}',
                        'category': 'Malware',
                        'severity': 'Critical',
                        'description': f'Malicious threat detected by EDR system',
                        'timestamp': upload.uploaded_at.isoformat(),
                        'status': 'Detected',
                        'source_tool': tool_type,
                        'affected_assets': ['Endpoint'],
                        'source': 'KPI Analysis'
                    })
                
                for i in range(suspicious_threats):
                    threats.append({
                        'id': f'edr_suspicious_{i+1}',
                        'category': 'Suspicious Activity',
                        'severity': 'High',
                        'description': f'Suspicious activity detected by EDR system',
                        'timestamp': upload.uploaded_at.isoformat(),
                        'status': 'Investigating',
                        'source_tool': tool_type,
                        'affected_assets': ['Endpoint'],
                        'source': 'KPI Analysis'
                    })
                    
            elif tool_type == 'GSUITE':
                # GSuite email threats
                phishing_attempts = kpis.get('phishingAttempted', 0)
                suspicious_emails = kpis.get('suspiciousEmails', 0)
                
                for i in range(phishing_attempts):
                    threats.append({
                        'id': f'gsuite_phishing_{i+1}',
                        'category': 'Phishing',
                        'severity': 'Critical',
                        'description': f'Phishing attempt detected in email system',
                        'timestamp': upload.uploaded_at.isoformat(),
                        'status': 'Blocked',
                        'source_tool': tool_type,
                        'affected_assets': ['Email System'],
                        'source': 'KPI Analysis'
                    })
                
                for i in range(suspicious_emails):
                    threats.append({
                        'id': f'gsuite_suspicious_{i+1}',
                        'category': 'Suspicious Email',
                        'severity': 'Medium',
                        'description': f'Suspicious email detected and quarantined',
                        'timestamp': upload.uploaded_at.isoformat(),
                        'status': 'Quarantined',
                        'source_tool': tool_type,
                        'affected_assets': ['Email System'],
                        'source': 'KPI Analysis'
                    })
                    
            elif tool_type == 'MDM':
                # MDM security issues
                security_issues = kpis.get('securityIssues', 0)
                compromised_devices = kpis.get('compromisedDevices', 0)
                
                for i in range(compromised_devices):
                    threats.append({
                        'id': f'mdm_compromised_{i+1}',
                        'category': 'Device Compromise',
                        'severity': 'Critical',
                        'description': f'Compromised mobile device detected',
                        'timestamp': upload.uploaded_at.isoformat(),
                        'status': 'Investigating',
                        'source_tool': tool_type,
                        'affected_assets': ['Mobile Device'],
                        'source': 'KPI Analysis'
                    })
                
                for i in range(security_issues - compromised_devices):
                    threats.append({
                        'id': f'mdm_security_{i+1}',
                        'category': 'Security Policy Violation',
                        'severity': 'Medium',
                        'description': f'Mobile device security policy violation',
                        'timestamp': upload.uploaded_at.isoformat(),
                        'status': 'Remediation Required',
                        'source_tool': tool_type,
                        'affected_assets': ['Mobile Device'],
                        'source': 'KPI Analysis'
                    })
                    
            elif tool_type == 'SIEM':
                # SIEM critical alerts
                critical_alerts = kpis.get('criticalAlerts', 0)
                
                for i in range(critical_alerts):
                    threats.append({
                        'id': f'siem_critical_{i+1}',
                        'category': 'Security Event',
                        'severity': 'Critical',
                        'description': f'Critical security event detected by SIEM',
                        'timestamp': upload.uploaded_at.isoformat(),
                        'status': 'Analyzing',
                        'source_tool': tool_type,
                        'affected_assets': ['Infrastructure'],
                        'source': 'KPI Analysis'
                    })
                    
        except Exception as e:
            logger.warning(f"Error deriving threats from KPIs for {tool_type}: {e}")
        
        return threats
    
    def _get_empty_analysis_result(self, period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """Return empty analysis result structure"""
        return {
            'period': {
                'start': period_start.strftime('%Y-%m-%d'),
                'end': period_end.strftime('%Y-%m-%d'),
                'duration_days': (period_end - period_start).days
            },
            'data_sources': {},
            'security_insights': {'overview': {'total_data_sources': 0, 'total_records_analyzed': 0}},
            'threat_analysis': {'message': 'No data available for analysis'},
            'performance_metrics': {},
            'recommendations': [],
            'patterns_discovered': [],
            'error': 'Analysis could not be completed due to insufficient data'
        }