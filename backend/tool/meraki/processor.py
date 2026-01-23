# backend/tool/meraki/processor.py
# Enhanced Meraki data processing logic with comprehensive analytics

import pandas as pd
import logging
from datetime import datetime, timedelta
from ..shared.data_utils import safe_to_dict, safe_float, safe_int, clean_data_for_json

logger = logging.getLogger(__name__)

def process_meraki_excel(file):
    """Process Meraki Excel files with comprehensive network analytics"""
    try:
        excel_data = pd.ExcelFile(file)
        sheets_data = {}
        
        # Process all sheets with proper date handling for Meraki data
        for sheet_name in excel_data.sheet_names:
            df = pd.read_excel(file, sheet_name=sheet_name)
            df = df.dropna(how='all')
            
            # Special handling for the 3 Meraki sheets with Time column
            time_based_sheets = [
                "Number of sessions over time", 
                "Usage over time", 
                "Clients per day"
            ]
            
            if sheet_name in time_based_sheets and 'Time' in df.columns:
                # Handle Meraki-specific date format: 2025/04/01 00:00:00.000000 +00:00
                try:
                    df['Time'] = pd.to_datetime(df['Time'], format='%Y/%m/%d %H:%M:%S.%f %z', errors='coerce')
                    # If that fails, try without timezone
                    if df['Time'].isna().any():
                        df['Time'] = pd.to_datetime(df['Time'], format='%Y/%m/%d %H:%M:%S.%f', errors='coerce')
                    # If still failing, try basic format
                    if df['Time'].isna().any():
                        df['Time'] = pd.to_datetime(df['Time'], errors='coerce')
                    logger.info(f"Processed Time column for sheet: {sheet_name}")
                except Exception as e:
                    logger.warning(f"Failed to parse Time column in {sheet_name}: {str(e)}")
            
            # Handle other date columns generically
            for col in df.columns:
                col_lower = str(col).lower()
                if col != 'Time' and any(date_keyword in col_lower for date_keyword in ['date', 'time', 'created', 'updated', 'last']):
                    try:
                        df[col] = pd.to_datetime(df[col], errors='coerce')
                    except:
                        pass
            
            logger.info(f"Processing sheet {sheet_name} with original data structure (no mock data)")
            
            sheets_data[sheet_name] = safe_to_dict(df)
        
        # Calculate comprehensive KPIs
        kpis = calculate_network_kpis(sheets_data)
        
        # Perform advanced analytics
        analytics = perform_network_analytics(sheets_data)
        
        # Generate insights and recommendations
        insights = generate_network_insights(sheets_data, analytics)
        
        return {
            "fileType": "meraki",
            "kpis": kpis,
            "details": sheets_data,
            "analytics": analytics,
            "insights": insights,
            "rawSheetNames": excel_data.sheet_names,
            "metadata": {
                "processedAt": datetime.now().isoformat(),
                "totalSheets": len(excel_data.sheet_names),
                "dataPoints": sum(len(data) for data in sheets_data.values())
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing Meraki file: {str(e)}")
        return {"error": f"Error processing Meraki file: {str(e)}"}

def calculate_network_kpis(sheets_data):
    """Calculate comprehensive network KPIs from all sheets"""
    kpis = {}
    
    try:
        # Sheet 1: Top SSIDs by usage
        top_ssids = sheets_data.get("Top SSIDs by usage", [])
        if top_ssids:
            total_ssids = len([s for s in top_ssids if s and s.get('Name')])
            total_ssid_clients = sum(safe_int(s.get('Clients', 0)) for s in top_ssids if s)
            total_ssid_usage = sum(safe_float(s.get('Usage (kB)', 0)) for s in top_ssids if s)
            
            kpis.update({
                "totalSSIDs": total_ssids,
                "totalSSIDClients": total_ssid_clients,
                "totalSSIDUsageKB": round(total_ssid_usage, 2),
                "avgClientsPerSSID": round(total_ssid_clients / max(total_ssids, 1), 2)
            })
        
        # Sheet 2: Top devices
        top_devices = sheets_data.get("Top devices", [])
        if top_devices:
            total_devices = len([d for d in top_devices if d and d.get('Name')])
            total_device_clients = sum(safe_int(d.get('Clients', 0)) for d in top_devices if d)
            total_device_usage = sum(safe_float(d.get('Usage (kB)', 0)) for d in top_devices if d)
            
            kpis.update({
                "totalDevices": total_devices,
                "totalDeviceClients": total_device_clients,
                "totalDeviceUsageKB": round(total_device_usage, 2),
                "avgClientsPerDevice": round(total_device_clients / max(total_devices, 1), 2)
            })
        
        # Sheet 3: Top device models by usage
        device_models = sheets_data.get("Top devices models by usage", [])
        if device_models:
            total_models = len([m for m in device_models if m and m.get('Model')])
            total_model_devices = sum(safe_int(m.get('Devices', 0)) for m in device_models if m)
            total_model_usage = sum(safe_float(m.get('Usage (B)', 0)) for m in device_models if m)
            
            kpis.update({
                "totalDeviceModels": total_models,
                "totalModelDevices": total_model_devices,
                "totalModelUsageB": round(total_model_usage, 2),
                "avgDevicesPerModel": round(total_model_devices / max(total_models, 1), 2)
            })
        
        # Sheet 4: Top clients by usage
        top_clients = sheets_data.get("Top clients by usage", [])
        if top_clients:
            total_clients = len([c for c in top_clients if c])
            total_data_received = sum(safe_float(c.get('Data Received (kB)', 0)) for c in top_clients if c)
            total_data_sent = sum(safe_float(c.get('Data Sent (kB)', 0)) for c in top_clients if c)
            total_client_traffic = total_data_received + total_data_sent
            
            kpis.update({
                "totalClients": total_clients,
                "totalDataReceivedKB": round(total_data_received, 2),
                "totalDataSentKB": round(total_data_sent, 2),
                "totalClientTrafficKB": round(total_client_traffic, 2),
                "avgTrafficPerClient": round(total_client_traffic / max(total_clients, 1), 2)
            })
        
        # Sheet 5: Top manufacturers by usage
        manufacturers = sheets_data.get("Top manufactures by usage", [])
        if manufacturers:
            total_manufacturers = len([m for m in manufacturers if m and m.get('Manufacturer')])
            manufacturer_clients = sum(safe_int(m.get('Clients', 0)) for m in manufacturers if m)
            
            kpis.update({
                "totalManufacturers": total_manufacturers,
                "manufacturerClients": manufacturer_clients
            })
        
        # Sheet 6: Top operating systems by usage
        operating_systems = sheets_data.get("Top operating systems by usage", [])
        if operating_systems:
            total_os = len([os for os in operating_systems if os and os.get('OS')])
            os_clients = sum(safe_int(os.get('Clients', 0)) for os in operating_systems if os)
            
            kpis.update({
                "totalOperatingSystems": total_os,
                "osClients": os_clients
            })
        
        # Sheet 7: Top application category
        app_categories = sheets_data.get("Top application category", [])
        if app_categories:
            total_categories = len([cat for cat in app_categories if cat])
            total_category_usage = sum(safe_float(cat.get('Usage (kB)', 0)) for cat in app_categories if cat)
            
            kpis.update({
                "totalApplicationCategories": total_categories,
                "totalCategoryUsageKB": round(total_category_usage, 2)
            })
        
        # Sheet 8: Top applications by usage
        applications = sheets_data.get("Top applications by usage", [])
        if applications:
            total_applications = len([app for app in applications if app])
            total_app_usage = sum(safe_float(app.get('Usage (kB)', 0)) for app in applications if app)
            
            kpis.update({
                "totalApplications": total_applications,
                "totalApplicationUsageKB": round(total_app_usage, 2)
            })
        
        # Sheet 9 & 10: Time-based data for trends
        sessions_over_time = sheets_data.get("Number of sessions over time", [])
        usage_over_time = sheets_data.get("Usage over time", [])
        clients_per_day = sheets_data.get("Clients per day", [])
        
        if sessions_over_time:
            avg_sessions = sum(safe_int(s.get('Sessions', 0)) for s in sessions_over_time if s) / max(len(sessions_over_time), 1)
            peak_sessions = max(safe_int(s.get('Sessions', 0)) for s in sessions_over_time if s) if sessions_over_time else 0
            
            kpis.update({
                "avgSessionsPerTimeSlot": round(avg_sessions, 2),
                "peakSessions": peak_sessions
            })
        
        if usage_over_time:
            avg_download = sum(safe_float(u.get('Download (b/s)', 0)) for u in usage_over_time if u) / max(len(usage_over_time), 1)
            avg_total_bandwidth = sum(safe_float(u.get('Total (b/s)', 0)) for u in usage_over_time if u) / max(len(usage_over_time), 1)
            peak_bandwidth = max(safe_float(u.get('Total (b/s)', 0)) for u in usage_over_time if u) if usage_over_time else 0
            
            kpis.update({
                "avgDownloadBps": round(avg_download, 2),
                "avgTotalBandwidthBps": round(avg_total_bandwidth, 2),
                "peakBandwidthBps": round(peak_bandwidth, 2)
            })
        
        if clients_per_day:
            avg_clients_per_day = sum(safe_int(c.get('Clients', 0)) for c in clients_per_day if c) / max(len(clients_per_day), 1)
            peak_clients_per_day = max(safe_int(c.get('Clients', 0)) for c in clients_per_day if c) if clients_per_day else 0
            
            kpis.update({
                "avgClientsPerDay": round(avg_clients_per_day, 2),
                "peakClientsPerDay": peak_clients_per_day
            })
        
        # Calculate derived metrics
        if kpis.get('totalClientTrafficKB') and kpis.get('totalClients'):
            network_efficiency = (kpis['totalClientTrafficKB'] / kpis['totalClients']) / 1024  # MB per client
            kpis['networkEfficiencyMBPerClient'] = round(network_efficiency, 2)
        
        # Network health score (0-100)
        health_score = calculate_network_health_score(kpis)
        kpis['networkHealthScore'] = health_score
        
    except Exception as e:
        logger.error(f"Error calculating KPIs: {str(e)}")
        kpis['error'] = f"Error calculating KPIs: {str(e)}"
    
    return kpis

def perform_network_analytics(sheets_data):
    """Perform advanced network analytics"""
    analytics = {}
    
    try:
        # SSID Performance Analysis
        ssid_analytics = analyze_ssid_performance(sheets_data.get("Top SSIDs by usage", []))
        analytics['ssidAnalytics'] = ssid_analytics
        
        # Device Distribution Analysis
        device_analytics = analyze_device_distribution(sheets_data.get("Top devices", []))
        analytics['deviceAnalytics'] = device_analytics
        
        # Client Behavior Analysis
        client_analytics = analyze_client_behavior(sheets_data.get("Top clients by usage", []))
        analytics['clientAnalytics'] = client_analytics
        
        # Manufacturer Insights
        manufacturer_analytics = analyze_manufacturer_distribution(sheets_data.get("Top manufactures by usage", []))
        analytics['manufacturerAnalytics'] = manufacturer_analytics
        
        # Operating System Trends
        os_analytics = analyze_os_distribution(sheets_data.get("Top operating systems by usage", []))
        analytics['osAnalytics'] = os_analytics
        
        # Application Usage Patterns
        app_analytics = analyze_application_usage(
            sheets_data.get("Top application category", []),
            sheets_data.get("Top applications by usage", [])
        )
        analytics['applicationAnalytics'] = app_analytics
        
        # Time-based Trend Analysis
        time_analytics = analyze_time_trends(
            sheets_data.get("Number of sessions over time", []),
            sheets_data.get("Usage over time", []),
            sheets_data.get("Clients per day", [])
        )
        analytics['timeAnalytics'] = time_analytics
        
        # Bandwidth Utilization Analysis
        bandwidth_analytics = analyze_bandwidth_utilization(sheets_data)
        analytics['bandwidthAnalytics'] = bandwidth_analytics
        
        # Security and Compliance Analysis
        security_analytics = analyze_security_compliance(sheets_data)
        analytics['securityAnalytics'] = security_analytics
        
        # Add date range for filtering compatibility
        analytics['dateRange'] = {
            "start": (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d'),
            "end": datetime.now().strftime('%Y-%m-%d')
        }
        
    except Exception as e:
        logger.error(f"Error performing analytics: {str(e)}")
        analytics['error'] = f"Error performing analytics: {str(e)}"
    
    return analytics

def analyze_ssid_performance(ssid_data):
    """Analyze SSID performance metrics"""
    if not ssid_data:
        return {}
    
    ssids = [s for s in ssid_data if s and s.get('Name')]
    
    # Performance categorization
    high_usage_ssids = [s for s in ssids if safe_float(s.get('Usage (kB)', 0)) > 100000]  # >100MB
    medium_usage_ssids = [s for s in ssids if 10000 <= safe_float(s.get('Usage (kB)', 0)) <= 100000]  # 10-100MB
    low_usage_ssids = [s for s in ssids if safe_float(s.get('Usage (kB)', 0)) < 10000]  # <10MB
    
    # Client distribution analysis
    client_distribution = {
        "highClientSSIDs": len([s for s in ssids if safe_int(s.get('Clients', 0)) > 50]),
        "mediumClientSSIDs": len([s for s in ssids if 10 <= safe_int(s.get('Clients', 0)) <= 50]),
        "lowClientSSIDs": len([s for s in ssids if safe_int(s.get('Clients', 0)) < 10])
    }
    
    # Encryption analysis
    encryption_types = {}
    for ssid in ssids:
        enc = ssid.get('Encryption', 'Unknown')
        encryption_types[enc] = encryption_types.get(enc, 0) + 1
    
    return {
        "performanceDistribution": {
            "highUsage": len(high_usage_ssids),
            "mediumUsage": len(medium_usage_ssids),
            "lowUsage": len(low_usage_ssids)
        },
        "clientDistribution": client_distribution,
        "encryptionDistribution": encryption_types,
        "topPerformers": sorted(ssids, key=lambda x: safe_float(x.get('Usage (kB)', 0)), reverse=True)[:5],
        "utilizationRate": round(len([s for s in ssids if safe_int(s.get('Clients', 0)) > 0]) / max(len(ssids), 1) * 100, 2)
    }

def analyze_device_distribution(device_data):
    """Analyze device distribution and performance"""
    if not device_data:
        return {}
    
    devices = [d for d in device_data if d and d.get('Name')]
    
    # Model analysis
    model_usage = {}
    model_clients = {}
    
    for device in devices:
        model = device.get('Model', 'Unknown')
        usage = safe_float(device.get('Usage (kB)', 0))
        clients = safe_int(device.get('Clients', 0))
        
        model_usage[model] = model_usage.get(model, 0) + usage
        model_clients[model] = model_clients.get(model, 0) + clients
    
    # Performance tiers
    high_performance = [d for d in devices if safe_float(d.get('Usage (kB)', 0)) > 50000]
    medium_performance = [d for d in devices if 10000 <= safe_float(d.get('Usage (kB)', 0)) <= 50000]
    low_performance = [d for d in devices if safe_float(d.get('Usage (kB)', 0)) < 10000]
    
    return {
        "modelDistribution": dict(sorted(model_usage.items(), key=lambda x: x[1], reverse=True)[:10]),
        "modelClientDistribution": dict(sorted(model_clients.items(), key=lambda x: x[1], reverse=True)[:10]),
        "performanceTiers": {
            "high": len(high_performance),
            "medium": len(medium_performance),
            "low": len(low_performance)
        },
        "averageClientsPerDevice": round(sum(safe_int(d.get('Clients', 0)) for d in devices) / max(len(devices), 1), 2),
        "totalDeviceUsage": round(sum(safe_float(d.get('Usage (kB)', 0)) for d in devices), 2)
    }

def analyze_client_behavior(client_data):
    """Analyze client behavior patterns"""
    if not client_data:
        return {}
    
    clients = [c for c in client_data if c]
    
    # Traffic patterns
    heavy_users = [c for c in clients if (safe_float(c.get('Data Received (kB)', 0)) + safe_float(c.get('Data Sent (kB)', 0))) > 50000]
    moderate_users = [c for c in clients if 10000 <= (safe_float(c.get('Data Received (kB)', 0)) + safe_float(c.get('Data Sent (kB)', 0))) <= 50000]
    light_users = [c for c in clients if (safe_float(c.get('Data Received (kB)', 0)) + safe_float(c.get('Data Sent (kB)', 0))) < 10000]
    
    # Upload vs Download ratio analysis
    upload_download_ratios = []
    for client in clients:
        received = safe_float(client.get('Data Received (kB)', 0))
        sent = safe_float(client.get('Data Sent (kB)', 0))
        if received > 0:
            ratio = sent / received
            upload_download_ratios.append(ratio)
    
    avg_upload_download_ratio = sum(upload_download_ratios) / max(len(upload_download_ratios), 1) if upload_download_ratios else 0
    
    # Network distribution
    network_distribution = {}
    for client in clients:
        network = client.get('Network Name', 'Unknown')
        network_distribution[network] = network_distribution.get(network, 0) + 1
    
    return {
        "usageTiers": {
            "heavy": len(heavy_users),
            "moderate": len(moderate_users),
            "light": len(light_users)
        },
        "averageUploadDownloadRatio": round(avg_upload_download_ratio, 3),
        "networkDistribution": dict(sorted(network_distribution.items(), key=lambda x: x[1], reverse=True)[:10]),
        "totalDataTransfer": {
            "received": round(sum(safe_float(c.get('Data Received (kB)', 0)) for c in clients), 2),
            "sent": round(sum(safe_float(c.get('Data Sent (kB)', 0)) for c in clients), 2)
        }
    }

def analyze_manufacturer_distribution(manufacturer_data):
    """Analyze device manufacturer distribution"""
    if not manufacturer_data:
        return {}
    
    manufacturers = [m for m in manufacturer_data if m and m.get('Manufacturer')]
    
    # Market share analysis
    total_clients = sum(safe_int(m.get('Clients', 0)) for m in manufacturers)
    manufacturer_share = {}
    
    for manufacturer in manufacturers:
        name = manufacturer.get('Manufacturer')
        clients = safe_int(manufacturer.get('Clients', 0))
        share = (clients / max(total_clients, 1)) * 100
        manufacturer_share[name] = {
            'clients': clients,
            'marketShare': round(share, 2),
            'dataReceived': safe_float(manufacturer.get('Data Received (kB)', 0)),
            'dataSent': safe_float(manufacturer.get('Data Sent (kB)', 0))
        }
    
    # Dominance analysis
    top_manufacturer = max(manufacturers, key=lambda x: safe_int(x.get('Clients', 0))) if manufacturers else None
    market_concentration = (safe_int(top_manufacturer.get('Clients', 0)) / max(total_clients, 1) * 100) if top_manufacturer else 0
    
    return {
        "marketShare": dict(sorted(manufacturer_share.items(), key=lambda x: x[1]['clients'], reverse=True)),
        "marketConcentration": round(market_concentration, 2),
        "diversityIndex": len(manufacturers),
        "topManufacturer": top_manufacturer.get('Manufacturer') if top_manufacturer else None
    }

def analyze_os_distribution(os_data):
    """Analyze operating system distribution"""
    if not os_data:
        return {}
    
    operating_systems = [os for os in os_data if os and os.get('OS')]
    
    # OS category mapping
    os_categories = {
        'Mobile': ['iOS', 'Android', 'iPadOS'],
        'Desktop': ['Windows', 'macOS', 'Linux', 'Ubuntu'],
        'Other': []
    }
    
    category_distribution = {'Mobile': 0, 'Desktop': 0, 'Other': 0}
    
    for os_item in operating_systems:
        os_name = os_item.get('OS', '')
        clients = safe_int(os_item.get('Clients', 0))
        
        categorized = False
        for category, os_list in os_categories.items():
            if any(os_type.lower() in os_name.lower() for os_type in os_list):
                category_distribution[category] += clients
                categorized = True
                break
        
        if not categorized:
            category_distribution['Other'] += clients
    
    # Calculate percentages
    total_os_clients = sum(category_distribution.values())
    category_percentages = {
        category: round((count / max(total_os_clients, 1)) * 100, 2)
        for category, count in category_distribution.items()
    }
    
    return {
        "categoryDistribution": category_distribution,
        "categoryPercentages": category_percentages,
        "osVariety": len(operating_systems),
        "topOperatingSystems": sorted(operating_systems, key=lambda x: safe_int(x.get('Clients', 0)), reverse=True)[:5]
    }

def analyze_application_usage(category_data, app_data):
    """Analyze application usage patterns"""
    analytics = {}
    
    if category_data:
        categories = [c for c in category_data if c]
        total_category_usage = sum(safe_float(c.get('Usage (kB)', 0)) for c in categories)
        
        category_analysis = {}
        for category in categories:
            if 'Category' in category:
                name = category['Category']
                usage = safe_float(category.get('Usage (kB)', 0))
                percentage = safe_float(category.get('% Usage', 0))
                
                category_analysis[name] = {
                    'usage': usage,
                    'percentage': percentage,
                    'rank': len(category_analysis) + 1
                }
        
        analytics['categoryAnalysis'] = category_analysis
        analytics['totalCategoryUsage'] = round(total_category_usage, 2)
    
    if app_data:
        applications = [a for a in app_data if a]
        
        app_analysis = {}
        for app in applications:
            if 'Application' in app:
                name = app['Application']
                usage = safe_float(app.get('Usage (kB)', 0))
                percentage = safe_float(app.get('% Usage', 0))
                
                app_analysis[name] = {
                    'usage': usage,
                    'percentage': percentage
                }
        
        # Application distribution
        high_usage_apps = {k: v for k, v in app_analysis.items() if v['percentage'] > 10}
        medium_usage_apps = {k: v for k, v in app_analysis.items() if 1 <= v['percentage'] <= 10}
        low_usage_apps = {k: v for k, v in app_analysis.items() if v['percentage'] < 1}
        
        analytics['applicationAnalysis'] = app_analysis
        analytics['applicationDistribution'] = {
            'highUsage': len(high_usage_apps),
            'mediumUsage': len(medium_usage_apps),
            'lowUsage': len(low_usage_apps)
        }
    
    return analytics

def analyze_time_trends(sessions_data, usage_data, clients_data):
    """Analyze time-based trends and patterns"""
    analytics = {}
    
    try:
        # Sessions trend analysis
        if sessions_data:
            sessions = [s for s in sessions_data if s and s.get('Time')]
            if sessions:
                session_values = [safe_int(s.get('Sessions', 0)) for s in sessions]
                analytics['sessionsTrend'] = {
                    'dataPoints': len(sessions),
                    'average': round(sum(session_values) / len(session_values), 2),
                    'peak': max(session_values),
                    'minimum': min(session_values),
                    'variance': round(calculate_variance(session_values), 2)
                }
        
        # Usage trend analysis
        if usage_data:
            usage = [u for u in usage_data if u and u.get('Time')]
            if usage:
                download_values = [safe_float(u.get('Download (b/s)', 0)) for u in usage]
                total_values = [safe_float(u.get('Total (b/s)', 0)) for u in usage]
                
                analytics['usageTrend'] = {
                    'dataPoints': len(usage),
                    'averageDownload': round(sum(download_values) / len(download_values), 2),
                    'averageTotal': round(sum(total_values) / len(total_values), 2),
                    'peakBandwidth': max(total_values),
                    'downloadToTotalRatio': round(sum(download_values) / max(sum(total_values), 1), 3)
                }
        
        # Clients per day trend
        if clients_data:
            clients = [c for c in clients_data if c and c.get('Time')]
            if clients:
                client_values = [safe_int(c.get('Clients', 0)) for c in clients]
                analytics['clientsTrend'] = {
                    'dataPoints': len(clients),
                    'averageDaily': round(sum(client_values) / len(client_values), 2),
                    'peakDaily': max(client_values),
                    'minimumDaily': min(client_values),
                    'growthTrend': calculate_growth_trend(client_values)
                }
        
        # Peak time analysis
        peak_times = analyze_peak_times(sessions_data, usage_data, clients_data)
        analytics['peakTimes'] = peak_times
        
    except Exception as e:
        logger.error(f"Error in time trend analysis: {str(e)}")
        analytics['error'] = str(e)
    
    return analytics

def analyze_bandwidth_utilization(sheets_data):
    """Analyze bandwidth utilization patterns"""
    analytics = {}
    
    try:
        # Aggregate bandwidth data from multiple sources
        usage_data = sheets_data.get("Usage over time", [])
        device_data = sheets_data.get("Top devices", [])
        client_data = sheets_data.get("Top clients by usage", [])
        
        if usage_data:
            total_bandwidth_data = [safe_float(u.get('Total (b/s)', 0)) for u in usage_data if u]
            download_bandwidth_data = [safe_float(u.get('Download (b/s)', 0)) for u in usage_data if u]
            
            if total_bandwidth_data:
                analytics['bandwidthUtilization'] = {
                    'averageUtilization': round(sum(total_bandwidth_data) / len(total_bandwidth_data), 2),
                    'peakUtilization': max(total_bandwidth_data),
                    'utilizationEfficiency': round((sum(download_bandwidth_data) / sum(total_bandwidth_data)) * 100, 2),
                    'congestionPoints': len([b for b in total_bandwidth_data if b > (sum(total_bandwidth_data) / len(total_bandwidth_data)) * 1.5])
                }
        
        # Calculate total network capacity utilization
        if device_data and client_data:
            total_device_usage = sum(safe_float(d.get('Usage (kB)', 0)) for d in device_data if d)
            total_client_traffic = sum(
                safe_float(c.get('Data Received (kB)', 0)) + safe_float(c.get('Data Sent (kB)', 0))
                for c in client_data if c
            )
            
            analytics['capacityAnalysis'] = {
                'deviceUtilization': round(total_device_usage, 2),
                'clientTraffic': round(total_client_traffic, 2),
                'efficiencyRatio': round(total_client_traffic / max(total_device_usage, 1), 3)
            }
    
    except Exception as e:
        logger.error(f"Error in bandwidth analysis: {str(e)}")
        analytics['error'] = str(e)
    
    return analytics

def analyze_security_compliance(sheets_data):
    """Analyze security and compliance aspects"""
    analytics = {}
    
    try:
        # SSID encryption analysis
        ssid_data = sheets_data.get("Top SSIDs by usage", [])
        if ssid_data:
            ssids = [s for s in ssid_data if s]
            total_ssids = len(ssids)
            
            encrypted_ssids = len([s for s in ssids if s.get('Encryption') and s.get('Encryption').lower() not in ['none', 'open', '']])
            encryption_compliance = (encrypted_ssids / max(total_ssids, 1)) * 100
            
            analytics['encryptionCompliance'] = {
                'totalSSIDs': total_ssids,
                'encryptedSSIDs': encrypted_ssids,
                'compliancePercentage': round(encryption_compliance, 2),
                'securityRisk': 'Low' if encryption_compliance > 90 else 'Medium' if encryption_compliance > 70 else 'High'
            }
        
        # Device security analysis
        client_data = sheets_data.get("Top clients by usage", [])
        if client_data:
            clients = [c for c in client_data if c]
            
            # Analyze device types and potential security risks
            unknown_devices = len([c for c in clients if not c.get('Device Manufacturer') or c.get('Device Manufacturer', '').lower() in ['unknown', '']])
            total_clients = len(clients)
            
            device_visibility = ((total_clients - unknown_devices) / max(total_clients, 1)) * 100
            
            analytics['deviceSecurity'] = {
                'totalClients': total_clients,
                'unknownDevices': unknown_devices,
                'deviceVisibility': round(device_visibility, 2),
                'visibilityRisk': 'Low' if device_visibility > 85 else 'Medium' if device_visibility > 70 else 'High'
            }
        
        # Network segmentation analysis
        if client_data:
            networks = set()
            for client in client_data:
                if client.get('Network Name'):
                    networks.add(client.get('Network Name'))
            
            analytics['networkSegmentation'] = {
                'totalNetworks': len(networks),
                'segmentationLevel': 'Good' if len(networks) > 3 else 'Basic' if len(networks) > 1 else 'Poor'
            }
    
    except Exception as e:
        logger.error(f"Error in security analysis: {str(e)}")
        analytics['error'] = str(e)
    
    return analytics

def generate_network_insights(sheets_data, analytics):
    """Generate actionable network insights and recommendations"""
    insights = {
        'recommendations': [],
        'alerts': [],
        'optimizations': [],
        'summary': {}
    }
    
    try:
        # Performance insights
        if 'ssidAnalytics' in analytics:
            ssid_analytics = analytics['ssidAnalytics']
            utilization_rate = ssid_analytics.get('utilizationRate', 0)
            
            if utilization_rate < 50:
                insights['recommendations'].append({
                    'type': 'Performance',
                    'priority': 'Medium',
                    'title': 'Low SSID Utilization',
                    'description': f'Only {utilization_rate}% of SSIDs are actively used. Consider consolidating underutilized SSIDs.',
                    'impact': 'Network Management Efficiency'
                })
            
            if 'encryptionDistribution' in ssid_analytics:
                unencrypted = ssid_analytics['encryptionDistribution'].get('None', 0) + ssid_analytics['encryptionDistribution'].get('Open', 0)
                if unencrypted > 0:
                    insights['alerts'].append({
                        'type': 'Security',
                        'severity': 'High',
                        'title': 'Unencrypted SSIDs Detected',
                        'description': f'{unencrypted} SSID(s) are not encrypted. This poses a significant security risk.',
                        'action': 'Enable WPA2/WPA3 encryption immediately'
                    })
        
        # Bandwidth optimization insights
        if 'bandwidthAnalytics' in analytics:
            bandwidth_analytics = analytics['bandwidthAnalytics']
            if 'bandwidthUtilization' in bandwidth_analytics:
                utilization = bandwidth_analytics['bandwidthUtilization']
                efficiency = utilization.get('utilizationEfficiency', 0)
                congestion_points = utilization.get('congestionPoints', 0)
                
                if efficiency < 70:
                    insights['optimizations'].append({
                        'type': 'Bandwidth',
                        'priority': 'High',
                        'title': 'Bandwidth Efficiency Low',
                        'description': f'Bandwidth efficiency is only {efficiency}%. Network optimization needed.',
                        'suggestion': 'Implement QoS policies and traffic shaping'
                    })
                
                if congestion_points > 5:
                    insights['alerts'].append({
                        'type': 'Performance',
                        'severity': 'Medium',
                        'title': 'Network Congestion Detected',
                        'description': f'{congestion_points} congestion points identified during peak usage.',
                        'action': 'Consider bandwidth upgrades or load balancing'
                    })
        
        # Device distribution insights
        if 'deviceAnalytics' in analytics:
            device_analytics = analytics['deviceAnalytics']
            avg_clients = device_analytics.get('averageClientsPerDevice', 0)
            
            if avg_clients > 20:
                insights['recommendations'].append({
                    'type': 'Capacity',
                    'priority': 'High',
                    'title': 'High Client Density',
                    'description': f'Average of {avg_clients} clients per device may cause performance issues.',
                    'suggestion': 'Consider deploying additional access points'
                })
        
        # Security compliance insights
        if 'securityAnalytics' in analytics:
            security_analytics = analytics['securityAnalytics']
            
            if 'encryptionCompliance' in security_analytics:
                compliance = security_analytics['encryptionCompliance']
                if compliance.get('securityRisk') in ['Medium', 'High']:
                    insights['alerts'].append({
                        'type': 'Security',
                        'severity': 'High' if compliance.get('securityRisk') == 'High' else 'Medium',
                        'title': 'Encryption Compliance Issue',
                        'description': f"Only {compliance.get('compliancePercentage', 0)}% of SSIDs are properly encrypted.",
                        'action': 'Implement encryption on all wireless networks'
                    })
            
            if 'deviceSecurity' in security_analytics:
                device_security = security_analytics['deviceSecurity']
                if device_security.get('visibilityRisk') in ['Medium', 'High']:
                    insights['recommendations'].append({
                        'type': 'Security',
                        'priority': 'Medium',
                        'title': 'Device Visibility Concerns',
                        'description': f"{device_security.get('unknownDevices', 0)} unknown devices detected on network.",
                        'suggestion': 'Implement device fingerprinting and access control'
                    })
        
        # Application usage insights
        if 'applicationAnalytics' in analytics:
            app_analytics = analytics['applicationAnalytics']
            if 'applicationDistribution' in app_analytics:
                dist = app_analytics['applicationDistribution']
                high_usage_apps = dist.get('highUsage', 0)
                
                if high_usage_apps > 5:
                    insights['optimizations'].append({
                        'type': 'Application',
                        'priority': 'Medium',
                        'title': 'High Application Diversity',
                        'description': f'{high_usage_apps} applications consuming significant bandwidth.',
                        'suggestion': 'Implement application-based QoS policies'
                    })
        
        # Time-based insights
        if 'timeAnalytics' in analytics:
            time_analytics = analytics['timeAnalytics']
            
            if 'usageTrend' in time_analytics:
                usage_trend = time_analytics['usageTrend']
                peak_bandwidth = usage_trend.get('peakBandwidth', 0)
                avg_bandwidth = usage_trend.get('averageTotal', 0)
                
                if peak_bandwidth > avg_bandwidth * 3:
                    insights['optimizations'].append({
                        'type': 'Capacity Planning',
                        'priority': 'High',
                        'title': 'High Peak Usage Variance',
                        'description': 'Peak bandwidth usage is 3x higher than average.',
                        'suggestion': 'Consider peak-time traffic management or capacity increases'
                    })
        
        # Generate summary
        insights['summary'] = {
            'totalRecommendations': len(insights['recommendations']),
            'totalAlerts': len(insights['alerts']),
            'totalOptimizations': len(insights['optimizations']),
            'overallNetworkHealth': calculate_overall_health(analytics),
            'criticalIssues': len([a for a in insights['alerts'] if a.get('severity') == 'High']),
            'improvementAreas': len([r for r in insights['recommendations'] if r.get('priority') == 'High'])
        }
    
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        insights['error'] = str(e)
    
    return insights

def calculate_network_health_score(kpis):
    """Calculate overall network health score (0-100)"""
    score = 100
    
    try:
        # Deduct points for potential issues
        
        # Low device utilization
        if kpis.get('avgClientsPerDevice', 0) < 5:
            score -= 10
        elif kpis.get('avgClientsPerDevice', 0) > 25:
            score -= 15
        
        # Bandwidth efficiency
        if kpis.get('networkEfficiencyMBPerClient', 0) < 1:
            score -= 20
        
        # Client distribution
        total_clients = kpis.get('totalClients', 0)
        if total_clients < 10:
            score -= 15
        
        # Session consistency
        peak_sessions = kpis.get('peakSessions', 0)
        avg_sessions = kpis.get('avgSessionsPerTimeSlot', 0)
        if peak_sessions > avg_sessions * 4:  # High variance
            score -= 10
        
        # Ensure score stays within bounds
        score = max(0, min(100, score))
        
    except Exception as e:
        logger.error(f"Error calculating health score: {str(e)}")
        score = 50  # Default moderate score
    
    return score

def calculate_overall_health(analytics):
    """Calculate overall network health based on analytics"""
    health_factors = []
    
    # Security health
    if 'securityAnalytics' in analytics:
        security = analytics['securityAnalytics']
        if 'encryptionCompliance' in security:
            compliance = security['encryptionCompliance'].get('compliancePercentage', 0)
            health_factors.append(min(compliance, 100))
    
    # Performance health
    if 'bandwidthAnalytics' in analytics:
        bandwidth = analytics['bandwidthAnalytics']
        if 'bandwidthUtilization' in bandwidth:
            efficiency = bandwidth['bandwidthUtilization'].get('utilizationEfficiency', 0)
            health_factors.append(min(efficiency, 100))
    
    # Average health score
    if health_factors:
        avg_health = sum(health_factors) / len(health_factors)
        if avg_health >= 80:
            return 'Excellent'
        elif avg_health >= 60:
            return 'Good'
        elif avg_health >= 40:
            return 'Fair'
        else:
            return 'Poor'
    
    return 'Unknown'

def calculate_variance(values):
    """Calculate variance of a list of values"""
    if not values:
        return 0
    
    mean = sum(values) / len(values)
    variance = sum((x - mean) ** 2 for x in values) / len(values)
    return variance

def calculate_growth_trend(values):
    """Calculate growth trend from time series data"""
    if len(values) < 2:
        return 'Insufficient Data'
    
    # Simple linear trend calculation
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

def analyze_peak_times(sessions_data, usage_data, clients_data):
    """Analyze peak usage times across different metrics"""
    peak_analysis = {}
    
    try:
        # Find peak session times
        if sessions_data:
            sessions = [(s.get('Time'), safe_int(s.get('Sessions', 0))) for s in sessions_data if s and s.get('Time')]
            if sessions:
                peak_session = max(sessions, key=lambda x: x[1])
                peak_analysis['peakSessionTime'] = {
                    'time': peak_session[0],
                    'sessions': peak_session[1]
                }
        
        # Find peak bandwidth times
        if usage_data:
            usage = [(u.get('Time'), safe_float(u.get('Total (b/s)', 0))) for u in usage_data if u and u.get('Time')]
            if usage:
                peak_usage = max(usage, key=lambda x: x[1])
                peak_analysis['peakUsageTime'] = {
                    'time': peak_usage[0],
                    'bandwidth': peak_usage[1]
                }
        
        # Find peak client times
        if clients_data:
            clients = [(c.get('Time'), safe_int(c.get('Clients', 0))) for c in clients_data if c and c.get('Time')]
            if clients:
                peak_clients = max(clients, key=lambda x: x[1])
                peak_analysis['peakClientTime'] = {
                    'time': peak_clients[0],
                    'clients': peak_clients[1]
                }
    
    except Exception as e:
        logger.error(f"Error analyzing peak times: {str(e)}")
        peak_analysis['error'] = str(e)
    
    return peak_analysis