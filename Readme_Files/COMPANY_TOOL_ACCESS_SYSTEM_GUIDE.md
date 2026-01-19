# Company-Based Tool Access System Guide

## 🎯 Overview

The SOC Central platform implements a robust company-based tool access system where:

1. **Super Admin** controls which tools each company can access
2. **Company Users** can only see and use tools their company has permissions for
3. **Tool Access** is enforced at both API and UI levels

## 🔧 System Architecture

### 1. User Roles
- **Super Admin**: Can see all tools, manage companies and their permissions
- **Admin**: Company-level admin (inherits company tool permissions)
- **User**: Regular user (inherits company tool permissions)

### 2. Company Tool Permissions
Each company has:
- **enabled_tools**: List of tool types the company can access
- **CompanyToolPermission**: Detailed permissions per tool (view, upload, analyze, etc.)

### 3. Available Tools
```python
TOOL_CHOICES = [
    ('gsuite', 'G Suite'),
    ('mdm', 'MDM'),
    ('siem', 'SIEM'),
    ('edr', 'EDR'),
    ('meraki', 'Meraki'),
    ('sonicwall', 'SonicWall'),
]
```

## 🚀 How It Works

### Frontend Flow
1. User logs in to dashboard
2. Frontend calls: `GET /api/auth/tools/accessible/`
3. Backend returns only tools the user's company has access to
4. Frontend displays only accessible tools
5. User cannot access restricted tools

### Backend Logic
```python
def get_available_tools(self):
    """Get list of tools available to this user"""
    if self.role == 'super_admin':
        # Super admins see all tools
        return [choice[0] for choice in Company.TOOL_CHOICES]

    if self.company:
        # Get tools from CompanyToolPermission model
        enabled_permissions = self.company.tool_permissions.filter(is_enabled=True)
        if enabled_permissions.exists():
            return [perm.tool_type for perm in enabled_permissions]
        # Fallback to enabled_tools
        return self.company.enabled_tools

    # Users without company have no tools
    return []
```

## 🛠️ Setup Instructions

### 1. Fix Frontend API URL (COMPLETED ✅)
The issue was a double `/api` in the URL. Fixed by updating `soccentral/.env`:

```env
# BEFORE (WRONG)
VITE_API_URL=http://localhost:8000/api

# AFTER (CORRECT)
VITE_API_URL=http://localhost:8000
```

This ensures the frontend calls:
- `${VITE_API_URL}/api/auth/tools/accessible/`
- Results in: `http://localhost:8000/api/auth/tools/accessible/`
- NOT: `http://localhost:8000/api/api/auth/tools/accessible/`

### 2. Create Company with Specific Tools

```python
# Example: Create company with only EDR and MDM access
company = Company.objects.create(
    name="Example Company",
    display_name="Example Company Ltd",
    description="Company with EDR and MDM access only",
    enabled_tools=['edr', 'mdm'],
    is_active=True
)

# Create detailed permissions
for tool_type in ['edr', 'mdm']:
    CompanyToolPermission.objects.create(
        company=company,
        tool_type=tool_type,
        is_enabled=True,
        can_view=True,
        can_upload=True,
        can_analyze=True,
        can_export=True,
        can_manage=False,
        data_retention_days=365,
        max_upload_size_mb=100,
        max_records_per_upload=100000
    )
```

### 3. Create User with Company Access

```python
user = User.objects.create(
    email="user@company.com",
    first_name="John",
    last_name="Doe",
    company=company,  # Link to company
    role='user',
    is_active=True,
    is_email_verified=True,
    password=make_password('secure_password')
)
```

## 📊 Testing the System

### Test Regular User Access
```bash
# Run the test script
python test_company_tool_access.py
```

Expected results:
- Regular user sees only company-permitted tools
- Super admin sees all tools
- API returns correct tool list based on company permissions

### Manual Testing
1. Create a company with specific tools (e.g., only EDR)
2. Create a user linked to that company
3. Login with that user
4. Verify dashboard shows only EDR tool
5. Verify other tools are not accessible

## 🔐 Security Features

### 1. API Level Protection
- All tool endpoints check user permissions
- Users cannot access tools not permitted by their company
- JWT tokens include user company information

### 2. UI Level Protection
- Frontend only displays accessible tools
- Navigation is filtered based on permissions
- Tool cards are hidden for non-accessible tools

### 3. Data Isolation
- Each company's data is isolated
- Users can only see their company's data
- Cross-company data access is prevented

## 🎛️ Super Admin Management

### Company Management Dashboard
Super admins can:
1. Create new companies
2. Assign tool permissions to companies
3. Enable/disable specific tools for companies
4. Manage company users
5. Transfer users between companies

### API Endpoints for Management
```
GET    /api/auth/companies/                     # List all companies
POST   /api/auth/companies/create/              # Create new company
GET    /api/auth/companies/{id}/tools/          # Get company tool permissions
POST   /api/auth/companies/{id}/tools/update/   # Update tool permissions
GET    /api/auth/companies/{id}/users/          # Get company users
POST   /api/auth/companies/{id}/users/assign/   # Assign user to company
```

## 📋 Example Scenarios

### Scenario 1: EDR-Only Company
```python
# Company setup
company = Company.objects.create(
    name="SecureCorpEDR",
    enabled_tools=['edr']
)

# User login result
{
    "success": true,
    "tools": [
        {"value": "edr", "label": "EDR"}
    ],
    "user_role": "user",
    "company": "SecureCorpEDR"
}
```

### Scenario 2: Multi-Tool Company
```python
# Company setup
company = Company.objects.create(
    name="FullSecurityCorp",
    enabled_tools=['gsuite', 'mdm', 'siem', 'edr']
)

# User login result
{
    "success": true,
    "tools": [
        {"value": "gsuite", "label": "G Suite"},
        {"value": "mdm", "label": "MDM"},
        {"value": "siem", "label": "SIEM"},
        {"value": "edr", "label": "EDR"}
    ],
    "user_role": "user",
    "company": "FullSecurityCorp"
}
```

### Scenario 3: Super Admin
```python
# Super admin login result (sees all tools regardless of company)
{
    "success": true,
    "tools": [
        {"value": "gsuite", "label": "G Suite"},
        {"value": "mdm", "label": "MDM"},
        {"value": "siem", "label": "SIEM"},
        {"value": "edr", "label": "EDR"},
        {"value": "meraki", "label": "Meraki"},
        {"value": "sonicwall", "label": "SonicWall"}
    ],
    "user_role": "super_admin",
    "company": "SOC Central"
}
```

## 🐛 Troubleshooting

### Issue: "You have no access to any tools"
**Cause**: User's company has no enabled tools or user is not linked to a company

**Solution**:
1. Check if user has a company assigned
2. Verify company has enabled_tools
3. Ensure CompanyToolPermission records exist and are enabled

### Issue: Double /api in URL (404 Error)
**Cause**: Frontend environment variable includes `/api` suffix

**Solution**: Update `soccentral/.env`:
```env
VITE_API_URL=http://localhost:8000  # Remove /api suffix
```

### Issue: User sees all tools despite company restrictions
**Cause**: User might be super_admin or company permissions are too broad

**Solution**:
1. Check user role (should be 'user' or 'admin', not 'super_admin')
2. Verify company's enabled_tools list
3. Check CompanyToolPermission records

## 🔄 System Flow Summary

```
1. User Login → JWT Token Generated
2. Frontend Loads → Calls /api/auth/tools/accessible/
3. Backend Checks → User Company → Tool Permissions
4. API Returns → Filtered Tool List
5. Frontend Displays → Only Accessible Tools
6. User Interaction → Restricted to Permitted Tools
```

## ✅ Current Status

- ✅ Backend API working correctly
- ✅ Company-based permissions implemented
- ✅ Frontend URL fixed (no more double /api)
- ✅ Tool filtering working properly
- ✅ Super admin can see all tools
- ✅ Regular users see only company tools
- ✅ Security enforced at API level

The system is now fully functional and ready for production use!