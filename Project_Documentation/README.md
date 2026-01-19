# SOC Central V3.1.1 - Project Documentation

## Overview

This directory contains comprehensive documentation for the SOC Central V3.1.1 platform, an Enterprise Security Operations Center (SOC) Management Platform.

## Documentation Structure

### Primary Documents

#### 1. Software Requirements Specification (SRS)
**File:** `SRS_SOC_Central_v3.1.1.md`

The complete SRS document containing:
- **Introduction** - Purpose, scope, definitions, and overview
- **Overall Description** - Product perspective, functions, user classes, and constraints
- **System Features** - Detailed functional requirements for all features
- **External Interface Requirements** - UI, hardware, software, and communication interfaces
- **Non-Functional Requirements** - Performance, security, and quality attributes
- **System Architecture** - Architecture diagrams, database design, and component design
- **Use Case Diagrams** - Visual representation of user interactions
- **Sequence Diagrams** - Process flows for key operations
- **Data Flow Diagrams** - Data movement through the system
- **Entity Relationship Diagram** - Complete database schema
- **Appendices** - Technology stack, API formats, security practices, deployment config

## Quick Navigation

### For Developers
Start with:
1. System Architecture (Section 6 of SRS)
2. Database Design (Section 6.2 of SRS)
3. API Endpoints (Section 4.3.3 of SRS)
4. Technology Stack (Appendix A)

### For Project Managers
Focus on:
1. Overall Description (Section 2 of SRS)
2. System Features (Section 3 of SRS)
3. User Classes (Section 2.3 of SRS)
4. Business Rules (Section 5.4 of SRS)

### For QA/Testing Teams
Review:
1. Functional Requirements (Section 3 of SRS)
2. Non-Functional Requirements (Section 5 of SRS)
3. Use Case Diagrams (Section 7 of SRS)
4. Sequence Diagrams (Section 8 of SRS)

### For Security Analysts
Examine:
1. Security Requirements (Section 5.2 of SRS)
2. Authentication System (Section 3.1 of SRS)
3. Security Best Practices (Appendix C)
4. Role-Based Access Control (Section 3.2 of SRS)

### For System Administrators
Study:
1. Operating Environment (Section 2.4 of SRS)
2. Deployment Configuration (Appendix D)
3. External Interface Requirements (Section 4 of SRS)
4. Performance Requirements (Section 5.1 of SRS)

## Key Features Documented

### 1. Authentication & Authorization
- JWT-based authentication with MFA
- Four-tier role hierarchy (Super Admin, Master Admin, Admin, General User)
- Email/SMS OTP verification
- Password reset and account activation workflows

### 2. Multi-Tool Security Integration
- G Suite - Email security and phishing detection
- MDM - Mobile device management
- SIEM - Security event management
- EDR - Endpoint detection and response (Wazuh)
- Meraki - Network monitoring
- SonicWall - Firewall and intrusion detection

### 3. MITRE ATT&CK Integration
- 12 MITRE tactics coverage
- 50+ technique mappings
- Attack path reconstruction
- Threat prioritization

### 4. Machine Learning & AI
- Anomaly detection using scikit-learn
- AI-powered report generation (Google Gemini)
- Intelligent security chatbot
- Automated threat analysis

### 5. Company Management
- Multi-tenancy with data isolation
- Configurable user limits
- Granular tool permissions
- Company-specific analytics

## System Architecture Highlights

### Technology Stack

**Backend:**
- Django 5.1.2 with Django REST Framework
- PostgreSQL database
- Python 3.10+
- Scikit-learn for ML
- Google Gemini AI

**Frontend:**
- React 18.3 with TypeScript
- Vite build tool
- TanStack Query for data fetching
- Recharts for visualizations
- shadcn/ui component library

**Deployment:**
- Cloud-ready (Render, AWS, Azure, GCP)
- Docker support
- Gunicorn WSGI server
- PostgreSQL production database

## Database Schema Overview

The system uses 25+ tables organized into schemas:

### Authentication Schema
- Companies
- Users (with roles)
- Company Tool Permissions
- OTP Verification
- Password Reset Tokens
- User Sessions
- MFA Codes
- User Activity Logs

### Tools Schema
- Security Data Uploads
- Data Access Logs
- Processing Logs
- Data Notifications

### ML & Analytics Schema
- Anomaly Models
- Anomaly Detections
- Training Jobs

### Reports Schema
- SOC Reports
- Report Sections
- Report Templates
- Report Exports

### Chat Schema
- Chat Conversations
- Chat Messages

## User Roles & Capabilities

### Super Admin
- Global system access across all companies
- Create and manage companies
- Assign tool permissions
- Manage all users
- Access all security data

### Master Admin (1 per company)
- Full control within their company
- Create up to 3 Admin users
- Create unlimited General users
- Cannot be deleted (protected)
- Full access to company data

### Admin
- Company-specific management
- Create General users
- Upload security data
- Generate reports
- Manage company dashboards

### General User
- Read-only access to company data
- View security dashboards
- View reports and analytics
- No upload or management permissions

## Security Features

### Authentication Security
- Password complexity requirements
- MFA with email/SMS OTP
- JWT token management (24h access, 7d refresh)
- Rate limiting on authentication
- Session timeout (5 minutes inactivity)

### Data Security
- Encryption at rest and in transit (TLS 1.2+)
- Password hashing (bcrypt/PBKDF2)
- Company-level data isolation
- SHA-256 file hashing for duplicate detection
- Comprehensive audit logging

### Application Security
- CSRF protection
- XSS prevention
- SQL injection prevention (ORM)
- Security headers (X-Frame-Options, CSP, HSTS)
- Input validation and sanitization

## Performance Specifications

- **Page Load Time:** < 2 seconds (90th percentile)
- **API Response Time:** < 500ms (average)
- **Dashboard Rendering:** < 1 second
- **Report Generation:** < 30 seconds
- **Concurrent Users:** 100 per company
- **Max Upload Size:** 50MB
- **Max Records:** 100,000 per upload

## API Endpoints Summary

### Authentication APIs
- `/api/auth/signup/` - User registration
- `/api/auth/login/` - User login
- `/api/auth/verify-mfa/` - MFA verification
- `/api/auth/logout/` - User logout
- `/api/auth/password-reset/` - Password reset

### User Management APIs
- `/api/auth/admin/users/` - List users
- `/api/auth/admin/create-user/` - Create user
- `/api/auth/admin/update-user/:id/` - Update user
- `/api/auth/admin/delete-user/:id/` - Delete user

### Company Management APIs
- `/api/auth/companies/` - Company CRUD
- `/api/auth/companies/:id/tools/` - Tool permissions

### Data Management APIs
- `/api/tool/upload/` - Upload security data
- `/api/tool/:toolType/active/` - Get active dataset
- `/api/tool/:toolType/activate/:id/` - Activate dataset
- `/api/tool/:toolType/filtered/` - Get filtered data

### Reports APIs
- `/api/tool/reports/` - Report CRUD
- `/api/tool/reports/:id/generate/` - Generate report
- `/api/tool/reports/:id/export/` - Export report

### ML & Analytics APIs
- `/api/tool/ml/train/` - Train anomaly model
- `/api/tool/ml/anomalies/` - Get anomalies
- `/api/tool/ml/detect/` - Run detection

### Chatbot APIs
- `/api/tool/chatbot/message/` - Send message
- `/api/tool/chatbot/conversations/` - List conversations

## Business Rules

1. **Master Admin Protection** - One Master Admin per company, cannot be deleted
2. **Admin Creation Limits** - Master Admin can create max 3 Admins
3. **Company User Limits** - Default 10 users per company (configurable)
4. **Data Isolation** - Strict company-level data separation
5. **Active Dataset Rule** - One active dataset per tool per company
6. **Authentication Requirements** - Email verification required, MFA recommended

## Compliance & Standards

- **GDPR** - Data privacy compliance
- **OWASP Top 10** - Security compliance
- **WCAG 2.1 Level AA** - Accessibility compliance
- **REST API** - Standard API design
- **JWT RFC 7519** - Token standard

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 2026-01-10 | Initial documentation release |

## Document Maintenance

This documentation should be updated whenever:
- New features are added
- System architecture changes
- Database schema is modified
- API endpoints are added/modified
- Security requirements change
- Technology stack is updated

## Contact Information

For questions or clarifications about this documentation, please contact the SOC Central development team.

---

**Last Updated:** January 10, 2026
**Document Version:** 1.0
**Project:** SOC Central V3.1.1
