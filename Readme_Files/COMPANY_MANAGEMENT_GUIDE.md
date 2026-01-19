# Company Management Feature - User Guide

## 🎉 Company Management with Tool Permissions

This feature allows Super Admins to create and manage companies with specific tool permissions, ensuring users only see the tools their company has access to.

## 🔑 Key Features

### ✅ **Company Creation & Management**
- Create companies with detailed information (name, contact details, description)
- Select which tools each company can access (G Suite, MDM, SIEM, EDR, Meraki, SonicWall)
- Activate/deactivate companies
- View company statistics (user count, admin count)

### ✅ **Granular Tool Permissions**
- **Basic Permissions** per tool:
  - **View**: Can see tool data and dashboards
  - **Upload**: Can upload data files
  - **Analyze**: Can run analysis and reports
  - **Export**: Can export data
  - **Manage**: Can configure tool settings (admin level)

- **Data Management Limits**:
  - **Data Retention**: Set how long data is kept (days, 0 = unlimited)
  - **Upload Size Limit**: Maximum file size per upload (MB)
  - **Record Limit**: Maximum records per upload

### ✅ **User Access Control**
- Users inherit tool access from their company
- Super Admins can access all tools regardless of company restrictions
- Tool dashboards only show tools the user's company has access to

## 🚀 How to Use

### **Step 1: Access Company Management**
1. Log in as a **Super Admin**
2. Navigate to **User Management** page
3. Click on the **"Company Management"** tab

### **Step 2: Create a New Company**
1. Click the **"Create Company"** button
2. Fill in company information:
   - **Company Name*** (required)
   - **Display Name** (optional, defaults to company name)
   - **Email Domain** (e.g., "company.com")
   - **Primary Contact Email**
   - **Phone Number**
   - **Description**
   - **Address**

3. **Select Tool Access**:
   - Check the tools this company should have access to
   - Each selected tool will be enabled with default permissions

4. Click **"Create Company"**

### **Step 3: Manage Tool Permissions**
1. Find the company in the list
2. Click **"Permissions"** button
3. For each tool, configure:
   - **Enable/Disable** the tool entirely
   - Set **Basic Permissions** (View, Upload, Analyze, Export, Manage)
   - Configure **Data Limits** (retention days, upload size, record limits)
4. Changes are saved automatically

### **Step 4: Assign Users to Companies**
1. Go to **User Management** tab
2. Create new users or edit existing users
3. Set the user's **Company** field to link them to a company
4. Users will automatically inherit tool access from their company

## 📋 API Endpoints

All endpoints require Super Admin authentication:

### **Company Management**
```
GET /api/auth/companies/                           - List all companies
POST /api/auth/companies/create/                   - Create new company
GET /api/auth/companies/{id}/                      - Get company details
PUT /api/auth/companies/{id}/update/               - Update company
POST /api/auth/companies/{id}/toggle-status/       - Activate/deactivate company
```

### **Tool Permissions**
```
GET /api/auth/companies/{id}/tools/                - Get company tool permissions
POST /api/auth/companies/{id}/tools/update/        - Update tool permissions
DELETE /api/auth/companies/{id}/tools/{tool}/remove/ - Remove tool access
```

### **User-Company Management**
```
GET /api/auth/companies/{id}/users/                - Get company users
POST /api/auth/companies/{id}/users/assign/        - Assign user to company
```

### **Utility Endpoints**
```
GET /api/auth/tools/available/                     - Get all available tools
GET /api/auth/tools/accessible/                    - Get user's accessible tools
```

## 💡 Example Use Cases

### **1. Enterprise Client Setup**
```
Company: "Acme Corporation"
Tools: G Suite, MDM, SIEM
Users: 50 employees, 3 admins
Permissions: Full access to all features, 2-year data retention
```

### **2. Small Business Setup**
```
Company: "Local Business Inc"
Tools: G Suite, MDM
Users: 10 employees, 1 admin
Permissions: View and upload only, 1-year data retention, smaller upload limits
```

### **3. Trial/Demo Setup**
```
Company: "Demo Company"
Tools: G Suite (limited)
Users: 3 trial users
Permissions: View only, 30-day data retention, restricted uploads
```

## 🔒 Security & Access Control

### **Permission Hierarchy**
1. **Super Admin**: Can access all tools and manage all companies
2. **Company Admin**: Can manage users within their company
3. **General User**: Can access tools based on company permissions

### **Data Isolation**
- Users only see tools their company has access to
- Each company's data is isolated and managed independently
- Tool dashboards dynamically show/hide based on permissions

### **Audit Trail**
- All company and permission changes are logged
- User actions are tracked per company
- Created/updated timestamps on all records

## 🛡️ Best Practices

### **Company Setup**
- Use descriptive company names and display names
- Set realistic data retention policies based on client needs
- Configure upload limits based on expected usage
- Regularly review and update permissions

### **User Management**
- Always assign users to appropriate companies
- Use company email domains for automatic user assignment
- Regular audit of user-company assignments

### **Security**
- Only grant Super Admin access to trusted personnel
- Regularly review company permissions and access
- Monitor tool usage and data access patterns

## 🔧 Technical Details

### **Database Schema**
- **companies**: Main company information
- **company_tool_permissions**: Detailed tool permissions per company
- **auth_users**: User model with company foreign key

### **Frontend Components**
- **CompanyManagement.tsx**: Main company management interface
- **CompanyToolPermissions.tsx**: Detailed permission management
- Integrated into UserManagement tabs

### **Backend Implementation**
- **Django models**: Company, CompanyToolPermission
- **API views**: Full CRUD operations for companies and permissions
- **Permission decorators**: Tool access checking middleware

## 🎯 Next Steps

After setting up companies and permissions:

1. **Test tool access** with different user roles
2. **Monitor usage** and adjust limits as needed
3. **Train company admins** on user management
4. **Review and update** permissions periodically

## 📞 Support

For technical support or feature requests:
- Check the API documentation for endpoint details
- Review the codebase for implementation specifics
- Test with different user roles to verify permissions

---

**The Company Management feature is now fully implemented and ready for production use!** 🚀