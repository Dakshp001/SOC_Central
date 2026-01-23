# backend/tool/siem/date_utils.py
# SIEM-specific date processing utilities

import pandas as pd
import numpy as np
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def parse_siem_datetime(date_str):
    """Parse SIEM datetime format: '14-07-2025  4.04.03 PM'"""
    if pd.isna(date_str) or date_str is None:
        return None
    
    date_str = str(date_str).strip()
    if not date_str or date_str.lower() in ['nan', 'none', '', 'nat']:
        return None
    
    # Handle the specific SIEM format with double spaces and dots in time
    try:
        # Replace double spaces and dots in time format
        normalized_str = date_str.replace('  ', ' ').replace('.', ':')
        
        # Try different datetime formats for SIEM data
        formats_to_try = [
            '%d-%m-%Y %I:%M:%S %p',    # 14-07-2025 4:04:03 PM
            '%d-%m-%Y %H:%M:%S',       # 14-07-2025 16:04:03
            '%d/%m/%Y %I:%M:%S %p',    # 14/07/2025 4:04:03 PM
            '%d/%m/%Y %H:%M:%S',       # 14/07/2025 16:04:03
            '%Y-%m-%d %H:%M:%S',       # 2025-07-14 16:04:03
            '%Y-%m-%d %I:%M:%S %p',    # 2025-07-14 4:04:03 PM
            '%d-%m-%Y',                # 14-07-2025 (date only)
            '%d/%m/%Y',                # 14/07/2025 (date only)
        ]
        
        for fmt in formats_to_try:
            try:
                return datetime.strptime(normalized_str, fmt)
            except ValueError:
                continue
        
        # If all manual formats fail, try pandas
        parsed = pd.to_datetime(normalized_str, errors='coerce', dayfirst=True)
        if pd.isna(parsed):
            return None
        return parsed.to_pydatetime()
        
    except Exception as e:
        logger.warning(f"Could not parse SIEM date: {date_str} - {e}")
        return None

def calculate_real_response_times(events_df):
    """Calculate real response times from SIEM data"""
    if events_df.empty or 'Date' not in events_df.columns:
        return 0.0, {}
    
    try:
        # Parse all dates
        events_df['ParsedDate'] = events_df['Date'].apply(parse_siem_datetime)
        valid_dates = events_df.dropna(subset=['ParsedDate'])
        
        if len(valid_dates) < 2:
            return 0.0, {}
        
        # Sort by date
        valid_dates = valid_dates.sort_values('ParsedDate')
        
        # Calculate time differences between consecutive events (as a proxy for response time)
        time_diffs = []
        for i in range(1, len(valid_dates)):
            prev_time = valid_dates.iloc[i-1]['ParsedDate']
            curr_time = valid_dates.iloc[i]['ParsedDate']
            diff_minutes = (curr_time - prev_time).total_seconds() / 60
            
            # Filter reasonable response times (between 1 minute and 24 hours)
            if 1 <= diff_minutes <= 1440:
                time_diffs.append(diff_minutes)
        
        if not time_diffs:
            return 0.0, {}
        
        avg_response_time = np.mean(time_diffs)
        
        # Calculate response time by severity
        response_by_severity = {}
        for severity in ['critical', 'high', 'medium', 'low', 'info']:
            severity_events = valid_dates[valid_dates.get('Severity_Name', '') == severity]
            if len(severity_events) > 1:
                severity_diffs = []
                for i in range(1, len(severity_events)):
                    prev_time = severity_events.iloc[i-1]['ParsedDate']
                    curr_time = severity_events.iloc[i]['ParsedDate']
                    diff_minutes = (curr_time - prev_time).total_seconds() / 60
                    if 1 <= diff_minutes <= 1440:
                        severity_diffs.append(diff_minutes)
                
                if severity_diffs:
                    response_by_severity[severity] = np.mean(severity_diffs)
        
        return float(avg_response_time), response_by_severity
        
    except Exception as e:
        logger.error(f"Error calculating response times: {e}")
        return 0.0, {}

def calculate_real_false_positive_rate(events_df):
    """
    Calculates the false positive rate based on severity levels.
    Severity 0 (Info) and optionally 1 (Low) are treated as false positives.
    """
    if events_df.empty or 'severity' not in events_df.columns:
        return 0.0

    try:
        total_events = len(events_df)

        # Define severity levels to treat as false positives
        false_positive_severities = [0, 1]  # Info and Low

        false_positives = len(events_df[events_df['severity'].isin(false_positive_severities)])

        false_positive_rate = (false_positives / total_events) * 100
        return round(false_positive_rate, 2)

    except Exception as e:
        print(f"Error calculating false positive rate: {e}")
        return 0.0


def generate_real_monthly_trends(events_df):
    """Generate real monthly trends from actual date data"""
    if events_df.empty or 'Date' not in events_df.columns:
        return {}
    
    try:
        # Parse dates
        events_df['ParsedDate'] = events_df['Date'].apply(parse_siem_datetime)
        valid_dates = events_df.dropna(subset=['ParsedDate'])
        
        if valid_dates.empty:
            return {}
        
        # Group by year-month
        valid_dates['YearMonth'] = valid_dates['ParsedDate'].dt.to_period('M')
        monthly_counts = valid_dates.groupby('YearMonth').size()
        
        # Convert to dictionary with string keys
        monthly_trends = {}
        for period, count in monthly_counts.items():
            monthly_trends[str(period)] = int(count)
        
        return monthly_trends
        
    except Exception as e:
        logger.error(f"Error generating monthly trends: {e}")
        return {}

def get_real_date_range(events_df):
    """Get real date range from actual data"""
    if events_df.empty or 'Date' not in events_df.columns:
        return {"start": None, "end": None}
    
    try:
        # Parse dates
        events_df['ParsedDate'] = events_df['Date'].apply(parse_siem_datetime)
        valid_dates = events_df['ParsedDate'].dropna()
        
        if valid_dates.empty:
            return {"start": None, "end": None}
        
        start_date = valid_dates.min()
        end_date = valid_dates.max()
        
        return {
            "start": start_date.strftime('%Y-%m-%d') if start_date else None,
            "end": end_date.strftime('%Y-%m-%d') if end_date else None
        }
        
    except Exception as e:
        logger.error(f"Error getting date range: {e}")
        return {"start": None, "end": None}

def calculate_peak_activity_hours(events_df):
    """Calculate peak activity hours from real date data"""
    if events_df.empty or 'Date' not in events_df.columns:
        return {}
    
    try:
        # Parse dates
        events_df['ParsedDate'] = events_df['Date'].apply(parse_siem_datetime)
        valid_dates = events_df.dropna(subset=['ParsedDate'])
        
        if valid_dates.empty:
            return {}
        
        # Extract hour from datetime
        valid_dates['Hour'] = valid_dates['ParsedDate'].dt.hour
        hourly_counts = valid_dates.groupby('Hour').size()
        
        # Convert to dictionary
        peak_hours = {}
        for hour, count in hourly_counts.items():
            hour_label = f"{hour:02d}:00"
            peak_hours[hour_label] = int(count)
        
        return peak_hours
        
    except Exception as e:
        logger.error(f"Error calculating peak hours: {e}")
        return {}

def get_events_by_day_of_week(events_df):
    """Get event distribution by day of week"""
    if events_df.empty or 'Date' not in events_df.columns:
        return {}
    
    try:
        # Parse dates
        events_df['ParsedDate'] = events_df['Date'].apply(parse_siem_datetime)
        valid_dates = events_df.dropna(subset=['ParsedDate'])
        
        if valid_dates.empty:
            return {}
        
        # Extract day of week
        valid_dates['DayOfWeek'] = valid_dates['ParsedDate'].dt.day_name()
        daily_counts = valid_dates.groupby('DayOfWeek').size()
        
        # Convert to dictionary with proper order
        days_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        daily_distribution = {}
        
        for day in days_order:
            if day in daily_counts:
                daily_distribution[day] = int(daily_counts[day])
            else:
                daily_distribution[day] = 0
        
        return daily_distribution
        
    except Exception as e:
        logger.error(f"Error calculating daily distribution: {e}")
        return {}