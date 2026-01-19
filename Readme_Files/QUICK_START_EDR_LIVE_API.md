# Quick Start: EDR Live API Integration

## How to Access

1. **Navigate to the EDR Tool**:
   - Open SOC Central application
   - Click on the EDR tool card from the Security Tools dashboard
   - You'll now see the EDR dashboard page

2. **New UI - Data Source Toggle**:
   - At the TOP of the EDR page, you'll see a new card titled "EDR Data Source"
   - This card has two large buttons:
     - **PDF Upload** (left) - For uploaded Excel files
     - **Live Wazuh API** (right) - For real-time Wazuh data

3. **Load Live Data**:
   - Click the "Live Wazuh API" button
   - Wait a few seconds while it fetches data from Wazuh
   - The dashboard will automatically populate with real-time data
   - You'll see: "Currently viewing live data from Wazuh API"

4. **Switch Back to PDF**:
   - Click "PDF Upload" button
   - Dashboard switches back to uploaded file data (if any)

## What Changed

### Before:
- EDR dashboard only showed when you uploaded a PDF file
- No live data option

### After:
- EDR page always shows the "Data Source" toggle
- Can access live Wazuh data without uploading anything
- Can switch between PDF and live data with one click

## File Changes Made

### Backend Files Created:
1. `backend/tool/edr/wazuh_api_service.py` - Wazuh API integration service
2. Added `WazuhLiveDataView` to `backend/tool/edr/views.py`
3. Registered `/api/tools/edr/live-data/` endpoint in `backend/tool/urls.py`

### Frontend Files Created/Modified:
1. **Created**: `soccentral/src/components/dashboards/EDR/components/DataSourceToggle.tsx`
   - The toggle UI component

2. **Created**: `soccentral/src/components/dashboards/EDRDashboardWrapper.tsx`
   - Wrapper that manages PDF vs API mode

3. **Modified**: `soccentral/src/components/Dashboard-Analytics/components/ToolDashboardRenderer.tsx`
   - Now renders EDRDashboardWrapper instead of EDRDashboard directly
   - Shows toggle even when no PDF data exists

4. **Modified**: `soccentral/src/components/dashboards/EDRDashboard.tsx`
   - Simplified - now only renders data (wrapper handles mode)

## Testing Steps

1. **Restart your backend** (if it's running):
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Restart your frontend** (if it's running):
   ```bash
   cd soccentral
   npm run dev
   ```

3. **Navigate to EDR Tool**:
   - Login to SOC Central
   - Click on "EDR" tool card
   - You should now see the new "EDR Data Source" toggle card

4. **Test Live API**:
   - Click "Live Wazuh API" button
   - Wait for loading (button shows "Loading...")
   - Check browser console for:
     - `📡 Live data loaded from Wazuh API`
     - Should show endpoint and threat counts

5. **Verify Dashboard**:
   - After loading, dashboard should display with real Wazuh data
   - All tabs (Overview, Endpoints, Threats, Analytics) should work
   - KPI cards should show actual numbers
   - Charts should render

## Troubleshooting

### "Live Wazuh API" button keeps loading forever

**Check Browser Console**:
- Open DevTools (F12)
- Look for errors in Console tab
- Common errors:
  - Network error → Backend not running or Wazuh not accessible
  - 401/403 → Authentication issue
  - 500 → Server error (check backend logs)

**Check Backend Logs**:
```bash
# Look for error messages
# Should see: "Fetching live Wazuh data..."
# Should NOT see: Connection errors or timeouts
```

**Verify Wazuh Server**:
```bash
# Test if Wazuh API is accessible
curl -k -u SOC_Central:CSUSOCAPI123 https://192.168.3.11:9200/_cat/indices
```

### Toggle doesn't appear

1. **Hard refresh browser**: Ctrl+F5 or Cmd+Shift+R
2. **Clear browser cache**
3. **Check if files were saved**: Look for the new files mentioned above
4. **Restart both backend and frontend**

### Data shows but looks wrong

- Check browser console for data structure
- Verify Wazuh has actual data (alerts and monitoring records)
- Check backend logs for transformation errors

## Expected Console Output

When you click "Live Wazuh API", you should see in browser console:

```
🔄 Switching EDR data source mode to: api
📡 Live data loaded from Wazuh API
✅ Using live Wazuh API data
📊 Active KPIs being used: { totalEndpoints: X, totalThreats: Y, ... }
```

## API Endpoint Details

- **URL**: `GET /api/tools/edr/live-data/`
- **Auth**: Bearer token (automatic)
- **Optional Query Params**:
  - `date_from=2025-01-01` - Filter alerts from date
  - `date_to=2025-01-15` - Filter alerts to date

Example:
```
GET /api/tools/edr/live-data/?date_from=2025-01-01&date_to=2025-01-15
```

## Success Indicators

✅ You see "EDR Data Source" card at top of EDR page
✅ Two buttons: "PDF Upload" and "Live Wazuh API"
✅ Clicking "Live Wazuh API" shows loading state
✅ After loading, toast notification shows success message
✅ Dashboard displays with real data
✅ Status shows: "Currently viewing live data from Wazuh API"
✅ All dashboard features work (tabs, modals, charts)

## Next Steps

Once confirmed working:
- Try the date filtering features
- Upload a PDF file and switch between modes
- Verify all dashboard tabs work in both modes
- Test with real Wazuh data (ensure Wazuh has alerts and agents)

---

**Need Help?**
Check the detailed implementation guide: `EDR_LIVE_API_IMPLEMENTATION.md`
