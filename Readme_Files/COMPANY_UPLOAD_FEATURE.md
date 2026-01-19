# Company-Specific Data Upload Feature

## Overview
Added company selection functionality to the file upload feature in the Analytics section, allowing admins to upload data for specific companies.

## Changes Made

### Frontend Changes

1. **Enhanced FileUpload Component** (`soccentral/src/components/FileUpload.tsx`):
   - Added `showCompanySelection` prop to enable company selection UI
   - Added company selection dropdown for admins
   - Added company loading functionality from backend API
   - Added validation to ensure company is selected when required
   - Modified upload functions to include target company parameter

2. **Updated UploadTabContent** (`soccentral/src/pages/ToolsNav/UploadTabContent.tsx`):
   - Added `showCompanySelection={true}` prop to FileUpload component
   - This enables company selection in the Analytics upload section

### Backend Changes

1. **Enhanced Universal Upload** (`backend/tool/views/universal.py`):
   - Added support for `target_company` parameter
   - Added permission checks for company selection:
     - Super Admin: Can upload for any company
     - Regular Admin: Can only upload for their own company
   - Added proper company assignment logic

2. **Company-Specific Upload Endpoint** (`backend/tool/views/admin.py`):
   - Already existed from previous implementation
   - Provides company list and handles company-specific uploads

## How It Works

### For Super Admins:
1. Navigate to Analytics → Select a tool → Upload tab
2. See company selection dropdown with all available companies
3. Select target company from dropdown
4. Upload file - data becomes available to all users of selected company

### For Regular Admins:
1. Navigate to Analytics → Select a tool → Upload tab
2. See their company name displayed (no dropdown, locked to their company)
3. Upload file - data becomes available to all users of their company

### For General Users:
- No company selection shown
- Can only view data uploaded for their company
- Cannot upload files

## UI Features

1. **Company Selection Dropdown**:
   - Shows all available companies for Super Admin
   - Shows locked company name for Regular Admin
   - Includes "Your Company" badge for user's own company
   - Loading state while fetching companies

2. **Validation**:
   - Requires company selection before upload
   - Shows appropriate error messages
   - Validates permissions on both frontend and backend

3. **Visual Indicators**:
   - Company badge in header shows which company's data user is viewing
   - Clear messaging about data availability
   - Permission-based UI elements

## API Endpoints Used

1. **GET `/api/tool/admin/company-upload/`**: Get available companies
2. **POST `/api/tool/admin/company-upload/`**: Upload for specific company
3. **POST `/api/tool/universal/upload/`**: Enhanced to support target_company parameter

## Benefits

1. **Multi-tenant Support**: Each company only sees their own data
2. **Admin Flexibility**: Super admins can manage data for any company
3. **Data Isolation**: Prevents cross-company data access
4. **User Experience**: Seamless integration with existing upload workflow
5. **Permission Control**: Role-based access to company selection

## Usage

The feature is automatically available in the Analytics section for admin users. No additional configuration required - just navigate to Analytics, select a tool, and use the Upload tab with the new company selection feature.