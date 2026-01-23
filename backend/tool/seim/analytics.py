# backend/tool/siem/analytics.py
# SIEM analytics and helper functions

import pandas as pd
import logging
from ..shared import safe_int

logger = logging.getLogger(__name__)

def get_top_alerts_with_users(events_df, severity):
    """
    Group by alert title, count occurrences, get affected users for specific severity
    Returns: List of dictionaries with alert details and affected users
    """
    if events_df.empty:
        return []
    
    try:
        # Group by alert title/type and count occurrences
        alert_groups = events_df.groupby('Alert Type').agg({
            'Username': lambda x: list(set([user for user in x.dropna() if user and str(user).strip() and str(user).lower() != 'unknown'])),
            'Alert Type': 'count'  # Count of occurrences
        }).rename(columns={'Alert Type': 'count'})
        
        # Sort by count (descending) and take top 10
        top_alerts = alert_groups.sort_values('count', ascending=False).head(10)
        
        result = []
        for alert_title, row in top_alerts.iterrows():
            # Clean and validate data
            clean_users = []
            if isinstance(row['Username'], list):
                clean_users = [str(user).strip() for user in row['Username'] 
                             if user and str(user).strip() and str(user).lower() != 'unknown' 
                             and not pd.isna(user)]
            
            alert_count = safe_int(row['count'], 0)
            if alert_count > 0:  # Only include alerts with valid counts
                result.append({
                    'alert_title': str(alert_title) if alert_title else f'Unknown Alert Type',
                    'count': alert_count,
                    'affected_users': clean_users,
                    'severity': str(severity),
                    'affected_users_count': len(clean_users)
                })
        
        return result
        
    except Exception as e:
        logger.error(f"Error in get_top_alerts_with_users: {e}")
        return []

def get_top_users_with_alerts(events_df, severity):
    """
    Group by username, count alert occurrences, get alert types for specific severity
    Returns: List of dictionaries with user details and their alerts
    """
    if events_df.empty:
        return []
    
    try:
        # Filter out unknown users first
        valid_events = events_df[
            (events_df['Username'].notna()) & 
            (events_df['Username'] != 'Unknown') & 
            (events_df['Username'].str.strip() != '')
        ]
        
        if valid_events.empty:
            return []
        
        # Group by username and count alerts
        user_groups = valid_events.groupby('Username').agg({
            'Alert Type': lambda x: list([alert for alert in x.dropna() if alert and str(alert).strip()]),
            'Username': 'count'  # Count of alerts
        }).rename(columns={'Username': 'alert_count'})
        
        # Sort by alert count (descending) and take top 10
        top_users = user_groups.sort_values('alert_count', ascending=False).head(10)
        
        result = []
        for username, row in top_users.iterrows():
            if username and str(username).strip():
                # Get top alert types for this user
                alert_types = []
                if isinstance(row['Alert Type'], list):
                    alert_types = [str(alert).strip() for alert in row['Alert Type'] 
                                 if alert and str(alert).strip() and not pd.isna(alert)]
                
                # Count alert type occurrences
                alert_counts = {}
                for alert in alert_types:
                    alert_counts[alert] = alert_counts.get(alert, 0) + 1
                
                # Get top 5 alert types
                top_alert_types = [alert for alert, count in 
                                 sorted(alert_counts.items(), key=lambda x: x[1], reverse=True)[:5]]
                
                alert_count = safe_int(row['alert_count'], 0)
                if alert_count > 0:  # Only include users with valid alert counts
                    result.append({
                        'username': str(username).strip(),
                        'alert_count': alert_count,
                        'top_alerts': top_alert_types,
                        'severity': str(severity),
                        'total_alert_types': len(set(alert_types))
                    })
        
        return result
        
    except Exception as e:
        logger.error(f"Error in get_top_users_with_alerts: {e}")
        return []