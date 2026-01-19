# 🚀 SOC Central v3.0 - Complete Beginner's IIS Deployment Guide

<div align="center">
  <img src="soccentral/public/logo.png" alt="SOC Central Logo" width="150"/>
  
  **Step-by-Step IIS Deployment Guide for Complete Beginners**
  
  [![Windows Server](https://img.shields.io/badge/Windows%20Server-2019%2B-blue.svg)]()
  [![IIS](https://img.shields.io/badge/IIS-10.0%2B-green.svg)]()
  [![Python](https://img.shields.io/badge/Python-3.10%2B-yellow.svg)]()
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)]()
</div>

---

## 📖 Table of Contents

- [🏁 Before We Start](#-before-we-start)
- [🛠️ Step 1: System Prerequisites](#️-step-1-system-prerequisites)
- [🔧 Step 2: Installing Required Software](#-step-2-installing-required-software)
- [🗄️ Step 3: Database Setup](#️-step-3-database-setup)
- [📥 Step 4: Download and Setup Project](#-step-4-download-and-setup-project)
- [🐍 Step 5: Backend Configuration](#-step-5-backend-configuration)
- [🎨 Step 6: Frontend Setup](#-step-6-frontend-setup)
- [🌐 Step 7: IIS Configuration](#-step-7-iis-configuration)
- [🔒 Step 8: Security & Permissions](#-step-8-security--permissions)
- [✅ Step 9: Testing Everything](#-step-9-testing-everything)
- [🚨 Common Issues & Solutions](#-common-issues--solutions)
- [📞 Support & Next Steps](#-support--next-steps)

---

## 🏁 Before We Start

### What You'll Achieve
By the end of this guide, you'll have a fully functional SOC Central application running on your Windows server with IIS, including:

- ✅ Django REST API backend serving security analytics
- ✅ React frontend with modern dashboard interface
- ✅ PostgreSQL database for data storage
- ✅ JWT authentication system
- ✅ File upload functionality for security data
- ✅ Email notifications system
- ✅ Admin panel for user management

### Time Required
- **Estimated Time**: 2-3 hours
- **Difficulty**: Beginner (step-by-step instructions provided)
- **Prerequisites**: Basic Windows server administration knowledge

### What Is SOC Central?
SOC Central is a Security Operations Center management platform that helps organizations analyze security data from multiple sources (G Suite, MDM, SIEM, EDR, Meraki, SonicWall) with advanced MITRE ATT&CK framework integration.

---

## 🛠️ Step 1: System Prerequisites

### 1.1 Check Your Windows Version

1. **Press `Windows Key + R`**
2. **Type `winver`** and press Enter
3. **Verify you have**:
   - Windows Server 2019 or later
   - OR Windows 10/11 Pro with IIS capability

### 1.2 Check System Resources

**Minimum Requirements:**
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB free space (50GB recommended)
- **CPU**: 2 cores (4 cores recommended)
- **Network**: Stable internet connection

**To check your system:**
1. **Press `Ctrl + Shift + Esc`** (Task Manager)
2. **Click "Performance" tab**
3. **Verify you have adequate RAM and CPU**

---

## 🔧 Step 2: Installing Required Software

### 2.1 Enable IIS with Required Features

1. **Open "Turn Windows features on or off"**:
   - Press `Windows Key + R`
   - Type `optionalfeatures.exe`
   - Press Enter

2. **Enable these IIS features** (check the boxes):
   ```
   ☑️ Internet Information Services
     ☑️ Web Management Tools
       ☑️ IIS Management Console
     ☑️ World Wide Web Services
       ☑️ Common HTTP Features
         ☑️ Default Document
         ☑️ Directory Browsing
         ☑️ HTTP Errors
         ☑️ HTTP Redirection
         ☑️ Static Content
       ☑️ Health and Diagnostics
         ☑️ HTTP Logging
       ☑️ Performance Features
         ☑️ Static Content Compression
       ☑️ Security
         ☑️ Request Filtering
       ☑️ Application Development
         ☑️ CGI
         ☑️ ISAPI Extensions
         ☑️ ISAPI Filters
   ```

3. **Click OK** and wait for installation to complete
4. **Test IIS**: Open browser, go to `http://localhost` - you should see IIS welcome page

### 2.2 Install Python 3.10+

1. **Download Python**:
   - Go to https://www.python.org/downloads/
   - Download Python 3.10 or newer
   - **IMPORTANT**: During installation, check "Add Python to PATH"

2. **Verify Installation**:
   - Open Command Prompt (Press `Windows Key + R`, type `cmd`)
   - Type: `python --version`
   - Should show Python 3.10.x or newer

### 2.3 Install Node.js 18+

1. **Download Node.js**:
   - Go to https://nodejs.org/
   - Download the LTS version (18.x or newer)
   - Run the installer with default settings

2. **Verify Installation**:
   - Open new Command Prompt
   - Type: `node --version`
   - Type: `npm --version`
   - Both should show version numbers

### 2.4 Install Git

1. **Download Git**:
   - Go to https://git-scm.com/download/win
   - Download and install with default settings

2. **Verify Installation**:
   - Open new Command Prompt
   - Type: `git --version`
   - Should show Git version

### 2.5 Install PostgreSQL 14+

1. **Download PostgreSQL**:
   - Go to https://www.postgresql.org/download/windows/
   - Download version 14 or newer
   - **IMPORTANT**: Remember the password you set for 'postgres' user!

2. **During Installation**:
   - Keep default port (5432)
   - Remember the postgres user password
   - Install pgAdmin 4 (recommended)

3. **Verify Installation**:
   - Open pgAdmin 4
   - Connect using postgres user and your password

---

## 🗄️ Step 3: Database Setup

### 3.1 Create Database and User

1. **Open pgAdmin 4**
2. **Connect to PostgreSQL** (use postgres user and your password)
3. **Right-click "Databases"** → **"Create"** → **"Database"**

4. **Create Database**:
   - **Name**: `soccentral_db`
   - **Owner**: postgres
   - Click **"Save"**

5. **Create User**:
   - Right-click **"Login/Group Roles"** → **"Create"** → **"Login/Group Role"**
   - **General Tab**:
     - **Name**: `soc_central_user`
   - **Definition Tab**:
     - **Password**: `CSUsoc--0011**`
     - **Password expiration**: Never
   - **Privileges Tab**:
     - **Can login?**: Yes
     - **Superuser?**: No
     - **Create roles?**: No
     - **Create databases?**: Yes
   - Click **"Save"**

6. **Grant Database Permissions**:
   - Right-click on `soccentral_db` → **"Properties"**
   - Go to **"Security"** tab
   - Click **"+"** (Add)
   - **Grantee**: `soc_central_user`
   - **Privileges**: Check ALL boxes
   - Click **"Save"**

### 3.2 Test Database Connection

1. **Open Command Prompt**
2. **Navigate to PostgreSQL bin directory**:
   ```cmd
   cd "C:\Program Files\PostgreSQL\14\bin"
   ```
3. **Test connection**:
   ```cmd
   psql -U soc_central_user -d soccentral_db -h localhost
   ```
4. **Enter password**: `CSUsoc--0011**`
5. **You should see**: `soccentral_db=>`
6. **Type `\q` to exit**

---

## 📥 Step 4: Download and Setup Project

### 4.1 Create Project Directory

1. **Open Command Prompt as Administrator**:
   - Press `Windows Key + X`
   - Click "Command Prompt (Admin)"

2. **Navigate to IIS directory**:
   ```cmd
   cd C:\inetpub\wwwroot
   ```

3. **Clone the repository**:
   ```cmd
   git clone https://github.com/your-username/SOCCENTRAL.git
   cd SOCCENTRAL
   ```

### 4.2 Verify Project Structure

You should see these folders:
```
SOCCENTRAL/
├── backend/          (Django API)
├── soccentral/      (React Frontend)
├── README_V3.md
├── README_DEPLOY.md
└── other files...
```

---

## 🐍 Step 5: Backend Configuration

### 5.1 Setup Python Virtual Environment

1. **Navigate to backend folder**:
   ```cmd
   cd C:\inetpub\wwwroot\SOCCENTRAL\backend
   ```

2. **Create virtual environment**:
   ```cmd
   python -m venv venv
   ```

3. **Activate virtual environment**:
   ```cmd
   venv\Scripts\activate
   ```
   *You should see `(venv)` at the beginning of your command prompt*

4. **Upgrade pip**:
   ```cmd
   python -m pip install --upgrade pip
   ```

### 5.2 Install Python Dependencies

1. **Install all required packages**:
   ```cmd
   pip install -r requirements.txt
   ```

2. **Install IIS-specific packages**:
   ```cmd
   pip install wfastcgi
   pip install psycopg2-binary
   ```

3. **Verify installation**:
   ```cmd
   pip list
   ```
   *You should see Django, djangorestframework, psycopg2-binary, wfastcgi, and many others*

### 5.3 Configure Environment Variables

1. **Create production environment file**:
   - **Copy the existing .env.production**:
     ```cmd
     copy .env.production .env.production.backup
     ```

2. **Edit .env.production** (you can use Notepad):
   ```cmd
   notepad .env.production
   ```

3. **Update these critical values** (replace with your actual values):
   ```env
   # CRITICAL: Update these with your server details
   SECRET_KEY=your-super-secure-secret-key-here-make-it-very-long-and-random
   DEBUG=False
   
   # Database Configuration
   DB_NAME=soccentral_db
   DB_USER=soc_central_user
   DB_PASSWORD=CSUsoc--0011**
   DB_HOST=localhost
   DB_PORT=5432
   DATABASE_URL=postgresql://soc_central_user:CSUsoc--0011**@localhost:5432/soccentral_db
   
   # Email Configuration (Gmail example)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=your-app-password
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   
   # Super Admin Account
   SUPER_ADMIN_EMAIL=admin@yourcompany.com
   SUPER_ADMIN_PASSWORD=YourSecureAdminPassword123!
   
   # Domain Settings (replace with your actual domain or IP)
   ALLOWED_HOSTS=localhost,127.0.0.1,your-server-ip,your-domain.com
   FRONTEND_URL=http://your-server-ip
   API_BASE_URL=http://your-server-ip:8000
   ```

4. **Save the file** (Ctrl+S in Notepad)

### 5.4 Setup Database

1. **Make sure you're in backend directory with venv activated**:
   ```cmd
   cd C:\inetpub\wwwroot\SOCCENTRAL\backend
   venv\Scripts\activate
   ```

2. **Run database migrations**:
   ```cmd
   python manage.py makemigrations
   python manage.py migrate
   ```

3. **Create cache table**:
   ```cmd
   python manage.py createcachetable
   ```

4. **Create super admin user**:
   ```cmd
   python manage.py shell
   ```
   
   In the Python shell, type:
   ```python
   from django.contrib.auth import get_user_model
   from decouple import config
   User = get_user_model()
   if not User.objects.filter(email=config('SUPER_ADMIN_EMAIL')).exists():
       User.objects.create_user(
           email=config('SUPER_ADMIN_EMAIL'),
           password=config('SUPER_ADMIN_PASSWORD'),
           is_staff=True,
           is_superuser=True,
           role='super_admin',
           is_email_verified=True
       )
       print('Super admin created successfully')
   else:
       print('Super admin already exists')
   exit()
   ```

5. **Collect static files**:
   ```cmd
   python manage.py collectstatic --noinput
   ```

6. **Test Django server**:
   ```cmd
   python manage.py runserver 127.0.0.1:8000
   ```
   
   Open browser to `http://127.0.0.1:8000/admin`
   - You should see Django admin login
   - Try logging in with your super admin credentials
   - **Press Ctrl+C to stop the server**

### 5.5 Configure FastCGI for IIS

1. **Open Command Prompt as Administrator**
2. **Configure FastCGI**:
   ```cmd
   C:\Windows\system32\inetsrv\appcmd.exe set config -section:system.webServer/fastCgi -+[fullPath='C:\inetpub\wwwroot\SOCCENTRAL\backend\venv\Scripts\python.exe',arguments='C:\inetpub\wwwroot\SOCCENTRAL\backend\venv\Lib\site-packages\wfastcgi.py']
   ```

3. **Create web.config for Django** (create new file):
   ```cmd
   cd C:\inetpub\wwwroot\SOCCENTRAL\backend
   notepad web.config
   ```

   **Copy and paste this content**:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <configuration>
     <system.web>
       <compilation targetFramework="4.0" />
     </system.web>

     <system.webServer>
       <handlers>
         <add name="Python FastCGI" path="*" verb="*" modules="FastCgiModule" scriptProcessor="C:\inetpub\wwwroot\SOCCENTRAL\backend\venv\Scripts\python.exe|C:\inetpub\wwwroot\SOCCENTRAL\backend\venv\Lib\site-packages\wfastcgi.py" resourceType="Unspecified" requireAccess="Script" />
       </handlers>

       <httpErrors errorMode="Detailed" />
       
       <staticContent>
         <remove fileExtension=".woff" />
         <mimeMap fileExtension=".woff" mimeType="font/woff" />
         <remove fileExtension=".woff2" />
         <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
       </staticContent>

       <security>
         <requestFiltering>
           <requestLimits maxAllowedContentLength="52428800" />
         </requestFiltering>
       </security>

       <defaultDocument>
         <files>
           <clear />
           <add value="manage.py" />
         </files>
       </defaultDocument>
     </system.webServer>

     <appSettings>
       <add key="WSGI_HANDLER" value="core.wsgi.application" />
       <add key="PYTHONPATH" value="C:\inetpub\wwwroot\SOCCENTRAL\backend" />
       <add key="DJANGO_SETTINGS_MODULE" value="core.settings" />
     </appSettings>
   </configuration>
   ```

4. **Save the file**

---

## 🎨 Step 6: Frontend Setup

### 6.1 Build React Application

1. **Navigate to frontend directory**:
   ```cmd
   cd C:\inetpub\wwwroot\SOCCENTRAL\soccentral
   ```

2. **Install Node.js dependencies**:
   ```cmd
   npm install
   ```
   *This might take 5-10 minutes*

3. **Create production environment file**:
   ```cmd
   copy .env.production .env.production.backup
   notepad .env.production
   ```

4. **Update environment variables** (replace with your server IP/domain):
   ```env
   # API Configuration - CRITICAL: Update with your server details
   VITE_API_URL=http://your-server-ip:8000
   VITE_APP_ENV=production
   
   # Performance Settings
   VITE_ENABLE_ANALYTICS=false
   VITE_ENABLE_ERROR_REPORTING=false
   VITE_ENABLE_PERFORMANCE_MONITORING=false
   
   # Security Settings
   VITE_ENABLE_CSP=false
   VITE_SECURE_COOKIES=false
   VITE_HTTPS_ONLY=false
   
   # Feature Flags
   VITE_ENABLE_SERVICE_WORKER=true
   VITE_ENABLE_PWA=true
   VITE_ENABLE_OFFLINE_MODE=false
   
   # Cache Settings
   VITE_CACHE_VERSION=2024-09-v1
   VITE_STATIC_CACHE_TTL=31536000
   VITE_API_CACHE_TTL=300
   ```

5. **Build the application for production**:
   ```cmd
   npm run build
   ```
   *This will create a 'dist' folder with all frontend files*

6. **Verify build completed**:
   ```cmd
   dir dist
   ```
   *You should see index.html and assets folder*

### 6.2 Create web.config for React SPA

1. **Create web.config in dist folder**:
   ```cmd
   notepad dist\web.config
   ```

2. **Copy and paste this content**:
   ```xml
   <?xml version="1.0"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="React Routes" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
               <add input="{REQUEST_URI}" pattern="^/(api|admin|static|media)" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>

       <staticContent>
         <remove fileExtension=".js" />
         <mimeMap fileExtension=".js" mimeType="application/javascript" />
         <remove fileExtension=".css" />
         <mimeMap fileExtension=".css" mimeType="text/css" />
         <remove fileExtension=".json" />
         <mimeMap fileExtension=".json" mimeType="application/json" />
         <remove fileExtension=".woff" />
         <mimeMap fileExtension=".woff" mimeType="font/woff" />
         <remove fileExtension=".woff2" />
         <mimeMap fileExtension=".woff2" mimeType="font/woff2" />
         <remove fileExtension=".svg" />
         <mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
       </staticContent>

       <httpProtocol>
         <customHeaders>
           <add name="X-Content-Type-Options" value="nosniff" />
           <add name="X-Frame-Options" value="DENY" />
           <add name="X-XSS-Protection" value="1; mode=block" />
           <add name="Access-Control-Allow-Origin" value="*" />
           <add name="Access-Control-Allow-Methods" value="GET,POST,PUT,DELETE,OPTIONS" />
           <add name="Access-Control-Allow-Headers" value="Content-Type,Authorization" />
         </customHeaders>
       </httpProtocol>

       <defaultDocument>
         <files>
           <clear />
           <add value="index.html" />
         </files>
       </defaultDocument>

       <httpErrors errorMode="Custom">
         <remove statusCode="404" subStatusCode="-1" />
         <error statusCode="404" prefixLanguageFilePath="" path="/index.html" responseMode="ExecuteURL" />
       </httpErrors>
     </system.webServer>
   </configuration>
   ```

3. **Save the file**

---

## 🌐 Step 7: IIS Configuration

### 7.1 Open IIS Manager

1. **Press `Windows Key + R`**
2. **Type `inetmgr`** and press Enter
3. **IIS Manager should open**

### 7.2 Create Application Pool for Backend API

1. **In IIS Manager, right-click "Application Pools"**
2. **Click "Add Application Pool"**
3. **Settings**:
   - **Name**: `SOCCentralAPI`
   - **.NET CLR Version**: No Managed Code
   - **Managed Pipeline Mode**: Integrated
4. **Click OK**

5. **Configure Application Pool**:
   - **Right-click "SOCCentralAPI"** → **Advanced Settings**
   - **Identity**: ApplicationPoolIdentity
   - **Enable 32-bit Applications**: False
   - **Click OK**

### 7.3 Create Website for Backend API

1. **Right-click "Sites"** → **Add Website**
2. **Settings**:
   - **Site name**: `SOCCentralAPI`
   - **Application pool**: `SOCCentralAPI`
   - **Physical path**: `C:\inetpub\wwwroot\SOCCENTRAL\backend`
   - **Port**: `8000`
3. **Click OK**

### 7.4 Create Application Pool for Frontend

1. **Right-click "Application Pools"** → **Add Application Pool**
2. **Settings**:
   - **Name**: `SOCCentralFrontend`
   - **.NET CLR Version**: No Managed Code
   - **Managed Pipeline Mode**: Integrated
3. **Click OK**

### 7.5 Create Website for Frontend

1. **Right-click "Sites"** → **Add Website**
2. **Settings**:
   - **Site name**: `SOCCentralFrontend`
   - **Application pool**: `SOCCentralFrontend`
   - **Physical path**: `C:\inetpub\wwwroot\SOCCENTRAL\soccentral\dist`
   - **Port**: `80`
3. **Click OK**

### 7.6 Install URL Rewrite Module (Required for React)

1. **Download URL Rewrite Module**:
   - Go to https://www.iis.net/downloads/microsoft/url-rewrite
   - Download and install "URL Rewrite Module 2.1"

2. **Restart IIS Manager after installation**

---

## 🔒 Step 8: Security & Permissions

### 8.1 Set File Permissions

1. **Open Command Prompt as Administrator**
2. **Set permissions for main project**:
   ```cmd
   icacls "C:\inetpub\wwwroot\SOCCENTRAL" /grant "IIS_IUSRS:(OI)(CI)R" /T
   ```

3. **Set permissions for logs directory**:
   ```cmd
   icacls "C:\inetpub\wwwroot\SOCCENTRAL\backend\logs" /grant "IIS_IUSRS:(OI)(CI)F" /T
   ```

4. **Set permissions for media uploads**:
   ```cmd
   icacls "C:\inetpub\wwwroot\SOCCENTRAL\backend\media" /grant "IIS_IUSRS:(OI)(CI)F" /T
   ```

5. **Set permissions for static files**:
   ```cmd
   icacls "C:\inetpub\wwwroot\SOCCENTRAL\backend\staticfiles" /grant "IIS_IUSRS:(OI)(CI)F" /T
   ```

### 8.2 Configure Windows Firewall

1. **Open Windows Firewall**:
   - Press `Windows Key + R`
   - Type `wf.msc`
   - Press Enter

2. **Create Inbound Rules**:
   - **Right-click "Inbound Rules"** → **New Rule**
   - **Rule Type**: Port
   - **Protocol**: TCP
   - **Specific Local Ports**: `80` (for frontend)
   - **Action**: Allow the connection
   - **Profile**: Check all
   - **Name**: `SOC Central Frontend`

3. **Repeat for API (port 8000)**:
   - **Port**: `8000`
   - **Name**: `SOC Central API`

---

## ✅ Step 9: Testing Everything

### 9.1 Test Backend API

1. **Open web browser**
2. **Go to**: `http://localhost:8000/admin`
3. **You should see Django admin login page**
4. **Login with your super admin credentials**
5. **You should see Django admin dashboard**

6. **Test API endpoint**:
   - **Go to**: `http://localhost:8000/api/auth/health/`
   - **You should see**: `{"status": "healthy", "timestamp": "..."}`

### 9.2 Test Frontend

1. **Open new browser tab**
2. **Go to**: `http://localhost`
3. **You should see SOC Central login page**
4. **Login with your super admin credentials**
5. **You should see the SOC Central dashboard**

### 9.3 Test Complete Integration

1. **Login Test**:
   - Go to frontend (`http://localhost`)
   - Login with super admin credentials
   - Should successfully redirect to dashboard

2. **API Communication Test**:
   - Press F12 (Developer Tools)
   - Go to Network tab
   - Refresh the page
   - Should see successful API calls (status 200)

3. **File Upload Test**:
   - Try uploading a sample Excel file
   - Check if upload succeeds

4. **Admin Panel Test**:
   - Go to User Management
   - Try creating a test user
   - Check if email would be sent (check logs)

### 9.4 Check Logs for Errors

1. **Django Logs**:
   ```cmd
   type "C:\inetpub\wwwroot\SOCCENTRAL\backend\logs\django.log"
   ```

2. **Authentication Logs**:
   ```cmd
   type "C:\inetpub\wwwroot\SOCCENTRAL\backend\logs\authentication.log"
   ```

3. **Windows Event Viewer**:
   - Press `Windows Key + R`, type `eventvwr.msc`
   - Check "Windows Logs" → "Application" for any errors

---

## 🚨 Common Issues & Solutions

### Issue 1: "500 Internal Server Error" on API

**Symptoms**: Backend returns 500 error, nothing loads

**Solutions**:
1. **Check Django logs**:
   ```cmd
   type "C:\inetpub\wwwroot\SOCCENTRAL\backend\logs\django.log"
   ```

2. **Check environment variables**:
   - Verify `.env.production` has correct database settings
   - Make sure `DEBUG=False`

3. **Check database connection**:
   ```cmd
   cd C:\inetpub\wwwroot\SOCCENTRAL\backend
   venv\Scripts\activate
   python manage.py check
   ```

4. **Restart IIS**:
   ```cmd
   iisreset
   ```

### Issue 2: Frontend shows blank page

**Symptoms**: Frontend loads but shows white/blank page

**Solutions**:
1. **Check browser console** (F12 → Console tab)
2. **Verify API URL in frontend config**:
   - Check `soccentral\.env.production`
   - Make sure `VITE_API_URL` points to correct backend URL

3. **Rebuild frontend**:
   ```cmd
   cd C:\inetpub\wwwroot\SOCCENTRAL\soccentral
   npm run build
   ```

### Issue 3: Database connection errors

**Symptoms**: Errors about database connection

**Solutions**:
1. **Check PostgreSQL is running**:
   - Open Services (`services.msc`)
   - Find "postgresql-x64-14" service
   - Make sure it's "Running"

2. **Test database connection manually**:
   ```cmd
   cd "C:\Program Files\PostgreSQL\14\bin"
   psql -U soc_central_user -d soccentral_db -h localhost
   ```

3. **Check environment variables**:
   - Verify database settings in `.env.production`
   - Make sure password matches what you set

### Issue 4: Permission errors

**Symptoms**: Access denied or permission errors

**Solutions**:
1. **Reset file permissions**:
   ```cmd
   icacls "C:\inetpub\wwwroot\SOCCENTRAL" /grant "IIS_IUSRS:(OI)(CI)F" /T
   ```

2. **Check application pool identity**:
   - In IIS Manager, check Application Pool advanced settings
   - Identity should be "ApplicationPoolIdentity"

### Issue 5: Email not working

**Symptoms**: Users don't receive activation/reset emails

**Solutions**:
1. **Check email settings** in `.env.production`
2. **For Gmail, use App Passwords**:
   - Go to Google Account settings
   - Enable 2-factor authentication
   - Generate App Password
   - Use App Password instead of regular password

3. **Check email logs**:
   ```cmd
   type "C:\inetpub\wwwroot\SOCCENTRAL\backend\logs\email.log"
   ```

### Issue 6: Cannot access from other computers

**Symptoms**: Works on server but not from other machines

**Solutions**:
1. **Update ALLOWED_HOSTS** in `.env.production`:
   ```env
   ALLOWED_HOSTS=localhost,127.0.0.1,your-server-ip,your-domain.com
   ```

2. **Update frontend API URL**:
   ```env
   VITE_API_URL=http://your-server-ip:8000
   ```

3. **Check Windows Firewall**:
   - Make sure ports 80 and 8000 are allowed
   - Check network firewall settings

4. **Rebuild frontend**:
   ```cmd
   cd C:\inetpub\wwwroot\SOCCENTRAL\soccentral
   npm run build
   ```

---

## 📞 Support & Next Steps

### 🎉 Congratulations!

If you've made it this far, you should have a fully functional SOC Central deployment! Here's what you've accomplished:

✅ **Deployed Django REST API** with JWT authentication  
✅ **Deployed React SPA frontend** with modern UI  
✅ **Configured PostgreSQL database** with proper security  
✅ **Set up IIS with FastCGI** for Python web apps  
✅ **Configured security permissions** and firewall rules  
✅ **Implemented file upload system** for security data  
✅ **Set up email notifications** for user management  

### 📋 Post-Deployment Checklist

- [ ] **Change default passwords** (super admin, database)
- [ ] **Set up SSL certificate** for production use
- [ ] **Configure automated backups** for database
- [ ] **Set up log rotation** to prevent disk space issues
- [ ] **Create additional admin users** for your team
- [ ] **Test file uploads** with your security data
- [ ] **Configure email templates** with your branding
- [ ] **Set up monitoring** for application health

### 🔧 Maintenance Tasks

**Daily**:
- Check application logs for errors
- Monitor disk space usage

**Weekly**:
- Review security logs
- Test backup and restore procedures

**Monthly**:
- Update Python packages
- Update Node.js packages
- Review user accounts and permissions

### 📖 Next Steps

1. **Read the User Manual**: Check `README_V3.md` for feature details
2. **Configure Security Tools**: Upload your G Suite, MDM, SIEM data
3. **Set up Dashboards**: Explore the analytics and MITRE ATT&CK features
4. **Train Your Team**: Show them how to use the platform
5. **Monitor Performance**: Keep an eye on system resources

### 🆘 Getting Help

If you encounter issues not covered in this guide:

1. **Check the logs first** - most issues are logged
2. **Review the troubleshooting section** above
3. **Search online** for specific error messages
4. **Contact your system administrator** if needed

### 📚 Additional Resources

- **Django Documentation**: https://docs.djangoproject.com/
- **IIS Documentation**: https://docs.microsoft.com/en-us/iis/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **React Documentation**: https://reactjs.org/docs/
- **SOC Central Features**: See `README_V3.md` in project root

---

## 🎯 Final Verification Checklist

Before considering your deployment complete, verify these items:

### Backend Verification
- [ ] `http://localhost:8000/admin` shows Django admin
- [ ] `http://localhost:8000/api/auth/health/` returns health status
- [ ] Can login to admin with super admin credentials
- [ ] Database contains proper tables (check pgAdmin)
- [ ] Static files are served correctly
- [ ] Logs are being written to backend/logs/

### Frontend Verification
- [ ] `http://localhost` shows SOC Central login page
- [ ] Can login with super admin credentials
- [ ] Dashboard loads properly with navigation
- [ ] API calls work (check browser Network tab)
- [ ] All pages are accessible
- [ ] File upload interface is present

### Integration Verification
- [ ] Frontend can communicate with backend API
- [ ] User management functions work
- [ ] File uploads succeed
- [ ] Email system is configured (check email logs)
- [ ] CORS is properly configured
- [ ] Authentication flow works end-to-end

### Security Verification
- [ ] Default passwords have been changed
- [ ] File permissions are set correctly
- [ ] Windows Firewall rules are in place
- [ ] Database is secured with proper user credentials
- [ ] No sensitive data in logs
- [ ] Admin panel is accessible only to authorized users

---

<div align="center">
  <h2>🎊 Deployment Complete! 🎊</h2>
  <p><strong>Your SOC Central v3.0 application is now running on IIS!</strong></p>
  <p><em>Access your application at:</em></p>
  <p>🌐 <strong>Frontend:</strong> http://localhost</p>
  <p>🔧 <strong>Admin Panel:</strong> http://localhost:8000/admin</p>
  <p>📊 <strong>API Health:</strong> http://localhost:8000/api/auth/health/</p>
  
  <br>
  <p><strong>Default Login Credentials:</strong></p>
  <p>📧 <strong>Email:</strong> admin@yourcompany.com</p>
  <p>🔑 <strong>Password:</strong> YourSecureAdminPassword123!</p>
  <p><em>(or whatever you set in your .env.production file)</em></p>
</div>

---

**🛡️ Welcome to SOC Central - Your Security Operations Command Center!**