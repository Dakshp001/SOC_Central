# Activity Logs API Views
# Save as: backend/authentication/views/activity_logs.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import models
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)

class ActivityLogView(APIView):
    """
    API endpoint for user activity logs
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get activity logs for the current user"""
        try:
            user = request.user
            
            # Get query parameters
            log_type = request.GET.get('type', 'all')
            severity = request.GET.get('severity', 'all')
            days = int(request.GET.get('days', 30))
            limit = int(request.GET.get('limit', 50))
            
            # Calculate date range
            start_date = timezone.now() - timedelta(days=days)
            
            # Mock activity data - replace with actual database queries
            mock_activities = self.generate_mock_activities(user, start_date, limit)
            
            # Filter by type and severity if specified
            filtered_activities = []
            for activity in mock_activities:
                if log_type != 'all' and activity['type'] != log_type:
                    continue
                if severity != 'all' and activity['severity'] != severity:
                    continue
                filtered_activities.append(activity)
            
            return Response({
                'success': True,
                'activities': filtered_activities,
                'total_count': len(filtered_activities),
                'filters': {
                    'type': log_type,
                    'severity': severity,
                    'days': days
                }
            })
            
        except Exception as e:
            logger.error(f"Error retrieving activity logs: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to retrieve activity logs'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generate_mock_activities(self, user, start_date, limit):
        """Generate mock activity data for demonstration"""
        from django.contrib.auth import get_user_model
        import random
        from datetime import timedelta
        
        activities = []
        now = timezone.now()
        
        # Activity types and their configurations
        activity_types = [
            {
                'type': 'login',
                'actions': ['User Login', 'Successful Authentication', 'Login from New Device'],
                'descriptions': [
                    'Successful authentication from secure session',
                    'Login attempt from trusted device',
                    'Multi-factor authentication completed'
                ],
                'severity': 'low'
            },
            {
                'type': 'upload',
                'actions': ['Data Upload', 'File Upload', 'Bulk Data Import'],
                'descriptions': [
                    'GSuite security data uploaded successfully',
                    'MDM compliance data processed',
                    'SIEM logs imported to system',
                    'EDR endpoint data uploaded',
                    'Meraki network data synchronized'
                ],
                'severity': 'medium'
            },
            {
                'type': 'view',
                'actions': ['Dashboard View', 'Report Access', 'Data Export'],
                'descriptions': [
                    'Accessed SIEM analytics dashboard',
                    'Viewed MDM compliance report',
                    'Downloaded security summary report',
                    'Accessed GSuite email security metrics'
                ],
                'severity': 'low'
            },
            {
                'type': 'security',
                'actions': ['Security Alert', 'Threat Detection', 'Policy Violation'],
                'descriptions': [
                    'High-priority security event detected',
                    'Suspicious login attempt blocked',
                    'Policy compliance violation identified',
                    'Threat indicator matched in system'
                ],
                'severity': 'high'
            },
            {
                'type': 'settings',
                'actions': ['Settings Update', 'Configuration Change', 'Profile Update'],
                'descriptions': [
                    'Updated notification preferences',
                    'Changed dashboard layout settings',
                    'Modified security alert thresholds',
                    'Updated profile information'
                ],
                'severity': 'low'
            }
        ]
        
        # Generate activities over the time period
        for i in range(min(limit, 100)):  # Cap at 100 for performance
            # Random time within the date range
            time_offset = random.randint(0, int((now - start_date).total_seconds()))
            activity_time = start_date + timedelta(seconds=time_offset)
            
            # Choose random activity type
            activity_type = random.choice(activity_types)
            
            # Adjust severity based on type and randomness
            severity = activity_type['severity']
            if activity_type['type'] == 'security' and random.random() > 0.7:
                severity = 'critical'
            elif random.random() > 0.9:
                severity = 'high'
            
            activity = {
                'id': f"activity_{i}_{int(activity_time.timestamp())}",
                'timestamp': activity_time.isoformat(),
                'action': random.choice(activity_type['actions']),
                'description': random.choice(activity_type['descriptions']),
                'type': activity_type['type'],
                'severity': severity,
                'ip_address': f"192.168.1.{random.randint(100, 255)}",
                'user_agent': random.choice([
                    'Chrome/91.0.4472.124',
                    'Firefox/89.0',
                    'Safari/14.1.1',
                    'Edge/91.0.864.59'
                ]),
                'details': self.generate_activity_details(activity_type['type'])
            }
            
            activities.append(activity)
        
        # Sort by timestamp (most recent first)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return activities
    
    def generate_activity_details(self, activity_type):
        """Generate relevant details for each activity type"""
        import random
        
        details = {}
        
        if activity_type == 'login':
            details = {
                'location': random.choice(['New York, NY', 'San Francisco, CA', 'Chicago, IL', 'Remote']),
                'device': random.choice(['Desktop', 'Mobile', 'Tablet']),
                'session_duration': f"{random.randint(10, 240)} minutes"
            }
        elif activity_type == 'upload':
            tools = ['GSuite', 'MDM', 'SIEM', 'EDR', 'Meraki', 'SonicWall']
            tool = random.choice(tools)
            details = {
                'file': f"{tool.lower()}_data_{random.randint(1, 12):02d}_{random.randint(2024, 2024)}.xlsx",
                'size': f"{random.uniform(0.5, 10):.1f} MB",
                'tool': tool,
                'records_processed': random.randint(100, 5000)
            }
        elif activity_type == 'view':
            dashboards = ['SIEM Analytics', 'MDM Compliance', 'GSuite Security', 'EDR Threats', 'Network Overview']
            details = {
                'dashboard': random.choice(dashboards),
                'duration': f"{random.randint(2, 45)} minutes",
                'actions_performed': random.randint(3, 15)
            }
        elif activity_type == 'security':
            details = {
                'alert_type': random.choice([
                    'Suspicious Login Attempt',
                    'Malware Detection',
                    'Data Exfiltration Alert',
                    'Policy Violation'
                ]),
                'affected_systems': random.sample(['EDR', 'SIEM', 'Firewall', 'Email'], random.randint(1, 3)),
                'risk_level': random.choice(['Low', 'Medium', 'High', 'Critical'])
            }
        elif activity_type == 'settings':
            details = {
                'changed': random.sample([
                    'email_notifications',
                    'alert_frequency',
                    'dashboard_layout',
                    'security_thresholds'
                ], random.randint(1, 3)),
                'previous_values': 'Hidden for security'
            }
        
        return details


class ActivityStatsView(APIView):
    """
    API endpoint for activity statistics and charts
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get activity statistics for charts"""
        try:
            user = request.user
            days = int(request.GET.get('days', 7))
            
            # Generate mock stats for charts
            stats = self.generate_activity_stats(user, days)
            
            return Response({
                'success': True,
                'stats': stats,
                'period': f"Last {days} days"
            })
            
        except Exception as e:
            logger.error(f"Error retrieving activity stats: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to retrieve activity statistics'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generate_activity_stats(self, user, days):
        """Generate activity statistics for charts"""
        import random
        from datetime import timedelta
        
        now = timezone.now()
        stats = {
            'daily_activity': [],
            'activity_by_type': [],
            'severity_distribution': [],
            'total_activities': 0
        }
        
        # Daily activity for the past N days
        for i in range(days):
            date = now - timedelta(days=i)
            daily_count = random.randint(5, 30)
            stats['daily_activity'].append({
                'date': date.strftime('%Y-%m-%d'),
                'count': daily_count,
                'label': date.strftime('%b %d')
            })
        
        # Activity by type
        activity_types = [
            {'type': 'view', 'label': 'Dashboard Views', 'count': random.randint(20, 100)},
            {'type': 'upload', 'label': 'Data Uploads', 'count': random.randint(5, 25)},
            {'type': 'login', 'label': 'Login Sessions', 'count': random.randint(10, 40)},
            {'type': 'security', 'label': 'Security Events', 'count': random.randint(2, 15)},
            {'type': 'settings', 'label': 'Settings Changes', 'count': random.randint(1, 8)}
        ]
        
        stats['activity_by_type'] = activity_types
        
        # Severity distribution
        stats['severity_distribution'] = [
            {'severity': 'low', 'count': random.randint(50, 120), 'color': 'green'},
            {'severity': 'medium', 'count': random.randint(15, 40), 'color': 'yellow'},
            {'severity': 'high', 'count': random.randint(5, 20), 'color': 'orange'},
            {'severity': 'critical', 'count': random.randint(0, 5), 'color': 'red'}
        ]
        
        # Calculate total
        stats['total_activities'] = sum([item['count'] for item in activity_types])
        
        return stats