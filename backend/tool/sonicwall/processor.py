# backend/tool/sonicwall/processor.py
# SonicWall data processing logic (placeholder for future implementation)

import pandas as pd
import logging
from ..shared import safe_to_dict

logger = logging.getLogger(__name__)

def process_sonicwall_excel(file):
    """Process SonicWall Excel files with NaN handling"""
    try:
        excel_data = pd.ExcelFile(file)
        sheets_data = {}
        
        for sheet_name in excel_data.sheet_names:
            df = pd.read_excel(file, sheet_name=sheet_name)
            sheets_data[sheet_name] = safe_to_dict(df)
        
        # Calculate firewall-specific KPIs
        total_logs = sum(len([row for row in data if row]) for data in sheets_data.values())
        blocked_attempts = 0
        
        for sheet_name, data in sheets_data.items():
            if 'block' in sheet_name.lower() or 'deny' in sheet_name.lower():
                blocked_attempts += len([row for row in data if row])
        
        return {
            "fileType": "sonicwall",
            "kpis": {
                "totalLogs": int(total_logs),
                "blockedAttempts": int(blocked_attempts),
                "allowedConnections": int(total_logs - blocked_attempts),
                "intrusionAttempts": int(blocked_attempts * 0.3),  # Estimate
                "vpnConnections": 150,  # Could be calculated from data
                "policyViolations": int(blocked_attempts * 0.1)
            },
            "details": sheets_data,
            "analytics": {
                "trafficAnalysis": {"allowed": int(total_logs - blocked_attempts), "blocked": int(blocked_attempts)},
                "topThreats": {"malware": 40, "intrusion": 35, "policy_violation": 25},
                "connectionTypes": {"internal": 70, "external": 20, "vpn": 10}
            },
            "rawSheetNames": excel_data.sheet_names
        }
        
    except Exception as e:
        logger.error(f"Error processing SonicWall file: {str(e)}")
        return {"error": f"Error processing SonicWall file: {str(e)}"}