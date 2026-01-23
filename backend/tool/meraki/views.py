# backend/tool/meraki/views.py
# Enhanced Meraki views with comprehensive network analytics endpoints

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from django.http import JsonResponse

try:
    from ..shared.views import BaseToolUploadView
    from ..shared import safe_float, safe_int
except ImportError:
    from backend.tool.shared.views import BaseToolUploadView
    from backend.tool.shared import safe_float, safe_int

try:
    from ..shared.views import BaseToolUploadView
except ImportError:
    from backend.tool.shared.views import BaseToolUploadView

try:
    from .processor import process_meraki_excel
except ImportError:
    from backend.tool.meraki.processor import process_meraki_excel

logger = logging.getLogger(__name__)

class MerakiUploadView(BaseToolUploadView):
    """Enhanced Meraki upload view with comprehensive network analytics"""
    tool_name = "Meraki"
    processor_function = staticmethod(process_meraki_excel)

    def post_process_result(self, result, uploaded_file):
        """Meraki-specific post-processing with enhanced logging"""
        logger.info(f"Meraki processing complete for {uploaded_file.name}")
        
        # Add processing metadata
        if 'metadata' not in result:
            result['metadata'] = {}
        
        result['metadata'].update({
            'fileName': uploaded_file.name,
            'fileSize': uploaded_file.size,
            'processor': 'MerakiUploadView',
            'version': '2.0'
        })
        
        # Log key metrics for monitoring
        if 'kpis' in result:
            kpis = result['kpis']
            logger.info(f"Meraki KPIs - Total Devices: {kpis.get('totalDevices', 0)}, "
                       f"Total Clients: {kpis.get('totalClients', 0)}, "
                       f"Network Health: {kpis.get('networkHealthScore', 0)}")
        
        return result

class MerakiKPIDetailView(APIView):
    """Get detailed information for specific KPI categories"""
    
    def post(self, request, kpi_type):
        """Return detailed data for a specific KPI type"""
        try:
            # Expect the full processed data to be sent from frontend
            data = request.data
            
            if not data or 'details' not in data:
                return Response({
                    'error': 'No processed data provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            details = data['details']
            kpi_data = self.get_kpi_details(kpi_type, details)
            
            if not kpi_data:
                return Response({
                    'error': f'KPI type "{kpi_type}" not found or has no data'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Add analytics for the specific KPI
            analytics = self.get_kpi_analytics(kpi_type, kpi_data)
            
            return Response({
                'kpiType': kpi_type,
                'data': kpi_data,
                'analytics': analytics,
                'summary': self.get_kpi_summary(kpi_type, kpi_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting KPI details for {kpi_type}: {str(e)}")
            return Response({
                'error': f'Error processing KPI details: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_kpi_details(self, kpi_type, details):
        """Map KPI types to their corresponding data sheets"""
        kpi_mapping = {
            'ssids': 'Top SSIDs by usage',
            'devices': 'Top devices',
            'device_models': 'Top devices models by usage',
            'clients': 'Top clients by usage',
            'manufacturers': 'Top manufactures by usage',
            'operating_systems': 'Top operating systems by usage',
            'app_categories': 'Top application category',
            'applications': 'Top applications by usage',
            'sessions_time': 'Number of sessions over time',
            'usage_time': 'Usage over time',
            'clients_daily': 'Clients per day'
        }
        
        sheet_name = kpi_mapping.get(kpi_type)
        if sheet_name and sheet_name in details:
            return details[sheet_name]
        return None
    
    def get_kpi_analytics(self, kpi_type, data):
        """Generate specific analytics for each KPI type"""
        analytics = {}
        
        try:
            if kpi_type == 'ssids':
                analytics = self.analyze_ssid_kpi(data)
            elif kpi_type == 'devices':
                analytics = self.analyze_devices_kpi(data)
            elif kpi_type == 'clients':
                analytics = self.analyze_clients_kpi(data)
            elif kpi_type == 'manufacturers':
                analytics = self.analyze_manufacturers_kpi(data)
            elif kpi_type == 'operating_systems':
                analytics = self.analyze_os_kpi(data)
            elif kpi_type in ['app_categories', 'applications']:
                analytics = self.analyze_applications_kpi(data)
            elif kpi_type in ['sessions_time', 'usage_time', 'clients_daily']:
                analytics = self.analyze_time_kpi(data, kpi_type)
            
        except Exception as e:
            logger.error(f"Error generating analytics for {kpi_type}: {str(e)}")
            analytics['error'] = str(e)
        
        return analytics
    
    def analyze_ssid_kpi(self, data):
        """Analyze SSID-specific metrics"""
        if not data:
            return {}
        
        ssids = [s for s in data if s]
        
        # Usage distribution
        usage_ranges = {
            'high': len([s for s in ssids if (s.get('Usage (kB)', 0) or 0) > 100000]),
            'medium': len([s for s in ssids if 10000 <= (s.get('Usage (kB)', 0) or 0) <= 100000]),
            'low': len([s for s in ssids if (s.get('Usage (kB)', 0) or 0) < 10000])
        }
        
        # Client distribution
        client_ranges = {
            'high': len([s for s in ssids if (s.get('Clients', 0) or 0) > 50]),
            'medium': len([s for s in ssids if 10 <= (s.get('Clients', 0) or 0) <= 50]),
            'low': len([s for s in ssids if (s.get('Clients', 0) or 0) < 10])
        }
        
        # Encryption analysis
        encryption_types = {}
        for ssid in ssids:
            enc_type = ssid.get('Encryption', 'Unknown')
            encryption_types[enc_type] = encryption_types.get(enc_type, 0) + 1
        
        return {
            'totalSSIDs': len(ssids),
            'usageDistribution': usage_ranges,
            'clientDistribution': client_ranges,
            'encryptionTypes': encryption_types,
            'topByUsage': sorted(ssids, key=lambda x: x.get('Usage (kB)', 0) or 0, reverse=True)[:5],
            'topByClients': sorted(ssids, key=lambda x: x.get('Clients', 0) or 0, reverse=True)[:5]
        }
    
    def analyze_devices_kpi(self, data):
        """Analyze device-specific metrics"""
        if not data:
            return {}
        
        devices = [d for d in data if d]
        
        # Model distribution
        models = {}
        for device in devices:
            model = device.get('Model', 'Unknown')
            if model not in models:
                models[model] = {'count': 0, 'totalClients': 0, 'totalUsage': 0}
            models[model]['count'] += 1
            models[model]['totalClients'] += device.get('Clients', 0) or 0
            models[model]['totalUsage'] += device.get('Usage (kB)', 0) or 0
        
        # Performance tiers
        performance_tiers = {
            'high': len([d for d in devices if (d.get('Usage (kB)', 0) or 0) > 50000]),
            'medium': len([d for d in devices if 10000 <= (d.get('Usage (kB)', 0) or 0) <= 50000]),
            'low': len([d for d in devices if (d.get('Usage (kB)', 0) or 0) < 10000])
        }
        
        return {
            'totalDevices': len(devices),
            'modelDistribution': dict(sorted(models.items(), key=lambda x: x[1]['totalUsage'], reverse=True)[:10]),
            'performanceTiers': performance_tiers,
            'topPerformers': sorted(devices, key=lambda x: x.get('Usage (kB)', 0) or 0, reverse=True)[:10],
            'avgClientsPerDevice': round(sum(d.get('Clients', 0) or 0 for d in devices) / max(len(devices), 1), 2)
        }
    
    def analyze_clients_kpi(self, data):
        """Analyze client-specific metrics"""
        if not data:
            return {}
        
        clients = [c for c in data if c]
        
        # Traffic analysis
        total_received = sum(c.get('Data Received (kB)', 0) or 0 for c in clients)
        total_sent = sum(c.get('Data Sent (kB)', 0) or 0 for c in clients)
        
        # Device manufacturer distribution
        manufacturers = {}
        for client in clients:
            manufacturer = client.get('Device Manufacturer', 'Unknown')
            manufacturers[manufacturer] = manufacturers.get(manufacturer, 0) + 1
        
        # Operating system distribution
        os_distribution = {}
        for client in clients:
            os = client.get('Operating System', 'Unknown')
            os_distribution[os] = os_distribution.get(os, 0) + 1
        
        # Network distribution
        networks = {}
        for client in clients:
            network = client.get('Network Name', 'Unknown')
            networks[network] = networks.get(network, 0) + 1
        
        # Usage tiers
        usage_tiers = {
            'heavy': len([c for c in clients if ((c.get('Data Received (kB)', 0) or 0) + (c.get('Data Sent (kB)', 0) or 0)) > 50000]),
            'medium': len([c for c in clients if 10000 <= ((c.get('Data Received (kB)', 0) or 0) + (c.get('Data Sent (kB)', 0) or 0)) <= 50000]),
            'light': len([c for c in clients if ((c.get('Data Received (kB)', 0) or 0) + (c.get('Data Sent (kB)', 0) or 0)) < 10000])
        }
        
        return {
            'totalClients': len(clients),
            'trafficSummary': {
                'totalReceived': round(total_received, 2),
                'totalSent': round(total_sent, 2),
                'totalTraffic': round(total_received + total_sent, 2)
            },
            'manufacturerDistribution': dict(sorted(manufacturers.items(), key=lambda x: x[1], reverse=True)[:10]),
            'osDistribution': dict(sorted(os_distribution.items(), key=lambda x: x[1], reverse=True)[:10]),
            'networkDistribution': dict(sorted(networks.items(), key=lambda x: x[1], reverse=True)),
            'usageTiers': usage_tiers,
            'topConsumers': sorted(clients, key=lambda x: (x.get('Data Received (kB)', 0) or 0) + (x.get('Data Sent (kB)', 0) or 0), reverse=True)[:10]
        }
    
    def analyze_manufacturers_kpi(self, data):
        """Analyze manufacturer-specific metrics"""
        if not data:
            return {}
        
        manufacturers = [m for m in data if m]
        total_clients = sum(m.get('Clients', 0) or 0 for m in manufacturers)
        
        # Market share calculation
        market_analysis = {}
        for manufacturer in manufacturers:
            name = manufacturer.get('Manufacturer', 'Unknown')
            clients = manufacturer.get('Clients', 0) or 0
            data_received = manufacturer.get('Data Received (kB)', 0) or 0
            data_sent = manufacturer.get('Data Sent (kB)', 0) or 0
            
            market_share = (clients / max(total_clients, 1)) * 100
            
            market_analysis[name] = {
                'clients': clients,
                'marketShare': round(market_share, 2),
                'dataReceived': round(data_received, 2),
                'dataSent': round(data_sent, 2),
                'totalTraffic': round(data_received + data_sent, 2)
            }
        
        # Concentration analysis
        sorted_manufacturers = sorted(manufacturers, key=lambda x: x.get('Clients', 0) or 0, reverse=True)
        top_3_share = sum(m.get('Clients', 0) or 0 for m in sorted_manufacturers[:3]) / max(total_clients, 1) * 100
        
        return {
            'totalManufacturers': len(manufacturers),
            'totalClients': total_clients,
            'marketAnalysis': dict(sorted(market_analysis.items(), key=lambda x: x[1]['clients'], reverse=True)),
            'marketConcentration': {
                'top3Share': round(top_3_share, 2),
                'dominantManufacturer': sorted_manufacturers[0].get('Manufacturer') if sorted_manufacturers else None,
                'diversityIndex': len(manufacturers)
            }
        }
    
    def analyze_os_kpi(self, data):
        """Analyze operating system metrics"""
        if not data:
            return {}
        
        os_data = [os for os in data if os]
        total_clients = sum(os.get('Clients', 0) or 0 for os in os_data)
        
        # Category mapping
        os_categories = {
            'Mobile': ['iOS', 'Android', 'iPadOS'],
            'Desktop': ['Windows', 'macOS', 'Linux', 'Ubuntu'],
            'IoT': ['embedded', 'router', 'camera']
        }
        
        category_stats = {'Mobile': 0, 'Desktop': 0, 'IoT': 0, 'Other': 0}
        
        for os_item in os_data:
            os_name = os_item.get('OS', '').lower()
            clients = os_item.get('Clients', 0) or 0
            
            categorized = False
            for category, os_types in os_categories.items():
                if any(os_type.lower() in os_name for os_type in os_types):
                    category_stats[category] += clients
                    categorized = True
                    break
            
            if not categorized:
                category_stats['Other'] += clients
        
        # Calculate percentages
        category_percentages = {
            category: round((count / max(total_clients, 1)) * 100, 2)
            for category, count in category_stats.items()
        }
        
        return {
            'totalOperatingSystems': len(os_data),
            'totalClients': total_clients,
            'categoryDistribution': category_stats,
            'categoryPercentages': category_percentages,
            'topOperatingSystems': sorted(os_data, key=lambda x: x.get('Clients', 0) or 0, reverse=True)[:10],
            'diversityScore': len(os_data)
        }
    
    def analyze_applications_kpi(self, data):
        """Analyze application usage metrics"""
        if not data:
            return {}
        
        apps = [app for app in data if app]
        
        # Usage distribution
        total_usage = sum(app.get('Usage (kB)', 0) or 0 for app in apps)
        
        usage_tiers = {
            'high': len([app for app in apps if (app.get('% Usage', 0) or 0) > 10]),
            'medium': len([app for app in apps if 1 <= (app.get('% Usage', 0) or 0) <= 10]),
            'low': len([app for app in apps if (app.get('% Usage', 0) or 0) < 1])
        }
        
        # Top applications by usage
        top_apps = sorted(apps, key=lambda x: x.get('Usage (kB)', 0) or 0, reverse=True)[:10]
        
        return {
            'totalApplications': len(apps),
            'totalUsage': round(total_usage, 2),
            'usageDistribution': usage_tiers,
            'topApplications': top_apps,
            'concentrationRatio': round(sum(app.get('% Usage', 0) or 0 for app in top_apps[:5]), 2)
        }
    
    def analyze_time_kpi(self, data, kpi_type):
        """Analyze time-based metrics"""
        if not data:
            return {}
        
        time_data = [item for item in data if item and item.get('Time')]
        
        if kpi_type == 'sessions_time':
            values = [item.get('Sessions', 0) or 0 for item in time_data]
            metric_name = 'Sessions'
        elif kpi_type == 'usage_time':
            values = [item.get('Total (b/s)', 0) or 0 for item in time_data]
            metric_name = 'Bandwidth (b/s)'
        elif kpi_type == 'clients_daily':
            values = [item.get('Clients', 0) or 0 for item in time_data]
            metric_name = 'Clients'
        else:
            values = []
            metric_name = 'Unknown'
        
        if not values:
            return {'error': 'No valid data points found'}
        
        # Statistical analysis
        avg_value = sum(values) / len(values)
        max_value = max(values)
        min_value = min(values)
        
        # Trend analysis
        if len(values) >= 4:
            first_quarter = values[:len(values)//4]
            last_quarter = values[-len(values)//4:]
            
            first_avg = sum(first_quarter) / len(first_quarter)
            last_avg = sum(last_quarter) / len(last_quarter)
            
            if last_avg > first_avg * 1.1:
                trend = 'Increasing'
            elif last_avg < first_avg * 0.9:
                trend = 'Decreasing'
            else:
                trend = 'Stable'
        else:
            trend = 'Insufficient data'
        
        # Peak detection
        peak_threshold = avg_value * 1.5
        peak_times = [
            {'time': item.get('Time'), 'value': values[i]}
            for i, item in enumerate(time_data)
            if values[i] > peak_threshold
        ]
        
        return {
            'dataPoints': len(time_data),
            'metricName': metric_name,
            'statistics': {
                'average': round(avg_value, 2),
                'maximum': max_value,
                'minimum': min_value,
                'range': max_value - min_value
            },
            'trend': trend,
            'peakTimes': peak_times[:10],  # Limit to top 10 peaks
            'variability': round((max_value - min_value) / max(avg_value, 1), 2)
        }
    
    def get_kpi_summary(self, kpi_type, data):
        """Generate summary for specific KPI"""
        if not data:
            return {'message': 'No data available'}
        
        summaries = {
            'ssids': f"Analysis of {len(data)} SSIDs with encryption and usage patterns",
            'devices': f"Performance analysis of {len(data)} network devices",
            'clients': f"Traffic analysis for {len(data)} connected clients",
            'manufacturers': f"Market analysis of {len(data)} device manufacturers",
            'operating_systems': f"OS distribution across {len(data)} different systems",
            'app_categories': f"Application category usage analysis for {len(data)} categories",
            'applications': f"Individual application usage for {len(data)} applications",
            'sessions_time': f"Session trends over {len(data)} time periods",
            'usage_time': f"Bandwidth utilization over {len(data)} time periods",
            'clients_daily': f"Daily client connectivity over {len(data)} days"
        }
        
        return {
            'description': summaries.get(kpi_type, f"Analysis of {len(data)} data points"),
            'dataPoints': len(data),
            'kpiType': kpi_type
        }


class MerakiAnalyticsView(APIView):
    """Advanced analytics endpoint for Meraki data"""
    
    def post(self, request):
        """Generate custom analytics based on request parameters"""
        try:
            data = request.data
            analytics_type = request.data.get('analyticsType', 'overview')
            
            if not data or 'details' not in data:
                return Response({
                    'error': 'No processed data provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            details = data['details']
            analytics = self.generate_custom_analytics(analytics_type, details)
            
            return Response({
                'analyticsType': analytics_type,
                'analytics': analytics,
                'generatedAt': logger.info(f"Generated {analytics_type} analytics")
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating analytics: {str(e)}")
            return Response({
                'error': f'Error generating analytics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generate_custom_analytics(self, analytics_type, details):
        """Generate different types of analytics based on request"""
        
        if analytics_type == 'security':
            return self.generate_security_analytics(details)
        elif analytics_type == 'performance':
            return self.generate_performance_analytics(details)
        elif analytics_type == 'capacity':
            return self.generate_capacity_analytics(details)
        elif analytics_type == 'trends':
            return self.generate_trends_analytics(details)
        else:
            return self.generate_overview_analytics(details)
    
    def generate_security_analytics(self, details):
        """Generate security-focused analytics"""
        analytics = {}
        
        # SSID Security Analysis
        ssid_data = details.get('Top SSIDs by usage', [])
        if ssid_data:
            total_ssids = len([s for s in ssid_data if s])
            encrypted_ssids = len([s for s in ssid_data if s and s.get('Encryption') and s.get('Encryption').lower() not in ['none', 'open', '']])
            
            analytics['ssidSecurity'] = {
                'totalSSIDs': total_ssids,
                'encryptedSSIDs': encrypted_ssids,
                'encryptionRate': round((encrypted_ssids / max(total_ssids, 1)) * 100, 2),
                'securityScore': 'High' if encrypted_ssids == total_ssids else 'Medium' if encrypted_ssids > total_ssids * 0.8 else 'Low'
            }
        
        # Device Visibility Analysis
        client_data = details.get('Top clients by usage', [])
        if client_data:
            total_clients = len([c for c in client_data if c])
            identified_devices = len([c for c in client_data if c and c.get('Device Manufacturer') and c.get('Device Manufacturer').lower() not in ['unknown', '']])
            
            analytics['deviceVisibility'] = {
                'totalClients': total_clients,
                'identifiedDevices': identified_devices,
                'visibilityRate': round((identified_devices / max(total_clients, 1)) * 100, 2),
                'unknownDevices': total_clients - identified_devices
            }
        
        return analytics
    
    def generate_performance_analytics(self, details):
        """Generate performance-focused analytics"""
        analytics = {}
        
        # Bandwidth Performance
        usage_data = details.get('Usage over time', [])
        if usage_data:
            bandwidth_values = [u.get('Total (b/s)', 0) or 0 for u in usage_data if u]
            if bandwidth_values:
                avg_bandwidth = sum(bandwidth_values) / len(bandwidth_values)
                peak_bandwidth = max(bandwidth_values)
                
                analytics['bandwidthPerformance'] = {
                    'averageBandwidth': round(avg_bandwidth, 2),
                    'peakBandwidth': peak_bandwidth,
                    'utilizationEfficiency': round((avg_bandwidth / max(peak_bandwidth, 1)) * 100, 2),
                    'consistencyScore': 'High' if (peak_bandwidth / max(avg_bandwidth, 1)) < 2 else 'Medium' if (peak_bandwidth / max(avg_bandwidth, 1)) < 4 else 'Low'
                }
        
        # Device Performance Distribution
        device_data = details.get('Top devices', [])
        if device_data:
            devices = [d for d in device_data if d]
            avg_clients_per_device = sum(d.get('Clients', 0) or 0 for d in devices) / max(len(devices), 1)
            
            high_load_devices = len([d for d in devices if (d.get('Clients', 0) or 0) > 20])
            optimal_load_devices = len([d for d in devices if 5 <= (d.get('Clients', 0) or 0) <= 20])
            low_load_devices = len([d for d in devices if (d.get('Clients', 0) or 0) < 5])
            
            analytics['devicePerformance'] = {
                'averageClientsPerDevice': round(avg_clients_per_device, 2),
                'loadDistribution': {
                    'highLoad': high_load_devices,
                    'optimalLoad': optimal_load_devices,
                    'lowLoad': low_load_devices
                },
                'balanceScore': 'Good' if optimal_load_devices > (high_load_devices + low_load_devices) else 'Fair'
            }
        
        return analytics
    
    def generate_capacity_analytics(self, details):
        """Generate capacity planning analytics"""
        analytics = {}
        
        # Client Growth Analysis
        clients_daily = details.get('Clients per day', [])
        if clients_daily:
            client_counts = [c.get('Clients', 0) or 0 for c in clients_daily if c]
            if len(client_counts) >= 7:  # At least a week of data
                recent_avg = sum(client_counts[-7:]) / 7
                overall_avg = sum(client_counts) / len(client_counts)
                growth_rate = ((recent_avg - overall_avg) / max(overall_avg, 1)) * 100
                
                analytics['capacityProjection'] = {
                    'currentAverage': round(overall_avg, 2),
                    'recentAverage': round(recent_avg, 2),
                    'growthRate': round(growth_rate, 2),
                    'projectedCapacity': round(recent_avg * 1.3, 2),  # 30% headroom
                    'recommendation': 'Expand' if growth_rate > 10 else 'Monitor' if growth_rate > 0 else 'Optimize'
                }
        
        # Network Utilization
        total_devices = len(details.get('Top devices', []))
        total_ssids = len(details.get('Top SSIDs by usage', []))
        total_clients = len(details.get('Top clients by usage', []))
        
        analytics['networkUtilization'] = {
            'deviceCount': total_devices,
            'ssidCount': total_ssids,
            'clientCount': total_clients,
            'clientToDeviceRatio': round(total_clients / max(total_devices, 1), 2),
            'ssidEfficiency': round(total_clients / max(total_ssids, 1), 2)
        }
        
        return analytics
    
    def generate_trends_analytics(self, details):
        """Generate trend analysis"""
        analytics = {}
        
        # Session Trends
        sessions_data = details.get('Number of sessions over time', [])
        if sessions_data:
            session_values = [s.get('Sessions', 0) or 0 for s in sessions_data if s]
            if len(session_values) >= 4:
                trend = self.calculate_trend(session_values)
                analytics['sessionTrends'] = {
                    'direction': trend['direction'],
                    'strength': trend['strength'],
                    'volatility': trend['volatility']
                }
        
        # Usage Trends
        usage_data = details.get('Usage over time', [])
        if usage_data:
            usage_values = [u.get('Total (b/s)', 0) or 0 for u in usage_data if u]
            if len(usage_values) >= 4:
                trend = self.calculate_trend(usage_values)
                analytics['usageTrends'] = {
                    'direction': trend['direction'],
                    'strength': trend['strength'],
                    'volatility': trend['volatility']
                }
        
        return analytics
    
    def generate_overview_analytics(self, details):
        """Generate comprehensive overview analytics"""
        analytics = {}
        
        # Aggregate all data for overview
        total_data_points = sum(len(sheet_data) for sheet_data in details.values() if isinstance(sheet_data, list))
        
        analytics['overview'] = {
            'totalDataSheets': len(details),
            'totalDataPoints': total_data_points,
            'dataCompleteness': self.calculate_data_completeness(details),
            'networkComplexity': self.calculate_network_complexity(details)
        }
        
        return analytics
    
    def calculate_trend(self, values):
        """Calculate trend direction and strength"""
        if len(values) < 4:
            return {'direction': 'Unknown', 'strength': 0, 'volatility': 0}
        
        # Simple linear regression
        n = len(values)
        x_values = list(range(n))
        
        sum_x = sum(x_values)
        sum_y = sum(values)
        sum_xy = sum(x * y for x, y in zip(x_values, values))
        sum_x2 = sum(x * x for x in x_values)
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        
        direction = 'Increasing' if slope > 0.1 else 'Decreasing' if slope < -0.1 else 'Stable'
        strength = abs(slope)
        
        # Calculate volatility (coefficient of variation)
        mean_val = sum(values) / len(values)
        variance = sum((x - mean_val) ** 2 for x in values) / len(values)
        std_dev = variance ** 0.5
        volatility = (std_dev / max(mean_val, 1)) * 100
        
        return {
            'direction': direction,
            'strength': round(strength, 4),
            'volatility': round(volatility, 2)
        }
    
    def calculate_data_completeness(self, details):
        """Calculate overall data completeness score"""
        expected_sheets = 11  # Based on your description
        actual_sheets = len([sheet for sheet in details.values() if sheet])
        
        completeness = (actual_sheets / expected_sheets) * 100
        return round(completeness, 2)
    
    def calculate_network_complexity(self, details):
        """Calculate network complexity score"""
        complexity_factors = 0
        
        # Factor in number of SSIDs
        ssids = len(details.get('Top SSIDs by usage', []))
        complexity_factors += min(ssids * 0.1, 2)  # Max 2 points
        
        # Factor in number of device types
        devices = len(details.get('Top devices', []))
        complexity_factors += min(devices * 0.05, 1.5)  # Max 1.5 points
        
        # Factor in number of manufacturers
        manufacturers = len(details.get('Top manufactures by usage', []))
        complexity_factors += min(manufacturers * 0.2, 2)  # Max 2 points
        
        # Factor in number of OS types
        os_types = len(details.get('Top operating systems by usage', []))
        complexity_factors += min(os_types * 0.15, 1.5)  # Max 1.5 points
        
        complexity_score = min(complexity_factors, 7)  # Max 7 points
        
        if complexity_score >= 5:
            return 'High'
        elif complexity_score >= 3:
            return 'Medium'
        else:
            return 'Low'



class MerakiHealthCheckView(APIView):
    """Network health check and monitoring endpoint"""
    
    def get(self, request):
        """Return health status of Meraki processing service"""
        return Response({
            'status': 'healthy',
            'service': 'Meraki Network Analytics',
            'version': '2.0',
            'endpoints': {
                'upload': '/api/gsuite/meraki/upload/',
                'kpi_details': '/api/gsuite/meraki/kpi/<kpi_type>/',
                'analytics': '/api/gsuite/meraki/analytics/',
                'health': '/api/gsuite/meraki/health/'
            },
            'supported_kpi_types': [
                'ssids', 'devices', 'device_models', 'clients', 
                'manufacturers', 'operating_systems', 'app_categories', 
                'applications', 'sessions_time', 'usage_time', 'clients_daily'
            ],
            'supported_analytics': [
                'overview', 'security', 'performance', 'capacity', 'trends'
            ],
            'features': {
                'network_health_scoring': True,
                'security_compliance_analysis': True,
                'performance_optimization': True,
                'ai_powered_insights': True,
                'real_time_analytics': True,
                'advanced_visualizations': True
            },
            'data_sources_supported': [
                'Top SSIDs by usage',
                'Top devices',
                'Top devices models by usage', 
                'Top clients by usage',
                'Top manufactures by usage',
                'Top operating systems by usage',
                'Top application category',
                'Top applications by usage',
                'Number of sessions over time',
                'Usage over time',
                'Clients per day'
            ]
        }, status=status.HTTP_200_OK)


class MerakiMetricsView(APIView):
    """Advanced metrics and monitoring endpoint"""
    
    def post(self, request):
        """Get comprehensive network metrics"""
        try:
            data = request.data
            
            if not data or 'details' not in data:
                return Response({
                    'error': 'No processed data provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            details = data['details']
            metrics = self.calculate_advanced_metrics(details)
            
            return Response({
                'metrics': metrics,
                'calculatedAt': datetime.now().isoformat(),
                'dataQuality': self.assess_data_quality(details)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            return Response({
                'error': f'Error calculating metrics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def calculate_advanced_metrics(self, details):
        """Calculate advanced network metrics"""
        metrics = {}
        
        try:
            # Network Efficiency Metrics
            clients_data = details.get('Top clients by usage', [])
            devices_data = details.get('Top devices', [])
            ssids_data = details.get('Top SSIDs by usage', [])
            
            if clients_data and devices_data:
                total_clients = len([c for c in clients_data if c])
                total_devices = len([d for d in devices_data if d])
                
                metrics['network_efficiency'] = {
                    'client_to_device_ratio': round(total_clients / max(total_devices, 1), 2),
                    'device_utilization_rate': self.calculate_device_utilization(devices_data),
                    'ssid_efficiency': self.calculate_ssid_efficiency(ssids_data, clients_data)
                }
            
            # Bandwidth Utilization
            usage_data = details.get('Usage over time', [])
            if usage_data:
                metrics['bandwidth_utilization'] = self.analyze_bandwidth_patterns(usage_data)
            
            # Security Posture
            if ssids_data:
                metrics['security_posture'] = self.analyze_security_posture(ssids_data, clients_data)
            
            # Application Performance
            app_data = details.get('Top applications by usage', [])
            if app_data:
                metrics['application_performance'] = self.analyze_application_performance(app_data)
            
            # Client Behavior Analysis
            if clients_data:
                metrics['client_behavior'] = self.analyze_client_behavior_advanced(clients_data)
            
        except Exception as e:
            logger.error(f"Error in advanced metrics calculation: {str(e)}")
            metrics['error'] = str(e)
        
        return metrics
    
    def calculate_device_utilization(self, devices_data):
        """Calculate device utilization metrics"""
        if not devices_data:
            return 0
        
        devices = [d for d in devices_data if d]
        total_usage = sum(safe_float(d.get('Usage (kB)', 0)) for d in devices)
        device_count = len(devices)
        
        if device_count == 0:
            return 0
        
        avg_usage = total_usage / device_count
        
        # Calculate utilization distribution
        high_usage = len([d for d in devices if safe_float(d.get('Usage (kB)', 0)) > avg_usage * 1.5])
        optimal_usage = len([d for d in devices if avg_usage * 0.5 <= safe_float(d.get('Usage (kB)', 0)) <= avg_usage * 1.5])
        low_usage = len([d for d in devices if safe_float(d.get('Usage (kB)', 0)) < avg_usage * 0.5])
        
        utilization_score = (optimal_usage / device_count) * 100
        
        return round(utilization_score, 2)
    
    def calculate_ssid_efficiency(self, ssids_data, clients_data):
        """Calculate SSID efficiency metrics"""
        if not ssids_data:
            return 0
        
        ssids = [s for s in ssids_data if s]
        total_ssids = len(ssids)
        active_ssids = len([s for s in ssids if safe_int(s.get('Clients', 0)) > 0])
        
        if total_ssids == 0:
            return 0
        
        efficiency = (active_ssids / total_ssids) * 100
        return round(efficiency, 2)
    
    def analyze_bandwidth_patterns(self, usage_data):
        """Analyze bandwidth usage patterns"""
        if not usage_data:
            return {}
        
        usage_values = [safe_float(u.get('Total (b/s)', 0)) for u in usage_data if u]
        
        if not usage_values:
            return {}
        
        avg_bandwidth = sum(usage_values) / len(usage_values)
        peak_bandwidth = max(usage_values)
        min_bandwidth = min(usage_values)
        
        # Calculate peak hours
        peak_threshold = avg_bandwidth * 1.5
        peak_periods = len([u for u in usage_values if u > peak_threshold])
        
        # Calculate consistency score
        variance = sum((x - avg_bandwidth) ** 2 for x in usage_values) / len(usage_values)
        consistency_score = max(0, 100 - (variance / avg_bandwidth * 10))
        
        return {
            'average_bandwidth_bps': round(avg_bandwidth, 2),
            'peak_bandwidth_bps': peak_bandwidth,
            'minimum_bandwidth_bps': min_bandwidth,
            'peak_periods_count': peak_periods,
            'consistency_score': round(consistency_score, 2),
            'peak_to_average_ratio': round(peak_bandwidth / max(avg_bandwidth, 1), 2)
        }
    
    def analyze_security_posture(self, ssids_data, clients_data):
        """Analyze overall security posture"""
        security_metrics = {}
        
        # SSID encryption analysis
        if ssids_data:
            ssids = [s for s in ssids_data if s]
            total_ssids = len(ssids)
            
            encrypted_ssids = len([s for s in ssids if s.get('Encryption') and 
                                 s.get('Encryption').lower() not in ['none', 'open', '']])
            
            encryption_rate = (encrypted_ssids / max(total_ssids, 1)) * 100
            
            security_metrics['encryption_compliance'] = {
                'total_ssids': total_ssids,
                'encrypted_ssids': encrypted_ssids,
                'encryption_rate': round(encryption_rate, 2),
                'security_level': 'High' if encryption_rate > 95 else 'Medium' if encryption_rate > 80 else 'Low'
            }
        
        # Device visibility analysis
        if clients_data:
            clients = [c for c in clients_data if c]
            total_clients = len(clients)
            
            identified_devices = len([c for c in clients if c.get('Device Manufacturer') and 
                                    c.get('Device Manufacturer').lower() not in ['unknown', '']])
            
            visibility_rate = (identified_devices / max(total_clients, 1)) * 100
            
            security_metrics['device_visibility'] = {
                'total_clients': total_clients,
                'identified_devices': identified_devices,
                'visibility_rate': round(visibility_rate, 2),
                'unknown_devices': total_clients - identified_devices
            }
        
        return security_metrics
    
    def analyze_application_performance(self, app_data):
        """Analyze application performance metrics"""
        if not app_data:
            return {}
        
        apps = [a for a in app_data if a]
        total_usage = sum(safe_float(a.get('Usage (kB)', 0)) for a in apps)
        
        # Top applications analysis
        top_apps = sorted(apps, key=lambda x: safe_float(x.get('Usage (kB)', 0)), reverse=True)[:10]
        
        # Application distribution
        high_usage_apps = len([a for a in apps if safe_float(a.get('% Usage', 0)) > 10])
        medium_usage_apps = len([a for a in apps if 1 <= safe_float(a.get('% Usage', 0)) <= 10])
        low_usage_apps = len([a for a in apps if safe_float(a.get('% Usage', 0)) < 1])
        
        # Concentration analysis
        top_5_usage = sum(safe_float(a.get('Usage (kB)', 0)) for a in top_apps[:5])
        concentration_ratio = (top_5_usage / max(total_usage, 1)) * 100
        
        return {
            'total_applications': len(apps),
            'total_usage_kb': round(total_usage, 2),
            'top_applications': [{'name': a.get('Application', 'Unknown'), 
                                'usage_kb': safe_float(a.get('Usage (kB)', 0))} 
                               for a in top_apps],
            'distribution': {
                'high_usage': high_usage_apps,
                'medium_usage': medium_usage_apps,
                'low_usage': low_usage_apps
            },
            'concentration_ratio': round(concentration_ratio, 2)
        }
    
    def analyze_client_behavior_advanced(self, clients_data):
        """Advanced client behavior analysis"""
        if not clients_data:
            return {}
        
        clients = [c for c in clients_data if c]
        
        # Traffic pattern analysis
        upload_download_ratios = []
        total_traffic_values = []
        
        for client in clients:
            received = safe_float(client.get('Data Received (kB)', 0))
            sent = safe_float(client.get('Data Sent (kB)', 0))
            total_traffic = received + sent
            
            total_traffic_values.append(total_traffic)
            
            if received > 0:
                ratio = sent / received
                upload_download_ratios.append(ratio)
        
        # Behavioral categorization
        if total_traffic_values:
            avg_traffic = sum(total_traffic_values) / len(total_traffic_values)
            
            power_users = len([t for t in total_traffic_values if t > avg_traffic * 2])
            normal_users = len([t for t in total_traffic_values if avg_traffic * 0.5 <= t <= avg_traffic * 2])
            light_users = len([t for t in total_traffic_values if t < avg_traffic * 0.5])
        else:
            power_users = normal_users = light_users = 0
        
        # Network usage patterns
        network_patterns = {}
        for client in clients:
            network = client.get('Network Name', 'Unknown')
            if network not in network_patterns:
                network_patterns[network] = []
            
            traffic = (safe_float(client.get('Data Received (kB)', 0)) + 
                      safe_float(client.get('Data Sent (kB)', 0)))
            network_patterns[network].append(traffic)
        
        return {
            'total_clients': len(clients),
            'average_upload_download_ratio': round(sum(upload_download_ratios) / max(len(upload_download_ratios), 1), 3),
            'user_categorization': {
                'power_users': power_users,
                'normal_users': normal_users,
                'light_users': light_users
            },
            'network_distribution': {
                network: {
                    'client_count': len(traffic_list),
                    'avg_traffic': round(sum(traffic_list) / len(traffic_list), 2)
                }
                for network, traffic_list in network_patterns.items()
            }
        }
    
    def assess_data_quality(self, details):
        """Assess the quality and completeness of data"""
        expected_sheets = [
            'Top SSIDs by usage',
            'Top devices',
            'Top devices models by usage',
            'Top clients by usage',
            'Top manufactures by usage',
            'Top operating systems by usage',
            'Top application category',
            'Top applications by usage',
            'Number of sessions over time',
            'Usage over time',
            'Clients per day'
        ]
        
        available_sheets = [sheet for sheet in expected_sheets if sheet in details and details[sheet]]
        missing_sheets = [sheet for sheet in expected_sheets if sheet not in details or not details[sheet]]
        
        completeness_score = (len(available_sheets) / len(expected_sheets)) * 100
        
        # Assess data richness
        data_points = sum(len(details[sheet]) for sheet in available_sheets if sheet in details)
        
        quality_assessment = {
            'completeness_score': round(completeness_score, 2),
            'available_data_sources': len(available_sheets),
            'missing_data_sources': len(missing_sheets),
            'total_data_points': data_points,
            'data_richness': 'High' if data_points > 1000 else 'Medium' if data_points > 500 else 'Low',
            'missing_sheets': missing_sheets
        }
        
        return quality_assessment


class MerakiReportView(APIView):
    """Generate comprehensive network reports"""
    
    def post(self, request):
        """Generate custom network report"""
        try:
            data = request.data
            report_type = data.get('reportType', 'summary')
            
            if not data or 'details' not in data:
                return Response({
                    'error': 'No processed data provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            report = self.generate_report(report_type, data)
            
            return Response({
                'report': report,
                'reportType': report_type,
                'generatedAt': datetime.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            return Response({
                'error': f'Error generating report: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generate_report(self, report_type, data):
        """Generate different types of reports"""
        
        if report_type == 'executive':
            return self.generate_executive_summary(data)
        elif report_type == 'technical':
            return self.generate_technical_report(data)
        elif report_type == 'security':
            return self.generate_security_report(data)
        elif report_type == 'performance':
            return self.generate_performance_report(data)
        else:
            return self.generate_summary_report(data)
    
    def generate_executive_summary(self, data):
        """Generate executive-level summary"""
        kpis = data.get('kpis', {})
        insights = data.get('insights', {})
        
        return {
            'title': 'Executive Network Summary',
            'key_metrics': {
                'network_health_score': kpis.get('networkHealthScore', 0),
                'total_devices': kpis.get('totalDevices', 0),
                'total_clients': kpis.get('totalClients', 0),
                'network_efficiency': kpis.get('networkEfficiencyMBPerClient', 0)
            },
            'critical_issues': insights.get('summary', {}).get('criticalIssues', 0),
            'recommendations': insights.get('summary', {}).get('totalRecommendations', 0),
            'overall_status': insights.get('summary', {}).get('overallNetworkHealth', 'Unknown'),
            'executive_insights': self.extract_executive_insights(insights)
        }
    
    def generate_technical_report(self, data):
        """Generate detailed technical report"""
        return {
            'title': 'Technical Network Analysis',
            'infrastructure': self.analyze_infrastructure(data.get('details', {})),
            'performance_metrics': self.analyze_performance_detailed(data.get('details', {})),
            'capacity_analysis': self.analyze_capacity_detailed(data.get('details', {})),
            'technical_recommendations': self.extract_technical_recommendations(data.get('insights', {}))
        }
    
    def generate_security_report(self, data):
        """Generate security-focused report"""
        analytics = data.get('analytics', {})
        
        return {
            'title': 'Network Security Assessment',
            'security_score': self.calculate_security_score(analytics),
            'encryption_status': analytics.get('securityAnalytics', {}).get('encryptionCompliance', {}),
            'device_visibility': analytics.get('securityAnalytics', {}).get('deviceSecurity', {}),
            'security_recommendations': self.extract_security_recommendations(data.get('insights', {})),
            'compliance_status': self.assess_compliance_status(analytics)
        }
    
    def generate_performance_report(self, data):
        """Generate performance-focused report"""
        analytics = data.get('analytics', {})
        
        return {
            'title': 'Network Performance Analysis',
            'bandwidth_analysis': analytics.get('bandwidthAnalytics', {}),
            'device_performance': analytics.get('deviceAnalytics', {}),
            'client_performance': analytics.get('clientAnalytics', {}),
            'time_based_analysis': analytics.get('timeAnalytics', {}),
            'performance_recommendations': self.extract_performance_recommendations(data.get('insights', {}))
        }
    
    def generate_summary_report(self, data):
        """Generate standard summary report"""
        return {
            'title': 'Network Summary Report',
            'overview': {
                'total_devices': data.get('kpis', {}).get('totalDevices', 0),
                'total_clients': data.get('kpis', {}).get('totalClients', 0),
                'network_health': data.get('kpis', {}).get('networkHealthScore', 0)
            },
            'key_findings': self.extract_key_findings(data),
            'recommendations': data.get('insights', {}).get('recommendations', [])[:5]
        }
    
    def extract_executive_insights(self, insights):
        """Extract insights relevant for executives"""
        if not insights:
            return []
        
        executive_insights = []
        
        # High priority recommendations
        recommendations = insights.get('recommendations', [])
        high_priority = [r for r in recommendations if r.get('priority') == 'High']
        
        for rec in high_priority[:3]:
            executive_insights.append({
                'type': 'recommendation',
                'priority': 'High',
                'summary': rec.get('title', ''),
                'business_impact': rec.get('description', '')
            })
        
        # Critical alerts
        alerts = insights.get('alerts', [])
        critical_alerts = [a for a in alerts if a.get('severity') == 'High']
        
        for alert in critical_alerts[:2]:
            executive_insights.append({
                'type': 'alert',
                'severity': 'High',
                'summary': alert.get('title', ''),
                'business_impact': alert.get('description', '')
            })
        
        return executive_insights
    
    def extract_technical_recommendations(self, insights):
        """Extract technical recommendations"""
        if not insights:
            return []
        
        recommendations = insights.get('recommendations', [])
        optimizations = insights.get('optimizations', [])
        
        technical_recs = []
        
        for rec in recommendations:
            if rec.get('type') in ['Performance', 'Capacity', 'Network']:
                technical_recs.append({
                    'category': rec.get('type'),
                    'title': rec.get('title'),
                    'description': rec.get('description'),
                    'implementation': rec.get('suggestion', '')
                })
        
        for opt in optimizations:
            technical_recs.append({
                'category': 'Optimization',
                'title': opt.get('title'),
                'description': opt.get('description'),
                'implementation': opt.get('suggestion', '')
            })
        
        return technical_recs
    
    def extract_security_recommendations(self, insights):
        """Extract security-specific recommendations"""
        if not insights:
            return []
        
        security_recs = []
        
        # Security alerts
        alerts = insights.get('alerts', [])
        security_alerts = [a for a in alerts if a.get('type') == 'Security']
        
        for alert in security_alerts:
            security_recs.append({
                'type': 'Alert',
                'severity': alert.get('severity'),
                'issue': alert.get('title'),
                'description': alert.get('description'),
                'action_required': alert.get('action')
            })
        
        # Security recommendations
        recommendations = insights.get('recommendations', [])
        security_recommendations = [r for r in recommendations if r.get('type') == 'Security']
        
        for rec in security_recommendations:
            security_recs.append({
                'type': 'Recommendation',
                'priority': rec.get('priority'),
                'issue': rec.get('title'),
                'description': rec.get('description'),
                'action_required': rec.get('suggestion', '')
            })
        
        return security_recs
    
    def extract_performance_recommendations(self, insights):
        """Extract performance-specific recommendations"""
        if not insights:
            return []
        
        performance_recs = []
        
        # Performance optimizations
        optimizations = insights.get('optimizations', [])
        performance_optimizations = [o for o in optimizations if o.get('type') in ['Bandwidth', 'Application', 'Capacity Planning']]
        
        for opt in performance_optimizations:
            performance_recs.append({
                'category': opt.get('type'),
                'title': opt.get('title'),
                'description': opt.get('description'),
                'optimization': opt.get('suggestion'),
                'priority': opt.get('priority')
            })
        
        return performance_recs
    
    def calculate_security_score(self, analytics):
        """Calculate overall security score"""
        score = 100
        
        security_analytics = analytics.get('securityAnalytics', {})
        
        # Encryption compliance
        encryption_compliance = security_analytics.get('encryptionCompliance', {})
        if encryption_compliance:
            compliance_rate = encryption_compliance.get('compliancePercentage', 100)
            if compliance_rate < 90:
                score -= (90 - compliance_rate)
        
        # Device visibility
        device_security = security_analytics.get('deviceSecurity', {})
        if device_security:
            visibility_rate = device_security.get('deviceVisibility', 100)
            if visibility_rate < 85:
                score -= (85 - visibility_rate) / 2
        
        return max(0, min(100, round(score, 1)))
    
    def assess_compliance_status(self, analytics):
        """Assess compliance with security standards"""
        security_analytics = analytics.get('securityAnalytics', {})
        
        compliance_status = {
            'overall_status': 'Compliant',
            'encryption_compliance': True,
            'device_visibility_compliance': True,
            'recommendations': []
        }
        
        # Check encryption compliance
        encryption_compliance = security_analytics.get('encryptionCompliance', {})
        if encryption_compliance:
            compliance_rate = encryption_compliance.get('compliancePercentage', 100)
            if compliance_rate < 95:
                compliance_status['encryption_compliance'] = False
                compliance_status['overall_status'] = 'Non-Compliant'
                compliance_status['recommendations'].append('Implement encryption on all wireless networks')
        
        # Check device visibility
        device_security = security_analytics.get('deviceSecurity', {})
        if device_security:
            visibility_rate = device_security.get('deviceVisibility', 100)
            if visibility_rate < 80:
                compliance_status['device_visibility_compliance'] = False
                compliance_status['overall_status'] = 'Non-Compliant'
                compliance_status['recommendations'].append('Implement device fingerprinting and access control')
        
        return compliance_status
    
    def analyze_infrastructure(self, details):
        """Analyze network infrastructure"""
        devices_data = details.get('Top devices', [])
        ssids_data = details.get('Top SSIDs by usage', [])
        
        infrastructure = {
            'device_inventory': len([d for d in devices_data if d]) if devices_data else 0,
            'ssid_inventory': len([s for s in ssids_data if s]) if ssids_data else 0,
            'device_models': self.get_device_models(devices_data),
            'network_segmentation': self.analyze_network_segmentation(details)
        }
        
        return infrastructure
    
    def get_device_models(self, devices_data):
        """Get unique device models"""
        if not devices_data:
            return []
        
        models = set()
        for device in devices_data:
            if device and device.get('Model'):
                models.add(device.get('Model'))
        
        return list(models)
    
    def analyze_network_segmentation(self, details):
        """Analyze network segmentation"""
        clients_data = details.get('Top clients by usage', [])
        
        if not clients_data:
            return {}
        
        networks = set()
        for client in clients_data:
            if client and client.get('Network Name'):
                networks.add(client.get('Network Name'))
        
        return {
            'total_networks': len(networks),
            'network_names': list(networks),
            'segmentation_level': 'Good' if len(networks) > 3 else 'Basic' if len(networks) > 1 else 'Poor'
        }
    
    def analyze_performance_detailed(self, details):
        """Detailed performance analysis"""
        usage_data = details.get('Usage over time', [])
        sessions_data = details.get('Number of sessions over time', [])
        
        performance = {}
        
        if usage_data:
            bandwidth_values = [safe_float(u.get('Total (b/s)', 0)) for u in usage_data if u]
            if bandwidth_values:
                performance['bandwidth'] = {
                    'average': round(sum(bandwidth_values) / len(bandwidth_values), 2),
                    'peak': max(bandwidth_values),
                    'minimum': min(bandwidth_values),
                    'consistency': self.calculate_consistency(bandwidth_values)
                }
        
        if sessions_data:
            session_values = [safe_int(s.get('Sessions', 0)) for s in sessions_data if s]
            if session_values:
                performance['sessions'] = {
                    'average': round(sum(session_values) / len(session_values), 2),
                    'peak': max(session_values),
                    'minimum': min(session_values)
                }
        
        return performance
    
    def analyze_capacity_detailed(self, details):
        """Detailed capacity analysis"""
        clients_daily = details.get('Clients per day', [])
        devices_data = details.get('Top devices', [])
        
        capacity = {}
        
        if clients_daily:
            client_values = [safe_int(c.get('Clients', 0)) for c in clients_daily if c]
            if client_values:
                capacity['client_trends'] = {
                    'average_daily': round(sum(client_values) / len(client_values), 2),
                    'peak_daily': max(client_values),
                    'growth_trend': self.calculate_growth_trend(client_values)
                }
        
        if devices_data:
            devices = [d for d in devices_data if d]
            total_device_clients = sum(safe_int(d.get('Clients', 0)) for d in devices)
            
            capacity['device_capacity'] = {
                'total_devices': len(devices),
                'total_supported_clients': total_device_clients,
                'average_load_per_device': round(total_device_clients / max(len(devices), 1), 2)
            }
        
        return capacity
    
    def calculate_consistency(self, values):
        """Calculate consistency score for values"""
        if not values or len(values) < 2:
            return 100
        
        avg = sum(values) / len(values)
        variance = sum((x - avg) ** 2 for x in values) / len(values)
        coefficient_of_variation = (variance ** 0.5) / max(avg, 1)
        
        # Convert to consistency score (lower variation = higher consistency)
        consistency = max(0, 100 - (coefficient_of_variation * 50))
        return round(consistency, 2)
    
    def calculate_growth_trend(self, values):
        """Calculate growth trend from time series"""
        if len(values) < 2:
            return 'Insufficient Data'
        
        # Simple trend calculation
        first_half = values[:len(values)//2]
        second_half = values[len(values)//2:]
        
        first_avg = sum(first_half) / len(first_half)
        second_avg = sum(second_half) / len(second_half)
        
        if second_avg > first_avg * 1.1:
            return 'Growing'
        elif second_avg < first_avg * 0.9:
            return 'Declining'
        else:
            return 'Stable'
    
    def extract_key_findings(self, data):
        """Extract key findings from the data"""
        findings = []
        
        kpis = data.get('kpis', {})
        analytics = data.get('analytics', {})
        
        # Network health finding
        health_score = kpis.get('networkHealthScore', 0)
        if health_score >= 80:
            findings.append(f"Network health is excellent with a score of {health_score}/100")
        elif health_score >= 60:
            findings.append(f"Network health is good with a score of {health_score}/100, with room for improvement")
        else:
            findings.append(f"Network health needs attention with a score of {health_score}/100")
        
        # Device utilization finding
        total_devices = kpis.get('totalDevices', 0)
        total_clients = kpis.get('totalClients', 0)
        if total_devices > 0:
            avg_clients_per_device = total_clients / total_devices
            if avg_clients_per_device > 25:
                findings.append(f"High device load detected: {avg_clients_per_device:.1f} clients per device on average")
            elif avg_clients_per_device < 5:
                findings.append(f"Low device utilization: {avg_clients_per_device:.1f} clients per device on average")
        
        # Security findings
        security_analytics = analytics.get('securityAnalytics', {})
        encryption_compliance = security_analytics.get('encryptionCompliance', {})
        if encryption_compliance:
            compliance_rate = encryption_compliance.get('compliancePercentage', 0)
            if compliance_rate < 90:
                findings.append(f"Security concern: Only {compliance_rate:.1f}% of SSIDs are properly encrypted")
        
        # Traffic patterns
        efficiency = kpis.get('networkEfficiencyMBPerClient', 0)
        if efficiency > 0:
            if efficiency > 10:
                findings.append(f"High bandwidth usage per client: {efficiency:.1f} MB per client")
            elif efficiency < 1:
                findings.append(f"Low bandwidth utilization: {efficiency:.1f} MB per client")
        
        return findings[:5]  # Return top 5 findings


class MerakiExportView(APIView):
    """Export network data and reports"""
    
    def post(self, request):
        """Export data in various formats"""
        try:
            data = request.data
            export_format = data.get('format', 'json')  # json, csv, excel
            export_type = data.get('type', 'summary')   # summary, detailed, raw
            
            if not data or 'details' not in data:
                return Response({
                    'error': 'No processed data provided'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            export_data = self.prepare_export_data(data, export_type)
            
            if export_format == 'csv':
                csv_data = self.convert_to_csv(export_data)
                return Response({
                    'format': 'csv',
                    'data': csv_data,
                    'filename': f'meraki_export_{export_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                }, status=status.HTTP_200_OK)
            
            elif export_format == 'excel':
                excel_data = self.prepare_excel_export(export_data)
                return Response({
                    'format': 'excel',
                    'data': excel_data,
                    'filename': f'meraki_export_{export_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
                }, status=status.HTTP_200_OK)
            
            else:  # Default to JSON
                return Response({
                    'format': 'json',
                    'data': export_data,
                    'filename': f'meraki_export_{export_type}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json',
                    'exportedAt': datetime.now().isoformat()
                }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error exporting data: {str(e)}")
            return Response({
                'error': f'Error exporting data: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def prepare_export_data(self, data, export_type):
        """Prepare data for export based on type"""
        
        if export_type == 'raw':
            return data.get('details', {})
        
        elif export_type == 'detailed':
            return {
                'metadata': data.get('metadata', {}),
                'kpis': data.get('kpis', {}),
                'analytics': data.get('analytics', {}),
                'insights': data.get('insights', {}),
                'raw_data': data.get('details', {})
            }
        
        else:  # summary
            return {
                'summary': {
                    'network_health_score': data.get('kpis', {}).get('networkHealthScore', 0),
                    'total_devices': data.get('kpis', {}).get('totalDevices', 0),
                    'total_clients': data.get('kpis', {}).get('totalClients', 0),
                    'total_ssids': data.get('kpis', {}).get('totalSSIDs', 0),
                    'network_efficiency': data.get('kpis', {}).get('networkEfficiencyMBPerClient', 0)
                },
                'insights_summary': {
                    'total_recommendations': data.get('insights', {}).get('summary', {}).get('totalRecommendations', 0),
                    'critical_issues': data.get('insights', {}).get('summary', {}).get('criticalIssues', 0),
                    'overall_health': data.get('insights', {}).get('summary', {}).get('overallNetworkHealth', 'Unknown')
                },
                'top_issues': data.get('insights', {}).get('alerts', [])[:5],
                'top_recommendations': data.get('insights', {}).get('recommendations', [])[:5]
            }
    
    def convert_to_csv(self, export_data):
        """Convert data to CSV format"""
        import csv
        import io
        
        output = io.StringIO()
        
        if isinstance(export_data, dict) and 'summary' in export_data:
            # Summary format
            writer = csv.writer(output)
            
            # Write summary metrics
            writer.writerow(['Metric', 'Value'])
            summary = export_data['summary']
            for key, value in summary.items():
                writer.writerow([key.replace('_', ' ').title(), value])
            
            writer.writerow([])  # Empty row
            
            # Write insights summary
            writer.writerow(['Insight Type', 'Count'])
            insights_summary = export_data['insights_summary']
            for key, value in insights_summary.items():
                writer.writerow([key.replace('_', ' ').title(), value])
        
        else:
            # Raw data format - flatten the structure
            writer = csv.writer(output)
            self._write_dict_to_csv(writer, export_data)
        
        return output.getvalue()
    
    def _write_dict_to_csv(self, writer, data, prefix=''):
        """Recursively write dictionary data to CSV"""
        if isinstance(data, dict):
            for key, value in data.items():
                new_prefix = f"{prefix}.{key}" if prefix else key
                if isinstance(value, (dict, list)):
                    self._write_dict_to_csv(writer, value, new_prefix)
                else:
                    writer.writerow([new_prefix, value])
        elif isinstance(data, list):
            for i, item in enumerate(data):
                new_prefix = f"{prefix}[{i}]"
                if isinstance(item, (dict, list)):
                    self._write_dict_to_csv(writer, item, new_prefix)
                else:
                    writer.writerow([new_prefix, item])
    
    def prepare_excel_export(self, export_data):
        """Prepare data for Excel export (structure for frontend to handle)"""
        # Return structured data that frontend can convert to Excel
        excel_structure = {
            'sheets': []
        }
        
        if isinstance(export_data, dict) and 'summary' in export_data:
            # Summary format
            excel_structure['sheets'].append({
                'name': 'Summary',
                'data': [
                    ['Metric', 'Value'],
                    *[[key.replace('_', ' ').title(), value] for key, value in export_data['summary'].items()]
                ]
            })
            
            excel_structure['sheets'].append({
                'name': 'Insights',
                'data': [
                    ['Insight Type', 'Count'],
                    *[[key.replace('_', ' ').title(), value] for key, value in export_data['insights_summary'].items()]
                ]
            })
            
            # Add top issues
            if export_data.get('top_issues'):
                issues_data = [['Title', 'Severity', 'Description']]
                for issue in export_data['top_issues']:
                    issues_data.append([
                        issue.get('title', ''),
                        issue.get('severity', ''),
                        issue.get('description', '')
                    ])
                excel_structure['sheets'].append({
                    'name': 'Top Issues',
                    'data': issues_data
                })
            
            # Add top recommendations
            if export_data.get('top_recommendations'):
                recs_data = [['Title', 'Priority', 'Description']]
                for rec in export_data['top_recommendations']:
                    recs_data.append([
                        rec.get('title', ''),
                        rec.get('priority', ''),
                        rec.get('description', '')
                    ])
                excel_structure['sheets'].append({
                    'name': 'Recommendations',
                    'data': recs_data
                })
        
        else:
            # Raw data format
            excel_structure['sheets'].append({
                'name': 'Raw Data',
                'data': self._flatten_for_excel(export_data)
            })
        
        return excel_structure
    
    def _flatten_for_excel(self, data):
        """Flatten nested data for Excel format"""
        rows = [['Key', 'Value']]
        
        def flatten_recursive(obj, prefix=''):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    new_key = f"{prefix}.{key}" if prefix else key
                    if isinstance(value, (dict, list)):
                        flatten_recursive(value, new_key)
                    else:
                        rows.append([new_key, value])
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    new_key = f"{prefix}[{i}]" if prefix else f"[{i}]"
                    if isinstance(item, (dict, list)):
                        flatten_recursive(item, new_key)
                    else:
                        rows.append([new_key, item])
        
        flatten_recursive(data)
        return rows


class MerakiComparisonView(APIView):
    """Compare network metrics across time periods or different networks"""
    
    def post(self, request):
        """Compare network data"""
        try:
            data = request.data
            comparison_type = data.get('comparisonType', 'baseline')  # baseline, historical, benchmark
            
            if comparison_type == 'baseline':
                result = self.compare_with_baseline(data)
            elif comparison_type == 'historical':
                result = self.compare_historical(data)
            elif comparison_type == 'benchmark':
                result = self.compare_with_benchmark(data)
            else:
                return Response({
                    'error': 'Invalid comparison type'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'comparison': result,
                'comparisonType': comparison_type,
                'comparedAt': datetime.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error performing comparison: {str(e)}")
            return Response({
                'error': f'Error performing comparison: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def compare_with_baseline(self, data):
        """Compare current metrics with industry baselines"""
        current_kpis = data.get('kpis', {})
        
        # Industry baseline values (these would typically come from a database)
        industry_baselines = {
            'networkHealthScore': 85,
            'avgClientsPerDevice': 15,
            'networkEfficiencyMBPerClient': 5.0,
            'encryptionComplianceRate': 95,
            'deviceVisibilityRate': 90
        }
        
        comparison = {}
        
        for metric, baseline in industry_baselines.items():
            current_value = current_kpis.get(metric, 0)
            
            if baseline > 0:
                variance_percent = ((current_value - baseline) / baseline) * 100
                performance = 'Above Baseline' if variance_percent > 5 else 'Below Baseline' if variance_percent < -5 else 'At Baseline'
            else:
                variance_percent = 0
                performance = 'No Baseline'
            
            comparison[metric] = {
                'current': current_value,
                'baseline': baseline,
                'variance_percent': round(variance_percent, 2),
                'performance': performance,
                'status': 'good' if variance_percent >= 0 else 'needs_improvement'
            }
        
        return comparison
    
    def compare_historical(self, data):
        """Compare with historical data (placeholder - would need historical data storage)"""
        current_kpis = data.get('kpis', {})
        
        # This would typically query historical data from database
        # For now, simulating previous period data
        historical_data = {
            'networkHealthScore': current_kpis.get('networkHealthScore', 0) * 0.95,
            'totalDevices': current_kpis.get('totalDevices', 0) * 0.9,
            'totalClients': current_kpis.get('totalClients', 0) * 0.85,
            'networkEfficiencyMBPerClient': current_kpis.get('networkEfficiencyMBPerClient', 0) * 1.1
        }
        
        comparison = {}
        
        for metric in historical_data.keys():
            current = current_kpis.get(metric, 0)
            historical = historical_data[metric]
            
            if historical > 0:
                change_percent = ((current - historical) / historical) * 100
                trend = 'Improving' if change_percent > 2 else 'Declining' if change_percent < -2 else 'Stable'
            else:
                change_percent = 0
                trend = 'No Historical Data'
            
            comparison[metric] = {
                'current': current,
                'historical': historical,
                'change_percent': round(change_percent, 2),
                'trend': trend,
                'status': 'positive' if change_percent >= 0 else 'negative'
            }
        
        return comparison
    
    def compare_with_benchmark(self, data):
        """Compare with industry benchmarks"""
        current_kpis = data.get('kpis', {})
        
        # Industry benchmark ranges
        benchmarks = {
            'networkHealthScore': {'excellent': 90, 'good': 75, 'fair': 60},
            'avgClientsPerDevice': {'optimal': (10, 20), 'acceptable': (5, 30), 'concerning': (0, 5)},
            'networkEfficiencyMBPerClient': {'efficient': (2, 8), 'normal': (1, 15), 'inefficient': (0, 1)},
        }
        
        comparison = {}
        
        for metric, benchmark_ranges in benchmarks.items():
            current_value = current_kpis.get(metric, 0)
            
            if isinstance(benchmark_ranges, dict) and 'excellent' in benchmark_ranges:
                # Threshold-based benchmarks
                if current_value >= benchmark_ranges['excellent']:
                    rating = 'Excellent'
                elif current_value >= benchmark_ranges['good']:
                    rating = 'Good'
                elif current_value >= benchmark_ranges['fair']:
                    rating = 'Fair'
                else:
                    rating = 'Poor'
            
            elif isinstance(benchmark_ranges, dict) and 'optimal' in benchmark_ranges:
                # Range-based benchmarks
                optimal_range = benchmark_ranges['optimal']
                acceptable_range = benchmark_ranges['acceptable']
                
                if optimal_range[0] <= current_value <= optimal_range[1]:
                    rating = 'Optimal'
                elif acceptable_range[0] <= current_value <= acceptable_range[1]:
                    rating = 'Acceptable'
                else:
                    rating = 'Concerning'
            
            else:
                rating = 'Unknown'
            
            comparison[metric] = {
                'current': current_value,
                'rating': rating,
                'benchmark_ranges': benchmark_ranges
            }
        
        return comparison


# Helper function imports that might be needed
from datetime import datetime
import json