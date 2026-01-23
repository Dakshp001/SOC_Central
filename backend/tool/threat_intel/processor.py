# backend/tool/threat_intel/processor.py - Real-time Threat Intelligence Feed

import requests
import json
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union
from django.core.cache import cache
from django.conf import settings
import ipaddress

logger = logging.getLogger(__name__)

class ThreatIntelligenceService:
    """
    Real-time threat intelligence service for SOC Central
    Integrates with multiple threat intelligence sources
    """
    
    def __init__(self):
        self.sources = {
            'virustotal': {
                'enabled': True,
                'api_key': getattr(settings, 'VIRUSTOTAL_API_KEY', None),
                'base_url': 'https://www.virustotal.com/vtapi/v2',
                'rate_limit': 4,  # requests per minute for free tier
                'cache_ttl': 3600  # 1 hour
            },
            'alienvault': {
                'enabled': True,
                'api_key': getattr(settings, 'ALIENVAULT_API_KEY', None),
                'base_url': 'https://otx.alienvault.com/api/v1',
                'rate_limit': 1000,  # requests per hour
                'cache_ttl': 1800  # 30 minutes
            },
            'abuseipdb': {
                'enabled': True,
                'api_key': getattr(settings, 'ABUSEIPDB_API_KEY', None),
                'base_url': 'https://api.abuseipdb.com/api/v2',
                'rate_limit': 1000,  # requests per day for free tier
                'cache_ttl': 7200  # 2 hours
            },
            'misp': {
                'enabled': False,  # Requires local MISP instance
                'api_key': getattr(settings, 'MISP_API_KEY', None),
                'base_url': getattr(settings, 'MISP_URL', None),
                'cache_ttl': 1800
            }
        }
        
        # Threat categories mapping
        self.threat_categories = {
            'malware': {
                'severity': 'high',
                'description': 'Malicious software detected',
                'mitre_tactics': ['execution', 'persistence', 'defense-evasion']
            },
            'phishing': {
                'severity': 'high',
                'description': 'Phishing attempt detected',
                'mitre_tactics': ['initial-access', 'credential-access']
            },
            'botnet': {
                'severity': 'high',
                'description': 'Botnet activity detected',
                'mitre_tactics': ['command-and-control', 'persistence']
            },
            'ransomware': {
                'severity': 'critical',
                'description': 'Ransomware activity detected',
                'mitre_tactics': ['impact', 'execution', 'persistence']
            },
            'suspicious': {
                'severity': 'medium',
                'description': 'Suspicious activity detected',
                'mitre_tactics': ['discovery']
            },
            'spam': {
                'severity': 'low',
                'description': 'Spam activity detected',
                'mitre_tactics': ['initial-access']
            }
        }
    
    def analyze_ip(self, ip_address: str) -> Dict:
        """
        Analyze IP address across threat intelligence sources
        
        Args:
            ip_address: IP address to analyze
            
        Returns:
            Threat intelligence data for the IP
        """
        try:
            # Validate IP address
            try:
                ip_obj = ipaddress.ip_address(ip_address)
                # Skip private IP addresses
                if ip_obj.is_private or ip_obj.is_loopback:
                    return {
                        'ip': ip_address,
                        'is_malicious': False,
                        'threat_score': 0,
                        'categories': [],
                        'sources': [],
                        'last_updated': datetime.now().isoformat(),
                        'message': 'Private or loopback IP address'
                    }
            except ValueError:
                return {'error': 'Invalid IP address format'}
            
            # Check cache first
            cache_key = f"threat_intel_ip_{hashlib.md5(ip_address.encode()).hexdigest()}"
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.debug(f"Returning cached threat intel for IP {ip_address}")
                return cached_result
            
            threat_data = {
                'ip': ip_address,
                'is_malicious': False,
                'threat_score': 0,
                'categories': [],
                'sources': [],
                'details': {},
                'last_updated': datetime.now().isoformat()
            }
            
            # Query VirusTotal
            vt_data = self._query_virustotal_ip(ip_address)
            if vt_data:
                threat_data['sources'].append('virustotal')
                threat_data['details']['virustotal'] = vt_data
                if vt_data.get('malicious_count', 0) > 0:
                    threat_data['is_malicious'] = True
                    threat_data['threat_score'] += min(vt_data.get('malicious_count', 0) * 10, 50)
            
            # Query AbuseIPDB
            abuse_data = self._query_abuseipdb_ip(ip_address)
            if abuse_data:
                threat_data['sources'].append('abuseipdb')
                threat_data['details']['abuseipdb'] = abuse_data
                confidence = abuse_data.get('abuseConfidenceScore', 0)
                if confidence > 50:
                    threat_data['is_malicious'] = True
                    threat_data['threat_score'] += confidence
            
            # Query AlienVault OTX
            otx_data = self._query_alienvault_ip(ip_address)
            if otx_data:
                threat_data['sources'].append('alienvault')
                threat_data['details']['alienvault'] = otx_data
                if otx_data.get('pulses_count', 0) > 0:
                    threat_data['is_malicious'] = True
                    threat_data['threat_score'] += min(otx_data.get('pulses_count', 0) * 5, 30)
            
            # Normalize threat score to 0-100
            threat_data['threat_score'] = min(threat_data['threat_score'], 100)
            
            # Determine threat categories
            threat_data['categories'] = self._determine_categories(threat_data)
            
            # Cache the result
            cache.set(cache_key, threat_data, self.sources['virustotal']['cache_ttl'])
            
            logger.info(f"Threat intelligence analysis completed for IP {ip_address}: "
                       f"Score {threat_data['threat_score']}, Malicious: {threat_data['is_malicious']}")
            
            return threat_data
            
        except Exception as e:
            logger.error(f"Error analyzing IP {ip_address}: {str(e)}")
            return {
                'ip': ip_address,
                'error': str(e),
                'last_updated': datetime.now().isoformat()
            }
    
    def analyze_domain(self, domain: str) -> Dict:
        """
        Analyze domain across threat intelligence sources
        
        Args:
            domain: Domain to analyze
            
        Returns:
            Threat intelligence data for the domain
        """
        try:
            # Check cache first
            cache_key = f"threat_intel_domain_{hashlib.md5(domain.encode()).hexdigest()}"
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.debug(f"Returning cached threat intel for domain {domain}")
                return cached_result
            
            threat_data = {
                'domain': domain,
                'is_malicious': False,
                'threat_score': 0,
                'categories': [],
                'sources': [],
                'details': {},
                'last_updated': datetime.now().isoformat()
            }
            
            # Query VirusTotal
            vt_data = self._query_virustotal_domain(domain)
            if vt_data:
                threat_data['sources'].append('virustotal')
                threat_data['details']['virustotal'] = vt_data
                if vt_data.get('malicious_count', 0) > 0:
                    threat_data['is_malicious'] = True
                    threat_data['threat_score'] += min(vt_data.get('malicious_count', 0) * 10, 50)
            
            # Query AlienVault OTX
            otx_data = self._query_alienvault_domain(domain)
            if otx_data:
                threat_data['sources'].append('alienvault')
                threat_data['details']['alienvault'] = otx_data
                if otx_data.get('pulses_count', 0) > 0:
                    threat_data['is_malicious'] = True
                    threat_data['threat_score'] += min(otx_data.get('pulses_count', 0) * 5, 30)
            
            # Normalize threat score
            threat_data['threat_score'] = min(threat_data['threat_score'], 100)
            
            # Determine threat categories
            threat_data['categories'] = self._determine_categories(threat_data)
            
            # Cache the result
            cache.set(cache_key, threat_data, self.sources['virustotal']['cache_ttl'])
            
            logger.info(f"Threat intelligence analysis completed for domain {domain}: "
                       f"Score {threat_data['threat_score']}, Malicious: {threat_data['is_malicious']}")
            
            return threat_data
            
        except Exception as e:
            logger.error(f"Error analyzing domain {domain}: {str(e)}")
            return {
                'domain': domain,
                'error': str(e),
                'last_updated': datetime.now().isoformat()
            }
    
    def analyze_file_hash(self, file_hash: str) -> Dict:
        """
        Analyze file hash across threat intelligence sources
        
        Args:
            file_hash: File hash (MD5, SHA1, or SHA256) to analyze
            
        Returns:
            Threat intelligence data for the file hash
        """
        try:
            # Check cache first
            cache_key = f"threat_intel_hash_{hashlib.md5(file_hash.encode()).hexdigest()}"
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.debug(f"Returning cached threat intel for hash {file_hash}")
                return cached_result
            
            threat_data = {
                'hash': file_hash,
                'is_malicious': False,
                'threat_score': 0,
                'categories': [],
                'sources': [],
                'details': {},
                'last_updated': datetime.now().isoformat()
            }
            
            # Query VirusTotal
            vt_data = self._query_virustotal_hash(file_hash)
            if vt_data:
                threat_data['sources'].append('virustotal')
                threat_data['details']['virustotal'] = vt_data
                if vt_data.get('malicious_count', 0) > 0:
                    threat_data['is_malicious'] = True
                    threat_data['threat_score'] = min(vt_data.get('malicious_count', 0) * 10, 100)
            
            # Determine threat categories
            threat_data['categories'] = self._determine_categories(threat_data)
            
            # Cache the result
            cache.set(cache_key, threat_data, self.sources['virustotal']['cache_ttl'])
            
            logger.info(f"Threat intelligence analysis completed for hash {file_hash}: "
                       f"Score {threat_data['threat_score']}, Malicious: {threat_data['is_malicious']}")
            
            return threat_data
            
        except Exception as e:
            logger.error(f"Error analyzing hash {file_hash}: {str(e)}")
            return {
                'hash': file_hash,
                'error': str(e),
                'last_updated': datetime.now().isoformat()
            }
    
    def _query_virustotal_ip(self, ip_address: str) -> Optional[Dict]:
        """Query VirusTotal for IP reputation"""
        if not self.sources['virustotal']['enabled'] or not self.sources['virustotal']['api_key']:
            return None
        
        try:
            # For demo purposes, return mock data since we don't have real API keys
            # In production, this would make actual API calls
            logger.info(f"Mock VirusTotal query for IP {ip_address}")
            
            # Mock response based on IP patterns
            if ip_address.startswith('192.168.') or ip_address.startswith('10.') or ip_address.startswith('127.'):
                return None  # Private IPs
            
            # Simulate some IPs being flagged
            mock_malicious_ips = ['192.0.2.1', '198.51.100.1', '203.0.113.1']
            if ip_address in mock_malicious_ips:
                return {
                    'malicious_count': 5,
                    'total_engines': 70,
                    'last_analysis_date': datetime.now().isoformat(),
                    'reputation': 'malicious'
                }
            else:
                return {
                    'malicious_count': 0,
                    'total_engines': 70,
                    'last_analysis_date': datetime.now().isoformat(),
                    'reputation': 'clean'
                }
                
        except Exception as e:
            logger.error(f"Error querying VirusTotal for IP {ip_address}: {str(e)}")
            return None
    
    def _query_virustotal_domain(self, domain: str) -> Optional[Dict]:
        """Query VirusTotal for domain reputation"""
        if not self.sources['virustotal']['enabled'] or not self.sources['virustotal']['api_key']:
            return None
        
        try:
            # Mock implementation
            logger.info(f"Mock VirusTotal query for domain {domain}")
            
            # Simulate some domains being flagged
            suspicious_keywords = ['malware', 'phishing', 'scam', 'fake', 'suspicious']
            if any(keyword in domain.lower() for keyword in suspicious_keywords):
                return {
                    'malicious_count': 8,
                    'total_engines': 70,
                    'last_analysis_date': datetime.now().isoformat(),
                    'reputation': 'malicious'
                }
            else:
                return {
                    'malicious_count': 0,
                    'total_engines': 70,
                    'last_analysis_date': datetime.now().isoformat(),
                    'reputation': 'clean'
                }
                
        except Exception as e:
            logger.error(f"Error querying VirusTotal for domain {domain}: {str(e)}")
            return None
    
    def _query_virustotal_hash(self, file_hash: str) -> Optional[Dict]:
        """Query VirusTotal for file hash reputation"""
        if not self.sources['virustotal']['enabled'] or not self.sources['virustotal']['api_key']:
            return None
        
        try:
            # Mock implementation
            logger.info(f"Mock VirusTotal query for hash {file_hash}")
            
            # Simulate some hashes being flagged (known bad hashes)
            known_bad_patterns = ['deadbeef', 'badc0de', '1337']
            if any(pattern in file_hash.lower() for pattern in known_bad_patterns):
                return {
                    'malicious_count': 45,
                    'total_engines': 70,
                    'last_analysis_date': datetime.now().isoformat(),
                    'reputation': 'malicious',
                    'malware_names': ['Trojan.Generic', 'PUA.Unwanted']
                }
            else:
                return {
                    'malicious_count': 0,
                    'total_engines': 70,
                    'last_analysis_date': datetime.now().isoformat(),
                    'reputation': 'clean'
                }
                
        except Exception as e:
            logger.error(f"Error querying VirusTotal for hash {file_hash}: {str(e)}")
            return None
    
    def _query_abuseipdb_ip(self, ip_address: str) -> Optional[Dict]:
        """Query AbuseIPDB for IP reputation"""
        if not self.sources['abuseipdb']['enabled'] or not self.sources['abuseipdb']['api_key']:
            return None
        
        try:
            # Mock implementation
            logger.info(f"Mock AbuseIPDB query for IP {ip_address}")
            
            # Simulate abuse confidence scores
            import random
            confidence_score = random.randint(0, 100) if '192.0.2' in ip_address else random.randint(0, 25)
            
            return {
                'abuseConfidenceScore': confidence_score,
                'countryCode': 'US',
                'isp': 'Example ISP',
                'totalReports': confidence_score // 10,
                'lastReportedAt': datetime.now().isoformat() if confidence_score > 0 else None
            }
                
        except Exception as e:
            logger.error(f"Error querying AbuseIPDB for IP {ip_address}: {str(e)}")
            return None
    
    def _query_alienvault_ip(self, ip_address: str) -> Optional[Dict]:
        """Query AlienVault OTX for IP reputation"""
        if not self.sources['alienvault']['enabled']:
            return None
        
        try:
            # Mock implementation
            logger.info(f"Mock AlienVault query for IP {ip_address}")
            
            # Simulate pulse data
            import random
            pulses_count = random.randint(0, 5) if '203.0.113' in ip_address else 0
            
            return {
                'pulses_count': pulses_count,
                'pulses': [
                    {
                        'name': 'Malicious IP Activity',
                        'description': 'Known malicious IP addresses',
                        'tags': ['malware', 'botnet']
                    }
                ] if pulses_count > 0 else []
            }
                
        except Exception as e:
            logger.error(f"Error querying AlienVault for IP {ip_address}: {str(e)}")
            return None
    
    def _query_alienvault_domain(self, domain: str) -> Optional[Dict]:
        """Query AlienVault OTX for domain reputation"""
        if not self.sources['alienvault']['enabled']:
            return None
        
        try:
            # Mock implementation
            logger.info(f"Mock AlienVault query for domain {domain}")
            
            # Simulate pulse data for suspicious domains
            suspicious_keywords = ['phishing', 'malware', 'scam']
            pulses_count = 3 if any(keyword in domain.lower() for keyword in suspicious_keywords) else 0
            
            return {
                'pulses_count': pulses_count,
                'pulses': [
                    {
                        'name': 'Phishing Campaign',
                        'description': 'Domains used in phishing campaigns',
                        'tags': ['phishing', 'social-engineering']
                    }
                ] if pulses_count > 0 else []
            }
                
        except Exception as e:
            logger.error(f"Error querying AlienVault for domain {domain}: {str(e)}")
            return None
    
    def _determine_categories(self, threat_data: Dict) -> List[str]:
        """Determine threat categories based on analysis results"""
        categories = []
        
        if threat_data.get('is_malicious', False):
            # Check VirusTotal data for specific malware types
            vt_data = threat_data.get('details', {}).get('virustotal', {})
            malware_names = vt_data.get('malware_names', [])
            
            # Categorize based on malware names or other indicators
            for name in malware_names:
                name_lower = name.lower()
                if 'trojan' in name_lower or 'backdoor' in name_lower:
                    categories.append('malware')
                elif 'ransomware' in name_lower or 'crypto' in name_lower:
                    categories.append('ransomware')
                elif 'phish' in name_lower:
                    categories.append('phishing')
                elif 'bot' in name_lower:
                    categories.append('botnet')
                elif 'pua' in name_lower or 'adware' in name_lower:
                    categories.append('suspicious')
            
            # Default to malware if no specific category found
            if not categories:
                categories.append('malware')
        
        return list(set(categories))  # Remove duplicates
    
    def get_threat_summary(self, indicators: List[str]) -> Dict:
        """
        Get threat intelligence summary for multiple indicators
        
        Args:
            indicators: List of IPs, domains, or hashes to analyze
            
        Returns:
            Summary of threat intelligence findings
        """
        try:
            summary = {
                'total_indicators': len(indicators),
                'malicious_count': 0,
                'clean_count': 0,
                'error_count': 0,
                'categories': {},
                'high_risk_indicators': [],
                'recommendations': [],
                'last_updated': datetime.now().isoformat()
            }
            
            for indicator in indicators:
                # Determine indicator type
                try:
                    ipaddress.ip_address(indicator)
                    result = self.analyze_ip(indicator)
                except ValueError:
                    if '.' in indicator and not indicator.replace('.', '').replace('-', '').isalnum():
                        result = self.analyze_domain(indicator)
                    else:
                        result = self.analyze_file_hash(indicator)
                
                if 'error' in result:
                    summary['error_count'] += 1
                elif result.get('is_malicious', False):
                    summary['malicious_count'] += 1
                    if result.get('threat_score', 0) >= 70:
                        summary['high_risk_indicators'].append({
                            'indicator': indicator,
                            'threat_score': result.get('threat_score', 0),
                            'categories': result.get('categories', [])
                        })
                else:
                    summary['clean_count'] += 1
                
                # Count categories
                for category in result.get('categories', []):
                    summary['categories'][category] = summary['categories'].get(category, 0) + 1
            
            # Generate recommendations
            if summary['malicious_count'] > 0:
                summary['recommendations'].append("Block or investigate malicious indicators")
                if 'ransomware' in summary['categories']:
                    summary['recommendations'].append("Implement ransomware protection measures")
                if 'phishing' in summary['categories']:
                    summary['recommendations'].append("Enhance email security and user training")
                if 'botnet' in summary['categories']:
                    summary['recommendations'].append("Check for compromised systems in network")
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating threat summary: {str(e)}")
            return {
                'error': str(e),
                'last_updated': datetime.now().isoformat()
            }

# Singleton instance
threat_intel_service = ThreatIntelligenceService()

def get_threat_intel_service() -> ThreatIntelligenceService:
    """Get the threat intelligence service instance"""
    return threat_intel_service