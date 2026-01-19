# Wazuh API Dashboard Enhancements

## Overview
Comprehensive enhancements to the Wazuh API EDR Dashboard to improve threat details display, classification clarity, and overall user experience.

## Changes Made

### 0. Threat Click Functionality ⭐ **NEW**

**Problem:** Users couldn't click on threat rows in the Threats tab to view detailed information.

**Solution:**
- Added `openModal` and `getAllThreatsData` props to `ThreatsTab` component
- Added click handler to each threat table row: `onClick={() => openModal(getAllThreatsData())}`
- Added cursor pointer styling and title tooltip: "Click to view all threat details"
- Updated `EDRDashboard` to pass required props to `ThreatsTab`

**Result:** Users can now click any threat row to open a modal with comprehensive threat information including:
- Full threat details with MITRE information
- Severity badges and classification
- Agent IDs and endpoint information
- Searchable and filterable threat list

**Files Modified:**
- `soccentral/src/components/dashboards/EDR/tabs/ThreatsTab.tsx` (lines 9-12, 105-110)
- `soccentral/src/components/dashboards/EDRDashboard.tsx` (lines 210-214)

### 1. Backend Enhancements (`backend/tool/edr/wazuh_api_service.py`)

#### A. Enhanced Threat Details Processing
**Problem:** Threat details were showing "No details available" because frontend expected `threat_details` field but backend only provided `threat_name`.

**Solution:**
- Added comprehensive `threat_details` field that combines:
  - Threat name (rule description)
  - MITRE ATT&CK information (tactics and techniques)
  - Rule ID and severity level
  - Category classification
- Added `details` field as alternative field name for compatibility
- Format: `"SSH Brute Force | MITRE Tactics: T1110: Brute Force | Rule ID: 5712 (Level 10) | Category: SSH Activity"`

**Location:** `_process_threats()` method, lines 218-289

#### B. Human-Readable Classification System
**Problem:** Classifications used raw Wazuh rule groups (e.g., "authentication, syslog, sshd") which were technical and not user-friendly.

**Solution:**
- Created `_get_human_readable_classification()` method with comprehensive mapping
- Converts technical groups to readable labels:
  - `authentication_failed` → "Failed Authentication"
  - `sshd` → "SSH Server Event"
  - `malware` → "Malware Detection"
  - `syscheck` → "File Integrity Change"
  - And 50+ more mappings
- Prioritizes high-severity categories (malware, ransomware, exploits)
- Falls back to formatted label if no exact match
- Keeps raw classification in `classification_raw` field for reference

**Location:** `_get_human_readable_classification()` method, lines 325-437

#### C. Enhanced Threat Data Fields
Added comprehensive threat information fields:
- `threat_name`: Primary threat identifier
- `threat_details`: Comprehensive threat description
- `details`: Alternative field for compatibility
- `classification`: Human-readable category
- `classification_raw`: Original Wazuh groups
- `severity`: Mapped severity level (Critical/High/Medium/Low)
- `mitre_technique`: MITRE ATT&CK technique names
- `mitre_id`: MITRE ATT&CK technique IDs
- `mitre_tactic`: MITRE ATT&CK tactics
- `rule_id`: Wazuh rule identifier
- `rule_level`: Wazuh rule severity level (0-15)
- `agent_id`: Agent identifier
- `endpoints`/`endpoint`: Affected endpoint name
- `location`: Event source location
- `decoder`: Wazuh decoder name

### 2. Frontend Enhancements

#### A. Threats Tab Display (`soccentral/src/components/dashboards/EDR/tabs/ThreatsTab.tsx`)

**Changes:**
1. **Enhanced Table Layout:**
   - Added Severity column with color-coded badges:
     - Critical: Red
     - High: Orange
     - Medium: Yellow
     - Low: Blue
   - Improved spacing and padding for better readability
   - Added hover effects for row highlighting

2. **Rich Threat Information:**
   - Primary: Threat name (bold, prominent)
   - Secondary: Full threat details (2-line clamp with tooltip)
   - Tertiary: MITRE ATT&CK ID with 🎯 icon
   - Classification shows category + Rule ID

3. **Multi-line Cell Content:**
   - Threat details: Name + full description + MITRE info
   - Classification: Category + Rule ID
   - Improved visual hierarchy

**Location:** Lines 83-171

#### B. Detail Modal Enhancements (`soccentral/src/components/dashboards/EDR/components/DetailModal.tsx`)

**Changes:**
1. **Comprehensive Threat Display:**
   - Header shows threat name (bold, clickable to copy)
   - Full threat details below (with tooltip)
   - Inline severity badge
   - Colored information badges for:
     - MITRE ID (blue)
     - MITRE Technique (purple)
     - Rule ID + Level (gray)

2. **Enhanced Classification Display:**
   - Primary: Human-readable classification
   - Secondary: Raw classification (tooltip shows full text)
   - Character limit with ellipsis for long classifications

3. **Improved Endpoint Information:**
   - Endpoint name (bold)
   - Agent ID (small text below)
   - Better visual separation

4. **Better Layout:**
   - Flexible columns with proper text wrapping
   - Color-coded information badges
   - Tooltips for full information
   - Click-to-copy functionality for threat names

**Location:** Lines 237-332

### 3. Dashboard Accessibility

**Status:** ✅ Now Fixed

**Problem:** EDR dashboard was not accessible when no file was uploaded - users couldn't see the Live API button.

**Solution:** Modified `AnalyticsTabContent.tsx` to always render the EDR dashboard, even without data:

```typescript
// Lines 29-34
const shouldAlwaysShowDashboard = selectedTool === 'edr';

return (
  <TabsContent value="analytics" className="space-y-4 m-0">
    {(currentData || shouldAlwaysShowDashboard) ? (
      <AnalyticsDashboard data={currentData} toolType={selectedTool} />
    ) : (
      // Show "No Data Available" for other tools
    )}
  </TabsContent>
);
```

**Location:** `soccentral/src/pages/ToolsNav/AnalyticsTabContent.tsx`, lines 29-34

The dashboard is now fully accessible without EDR data upload:

1. **Data Source Toggle** (`soccentral/src/components/dashboards/EDR/components/DataSourceToggle.tsx`):
   - Always visible at top of dashboard
   - Two modes: "PDF Upload" and "Live Wazuh API"
   - Users can click "Live Wazuh API" button anytime
   - Fetches real-time data from Wazuh server

2. **Wrapper Component** (`soccentral/src/components/dashboards/EDRDashboardWrapper.tsx`):
   - Shows instructional card when no data available
   - Guides users to:
     - Click "Live Wazuh API" for real-time data, OR
     - Upload EDR Excel file for historical data
   - Default mode is 'api' when no PDF data exists

3. **User Flow Without Upload:**
   ```
   Navigate to EDR Dashboard
   ↓
   See instructional card + Data Source Toggle
   ↓
   Click "Live Wazuh API" button
   ↓
   System fetches data from Wazuh server
   ↓
   Dashboard displays with full analytics
   ```

## Testing Recommendations

### 1. Backend Testing
```bash
# Test Wazuh API connection
python D:\College\Internship\SOC 3.3\SOC-Central\backend\test_wazuh_api.py

# Check API endpoint
curl http://localhost:8000/api/tool/edr/live-data/ \
  -H "Authorization: Bearer <token>"
```

### 2. Frontend Testing

**Test Cases:**
1. ✅ Threat details display (no more "No details available")
2. ✅ Human-readable classifications
3. ✅ MITRE information displays correctly
4. ✅ Severity badges show correct colors
5. ✅ Modal shows comprehensive threat information
6. ✅ Dashboard accessible without data upload
7. ✅ Live API button fetches data successfully
8. ✅ Classification tooltips show raw data

**Visual Checks:**
- Threats Tab shows rich, multi-line threat information
- Modal displays colored information badges
- Severity levels use correct colors
- MITRE info displays with proper formatting
- Classifications are easy to understand

### 3. User Experience Testing

**Scenario 1: New User Without Data**
1. Navigate to EDR dashboard
2. See clear instructions
3. Click "Live Wazuh API"
4. Verify data loads and displays properly

**Scenario 2: Viewing Threats**
1. Navigate to Threats tab
2. Verify threat details are comprehensive
3. Click on a threat row to open modal
4. Verify all fields display correctly
5. Check MITRE badges and rule information
6. Hover over classification to see raw data

**Scenario 3: Classification Understanding**
1. View various threats
2. Verify classifications are readable
   - "Failed Authentication" instead of "authentication_failed, syslog"
   - "SSH Server Event" instead of "sshd, authentication"
   - "Malware Detection" instead of "malware, virustotal"

## Benefits

### 1. Improved Threat Visibility
- **Before:** "No details available"
- **After:** Comprehensive threat information with MITRE mapping

### 2. Better Classification Understanding
- **Before:** "authentication, syslog, sshd, authentication_failures"
- **After:** "Failed Authentication" with tooltip showing raw data

### 3. Enhanced Security Analysis
- MITRE ATT&CK integration for threat intelligence
- Rule ID and severity levels for context
- Severity badges for quick threat assessment
- Agent and endpoint information for incident response

### 4. Improved Accessibility
- Dashboard usable without file uploads
- Direct Wazuh API integration
- Real-time threat monitoring
- Flexible data sources (PDF or Live API)

### 5. Better User Experience
- Color-coded severity levels
- Information badges for quick scanning
- Tooltips for detailed information
- Click-to-copy functionality
- Responsive design with proper wrapping

## API Integration

### Live Data Endpoint
**Endpoint:** `GET /api/tool/edr/live-data/`

**Authentication:** Bearer token required

**Response Format:**
```json
{
  "fileType": "edr",
  "dataSource": "wazuh_api",
  "kpis": {
    "totalEndpoints": 10,
    "totalThreats": 45,
    "criticalThreats": 5,
    ...
  },
  "details": {
    "threats": [
      {
        "threat_id": "xyz123",
        "threat_name": "SSH Brute Force Attempt",
        "threat_details": "SSH Brute Force Attempt | MITRE Tactics: T1110: Brute Force | Rule ID: 5712 (Level 10)",
        "classification": "Failed Authentication",
        "classification_raw": "authentication_failed, sshd, authentication_failures",
        "severity": "High",
        "mitre_id": "T1110",
        "mitre_technique": "Brute Force",
        "rule_id": "5712",
        "rule_level": 10,
        "endpoint": "server-001",
        "agent_id": "001",
        ...
      }
    ],
    "endpoints": [...],
    "detailedStatus": [...]
  },
  "analytics": {...},
  "processedAt": "2025-01-15T10:30:00"
}
```

## File Changes Summary

### Backend Files Modified:
1. `backend/tool/edr/wazuh_api_service.py`
   - Enhanced `_process_threats()` method
   - Added `_get_human_readable_classification()` method
   - Updated threat data structure with comprehensive fields

### Frontend Files Modified:
1. `soccentral/src/components/dashboards/EDR/tabs/ThreatsTab.tsx`
   - Enhanced table display with severity column
   - Added MITRE information display
   - Improved visual hierarchy
   - ⭐ **Added click handlers to threat rows** - Opens modal with all threat details
   - Added `cursor-pointer` styling and hover effects

2. `soccentral/src/components/dashboards/EDR/components/DetailModal.tsx`
   - Enhanced threat row rendering
   - Added colored information badges
   - Improved classification display with tooltips

3. `soccentral/src/pages/ToolsNav/AnalyticsTabContent.tsx` ⭐ **NEW**
   - Added `shouldAlwaysShowDashboard` check for EDR
   - EDR dashboard now renders even without uploaded data
   - Enables Live API button access without file upload

4. `soccentral/src/components/dashboards/EDRDashboard.tsx` ⭐ **UPDATED**
   - Now passes `openModal` and `getAllThreatsData` props to ThreatsTab
   - Enables threat click functionality

### Documentation Files Created:
1. `WAZUH_DASHBOARD_ENHANCEMENTS.md` (this file)

## Migration Notes

**No Breaking Changes:**
- Backward compatible with existing data
- Fallback values for all new fields
- Alternative field names provided for compatibility
- Existing PDF upload functionality unchanged

**No Database Migrations Required:**
- Changes are in data processing layer only
- No schema changes needed

## Future Enhancements

### Potential Improvements:
1. **Advanced Filtering:**
   - Filter by MITRE technique
   - Filter by rule ID
   - Filter by severity level

2. **Threat Intelligence:**
   - Link to MITRE ATT&CK framework
   - Integration with threat intelligence feeds
   - Historical trend analysis

3. **Visualization:**
   - MITRE ATT&CK heatmap
   - Classification distribution charts
   - Timeline view of threats

4. **Export Features:**
   - Export with MITRE mappings
   - PDF report generation
   - STIX/TAXII format support

5. **Correlation:**
   - Cross-reference with other tools (GSuite, SIEM, etc.)
   - Threat correlation engine
   - Automated incident response workflows

## Support and Maintenance

### Monitoring:
- Check Wazuh API connectivity regularly
- Monitor API response times
- Review classification accuracy
- Gather user feedback

### Updates:
- Keep classification mappings current
- Update MITRE ATT&CK mappings
- Add new rule classifications as they emerge
- Refine severity mappings based on usage

## Conclusion

These enhancements significantly improve the Wazuh API Dashboard by:
- ✅ Fixing "No details available" issue
- ✅ Making classifications user-friendly
- ✅ Adding comprehensive threat information
- ✅ Improving visual presentation
- ✅ Ensuring dashboard accessibility without file uploads
- ✅ Integrating MITRE ATT&CK framework
- ✅ Enhancing security analysis capabilities

The dashboard now provides a professional, comprehensive view of endpoint security with proper threat intelligence integration and user-friendly interface.
