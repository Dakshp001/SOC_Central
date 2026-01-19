# SOC Central V3.1.1 - Quick Reference Guide

## Table of Contents
1. [User Roles Quick Reference](#user-roles-quick-reference)
2. [API Endpoints Cheat Sheet](#api-endpoints-cheat-sheet)
3. [Database Models Quick Reference](#database-models-quick-reference)
4. [Security Configuration](#security-configuration)
5. [Common Operations](#common-operations)
6. [Error Codes](#error-codes)
7. [Environment Variables](#environment-variables)

---

## User Roles Quick Reference

| Role | Creation Limit | Management Scope | Special Features |
|------|---------------|------------------|------------------|
| **Super Admin** | Unlimited | All companies | - Access all data<br>- Create companies<br>- Assign tool permissions<br>- Promote/demote any user |
| **Master Admin** | Create 3 Admins | Own company only | - Cannot be deleted<br>- One per company<br>- Full company control |
| **Admin** | Create unlimited General users | Own company only | - Upload data<br>- Generate reports<br>- Manage General users |
| **General User** | Cannot create users | Read-only | - View dashboards<br>- View reports<br>- No data upload |

### Role Hierarchy
```
Super Admin (System-wide)
    └── Master Admin (Company-wide)
            └── Admin (Department-level)
                    └── General User (Read-only)
```

---

## API Endpoints Cheat Sheet

### Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/signup/` | No | Register new user |
| POST | `/api/auth/verify-otp/` | No | Verify email OTP |
| POST | `/api/auth/login/` | No | User login (step 1) |
| POST | `/api/auth/verify-mfa/` | No | MFA verification (step 2) |
| POST | `/api/auth/logout/` | Yes | User logout |
| POST | `/api/auth/refresh/` | Yes | Refresh JWT token |
| POST | `/api/auth/password-reset/` | No | Request password reset |
| POST | `/api/auth/password-reset/confirm/` | No | Confirm password reset |
| POST | `/api/auth/activate/` | No | Activate account |
| GET | `/api/auth/profile/` | Yes | Get user profile |
| PUT | `/api/auth/profile/` | Yes | Update user profile |
| POST | `/api/auth/change-password/` | Yes | Change password |

### Admin User Management

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| GET | `/api/auth/admin/users/` | Admin+ | List company users |
| POST | `/api/auth/admin/create-user/` | Admin+ | Create new user |
| PUT | `/api/auth/admin/update-user/:id/` | Admin+ | Update user |
| DELETE | `/api/auth/admin/delete-user/:id/` | Admin+ | Delete user |
| POST | `/api/auth/admin/toggle-activation/:id/` | Admin+ | Activate/deactivate user |
| POST | `/api/auth/admin/send-password-reset/:id/` | Admin+ | Send password reset email |

### Company Management (Super Admin Only)

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| GET | `/api/auth/companies/` | Super Admin | List all companies |
| POST | `/api/auth/companies/` | Super Admin | Create company |
| GET | `/api/auth/companies/:id/` | Super Admin | Get company details |
| PUT | `/api/auth/companies/:id/` | Super Admin | Update company |
| DELETE | `/api/auth/companies/:id/` | Super Admin | Delete company |
| PUT | `/api/auth/companies/:id/tools/` | Super Admin | Update tool permissions |

### Data Management

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| POST | `/api/tool/upload/` | Admin+ | Upload security data |
| GET | `/api/tool/:toolType/active/` | All | Get active dataset |
| POST | `/api/tool/:toolType/activate/:id/` | Admin+ | Activate dataset |
| DELETE | `/api/tool/:toolType/delete/:id/` | Admin+ | Delete dataset |
| GET | `/api/tool/:toolType/filtered/` | All | Get filtered data |
| GET | `/api/tool/:toolType/uploads/` | Admin+ | List all uploads |

**Tool Types:** `gsuite`, `mdm`, `siem`, `edr`, `meraki`, `sonicwall`

### Reports

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| GET | `/api/tool/reports/` | All | List reports |
| POST | `/api/tool/reports/` | Admin+ | Create report |
| GET | `/api/tool/reports/:id/` | All | Get report details |
| PUT | `/api/tool/reports/:id/` | Admin+ | Update report |
| DELETE | `/api/tool/reports/:id/` | Admin+ | Delete report |
| POST | `/api/tool/reports/:id/generate/` | Admin+ | Generate AI content |
| POST | `/api/tool/reports/:id/export/` | All | Export report (PDF/DOCX/HTML) |

### Machine Learning & Anomaly Detection

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| POST | `/api/tool/ml/train/` | Admin+ | Start training job |
| GET | `/api/tool/ml/jobs/` | Admin+ | List training jobs |
| GET | `/api/tool/ml/jobs/:id/` | Admin+ | Get job status |
| POST | `/api/tool/ml/detect/` | Admin+ | Run anomaly detection |
| GET | `/api/tool/ml/anomalies/` | All | List anomalies |
| GET | `/api/tool/ml/anomalies/:id/` | All | Get anomaly details |
| PUT | `/api/tool/ml/anomalies/:id/investigate/` | Admin+ | Mark as investigated |
| PUT | `/api/tool/ml/anomalies/:id/resolve/` | Admin+ | Resolve anomaly |

### Chatbot

| Method | Endpoint | Required Role | Description |
|--------|----------|---------------|-------------|
| POST | `/api/tool/chatbot/message/` | All | Send chat message |
| GET | `/api/tool/chatbot/conversations/` | All | List conversations |
| GET | `/api/tool/chatbot/conversations/:id/` | All | Get conversation history |
| DELETE | `/api/tool/chatbot/conversations/:id/` | All | Delete conversation |

---

## Database Models Quick Reference

### Authentication Models

#### User Model
```python
{
    "id": "uuid",
    "email": "string (unique)",
    "first_name": "string",
    "last_name": "string",
    "role": "super_admin|master_admin|admin|general",
    "company": "FK → Company",
    "is_email_verified": "boolean",
    "is_active": "boolean",
    "created_at": "datetime",
    "updated_at": "datetime"
}
```

#### Company Model
```python
{
    "id": "uuid",
    "name": "string (unique)",
    "display_name": "string",
    "enabled_tools": ["gsuite", "mdm", "siem", "edr", "meraki", "sonicwall"],
    "max_users": "integer (default: 10)",
    "is_active": "boolean",
    "created_at": "datetime"
}
```

### Tool Models

#### SecurityDataUpload Model
```python
{
    "id": "integer",
    "tool_type": "gsuite|mdm|siem|edr|meraki|sonicwall",
    "file_name": "string",
    "file_hash": "string (SHA-256)",
    "record_count": "integer",
    "processed_data": "json",
    "status": "pending|processing|completed|failed|active",
    "is_active": "boolean",
    "company_name": "string",
    "uploaded_by": "FK → User",
    "uploaded_at": "datetime"
}
```

#### AnomalyModel
```python
{
    "id": "integer",
    "tool_type": "string",
    "algorithm": "isolation_forest|one_class_svm|autoencoder",
    "model_name": "string",
    "feature_columns": "json",
    "hyperparameters": "json",
    "status": "training|trained|active|deprecated|failed",
    "is_active": "boolean",
    "company_name": "string",
    "trained_at": "datetime"
}
```

#### SOCReport Model
```python
{
    "id": "integer",
    "title": "string",
    "report_type": "individual_tool|combined_tools|executive_summary|incident_report|threat_analysis",
    "tool_types": ["gsuite", "siem"],
    "executive_summary": "text",
    "kpi_metrics": "json",
    "status": "draft|generating|completed|failed|published",
    "company_name": "string",
    "created_by": "FK → User",
    "report_period_start": "date",
    "report_period_end": "date",
    "created_at": "datetime"
}
```

---

## Security Configuration

### Password Requirements
```python
MINIMUM_LENGTH = 8
REQUIRED_CHARACTERS = {
    "uppercase": True,
    "lowercase": True,
    "number": True,
    "special": True
}
```

### Rate Limiting
```python
RATE_LIMITS = {
    "login": "5/15min",          # 5 attempts per 15 minutes
    "signup": "3/hour",          # 3 signups per hour
    "password_reset": "3/hour",  # 3 reset requests per hour
    "otp_request": "1/2min",     # 1 OTP per 2 minutes
    "api_general": "100/min"     # 100 API calls per minute
}
```

### Token Configuration
```python
JWT_SETTINGS = {
    "ACCESS_TOKEN_LIFETIME": 24 * 60,     # 24 hours
    "REFRESH_TOKEN_LIFETIME": 7 * 24 * 60, # 7 days
    "ROTATE_REFRESH_TOKENS": True,
    "ALGORITHM": "HS256"
}

OTP_SETTINGS = {
    "OTP_LENGTH": 6,              # 6 digits
    "OTP_EXPIRY_MINUTES": 10,     # 10 minutes
    "MAX_OTP_ATTEMPTS": 5         # 5 attempts
}

MFA_SETTINGS = {
    "MFA_CODE_LENGTH": 4,         # 4 digits
    "MFA_EXPIRY_MINUTES": 10,     # 10 minutes
    "MAX_MFA_ATTEMPTS": 3         # 3 attempts
}
```

### Security Headers
```python
SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "X-XSS-Protection": "1; mode=block"
}
```

---

## Common Operations

### 1. User Registration Flow
```javascript
// Step 1: Register
POST /api/auth/signup/
{
  "email": "user@company.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "company_name": "Acme Corp"
}

// Step 2: Verify OTP (sent to email)
POST /api/auth/verify-otp/
{
  "email": "user@company.com",
  "otp_code": "123456"
}

// Response: Account created, email verified
```

### 2. Login Flow with MFA
```javascript
// Step 1: Login
POST /api/auth/login/
{
  "email": "user@company.com",
  "password": "SecurePass123!"
}

// Response: MFA required
{
  "status": "mfa_required",
  "message": "MFA code sent to email"
}

// Step 2: Verify MFA
POST /api/auth/verify-mfa/
{
  "email": "user@company.com",
  "mfa_code": "1234"
}

// Response: JWT tokens
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "role": "admin",
    "company": "Acme Corp"
  }
}
```

### 3. Upload Security Data
```javascript
// Upload file
POST /api/tool/upload/
Content-Type: multipart/form-data
Authorization: Bearer <access_token>

{
  "file": <file_binary>,
  "tool_type": "siem"
}

// Response
{
  "status": "success",
  "data": {
    "upload_id": 123,
    "file_name": "siem_logs.csv",
    "record_count": 1500,
    "file_hash": "a3b2c1...",
    "status": "completed"
  }
}
```

### 4. Activate Dataset
```javascript
// Activate uploaded dataset
POST /api/tool/siem/activate/123/
Authorization: Bearer <access_token>

// Response
{
  "status": "success",
  "message": "Dataset activated successfully",
  "data": {
    "upload_id": 123,
    "is_active": true,
    "activated_at": "2026-01-10T10:30:00Z"
  }
}
```

### 5. Generate AI Report
```javascript
// Create report
POST /api/tool/reports/
Authorization: Bearer <access_token>

{
  "title": "Q1 2026 Security Report",
  "report_type": "executive_summary",
  "tool_types": ["siem", "edr", "gsuite"],
  "report_period_start": "2026-01-01",
  "report_period_end": "2026-03-31"
}

// Response: Report created (draft)
{
  "status": "success",
  "data": {
    "report_id": 456,
    "status": "draft"
  }
}

// Generate AI content
POST /api/tool/reports/456/generate/
Authorization: Bearer <access_token>

// Response: AI generation started
{
  "status": "success",
  "message": "Report generation started",
  "data": {
    "report_id": 456,
    "status": "generating"
  }
}

// Check status (poll every few seconds)
GET /api/tool/reports/456/
Authorization: Bearer <access_token>

// Response: Generation complete
{
  "status": "success",
  "data": {
    "id": 456,
    "title": "Q1 2026 Security Report",
    "status": "completed",
    "executive_summary": "AI generated summary...",
    "recommendations": "AI generated recommendations..."
  }
}
```

### 6. Train Anomaly Detection Model
```javascript
// Start training
POST /api/tool/ml/train/
Authorization: Bearer <access_token>

{
  "tool_type": "siem",
  "algorithm": "isolation_forest",
  "contamination_rate": 0.1,
  "hyperparameters": {
    "n_estimators": 100,
    "max_samples": "auto"
  }
}

// Response: Training job created
{
  "status": "success",
  "data": {
    "job_id": 789,
    "status": "pending"
  }
}

// Check training status
GET /api/tool/ml/jobs/789/
Authorization: Bearer <access_token>

// Response: Training complete
{
  "status": "success",
  "data": {
    "job_id": 789,
    "status": "completed",
    "trained_model_id": 12,
    "training_metrics": {
      "training_accuracy": 0.95,
      "validation_score": 0.92
    }
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password | Check credentials |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | Email not verified | Verify email via OTP |
| `AUTH_ACCOUNT_DISABLED` | 403 | Account deactivated | Contact admin |
| `AUTH_MFA_REQUIRED` | 401 | MFA verification needed | Complete MFA |
| `AUTH_MFA_INVALID` | 401 | Invalid MFA code | Check code and retry |
| `AUTH_MFA_EXPIRED` | 401 | MFA code expired | Request new code |
| `AUTH_RATE_LIMIT_EXCEEDED` | 429 | Too many attempts | Wait and retry |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT token expired | Refresh token |
| `AUTH_TOKEN_INVALID` | 401 | Invalid JWT token | Re-authenticate |
| `USER_NOT_FOUND` | 404 | User does not exist | Check user ID |
| `COMPANY_NOT_FOUND` | 404 | Company does not exist | Check company ID |
| `COMPANY_USER_LIMIT_REACHED` | 403 | Max users reached | Increase limit or remove users |
| `PERMISSION_DENIED` | 403 | Insufficient permissions | Check user role |
| `UPLOAD_FILE_TOO_LARGE` | 413 | File exceeds 50MB | Reduce file size |
| `UPLOAD_INVALID_FORMAT` | 400 | Invalid file format | Use CSV or Excel |
| `UPLOAD_DUPLICATE_FILE` | 409 | File already uploaded | Check file hash |
| `DATA_NOT_FOUND` | 404 | Dataset not found | Check dataset ID |
| `REPORT_GENERATION_FAILED` | 500 | AI report generation failed | Retry or contact support |
| `ML_TRAINING_FAILED` | 500 | Model training failed | Check data and parameters |

---

## Environment Variables

### Backend (.env)

```bash
# Django Core
SECRET_KEY=your-django-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/soccentral

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-specific-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=SOC Central <noreply@soccentral.com>

# AI Service
GOOGLE_API_KEY=your-google-gemini-api-key

# Security
CSRF_TRUSTED_ORIGINS=https://your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000

# File Upload
MAX_UPLOAD_SIZE=52428800  # 50MB in bytes
MEDIA_ROOT=/path/to/media/
MEDIA_URL=/media/

# Logging
LOG_LEVEL=INFO
LOG_FILE=/path/to/logs/django.log
```

### Frontend (.env)

```bash
# API Configuration
VITE_API_BASE_URL=https://api.your-domain.com
VITE_API_TIMEOUT=30000

# Environment
VITE_ENVIRONMENT=production
VITE_APP_NAME=SOC Central
VITE_APP_VERSION=3.1.1

# Features
VITE_ENABLE_MFA=true
VITE_ENABLE_CHATBOT=true
VITE_ENABLE_ML_FEATURES=true

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

---

## Performance Tips

### 1. Database Optimization
```python
# Use select_related for foreign keys
users = User.objects.select_related('company').all()

# Use prefetch_related for reverse foreign keys
companies = Company.objects.prefetch_related('users').all()

# Add database indexes
class Meta:
    indexes = [
        models.Index(fields=['company_name', 'is_active']),
    ]
```

### 2. API Response Caching
```python
# Cache frequently accessed data
from django.core.cache import cache

def get_active_data(tool_type, company_name):
    cache_key = f"active_data_{tool_type}_{company_name}"
    data = cache.get(cache_key)

    if data is None:
        data = SecurityDataUpload.get_active_data(tool_type, company_name)
        cache.set(cache_key, data, timeout=300)  # 5 minutes

    return data
```

### 3. Frontend Optimization
```typescript
// Use TanStack Query for automatic caching
const { data, isLoading } = useQuery({
  queryKey: ['activeData', toolType],
  queryFn: () => fetchActiveData(toolType),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Implement pagination
const { data } = useQuery({
  queryKey: ['users', page],
  queryFn: () => fetchUsers(page),
  keepPreviousData: true,
});
```

---

## Troubleshooting

### Common Issues

**Issue:** Login returns "Email not verified"
**Solution:** Complete email verification via OTP

**Issue:** MFA code not received
**Solution:** Check spam folder, verify email settings, wait 2 minutes before requesting new code

**Issue:** File upload fails with "Duplicate file"
**Solution:** File with same content already exists, activate existing upload or force upload

**Issue:** Report generation stuck in "generating" status
**Solution:** Check Google Gemini API key, verify API rate limits, check logs

**Issue:** Anomaly detection not finding anomalies
**Solution:** Increase contamination rate, retrain model with more data, check feature selection

**Issue:** Cannot delete Master Admin
**Solution:** By design - Master Admins are protected, contact Super Admin

---

**Last Updated:** January 10, 2026
**Version:** 1.0
