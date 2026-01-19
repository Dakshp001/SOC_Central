# Wazuh API Feature Flag Documentation

## Overview

The Wazuh API integration has been **disabled for production** while keeping the complete implementation intact for future use. This document explains how to control the Wazuh API feature and how to re-enable it when needed.

---

## Current Status

**Status**: ❌ **DISABLED** (Hidden from frontend, API endpoint blocked)

**Reason**: Internal use only - not ready for production deployment

**Implementation**: Feature flag system using environment variables

---

## How It Works

The Wazuh API feature is controlled by two environment variables:

### 1. Backend Feature Flag
- **Location**: `backend/core/settings.py:234`
- **Variable**: `WAZUH_API_ENABLED`
- **Default**: `False` (disabled)
- **Effect**: Controls whether `/api/tool/edr/live-data/` endpoint accepts requests

### 2. Frontend Feature Flag
- **Location**: `soccentral/.env.production:27` and `soccentral/.env:24`
- **Variable**: `VITE_ENABLE_WAZUH_API`
- **Default**: `false` (production), `true` (development)
- **Effect**: Controls whether "Live Wazuh API" button appears in DataSourceToggle component

---

## What Was Changed

### Backend Changes

#### 1. Settings Configuration (`backend/core/settings.py`)
```python
# Line 233-234
# Wazuh API Feature Flag - Set to False for production, True for internal testing
WAZUH_API_ENABLED = config('WAZUH_API_ENABLED', default=False, cast=bool)
```

#### 2. API View Protection (`backend/tool/edr/views.py`)
```python
# Lines 202-215
def get(self, request, *args, **kwargs):
    """Fetch and return live Wazuh data"""
    # Check if Wazuh API is enabled
    from django.conf import settings

    if not getattr(settings, 'WAZUH_API_ENABLED', False):
        logger.warning("Wazuh API access denied - feature is disabled in settings")
        return Response(
            {
                "error": "Wazuh API is currently disabled",
                "message": "This feature is not available in production. Contact your administrator for more information."
            },
            status=status.HTTP_403_FORBIDDEN
        )
```

**Effect**: When disabled, API returns 403 Forbidden with clear error message

### Frontend Changes

#### 1. Production Environment (`soccentral/.env.production`)
```bash
# Line 26-27
# Wazuh API Feature Flag - Set to false for production
VITE_ENABLE_WAZUH_API=false
```

#### 2. Development Environment (`soccentral/.env`)
```bash
# Line 23-24
# Wazuh API Feature Flag - Set to true for internal testing, false for production
VITE_ENABLE_WAZUH_API=true
```

#### 3. DataSourceToggle Component (`soccentral/src/components/dashboards/EDR/components/DataSourceToggle.tsx`)
```typescript
// Line 24-25
// Feature flag for Wazuh API - can be toggled via environment variable
const WAZUH_API_ENABLED = import.meta.env.VITE_ENABLE_WAZUH_API === 'true';

// Lines 185-206
{/* Live API Mode Button - Only show if feature flag is enabled */}
{WAZUH_API_ENABLED && (
  <Button
    variant={currentMode === 'api' ? 'default' : 'outline'}
    className="flex-1 h-auto py-4 flex flex-col gap-2"
    onClick={() => handleLiveDataLoad()}
    disabled={isLoading || isLoadingLive}
  >
    {/* Button content */}
  </Button>
)}
```

**Effect**: When disabled, the "Live Wazuh API" button is completely hidden from the UI

---

## Files Affected

### Modified Files
1. ✅ `backend/core/settings.py` - Added `WAZUH_API_ENABLED` setting
2. ✅ `backend/tool/edr/views.py` - Added feature flag check in `WazuzuhLiveDataView.get()`
3. ✅ `soccentral/.env.production` - Added `VITE_ENABLE_WAZUH_API=false`
4. ✅ `soccentral/.env` - Added `VITE_ENABLE_WAZUH_API=true`
5. ✅ `soccentral/src/components/dashboards/EDR/components/DataSourceToggle.tsx` - Conditional rendering based on feature flag

### Unchanged Files (Implementation Preserved)
- ✅ `backend/tool/edr/wazuh_api_service.py` - Complete Wazuh service implementation
- ✅ `backend/tool/urls.py` - Wazuh endpoint registration
- ✅ `backend/test_wazuh_api.py` - Connection test script
- ✅ `soccentral/src/components/dashboards/EDRDashboard.tsx` - Main dashboard
- ✅ `soccentral/src/components/dashboards/EDRDashboardWrapper.tsx` - Data management
- ✅ `soccentral/src/components/dashboards/EDR/components/DataSummaryFooter.tsx` - Source indicator
- ✅ All EDR-related documentation files

---

## How to Re-Enable Wazuh API in the Future

### For Development/Testing

#### Option 1: Local Development (Already Enabled)
The feature is already enabled in local development by default. Just run the app:

```bash
# Backend
cd backend
python manage.py runserver

# Frontend
cd soccentral
npm run dev
```

#### Option 2: Manual Override for Testing
If you want to test in a production-like environment:

**Backend**:
```bash
# Add to backend/.env or set environment variable
export WAZUH_API_ENABLED=True
```

**Frontend**:
```bash
# Edit soccentral/.env.production
VITE_ENABLE_WAZUH_API=true
```

### For Production Deployment

When ready to deploy Wazuh API to production:

#### Step 1: Backend Configuration

**Option A: Using Environment Variables (Recommended)**
```bash
# In your production server or hosting platform (e.g., Render, AWS, etc.)
# Set environment variable:
WAZUH_API_ENABLED=True
```

**Option B: Direct Settings Change**
Edit `backend/core/settings.py`:
```python
# Change line 234 from:
WAZUH_API_ENABLED = config('WAZUH_API_ENABLED', default=False, cast=bool)

# To:
WAZUH_API_ENABLED = config('WAZUH_API_ENABLED', default=True, cast=bool)
```

#### Step 2: Frontend Configuration

Edit `soccentral/.env.production`:
```bash
# Change line 27 from:
VITE_ENABLE_WAZUH_API=false

# To:
VITE_ENABLE_WAZUH_API=true
```

#### Step 3: Rebuild and Deploy

**Backend**:
```bash
# Restart Django server to load new settings
python manage.py runserver  # or your production command
```

**Frontend**:
```bash
# Rebuild with new environment variables
npm run build

# Deploy the new build
# (deployment command depends on your hosting platform)
```

#### Step 4: Verify Functionality

1. **Check Frontend**: Login and navigate to EDR dashboard (`/edr`)
   - You should see two buttons: "PDF Upload" and "Live Wazuh API"

2. **Test API Connection**: Click "Live Wazuh API" button
   - Should fetch data from Wazuh server at `192.168.3.11:9200`
   - Should display endpoints, threats, and auto-refresh every 2 minutes

3. **Check Backend Logs**:
   ```bash
   tail -f backend/logs/django.log
   # Should see: "Fetching live Wazuh data"
   # Should NOT see: "Wazuh API access denied"
   ```

---

## Quick Reference: Feature State Matrix

| Environment | Backend Flag | Frontend Flag | Wazuh Button | API Endpoint |
|-------------|--------------|---------------|--------------|--------------|
| **Production** | `False` | `false` | ❌ Hidden | ❌ Blocked (403) |
| **Development** | `True` | `true` | ✅ Visible | ✅ Accessible |
| **Testing** | `True` | `false` | ❌ Hidden | ✅ Accessible |
| **Re-enabled** | `True` | `true` | ✅ Visible | ✅ Accessible |

---

## Environment Variable Summary

### Backend Environment Variables

Create/edit `backend/.env`:
```bash
# Wazuh API Feature Flag
WAZUH_API_ENABLED=False  # Set to True to enable
```

Or set directly in your hosting platform's environment settings.

### Frontend Environment Variables

**For Production** (`soccentral/.env.production`):
```bash
VITE_ENABLE_WAZUH_API=false  # Set to true to enable
```

**For Development** (`soccentral/.env`):
```bash
VITE_ENABLE_WAZUH_API=true  # Already enabled for local testing
```

---

## Testing the Feature Flag

### Test 1: Verify Feature is Disabled (Current State)

**Frontend Test**:
```bash
cd soccentral
npm run build
npm run preview
# Navigate to /edr
# Expected: Only "PDF Upload" button visible
```

**Backend Test**:
```bash
curl -X GET http://localhost:8000/api/tool/edr/live-data/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# {
#   "error": "Wazuh API is currently disabled",
#   "message": "This feature is not available in production..."
# }
# Status: 403 Forbidden
```

### Test 2: Verify Feature Can Be Enabled

**Set Environment Variables**:
```bash
# Backend
export WAZUH_API_ENABLED=True

# Frontend
# Edit .env.production: VITE_ENABLE_WAZUH_API=true
cd soccentral
npm run build
```

**Frontend Test**:
```bash
npm run preview
# Navigate to /edr
# Expected: Both "PDF Upload" and "Live Wazuh API" buttons visible
```

**Backend Test**:
```bash
curl -X GET http://localhost:8000/api/tool/edr/live-data/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response: Full EDR data with endpoints, threats, KPIs
# Status: 200 OK
```

---

## Troubleshooting

### Issue: "Live Wazuh API" button still appears in production

**Solution**:
1. Check `soccentral/.env.production` has `VITE_ENABLE_WAZUH_API=false`
2. Rebuild frontend: `npm run build`
3. Clear browser cache
4. Verify build output includes the correct env variable

### Issue: API returns 403 even when enabled

**Solution**:
1. Check backend environment: `echo $WAZUH_API_ENABLED`
2. Verify `backend/.env` or hosting platform environment variables
3. Restart Django server to reload settings
4. Check logs: `tail -f backend/logs/django.log`

### Issue: Cannot connect to Wazuh server

**Solution**:
1. Ensure Wazuh server is accessible: `curl -k https://192.168.3.11:9200`
2. Check network/firewall rules
3. Verify credentials in `backend/tool/edr/wazuh_api_service.py:97-98`
4. Run connection test: `python backend/test_wazuh_api.py`

---

## Implementation Checklist

When re-enabling Wazuh API for production:

### Pre-Deployment
- [ ] Verify Wazuh server is accessible from production environment
- [ ] Test credentials and connection using `test_wazuh_api.py`
- [ ] Review and update Wazuh server URL if needed (currently `192.168.3.11:9200`)
- [ ] Ensure network security/firewall rules allow connection
- [ ] Test in staging environment first

### Backend Deployment
- [ ] Set `WAZUH_API_ENABLED=True` in production environment
- [ ] Restart backend server
- [ ] Verify endpoint responds correctly: `GET /api/tool/edr/live-data/`
- [ ] Check logs for successful connections
- [ ] Monitor for errors

### Frontend Deployment
- [ ] Set `VITE_ENABLE_WAZUH_API=true` in `.env.production`
- [ ] Rebuild frontend: `npm run build`
- [ ] Deploy new build
- [ ] Clear CDN/cache if applicable
- [ ] Test in browser

### Post-Deployment Verification
- [ ] Login and navigate to EDR dashboard
- [ ] Confirm "Live Wazuh API" button is visible
- [ ] Click button and verify data loads
- [ ] Confirm auto-refresh works (2-minute interval)
- [ ] Check data quality (endpoints, threats, KPIs)
- [ ] Monitor backend logs for errors
- [ ] Test with multiple users

### Rollback Plan (If Issues Occur)
- [ ] Set `VITE_ENABLE_WAZUH_API=false` in frontend
- [ ] Set `WAZUH_API_ENABLED=False` in backend
- [ ] Rebuild and redeploy
- [ ] Verify feature is hidden again

---

## Security Considerations

### Current State (Disabled)
- ✅ Wazuh API completely inaccessible from production
- ✅ No UI elements exposing the feature
- ✅ API endpoint returns 403 Forbidden
- ✅ Internal implementation preserved for future use

### When Re-Enabling
- ⚠️ Ensure Wazuh server is properly secured
- ⚠️ Review and rotate credentials if needed
- ⚠️ Implement rate limiting for API endpoint
- ⚠️ Monitor for unusual access patterns
- ⚠️ Consider adding company-level permissions
- ⚠️ Update authentication/authorization if needed

---

## Additional Resources

### Related Files
- Implementation Guide: `EDR_LIVE_API_IMPLEMENTATION.md`
- Quick Start: `QUICK_START_EDR_LIVE_API.md`
- Dashboard Enhancements: `WAZUH_DASHBOARD_ENHANCEMENTS.md`
- API Documentation: `backend/Wazuh-Api-Documentation.pdf`

### Wazuh API Service Details
- **File**: `backend/tool/edr/wazuh_api_service.py`
- **Server**: `https://192.168.3.11:9200`
- **Indices**: `wazuh-alerts-*`, `wazuh-monitoring-*`
- **Authentication**: Basic Auth (Username: `SOC_Central`)
- **Features**: Connection pooling, pagination, MITRE mapping

### Frontend Components
- **Toggle**: `soccentral/src/components/dashboards/EDR/components/DataSourceToggle.tsx`
- **Dashboard**: `soccentral/src/components/dashboards/EDRDashboard.tsx`
- **Footer**: `soccentral/src/components/dashboards/EDR/components/DataSummaryFooter.tsx`

---

## Contact

For questions or issues with re-enabling the Wazuh API feature:
1. Review this documentation
2. Check implementation files listed above
3. Test in development environment first
4. Contact system administrator for production deployment

---

**Last Updated**: 2025-11-03

**Status**: Feature successfully hidden via feature flags, ready for future activation
