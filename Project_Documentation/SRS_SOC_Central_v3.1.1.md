# Software Requirements Specification (SRS)
# SOC Central V3.1.1
## Enterprise Security Operations Center Management Platform

---

**Document Version:** 1.0
**Date:** January 10, 2026
**Project:** SOC Central V3.1.1
**Organization:** CSU Internship Project

---

## Document Control

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | 2026-01-10 | SOC Central Team | Initial SRS Document |

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Definitions, Acronyms, and Abbreviations](#13-definitions-acronyms-and-abbreviations)
   - 1.4 [References](#14-references)
   - 1.5 [Overview](#15-overview)

2. [Overall Description](#2-overall-description)
   - 2.1 [Product Perspective](#21-product-perspective)
   - 2.2 [Product Functions](#22-product-functions)
   - 2.3 [User Classes and Characteristics](#23-user-classes-and-characteristics)
   - 2.4 [Operating Environment](#24-operating-environment)
   - 2.5 [Design and Implementation Constraints](#25-design-and-implementation-constraints)
   - 2.6 [Assumptions and Dependencies](#26-assumptions-and-dependencies)

3. [System Features](#3-system-features)
   - 3.1 [Authentication and Authorization](#31-authentication-and-authorization)
   - 3.2 [User Management](#32-user-management)
   - 3.3 [Company Management](#33-company-management)
   - 3.4 [Security Data Management](#34-security-data-management)
   - 3.5 [MITRE ATT&CK Integration](#35-mitre-attck-integration)
   - 3.6 [Machine Learning and Anomaly Detection](#36-machine-learning-and-anomaly-detection)
   - 3.7 [Dashboard and Analytics](#37-dashboard-and-analytics)
   - 3.8 [Report Generation](#38-report-generation)
   - 3.9 [AI-Powered Chatbot](#39-ai-powered-chatbot)
   - 3.10 [Multi-Tool Integration](#310-multi-tool-integration)

4. [External Interface Requirements](#4-external-interface-requirements)
   - 4.1 [User Interfaces](#41-user-interfaces)
   - 4.2 [Hardware Interfaces](#42-hardware-interfaces)
   - 4.3 [Software Interfaces](#43-software-interfaces)
   - 4.4 [Communications Interfaces](#44-communications-interfaces)

5. [Non-Functional Requirements](#5-non-functional-requirements)
   - 5.1 [Performance Requirements](#51-performance-requirements)
   - 5.2 [Security Requirements](#52-security-requirements)
   - 5.3 [Software Quality Attributes](#53-software-quality-attributes)
   - 5.4 [Business Rules](#54-business-rules)

6. [System Architecture and Design](#6-system-architecture-and-design)
   - 6.1 [System Architecture](#61-system-architecture)
   - 6.2 [Database Design](#62-database-design)
   - 6.3 [Component Design](#63-component-design)

7. [Use Case Diagrams](#7-use-case-diagrams)
8. [Sequence Diagrams](#8-sequence-diagrams)
9. [Data Flow Diagrams](#9-data-flow-diagrams)
10. [Entity Relationship Diagram](#10-entity-relationship-diagram)
11. [Appendices](#11-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) document provides a comprehensive description of the SOC Central V3.1.1 platform. It details the functional and non-functional requirements, system architecture, and design specifications for the enterprise Security Operations Center (SOC) management platform.

The intended audience for this document includes:
- Software developers and engineers
- Project managers and stakeholders
- Quality assurance and testing teams
- System administrators
- Security analysts and SOC managers
- Technical documentation teams

### 1.2 Scope

**Product Name:** SOC Central V3.1.1

**Product Description:**
SOC Central is an Enterprise Security Operations Center (SOC) Management Platform designed to centralize, analyze, and manage security data from multiple security tools. The system provides a unified dashboard for security teams to monitor threats, analyze security events, and generate professional reports across various security domains.

**Major Features:**
1. Multi-tool security data integration (G Suite, MDM, SIEM, EDR, Meraki, SonicWall)
2. Advanced authentication with MFA and JWT-based security
3. Hierarchical role-based access control (Super Admin, Master Admin, Admin, General User)
4. MITRE ATT&CK framework integration for threat intelligence
5. Machine learning-powered anomaly detection
6. AI-powered professional report generation
7. Interactive dashboards and analytics
8. Company-level data isolation and multi-tenancy
9. Intelligent chatbot for security assistance
10. Real-time data processing and visualization

**Benefits:**
- Centralized security operations management
- Enhanced threat detection and response capabilities
- Automated security reporting and compliance
- Improved visibility across security infrastructure
- Reduced mean time to detect (MTTD) and respond (MTTR)
- Data-driven security decision making

**Goals:**
- Provide a unified platform for SOC operations
- Enable efficient security data analysis
- Support compliance and audit requirements
- Facilitate collaboration among security teams
- Automate routine security tasks

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| **SOC** | Security Operations Center - centralized unit dealing with security issues |
| **SIEM** | Security Information and Event Management |
| **EDR** | Endpoint Detection and Response |
| **MDM** | Mobile Device Management |
| **MITRE ATT&CK** | Adversarial Tactics, Techniques, and Common Knowledge framework |
| **MFA** | Multi-Factor Authentication |
| **JWT** | JSON Web Token - authentication standard |
| **API** | Application Programming Interface |
| **REST** | Representational State Transfer |
| **OTP** | One-Time Password |
| **CRUD** | Create, Read, Update, Delete operations |
| **KPI** | Key Performance Indicator |
| **CSRF** | Cross-Site Request Forgery |
| **XSS** | Cross-Site Scripting |
| **TLS** | Transport Layer Security |
| **SMTP** | Simple Mail Transfer Protocol |
| **CORS** | Cross-Origin Resource Sharing |
| **WSGI** | Web Server Gateway Interface |
| **ML** | Machine Learning |
| **AI** | Artificial Intelligence |
| **UUID** | Universally Unique Identifier |
| **SRS** | Software Requirements Specification |

### 1.4 References

1. **Django Documentation** - https://docs.djangoproject.com/
2. **Django REST Framework** - https://www.django-rest-framework.org/
3. **React Documentation** - https://react.dev/
4. **MITRE ATT&CK Framework** - https://attack.mitre.org/
5. **OWASP Top 10** - https://owasp.org/www-project-top-ten/
6. **JWT RFC 7519** - https://tools.ietf.org/html/rfc7519
7. **Google Gemini AI** - https://ai.google.dev/
8. **PostgreSQL Documentation** - https://www.postgresql.org/docs/
9. **Scikit-learn Documentation** - https://scikit-learn.org/
10. **TypeScript Documentation** - https://www.typescriptlang.org/docs/

### 1.5 Overview

This SRS document is organized into eleven major sections:

- **Section 2** provides an overall description of the system, including product perspective, functions, user classes, and constraints.
- **Section 3** details all system features with descriptions, stimulus/response sequences, and functional requirements.
- **Section 4** specifies external interface requirements including user interfaces, hardware, software, and communication interfaces.
- **Section 5** covers non-functional requirements such as performance, security, and quality attributes.
- **Section 6** describes the system architecture and design.
- **Sections 7-10** provide visual representations through use case diagrams, sequence diagrams, data flow diagrams, and entity relationship diagrams.
- **Section 11** contains appendices with additional supporting information.

---

## 2. Overall Description

### 2.1 Product Perspective

SOC Central V3.1.1 is a standalone enterprise web application that operates as a centralized security management platform. The system integrates with multiple security tools and provides a unified interface for security operations.

**System Context:**

```
┌─────────────────────────────────────────────────────────────────┐
│                     External Security Tools                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ G Suite  │  │   MDM    │  │   SIEM   │  │   EDR    │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐                                    │
│  │  Meraki  │  │SonicWall │                                    │
│  └──────────┘  └──────────┘                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │ Data Import (CSV/Excel)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SOC Central Platform                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Frontend (React + TypeScript)                │  │
│  │  - Authentication UI    - Dashboards    - Admin Panel    │  │
│  │  - Report Builder       - Analytics     - Chat Interface │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Backend (Django REST Framework)                   │  │
│  │  - JWT Authentication   - Data Processing                │  │
│  │  - MITRE Mapping       - ML Anomaly Detection            │  │
│  │  - AI Report Generation - Role-Based Access Control      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                          │  │
│  │  - User Data    - Security Data    - Reports             │  │
│  │  - Companies    - ML Models        - Audit Logs          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Google Gemini│  │  Gmail SMTP  │  │  MITRE API   │          │
│  │      AI      │  │    Email     │  │   ATT&CK     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

**Key Relationships:**
- **Data Sources:** Integrates with multiple security tools via file uploads (CSV/Excel)
- **Database:** PostgreSQL for persistent storage
- **External Services:** Google Gemini AI for report generation and chatbot, Gmail for email notifications
- **Users:** Security analysts, SOC managers, administrators, executives

### 2.2 Product Functions

The major functions of SOC Central include:

**1. Authentication & Security**
- User registration with email verification
- Multi-factor authentication (MFA) via email/SMS
- JWT-based session management
- Password reset and account activation workflows
- Rate limiting and brute-force protection

**2. User & Access Management**
- Four-tier role hierarchy (Super Admin, Master Admin, Admin, General User)
- Company-based user isolation
- Admin panel for user creation and management
- Permission-based feature access
- User activity logging and audit trails

**3. Data Management**
- Multi-tool data upload (G Suite, MDM, SIEM, EDR, Meraki, SonicWall)
- Excel/CSV file processing with multi-sheet support
- SHA-256 hash-based duplicate detection
- Active dataset management
- Company-level data isolation

**4. Security Analytics**
- MITRE ATT&CK technique mapping
- Machine learning anomaly detection
- Interactive dashboards with visualizations
- KPI tracking and trend analysis
- Severity-based alert categorization

**5. Reporting**
- AI-powered report generation
- Multiple report templates (Executive, Technical, Incident)
- Professional formatting with charts and graphs
- Multi-format export (PDF, Word, HTML)
- Custom report sections

**6. AI Assistance**
- Intelligent security chatbot
- Context-aware responses
- Threat intelligence queries
- Incident response guidance

### 2.3 User Classes and Characteristics

#### 2.3.1 Super Admin

**Characteristics:**
- Technical expertise: Expert
- Frequency of use: Daily
- Security knowledge: Advanced
- Business domain knowledge: Comprehensive

**Responsibilities:**
- Global system administration
- Cross-company management
- Tool permission assignment
- System configuration
- User promotion/demotion across all companies

**Privileges:**
- Full system access
- Create/manage all users and companies
- Access all security data
- Manage system-wide settings
- Delete Master Admins (with restrictions)

#### 2.3.2 Master Admin

**Characteristics:**
- Technical expertise: Advanced
- Frequency of use: Daily
- Security knowledge: Advanced
- Business domain knowledge: Company-specific

**Responsibilities:**
- Company-level administration
- User management within company
- Data upload and management
- Report generation and review
- Security posture monitoring

**Privileges:**
- Create up to 3 Admin users
- Create unlimited General users
- Full access to company data
- Generate reports
- Cannot be deleted (security protection)

#### 2.3.3 Admin

**Characteristics:**
- Technical expertise: Intermediate to Advanced
- Frequency of use: Daily
- Security knowledge: Intermediate
- Business domain knowledge: Department-specific

**Responsibilities:**
- Create and manage General users
- Upload security data
- Monitor dashboards
- Generate reports
- Investigate alerts

**Privileges:**
- Create General users for their company
- Upload and manage data
- Access company dashboards
- Generate and export reports
- View analytics

#### 2.3.4 General User

**Characteristics:**
- Technical expertise: Basic to Intermediate
- Frequency of use: Regular
- Security knowledge: Basic
- Business domain knowledge: Role-specific

**Responsibilities:**
- Monitor security dashboards
- View reports and analytics
- Provide input on security matters

**Privileges:**
- Read-only access to dashboards
- View reports
- Access analytics
- No upload or management permissions

### 2.4 Operating Environment

**Client-Side Requirements:**
- **Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Screen Resolution:** Minimum 1366x768, Recommended 1920x1080
- **JavaScript:** Enabled
- **Internet Connection:** Broadband (minimum 1 Mbps)

**Server-Side Environment:**
- **Operating System:** Linux (Ubuntu 20.04+), Windows Server 2019+, or compatible
- **Web Server:** Gunicorn WSGI server
- **Database:** PostgreSQL 13+ or SQLite (development)
- **Python Runtime:** Python 3.10+
- **Node.js:** 18+ (for build process)

**Deployment Platform:**
- Cloud hosting (Render.com, AWS, Azure, GCP)
- On-premises deployment supported
- Container support (Docker ready)

**Network Requirements:**
- HTTPS/TLS 1.2+ for secure communication
- SMTP access for email notifications
- Internet access for AI services (Google Gemini)

### 2.5 Design and Implementation Constraints

**Technical Constraints:**
1. **Memory Limit:** 20MB for file processing (512MB RAM servers)
2. **Upload Size:** Maximum 50MB per file
3. **Database:** Must use PostgreSQL in production
4. **API Design:** RESTful architecture required
5. **Authentication:** JWT tokens mandatory
6. **Browser Support:** Must support modern browsers only

**Regulatory Constraints:**
1. **Data Privacy:** GDPR compliance for EU data
2. **Security Standards:** OWASP Top 10 compliance
3. **Audit Requirements:** Complete activity logging
4. **Data Retention:** Configurable (default 365 days)

**Business Constraints:**
1. **User Limits:** Configurable per company (default 10 users)
2. **Admin Limits:** Master Admin can create max 3 Admins
3. **Master Admin Protection:** Cannot be deleted
4. **Company Isolation:** Strict data separation

**Development Constraints:**
1. **Framework:** Django 5.1.2 for backend
2. **Frontend:** React 18.3+ with TypeScript
3. **AI Service:** Google Gemini API
4. **Version Control:** Git required
5. **Code Style:** PEP 8 (Python), ESLint (TypeScript)

### 2.6 Assumptions and Dependencies

**Assumptions:**
1. Users have basic understanding of security concepts
2. Organizations have defined security processes
3. Security tool data can be exported to CSV/Excel
4. Stable internet connection available
5. Email service (Gmail SMTP) accessible
6. Google Gemini API available and operational

**Dependencies:**

**External Dependencies:**
1. **Google Gemini AI** - For report generation and chatbot
2. **Gmail SMTP** - For email notifications
3. **MITRE ATT&CK** - For threat intelligence framework
4. **Cloud Infrastructure** - For production deployment

**Technology Dependencies:**
1. **Django 5.1.2** - Web framework
2. **React 18.3** - Frontend framework
3. **PostgreSQL 13+** - Database
4. **Python 3.10+** - Runtime environment
5. **Scikit-learn** - Machine learning library
6. **Node.js 18+** - Build tools

**Service Dependencies:**
1. Email delivery service operational
2. Database server availability
3. SSL/TLS certificates valid
4. DNS resolution functional
5. External API rate limits not exceeded

---

## 3. System Features

### 3.1 Authentication and Authorization

**Priority:** High
**Risk:** High

#### 3.1.1 Description

The authentication system provides secure user access through JWT-based tokens, multi-factor authentication, and comprehensive session management. It ensures that only authorized users can access the system and its features based on their assigned roles.

#### 3.1.2 Functional Requirements

**FR-AUTH-001:** User Registration
- System shall allow new users to register with email, password, and company information
- System shall validate email format and password strength
- System shall send verification email with OTP
- System shall support rate limiting (3 signups per hour per IP)

**FR-AUTH-002:** Email Verification
- System shall generate 6-digit OTP for email verification
- OTP shall expire after 10 minutes
- System shall allow maximum 5 verification attempts
- System shall support OTP resend with 2-minute cooldown

**FR-AUTH-003:** Multi-Factor Authentication
- System shall send 4-digit MFA code via email after successful login
- MFA code shall expire after 10 minutes
- System shall allow maximum 3 verification attempts
- System shall support MFA code resend with 2-minute cooldown

**FR-AUTH-004:** JWT Token Management
- System shall generate access tokens valid for 24 hours
- System shall generate refresh tokens valid for 7 days
- System shall support token refresh mechanism
- System shall invalidate tokens on logout

**FR-AUTH-005:** Password Management
- System shall enforce password complexity requirements
- System shall support password reset via email
- Password reset tokens shall expire after 1 hour
- Activation tokens shall expire after 24 hours

**FR-AUTH-006:** Session Management
- System shall track user sessions with IP and device info
- System shall implement 5-minute inactivity timeout
- System shall log all authentication events
- System shall support session termination

**FR-AUTH-007:** Rate Limiting
- Login: 5 attempts per 15 minutes
- Signup: 3 attempts per hour
- Password reset: 3 attempts per hour
- OTP requests: 1 per 2 minutes

### 3.2 User Management

**Priority:** High
**Risk:** Medium

#### 3.2.1 Description

Comprehensive user management system supporting hierarchical role-based access control with four user types: Super Admin, Master Admin, Admin, and General User. Includes admin panel for user creation, modification, and deletion.

#### 3.2.2 Functional Requirements

**FR-USER-001:** User Creation (Admin Panel)
- Admins shall create users with automated email activation
- System shall validate user limits per company
- Master Admin can create up to 3 Admins
- Admins can create unlimited General users
- Super Admin has no creation limits

**FR-USER-002:** User Profile Management
- Users shall update profile information (name, phone, department)
- System shall validate phone number format
- Users shall change password (requires current password)
- System shall maintain profile update history

**FR-USER-003:** Role Management
- Super Admin can promote/demote users to any role
- Master Admin can promote General users to Admin (within limits)
- System shall enforce role hierarchy rules
- Role changes shall be logged and auditable

**FR-USER-004:** Account Activation/Deactivation
- Admins shall activate/deactivate user accounts
- Deactivated users cannot login
- System shall preserve data of deactivated users
- Reactivation shall restore full access

**FR-USER-005:** User Deletion
- Super Admin can delete users (except Master Admin by default)
- System shall implement soft delete with audit trail
- Deleted user data shall be anonymized after retention period
- System shall prevent deletion of users with active sessions

**FR-USER-006:** Password Reset Workflow
- Admins shall trigger password reset for users
- System shall send password reset email
- Users shall set new password via secure link
- Old password shall be invalidated immediately

**FR-USER-007:** User Search and Filtering
- Admin panel shall support search by name, email, role
- System shall filter users by company, status, role
- Results shall be paginated (50 users per page)
- Export user list to CSV

### 3.3 Company Management

**Priority:** High
**Risk:** Medium

#### 3.3.1 Description

Multi-tenancy support with company-level data isolation, tool permissions, and user limits. Enables organizations to manage their own security data independently.

#### 3.3.2 Functional Requirements

**FR-COMP-001:** Company Creation
- Super Admin shall create companies with name and contact info
- System shall assign unique UUID to each company
- System shall set default user limit (10 users)
- System shall enable default security tools

**FR-COMP-002:** Company Configuration
- Super Admin shall configure company details
- System shall manage company contact information
- System shall set email domain for auto-assignment
- System shall configure company address

**FR-COMP-003:** Tool Permission Management
- Super Admin shall enable/disable tools per company
- System shall support 6 tool types (G Suite, MDM, SIEM, EDR, Meraki, SonicWall)
- Permissions shall include granular access (view, upload, analyze, export, manage)
- System shall enforce tool access restrictions

**FR-COMP-004:** User Limit Management
- Super Admin shall configure max users per company
- System shall enforce user limits on creation
- System shall display remaining user slots
- Master Admin creation doesn't count toward admin limit

**FR-COMP-005:** Company Data Isolation
- System shall isolate security data by company
- Users shall only access their company data
- Super Admin can access all company data
- Cross-company access shall be logged

**FR-COMP-006:** Company Analytics
- System shall track user count per company
- System shall monitor admin count (excluding Master Admin)
- System shall display company activity statistics
- System shall generate company usage reports

### 3.4 Security Data Management

**Priority:** High
**Risk:** High

#### 3.4.1 Description

Centralized security data management supporting multiple tool types with intelligent file processing, duplicate detection, and active dataset management.

#### 3.4.2 Functional Requirements

**FR-DATA-001:** File Upload
- System shall accept CSV and Excel files (max 50MB)
- System shall process multiple sheets in Excel files
- System shall validate file format and structure
- System shall generate SHA-256 hash for duplicate detection

**FR-DATA-002:** Data Processing
- System shall parse CSV/Excel data using Pandas
- System shall validate data schema per tool type
- System shall extract metadata (sheet names, record count)
- System shall handle processing errors gracefully

**FR-DATA-003:** Duplicate Detection
- System shall detect duplicate uploads via file hash
- System shall prevent duplicate data upload
- System shall notify user of duplicate files
- System shall allow force upload override (admin only)

**FR-DATA-004:** Active Dataset Management
- System shall maintain one active dataset per tool per company
- Activating dataset shall deactivate previous active dataset
- System shall track activation history (who, when)
- System shall support dataset rollback

**FR-DATA-005:** Data Deletion
- Admins shall delete uploaded datasets
- System shall implement soft delete with grace period
- System shall permanently delete after retention period
- Deletion shall be logged in audit trail

**FR-DATA-006:** Data Access Logging
- System shall log all data access (view, download, analyze)
- Logs shall include user, timestamp, access type
- System shall track cross-company access
- Logs shall be immutable and auditable

**FR-DATA-007:** Data Filtering
- System shall filter data by date range
- System shall support multi-field filtering
- System shall provide filtered data export
- Results shall be paginated for large datasets

### 3.5 MITRE ATT&CK Integration

**Priority:** High
**Risk:** Low

#### 3.5.1 Description

Integration with MITRE ATT&CK framework for threat intelligence, technique mapping, and security coverage analysis across all supported tools.

#### 3.5.2 Functional Requirements

**FR-MITRE-001:** Technique Mapping
- System shall map security events to MITRE ATT&CK techniques
- System shall support 12 MITRE tactics (Initial Access to Impact)
- System shall maintain 50+ technique mappings
- Each technique shall have tool-specific detection rules

**FR-MITRE-002:** Tactic Coverage Analysis
- System shall calculate coverage percentage per tactic
- System shall identify security coverage gaps
- System shall display tactic distribution across tools
- System shall provide tactic-based filtering

**FR-MITRE-003:** Confidence Scoring
- System shall assign confidence scores to technique detections
- Confidence shall be based on data quality and patterns
- System shall support manual confidence adjustment
- High-confidence detections shall be prioritized

**FR-MITRE-004:** Attack Path Reconstruction
- System shall reconstruct attack paths from techniques
- System shall visualize kill chain progression
- System shall identify multi-stage attacks
- System shall correlate techniques across tools

**FR-MITRE-005:** Threat Prioritization
- System shall prioritize threats based on MITRE severity
- Critical techniques shall trigger alerts
- System shall recommend mitigation strategies
- Prioritization shall consider company context

**FR-MITRE-006:** MITRE Dashboard
- System shall display MITRE ATT&CK matrix
- Dashboard shall show technique detection counts
- System shall highlight high-risk techniques
- Dashboard shall support interactive exploration

### 3.6 Machine Learning and Anomaly Detection

**Priority:** Medium
**Risk:** Medium

#### 3.6.1 Description

Automated anomaly detection using machine learning algorithms (Isolation Forest, One-Class SVM, Autoencoder) to identify unusual patterns in security data.

#### 3.6.2 Functional Requirements

**FR-ML-001:** Model Training
- System shall support 3 ML algorithms (Isolation Forest, One-Class SVM, Autoencoder)
- Training shall use active dataset for tool type
- System shall support custom hyperparameter tuning
- Training job progress shall be tracked

**FR-ML-002:** Anomaly Detection
- System shall detect anomalies in real-time
- Anomalies shall have severity levels (Low, Medium, High, Critical)
- System shall calculate anomaly scores and confidence
- Detection results shall be stored persistently

**FR-ML-003:** Feature Engineering
- System shall extract relevant features from security data
- Feature selection shall be tool-specific
- System shall normalize features for ML algorithms
- Feature importance shall be calculated

**FR-ML-004:** Model Management
- System shall maintain one active model per tool per company
- Model versioning and rollback shall be supported
- System shall track model performance metrics
- Models shall be retrained periodically

**FR-ML-005:** Anomaly Investigation
- Users shall investigate detected anomalies
- System shall provide feature contribution analysis
- Investigation notes shall be captured
- Anomalies shall be marked as confirmed or false positive

**FR-ML-006:** Training Job Management
- System shall queue training jobs
- Job status shall be tracked (Pending, Running, Completed, Failed)
- Failed jobs shall log error messages
- Completed jobs shall report performance metrics

### 3.7 Dashboard and Analytics

**Priority:** High
**Risk:** Low

#### 3.7.1 Description

Interactive dashboards providing real-time visualization of security data with tool-specific views, KPI tracking, and customizable date ranges.

#### 3.7.2 Functional Requirements

**FR-DASH-001:** Tool-Specific Dashboards
- System shall provide dedicated dashboard for each tool
- G Suite dashboard: Email threats, phishing, whitelist management
- MDM dashboard: Device compliance, policy violations
- SIEM dashboard: Event correlation, alert trends
- EDR dashboard: Endpoint threats, incident response
- Meraki dashboard: Network traffic, anomalies
- SonicWall dashboard: Firewall logs, intrusion attempts

**FR-DASH-002:** Data Visualization
- System shall display interactive charts (bar, line, pie, area)
- Charts shall use Recharts library
- Visualizations shall be responsive and mobile-friendly
- System shall support chart export as images

**FR-DASH-003:** KPI Metrics
- System shall calculate and display key performance indicators
- KPIs include: Total events, Critical alerts, Resolution time, Coverage %
- Metrics shall update in real-time
- Historical KPI trends shall be available

**FR-DASH-004:** Date Range Filtering
- Users shall filter dashboard data by date range
- Preset ranges: Today, Last 7 days, Last 30 days, Custom
- System shall validate date range inputs
- Filtered data shall update all visualizations

**FR-DASH-005:** Severity-Based Categorization
- System shall categorize alerts by severity
- Color coding: Critical (red), High (orange), Medium (yellow), Low (blue)
- Users shall filter by severity level
- Severity distribution shall be visualized

**FR-DASH-006:** Trend Analysis
- System shall identify security trends over time
- Trending metrics shall be highlighted
- System shall provide predictive analytics
- Trend reports shall be exportable

### 3.8 Report Generation

**Priority:** High
**Risk:** Medium

#### 3.8.1 Description

AI-powered professional report generation supporting multiple report types, templates, and export formats with MITRE ATT&CK integration.

#### 3.8.2 Functional Requirements

**FR-REPORT-001:** Report Types
- System shall support 5 report types:
  - Individual Tool Report
  - Combined Tools Report
  - Executive Summary
  - Incident Report
  - Threat Analysis Report

**FR-REPORT-002:** AI-Powered Content Generation
- System shall use Google Gemini AI for report generation
- AI shall analyze security data and generate insights
- Generated content shall include:
  - Executive Summary
  - Monitoring Overview
  - Incident Summary
  - Critical Threat Analysis
  - Recommendations

**FR-REPORT-003:** Report Templates
- System shall provide predefined templates:
  - Executive Dashboard
  - Technical Analysis
  - Compliance Report
  - Incident Response
- Users shall create custom templates
- Templates shall define sections and chart types

**FR-REPORT-004:** Report Customization
- Users shall select data sources (specific uploads)
- Users shall define report period (start/end dates)
- Users shall add/remove report sections
- Manual editing of AI-generated content shall be supported

**FR-REPORT-005:** Charts and Visualizations
- Reports shall include configurable charts
- Chart types: Bar, Pie, Line, Area, Table
- Charts shall be generated from KPI metrics
- Chart data shall be accurate and up-to-date

**FR-REPORT-006:** Multi-Format Export
- System shall export reports in 3 formats: PDF, Word (DOCX), HTML
- Exported reports shall maintain professional formatting
- Charts shall be embedded in exports
- Export history shall be tracked

**FR-REPORT-007:** Report Management
- Users shall save reports as drafts
- System shall track report status (Draft, Generating, Completed, Published)
- Reports shall be versioned
- Report deletion shall be audited

### 3.9 AI-Powered Chatbot

**Priority:** Medium
**Risk:** Low

#### 3.9.1 Description

Intelligent security chatbot powered by Google Gemini AI providing context-aware assistance, threat intelligence queries, and incident response guidance.

#### 3.9.2 Functional Requirements

**FR-CHAT-001:** Conversation Management
- System shall maintain chat conversations per user
- Conversations shall have unique session IDs
- Chat history shall be preserved
- Users shall start new conversations

**FR-CHAT-002:** Context-Aware Responses
- Chatbot shall have access to user's company data
- Responses shall be tailored to security context
- System shall use company security data for insights
- Context shall include tool data, anomalies, reports

**FR-CHAT-003:** Security Queries
- Users shall query security events and alerts
- Chatbot shall provide threat intelligence information
- MITRE ATT&CK technique explanations shall be available
- Real-time data analysis shall be supported

**FR-CHAT-004:** Incident Response Guidance
- Chatbot shall provide incident response recommendations
- Step-by-step remediation guidance shall be given
- Best practices shall be suggested
- Chatbot shall reference industry standards

**FR-CHAT-005:** AI Model Integration
- System shall use Google Gemini 1.5 Flash model
- API calls shall be rate-limited
- Response time shall be tracked
- Fallback responses for API failures

**FR-CHAT-006:** Message History
- All messages shall be stored persistently
- Message type (user/bot) shall be tracked
- Timestamps shall be recorded
- Processing time per response shall be logged

### 3.10 Multi-Tool Integration

**Priority:** High
**Risk:** Medium

#### 3.10.1 Description

Integration layer supporting 6 security tools with tool-specific data processors, parsers, and analytics engines.

#### 3.10.2 Functional Requirements

**FR-TOOL-001:** G Suite Integration
- System shall process G Suite security logs
- Email threat detection (phishing, malware, spam)
- Whitelist management for trusted senders
- Email delivery analysis
- User activity monitoring

**FR-TOOL-002:** MDM Integration
- System shall process mobile device management data
- Device compliance tracking
- Policy violation detection
- Device inventory management
- Security posture assessment

**FR-TOOL-003:** SIEM Integration
- System shall process SIEM event data
- Security event correlation
- Alert management and prioritization
- Log aggregation and analysis
- Threat detection rules

**FR-TOOL-004:** EDR Integration
- System shall process endpoint detection data
- Integration with Wazuh EDR
- Endpoint threat detection
- Incident response tracking
- Vulnerability assessment

**FR-TOOL-005:** Meraki Integration
- System shall process Meraki network data
- Network traffic analysis
- Anomaly detection in traffic patterns
- Network device monitoring
- Bandwidth utilization tracking

**FR-TOOL-006:** SonicWall Integration
- System shall process SonicWall firewall logs
- Firewall rule analysis
- Intrusion detection and prevention
- VPN connection monitoring
- Threat prevention tracking

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 General UI Requirements

**UI-001:** Responsive Design
- Interface shall be responsive (mobile, tablet, desktop)
- Minimum screen resolution: 1366x768
- Optimal viewing on 1920x1080 displays
- Touch-friendly on mobile devices

**UI-002:** Design System
- Shall use shadcn/ui component library
- Radix UI primitives for accessibility
- Tailwind CSS for styling
- Consistent color scheme and typography

**UI-003:** Navigation
- Main navigation sidebar with tool icons
- Breadcrumb navigation for context
- Quick access search functionality
- User profile menu with settings

**UI-004:** Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode option

#### 4.1.2 Specific Screen Requirements

**Authentication Screens:**
- Login page with email/password fields
- MFA verification with OTP input
- Password reset request form
- Account activation interface
- Email verification screen

**Dashboard Screens:**
- Main dashboard with KPI cards
- Tool-specific dashboard layouts
- Interactive charts and graphs
- Date range selector
- Filter panels

**Admin Panel:**
- User management table with actions
- Company management interface
- Create user form with validation
- Role assignment interface
- Bulk operations support

**Report Builder:**
- Report type selection
- Data source selector
- Date range picker
- Template chooser
- Report preview pane
- Export format options

**Analytics Pages:**
- MITRE ATT&CK matrix visualization
- Anomaly detection results table
- Trend analysis charts
- Security coverage heatmap

**Chat Interface:**
- Message input field
- Conversation history display
- Typing indicators
- Code syntax highlighting
- Markdown rendering

### 4.2 Hardware Interfaces

**HI-001:** Server Hardware
- Minimum 2 CPU cores (4 recommended)
- Minimum 2GB RAM (4GB recommended)
- Minimum 20GB storage (SSD recommended)
- Network interface card for connectivity

**HI-002:** Client Hardware
- Modern processor (Intel i3+ or equivalent)
- Minimum 4GB RAM
- Display adapter supporting 1366x768+
- Network connectivity (Ethernet/Wi-Fi)

### 4.3 Software Interfaces

#### 4.3.1 Database Interface

**SI-DB-001:** PostgreSQL Interface
- Database: PostgreSQL 13+
- ORM: Django ORM
- Connection pooling: psycopg2-binary
- Migration management: Django migrations

#### 4.3.2 External API Interfaces

**SI-API-001:** Google Gemini AI
- API: Google Generative AI API
- Model: gemini-1.5-flash
- Authentication: API key
- Rate limit: Per Google's limits
- Use cases: Report generation, chatbot

**SI-API-002:** Email Service
- Protocol: SMTP with TLS
- Service: Gmail SMTP
- Port: 587
- Authentication: OAuth2 or App Password
- Use cases: Account activation, password reset, MFA

**SI-API-003:** MITRE ATT&CK
- Data source: MITRE ATT&CK framework
- Format: JSON/Static data
- Update frequency: Quarterly
- Use cases: Technique mapping, threat intelligence

#### 4.3.3 Frontend-Backend API

**SI-API-004:** REST API
- Protocol: HTTPS/TLS
- Format: JSON
- Authentication: JWT Bearer tokens
- Base URL: /api/
- API documentation: OpenAPI/Swagger

**API Endpoints:**

**Authentication:**
- POST /api/auth/signup/ - User registration
- POST /api/auth/login/ - User login
- POST /api/auth/verify-mfa/ - MFA verification
- POST /api/auth/logout/ - User logout
- POST /api/auth/refresh/ - Token refresh
- POST /api/auth/password-reset/ - Request password reset
- POST /api/auth/activate/ - Account activation

**User Management:**
- GET /api/auth/admin/users/ - List users
- POST /api/auth/admin/create-user/ - Create user
- PUT /api/auth/admin/update-user/:id/ - Update user
- DELETE /api/auth/admin/delete-user/:id/ - Delete user
- POST /api/auth/admin/toggle-activation/:id/ - Activate/deactivate

**Company Management:**
- GET /api/auth/companies/ - List companies
- POST /api/auth/companies/ - Create company
- PUT /api/auth/companies/:id/ - Update company
- DELETE /api/auth/companies/:id/ - Delete company
- PUT /api/auth/companies/:id/tools/ - Update tool permissions

**Data Management:**
- POST /api/tool/upload/ - Upload security data
- GET /api/tool/:toolType/active/ - Get active dataset
- POST /api/tool/:toolType/activate/:id/ - Activate dataset
- DELETE /api/tool/:toolType/delete/:id/ - Delete dataset
- GET /api/tool/:toolType/filtered/ - Get filtered data

**Reports:**
- GET /api/tool/reports/ - List reports
- POST /api/tool/reports/ - Create report
- GET /api/tool/reports/:id/ - Get report details
- POST /api/tool/reports/:id/generate/ - Generate report content
- POST /api/tool/reports/:id/export/ - Export report

**ML & Analytics:**
- POST /api/tool/ml/train/ - Train anomaly model
- GET /api/tool/ml/anomalies/ - Get anomalies
- POST /api/tool/ml/detect/ - Run anomaly detection
- GET /api/tool/ml/jobs/ - List training jobs

**Chatbot:**
- POST /api/tool/chatbot/message/ - Send chat message
- GET /api/tool/chatbot/conversations/ - List conversations
- GET /api/tool/chatbot/conversations/:id/ - Get conversation history

### 4.4 Communications Interfaces

**CI-001:** HTTPS Protocol
- All communications shall use HTTPS/TLS 1.2+
- SSL certificate required for production
- HTTP requests shall redirect to HTTPS
- Certificate validation enforced

**CI-002:** WebSocket (Future)
- Real-time notifications (planned feature)
- Chat message streaming (planned)
- Dashboard live updates (planned)

**CI-003:** Email Protocol
- SMTP with TLS encryption
- Port 587 for submission
- STARTTLS required
- SPF/DKIM validation recommended

**CI-004:** File Transfer
- Multipart form-data for file uploads
- Base64 encoding for small files
- Chunked transfer for large files
- Content-Type validation

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

**NFR-PERF-001:** Response Time
- Page load time: < 2 seconds (90th percentile)
- API response time: < 500ms (average)
- Dashboard rendering: < 1 second
- Report generation: < 30 seconds for standard reports
- Database queries: < 200ms (average)

**NFR-PERF-002:** Throughput
- Support 100 concurrent users per company
- Process 100,000 records per upload
- Handle 50 file uploads simultaneously
- Support 1000 API requests per minute

**NFR-PERF-003:** Scalability
- Horizontal scaling via load balancing
- Database connection pooling
- Stateless API design
- Caching for frequently accessed data

**NFR-PERF-004:** Resource Utilization
- Memory: Max 20MB per file processing operation
- CPU: Max 80% sustained utilization
- Database connections: Max 100 concurrent
- Storage: Efficient data compression

### 5.2 Security Requirements

**NFR-SEC-001:** Authentication
- Password minimum 8 characters with complexity requirements
- MFA required for admin accounts (recommended for all)
- JWT tokens with short expiration (24 hours)
- Refresh token rotation
- Session invalidation on logout

**NFR-SEC-002:** Authorization
- Role-based access control (RBAC)
- Principle of least privilege
- Company-level data isolation
- Permission checks on all API endpoints
- Admin action authorization

**NFR-SEC-003:** Data Protection
- Encryption at rest (database encryption)
- Encryption in transit (TLS 1.2+)
- Password hashing with bcrypt/PBKDF2
- Sensitive data masking in logs
- Secure file storage

**NFR-SEC-004:** Input Validation
- Server-side validation for all inputs
- SQL injection prevention via ORM
- XSS prevention via output encoding
- CSRF token validation
- File upload validation (type, size, content)

**NFR-SEC-005:** Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- X-XSS-Protection: 1; mode=block

**NFR-SEC-006:** Audit and Logging
- Log all authentication attempts
- Log all administrative actions
- Log all data access
- Immutable audit trail
- Log retention: 365 days minimum

**NFR-SEC-007:** Rate Limiting
- Login: 5 attempts per 15 minutes per IP
- API: 100 requests per minute per user
- File upload: 10 uploads per hour per user
- Password reset: 3 requests per hour per email

### 5.3 Software Quality Attributes

#### 5.3.1 Reliability

**NFR-REL-001:** Availability
- System uptime: 99.5% (excluding planned maintenance)
- Planned maintenance window: 2 hours per month
- Maximum unplanned downtime: 4 hours per month
- Graceful degradation for non-critical features

**NFR-REL-002:** Fault Tolerance
- Database connection retry logic
- API timeout handling
- Graceful error messages
- Automatic failover for critical services

**NFR-REL-003:** Data Integrity
- Database transaction management
- Referential integrity constraints
- Data validation on write operations
- Backup and recovery procedures

#### 5.3.2 Usability

**NFR-USE-001:** Learnability
- Intuitive interface requiring minimal training
- Contextual help and tooltips
- Onboarding tutorial for new users
- Comprehensive user documentation

**NFR-USE-002:** Efficiency
- Keyboard shortcuts for common actions
- Bulk operations support
- Quick search functionality
- Recently used items

**NFR-USE-003:** Error Handling
- Clear, actionable error messages
- Field-level validation feedback
- Confirmation dialogs for destructive actions
- Error recovery guidance

#### 5.3.3 Maintainability

**NFR-MAIN-001:** Code Quality
- PEP 8 compliance (Python)
- ESLint compliance (TypeScript)
- Maximum cyclomatic complexity: 10
- Code comments for complex logic
- Minimum 70% code coverage (unit tests)

**NFR-MAIN-002:** Modularity
- Clear separation of concerns
- Reusable components
- Service-oriented architecture
- API versioning support

**NFR-MAIN-003:** Documentation
- API documentation (OpenAPI/Swagger)
- Code documentation (docstrings)
- Architecture documentation
- Deployment guides

#### 5.3.4 Portability

**NFR-PORT-001:** Platform Independence
- Cross-platform server deployment (Linux, Windows)
- Cross-browser client support
- Database abstraction via ORM
- Environment-based configuration

**NFR-PORT-002:** Deployment Flexibility
- Docker containerization support
- Cloud deployment (Render, AWS, Azure, GCP)
- On-premises deployment option
- Configuration via environment variables

### 5.4 Business Rules

**BR-001:** Master Admin Protection
- Each company must have exactly one Master Admin
- Master Admin cannot be deleted by default
- Master Admin is auto-created with company

**BR-002:** Admin Creation Limits
- Master Admin can create maximum 3 Admin users
- Super Admin has no creation limits
- General users cannot create other users

**BR-003:** Company User Limits
- Default limit: 10 users per company
- Configurable by Super Admin
- Limit enforcement on user creation
- Master Admin doesn't count toward limit

**BR-004:** Data Isolation
- Users can only access their company's data
- Super Admin can access all companies' data
- Cross-company access is logged
- Data sharing requires explicit permission

**BR-005:** Active Dataset Rule
- Only one active dataset per tool per company
- Activating new dataset deactivates previous
- Deactivated datasets are retained
- Dataset deletion is soft delete initially

**BR-006:** Authentication Requirements
- Email verification required before login
- MFA recommended for admin accounts
- Password must meet complexity requirements
- Inactive accounts auto-disabled after 90 days

**BR-007:** Report Generation
- Reports can only include company's own data
- AI-generated content requires approval before publishing
- Reports are versioned
- Export limited to 10 reports per day per user

---

## 6. System Architecture and Design

### 6.1 System Architecture

#### 6.1.1 Overall Architecture

SOC Central follows a three-tier architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              React Frontend (TypeScript)                  │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │  Pages   │  │Components│  │ Contexts │  │  Hooks   │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │  │
│  │                                                            │  │
│  │  ┌───────────────────────────────────────────────────┐   │  │
│  │  │         TanStack Query (API Client)                │   │  │
│  │  └───────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS/REST API (JSON)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                     APPLICATION TIER                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           Django REST Framework Backend                   │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │                 API Layer                           │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │  │
│  │  │  │Auth Views│  │Tool Views│  │Admin Views│         │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘         │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              Middleware Layer                       │  │  │
│  │  │  - Authentication   - Logging   - Rate Limiting    │  │  │
│  │  │  - CORS            - Security   - Error Handling   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┢━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┪  │  │
│  │  ┃             Business Logic Layer                  ┃  │  │
│  │  ┢━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┪  │  │
│  │  │                                                        │  │
│  │  │  ┌──────────────┐  ┌──────────────┐                 │  │
│  │  │  │   Services   │  │   Utilities  │                 │  │
│  │  │  ├──────────────┤  ├──────────────┤                 │  │
│  │  │  │ Email Service│  │Data Validator│                 │  │
│  │  │  │ AI Service   │  │File Processor│                 │  │
│  │  │  │ MITRE Mapper │  │Hash Generator│                 │  │
│  │  │  │ Data Filter  │  │Date Utilities│                 │  │
│  │  │  └──────────────┘  └──────────────┘                 │  │
│  │  │                                                        │  │
│  │  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  │         Tool Processors                        │ │  │
│  │  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │ │  │
│  │  │  │  │GSuite│ │ MDM  │ │ SIEM │ │ EDR  │          │ │  │
│  │  │  │  └──────┘ └──────┘ └──────┘ └──────┘          │ │  │
│  │  │  │  ┌──────┐ ┌──────────┐                        │ │  │
│  │  │  │  │Meraki│ │SonicWall │                        │ │  │
│  │  │  │  └──────┘ └──────────┘                        │ │  │
│  │  │  └────────────────────────────────────────────────┘ │  │
│  │  │                                                        │  │
│  │  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  │         ML & AI Components                     │ │  │
│  │  │  │  - Anomaly Detector (scikit-learn)            │ │  │
│  │  │  │  - Report Generator (Google Gemini)           │ │  │
│  │  │  │  - Chatbot Engine (Google Gemini)             │ │  │
│  │  │  └────────────────────────────────────────────────┘ │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │                 Data Access Layer                   │  │  │
│  │  │         Django ORM (Object-Relational Mapping)     │  │  │
│  │  │  - Models    - Queries    - Migrations            │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Database Protocol
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                         DATA TIER                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                PostgreSQL Database                         │  │
│  │                                                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │  │
│  │  │Authentication│ │   Tools    │  │  Reports   │          │  │
│  │  │   Schema    │  │  Schema    │  │   Schema   │          │  │
│  │  └────────────┘  └────────────┘  └────────────┘          │  │
│  │                                                            │  │
│  │  - Users            - SecurityDataUpload  - SOCReport     │  │
│  │  - Companies        - AnomalyDetection    - SOCReportSection│
│  │  - UserSessions     - AnomalyModel        - ChatConversation│
│  │  - MFACodes         - DataAccessLog       - ChatMessage   │  │
│  │  - PasswordResetToken - ProcessingLog    - Templates      │  │
│  │  - OTPVerification  - ML Training Jobs                    │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.1.2 Component Interaction

**Authentication Flow:**
```
User -> Frontend -> API (Login) -> JWT Service -> Database
                       ↓
                    Email Service -> SMTP -> User Email
                       ↓
User -> Frontend -> API (MFA) -> JWT Service -> Access Granted
```

**Data Upload Flow:**
```
User -> Frontend -> API (Upload) -> File Validator -> File Processor
                                         ↓
                                   Hash Generator -> Duplicate Check
                                         ↓
                                   Tool Processor -> JSON Storage
                                         ↓
                                   Database -> Success Response
```

**Report Generation Flow:**
```
User -> Frontend -> API (Create Report) -> Data Aggregation
                                                ↓
                                          AI Service (Gemini)
                                                ↓
                                          Content Generation
                                                ↓
                                          Database Storage
                                                ↓
                                          Export Service -> PDF/DOCX
```

### 6.2 Database Design

#### 6.2.1 Database Schema Overview

The database consists of three main schema groups:

1. **Authentication Schema** - User management, authentication, authorization
2. **Tools Schema** - Security data, uploads, processing
3. **Reports & Analytics Schema** - Reports, ML models, chat

#### 6.2.2 Key Tables and Relationships

**Authentication Tables:**
- `companies` - Organization/company records
- `auth_users` - User accounts with roles
- `company_tool_permissions` - Granular tool access per company
- `otp_verifications` - Email/SMS OTP codes
- `password_reset_tokens` - Password reset and activation tokens
- `user_sessions` - Active user sessions
- `mfa_codes` - Multi-factor authentication codes
- `user_settings` - User preferences
- `user_activity_log` - Audit trail

**Tools Tables:**
- `security_data_upload` - Uploaded security data
- `data_access_log` - Data access audit trail
- `processing_log` - Data processing events
- `data_notification` - User notifications

**ML & Analytics Tables:**
- `anomaly_model` - Trained ML models
- `anomaly_detection` - Detected anomalies
- `anomaly_training_job` - Training job tracking

**Reports Tables:**
- `soc_report` - Main report records
- `soc_report_section` - Report sections
- `soc_report_template` - Report templates
- `soc_report_export` - Export history

**Chat Tables:**
- `chat_conversation` - Chat sessions
- `chat_message` - Individual messages

### 6.3 Component Design

#### 6.3.1 Frontend Components

**Component Hierarchy:**
```
App
├── AuthPage
│   ├── LoginForm
│   ├── SignupForm
│   ├── MFAVerification
│   └── PasswordReset
├── Dashboard
│   ├── Sidebar
│   ├── Header
│   ├── MainContent
│   │   ├── KPICards
│   │   ├── Charts
│   │   └── DataTable
│   └── Footer
├── AdminPanel
│   ├── UserManagement
│   │   ├── UserTable
│   │   ├── CreateUserForm
│   │   └── UserActions
│   └── CompanyManagement
│       ├── CompanyTable
│       └── CompanyForm
├── ReportsPage
│   ├── ReportList
│   ├── ReportBuilder
│   │   ├── DataSourceSelector
│   │   ├── DateRangePicker
│   │   └── TemplateChooser
│   └── ReportPreview
├── AnalyticsPage
│   ├── MITREMatrix
│   ├── AnomalyList
│   └── TrendCharts
└── ChatInterface
    ├── ConversationList
    ├── MessageDisplay
    └── MessageInput
```

#### 6.3.2 Backend Modules

**Module Structure:**
```
backend/
├── authentication/
│   ├── models.py - User, Company, Session models
│   ├── serializers.py - API serializers
│   ├── views/ - View modules
│   │   ├── auth_views.py
│   │   ├── admin_views.py
│   │   └── user_management_views.py
│   ├── services.py - Email, auth services
│   ├── middleware.py - Security middleware
│   └── urls.py - URL routing
├── tool/
│   ├── models.py - Upload, Report, ML models
│   ├── views/ - Tool views
│   │   ├── universal.py
│   │   ├── admin.py
│   │   └── service_dashboard_views.py
│   ├── gsuite/ - G Suite processor
│   ├── mdm/ - MDM processor
│   ├── siem/ - SIEM processor
│   ├── edr/ - EDR processor
│   ├── meraki/ - Meraki processor
│   ├── sonicwall/ - SonicWall processor
│   ├── ml/ - Machine learning
│   │   ├── anomaly_detector.py
│   │   └── views.py
│   └── services/
│       ├── ai_service.py
│       ├── data_filter_service.py
│       └── professional_report_generator.py
└── core/
    ├── settings.py - Configuration
    ├── urls.py - Main routing
    └── wsgi.py - WSGI application
```

---

## 7. Use Case Diagrams

### 7.1 Overall System Use Case

```
                    SOC Central System Use Cases

┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    ┌──────────────────────┐                     │
│                    │   General User       │                     │
│                    └──────┬───────────────┘                     │
│                           │                                      │
│          ┌────────────────┼────────────────┐                    │
│          │                │                │                    │
│          ▼                ▼                ▼                    │
│   ┌───────────┐  ┌────────────┐  ┌──────────────┐             │
│   │   View    │  │    View    │  │  View Chat   │             │
│   │Dashboards │  │  Reports   │  │   History    │             │
│   └───────────┘  └────────────┘  └──────────────┘             │
│                                                                  │
│                    ┌──────────────────────┐                     │
│                    │      Admin           │                     │
│                    └──────┬───────────────┘                     │
│                           │                                      │
│          ┌────────────────┼────────────────┐                    │
│          │                │                │                    │
│          ▼                ▼                ▼                    │
│   ┌───────────┐  ┌────────────┐  ┌──────────────┐             │
│   │  Create   │  │   Upload   │  │   Generate   │             │
│   │   Users   │  │Security Data│ │   Reports    │             │
│   └───────────┘  └────────────┘  └──────────────┘             │
│          │                │                │                    │
│          ▼                ▼                ▼                    │
│   ┌───────────┐  ┌────────────┐  ┌──────────────┐             │
│   │  Activate │  │  Activate  │  │    Train     │             │
│   │   Users   │  │  Datasets  │  │  ML Models   │             │
│   └───────────┘  └────────────┘  └──────────────┘             │
│                                                                  │
│                    ┌──────────────────────┐                     │
│                    │   Master Admin       │                     │
│                    └──────┬───────────────┘                     │
│                           │                                      │
│          ┌────────────────┼────────────────┐                    │
│          │                │                │                    │
│          ▼                ▼                ▼                    │
│   ┌───────────┐  ┌────────────┐  ┌──────────────┐             │
│   │  Create   │  │   Manage   │  │    Manage    │             │
│   │  Admins   │  │  Company   │  │   Company    │             │
│   │(Max 3)    │  │   Users    │  │     Data     │             │
│   └───────────┘  └────────────┘  └──────────────┘             │
│                                                                  │
│                    ┌──────────────────────┐                     │
│                    │   Super Admin        │                     │
│                    └──────┬───────────────┘                     │
│                           │                                      │
│          ┌────────────────┼────────────────┐                    │
│          │                │                │                    │
│          ▼                ▼                ▼                    │
│   ┌───────────┐  ┌────────────┐  ┢━━━━━━━━━━━━━┪             │
│   │  Create   │  │   Assign   │  ┃   Access    ┃             │
│   │Companies  │  │    Tool    │  ┃     All     ┃             │
│   │           │  │Permissions │  ┃  Companies  ┃             │
│   └───────────┘  └────────────┘  ┗━━━━━━━━━━━━━┛             │
│          │                │                │                    │
│          ▼                ▼                ▼                    │
│   ┌───────────┐  ┌────────────┐  ┌──────────────┐             │
│   │  Manage   │  │ Configure  │  │   Promote/   │             │
│   │    All    │  │   System   │  │    Demote    │             │
│   │   Users   │  │  Settings  │  │    Users     │             │
│   └───────────┘  └────────────┘  └──────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Authentication Use Cases

```
        Authentication & Authorization Use Cases

┌──────────────────────────────────────────────────────────────┐
│                                                               │
│         ┌────────────┐                                        │
│         │    User    │                                        │
│         └─────┬──────┘                                        │
│               │                                               │
│               │ ┌───────────────────────────────────┐        │
│               ├─│       User Registration           │        │
│               │ │  - Enter email, password         │        │
│               │ │  - Receive OTP email             │        │
│               │ │  - Verify OTP                    │        │
│               │ │  - Account created               │        │
│               │ └───────────────────────────────────┘        │
│               │                                               │
│               │ ┌───────────────────────────────────┐        │
│               ├─│       Account Activation          │        │
│               │ │  - Receive activation email      │        │
│               │ │  - Click activation link         │        │
│               │ │  - Set initial password          │        │
│               │ │  - Account activated             │        │
│               │ └───────────────────────────────────┘        │
│               │                                               │
│               │ ┌───────────────────────────────────┐        │
│               ├─│            Login                  │        │
│               │ │  - Enter email & password        │        │
│               │ │  - Receive MFA code              │        │
│               │ │  - Verify MFA code               │        │
│               │ │  - Receive JWT tokens            │        │
│               │ └───────────────────────────────────┘        │
│               │                                               │
│               │ ┌───────────────────────────────────┐        │
│               ├─│       Password Reset              │        │
│               │ │  - Request password reset        │        │
│               │ │  - Receive reset email           │        │
│               │ │  - Click reset link              │        │
│               │ │  - Set new password              │        │
│               │ └───────────────────────────────────┘        │
│               │                                               │
│               │ ┌───────────────────────────────────┐        │
│               └─│           Logout                  │        │
│                 │  - Invalidate JWT tokens         │        │
│                 │  - End session                   │        │
│                 └───────────────────────────────────┘        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 Data Management Use Cases

```
         Security Data Management Use Cases

┌──────────────────────────────────────────────────────────────┐
│                                                               │
│      ┌────────────┐                                           │
│      │   Admin    │                                           │
│      └─────┬──────┘                                           │
│            │                                                  │
│            │ ┌───────────────────────────────────┐           │
│            ├─│      Upload Security Data         │           │
│            │ │  - Select tool type               │           │
│            │ │  - Choose file (CSV/Excel)        │           │
│            │ │  - Validate file format           │           │
│            │ │  - Check for duplicates           │           │
│            │ │  - Process data                   │           │
│            │ │  - Store in database              │           │
│            │ └───────────────────────────────────┘           │
│            │                                                  │
│            │ ┌───────────────────────────────────┐           │
│            ├─│      Activate Dataset             │           │
│            │ │  - Select uploaded dataset        │           │
│            │ │  - Deactivate current active      │           │
│            │ │  - Set as active dataset          │           │
│            │ │  - Update dashboards              │           │
│            │ └───────────────────────────────────┘           │
│            │                                                  │
│            │ ┌───────────────────────────────────┐           │
│            ├─│      Delete Dataset               │           │
│            │ │  - Select dataset to delete       │           │
│            │ │  - Confirm deletion               │           │
│            │ │  - Soft delete dataset            │           │
│            │ │  - Log deletion action            │           │
│            │ └───────────────────────────────────┘           │
│            │                                                  │
│            │ ┌───────────────────────────────────┐           │
│            ├─│      Filter Data                  │           │
│            │ │  - Select date range              │           │
│            │ │  - Apply filters                  │           │
│            │ │  - View filtered results          │           │
│            │ │  - Export filtered data           │           │
│            │ └───────────────────────────────────┘           │
│            │                                                  │
│            │ ┌───────────────────────────────────┐           │
│            └─│  View Data Access Logs            │           │
│              │  - View access history            │           │
│              │  - Filter by user/date            │           │
│              │  - Identify cross-company access  │           │
│              │  - Generate audit reports         │           │
│              └───────────────────────────────────┘           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Sequence Diagrams

### 8.1 User Authentication Sequence

```
User Login with MFA

User          Frontend       Backend API    JWT Service    Email Service    Database
 │                │               │              │               │              │
 │  Enter Login  │               │              │               │              │
 │  Credentials  │               │              │               │              │
 ├───────────────>│               │              │               │              │
 │                │  POST /login  │              │               │              │
 │                ├──────────────>│              │               │              │
 │                │               │  Verify      │               │              │
 │                │               │  Credentials │               │              │
 │                │               ├─────────────────────────────>│              │
 │                │               │              │               │  Query User  │
 │                │               │              │               │<─────────────┤
 │                │               │              │               │  User Found  │
 │                │               │              │               │──────────────>│
 │                │               │  Generate    │               │              │
 │                │               │  MFA Code    │               │              │
 │                │               ├──────────────>│               │              │
 │                │               │              │  Send MFA     │              │
 │                │               │              │  Email        │              │
 │                │               │              ├──────────────>│              │
 │                │               │              │               │  Store Code  │
 │                │               │              │               ├─────────────>│
 │                │  MFA Required │              │               │              │
 │                │<──────────────┤              │               │              │
 │  MFA Code Sent │               │              │               │              │
 │<───────────────┤               │              │               │              │
 │                │               │              │               │              │
 │  Enter MFA     │               │              │               │              │
 │  Code          │               │              │               │              │
 ├───────────────>│               │              │               │              │
 │                │  POST         │              │               │              │
 │                │  /verify-mfa  │              │               │              │
 │                ├──────────────>│              │               │              │
 │                │               │  Verify Code │               │              │
 │                │               ├─────────────────────────────>│              │
 │                │               │              │               │  Check Code  │
 │                │               │              │               │<─────────────┤
 │                │               │              │               │  Valid       │
 │                │               │              │               │──────────────>│
 │                │               │  Generate    │               │              │
 │                │               │  JWT Tokens  │               │              │
 │                │               ├──────────────>│               │              │
 │                │               │  Access +    │               │              │
 │                │               │  Refresh     │               │              │
 │                │               │<──────────────┤               │              │
 │                │  JWT Tokens   │              │               │  Create      │
 │                │  + User Info  │              │               │  Session     │
 │                │<──────────────┤              │               ├─────────────>│
 │  Login Success │               │              │               │              │
 │<───────────────┤               │              │               │              │
 │                │               │              │               │              │
```

### 8.2 File Upload and Processing Sequence

```
Security Data Upload Process

Admin       Frontend      Backend API   File Processor   MITRE Mapper   Database
 │              │               │              │               │            │
 │  Select File │               │              │               │            │
 │  & Tool Type │               │              │               │            │
 ├─────────────>│               │              │               │            │
 │              │  POST /upload │              │               │            │
 │              │  (multipart)  │              │               │            │
 │              ├──────────────>│              │               │            │
 │              │               │  Validate    │               │            │
 │              │               │  File        │               │            │
 │              │               ├──────────────>│               │            │
 │              │               │  Generate    │               │            │
 │              │               │  Hash        │               │            │
 │              │               │<──────────────┤               │            │
 │              │               │              │               │  Check     │
 │              │               │              │               │  Duplicate │
 │              │               ├─────────────────────────────────────────>│
 │              │               │              │               │  Not Found │
 │              │               │<─────────────────────────────────────────┤
 │              │               │  Parse File  │               │            │
 │              │               │  (Pandas)    │               │            │
 │              │               ├──────────────>│               │            │
 │              │               │  Process     │               │            │
 │              │               │  Rows        │               │            │
 │              │               │<──────────────┤               │            │
 │              │               │  Map to      │               │            │
 │              │               │  MITRE       │               │            │
 │              │               ├──────────────────────────────>│            │
 │              │               │  Techniques  │               │            │
 │              │               │<──────────────────────────────┤            │
 │              │               │              │               │  Store     │
 │              │               │              │               │  Upload    │
 │              │               ├─────────────────────────────────────────>│
 │              │               │              │               │  Upload ID │
 │              │               │<─────────────────────────────────────────┤
 │              │  Upload       │              │               │            │
 │              │  Success +    │              │               │            │
 │              │  Upload ID    │              │               │            │
 │              │<──────────────┤              │               │            │
 │  Processing  │               │              │               │            │
 │  Complete    │               │              │               │            │
 │<─────────────┤               │              │               │            │
 │              │               │              │               │            │
```

### 8.3 Report Generation Sequence

```
AI-Powered Report Generation

Admin       Frontend      Backend API   AI Service    Report Generator   Database
 │              │               │           │               │               │
 │  Select      │               │           │               │               │
 │  Report Type │               │           │               │               │
 │  & Data      │               │           │               │               │
 ├─────────────>│               │           │               │               │
 │              │  POST         │           │               │               │
 │              │  /reports/    │           │               │               │
 │              │  create       │           │               │               │
 │              ├──────────────>│           │               │               │
 │              │               │  Fetch    │               │               │
 │              │               │  Data     │               │               │
 │              │               ├──────────────────────────────────────────>│
 │              │               │  Security │               │  Active Data  │
 │              │               │<──────────────────────────────────────────┤
 │              │               │  Calculate│               │               │
 │              │               │  KPIs     │               │               │
 │              │               ├──────────>│               │               │
 │              │               │  KPI Data │               │               │
 │              │               │<──────────┤               │               │
 │              │               │  Generate │               │               │
 │              │               │  Prompt   │               │               │
 │              │               ├──────────────────────────>│               │
 │              │               │  Call     │               │               │
 │              │               │  Gemini   │               │               │
 │              │               │  API      │               │               │
 │              │               ├──────────>│               │               │
 │              │               │  AI       │               │               │
 │              │               │  Content  │               │               │
 │              │               │<──────────┤               │               │
 │              │               │  Format   │               │               │
 │              │               │  Report   │               │               │
 │              │               │<──────────────────────────┤               │
 │              │               │           │               │  Save Report  │
 │              │               ├──────────────────────────────────────────>│
 │              │  Report       │           │               │  Report ID    │
 │              │  Created      │           │               │<──────────────┤
 │              │<──────────────┤           │               │               │
 │  View Report │               │           │               │               │
 │<─────────────┤               │           │               │               │
 │              │               │           │               │               │
 │  Export PDF  │               │           │               │               │
 ├─────────────>│  POST /export │           │               │               │
 │              ├──────────────>│  Generate │               │               │
 │              │               │  PDF      │               │               │
 │              │               ├──────────────────────────>│               │
 │              │               │  PDF File │               │               │
 │              │               │<──────────────────────────┤               │
 │              │  Download     │           │               │               │
 │              │  PDF          │           │               │               │
 │              │<──────────────┤           │               │               │
 │  PDF         │               │           │               │               │
 │  Downloaded  │               │           │               │               │
 │<─────────────┤               │           │               │               │
 │              │               │           │               │               │
```

---

## 9. Data Flow Diagrams

### 9.1 Level 0 DFD (Context Diagram)

```
                    SOC Central - Context Diagram

┌──────────────┐                                        ┌──────────────┐
│              │   Security Data (CSV/Excel)            │              │
│ Security     ├───────────────────────────────────────>│              │
│ Admin        │                                        │              │
│              │<───────────────────────────────────────┤              │
│              │   Dashboards, Reports, Alerts          │              │
└──────────────┘                                        │              │
                                                        │              │
┌──────────────┐                                        │              │
│              │   Login, View Dashboards               │              │
│ Security     ├───────────────────────────────────────>│              │
│ Analyst      │                                        │              │
│              │<───────────────────────────────────────┤    SOC       │
│              │   Security Insights, Reports           │   Central    │
└──────────────┘                                        │   Platform   │
                                                        │              │
┌──────────────┐                                        │              │
│              │   User Management                      │              │
│ Master       ├───────────────────────────────────────>│              │
│ Admin        │                                        │              │
│              │<───────────────────────────────────────┤              │
│              │   User Reports, Activity Logs          │              │
└──────────────┘                                        │              │
                                                        │              │
┌──────────────┐                                        │              │
│              │   Company & Permission Management      │              │
│ Super        ├───────────────────────────────────────>│              │
│ Admin        │                                        │              │
│              │<───────────────────────────────────────┤              │
│              │   System Reports, Analytics            │              │
└──────────────┘                                        └──────┬───────┘
                                                               │
                   ┌───────────────────────────────────────────┤
                   │                                           │
                   ▼                                           ▼
         ┌──────────────────┐                        ┌─────────────────┐
         │  Google Gemini   │                        │  Email Service  │
         │      API         │                        │  (Gmail SMTP)   │
         │  - AI Reports    │                        │  - MFA Codes    │
         │  - Chatbot       │                        │  - Activations  │
         └──────────────────┘                        │  - Resets       │
                                                     └─────────────────┘
```

### 9.2 Level 1 DFD (System Process)

```
              SOC Central - Level 1 Data Flow Diagram

┌────────────┐                      ┌──────────────────────────┐
│            │  Login Credentials   │                          │
│   User     ├─────────────────────>│  1. Authentication       │
│            │                      │     Process              │
│            │<─────────────────────┤                          │
│            │  JWT Tokens          │                          │
└────────────┘                      └────────┬─────────────────┘
                                             │
                                             │ User Info
                                             ▼
                                   ┌─────────────────┐
                                   │   User Store    │
                                   │   (Database)    │
                                   └─────────────────┘
                                             │
                                             │ Access Token
                                             ▼
┌────────────┐                      ┌──────────────────────────┐
│            │  Security Data       │                          │
│   Admin    ├─────────────────────>│  2. Data Management      │
│            │  (CSV/Excel)         │     Process              │
│            │                      │                          │
│            │<─────────────────────┤                          │
│            │  Upload Status       │                          │
└────────────┘                      └────────┬─────────────────┘
                                             │
                                             │ Processed Data
                                             ▼
                                   ┌─────────────────┐
                                   │ Security Data   │
                                   │     Store       │
                                   │  (Database)     │
                                   └─────────────────┘
                                             │
                                             │ Active Data
                                             ▼
┌────────────┐                      ┌──────────────────────────┐
│            │  Query Parameters    │                          │
│   User     ├─────────────────────>│  3. Analytics &          │
│            │                      │     Dashboard            │
│            │<─────────────────────┤     Process              │
│            │  Visualizations      │                          │
└────────────┘                      └────────┬─────────────────┘
                                             │
                                             │ Anomaly Data
                                             ▼
                                   ┌─────────────────┐
                                   │  ML Models &    │
                                   │  Anomalies      │
                                   │  (Database)     │
                                   └─────────────────┘
                                             │
                                             │ Report Data
                                             ▼
┌────────────┐                      ┌──────────────────────────┐
│            │  Report Request      │                          │
│   Admin    ├─────────────────────>│  4. Report Generation    │
│            │                      │     Process              │
│            │<─────────────────────┤     (AI-Powered)         │
│            │  Generated Report    │                          │
└────────────┘                      └────────┬─────────────────┘
                                             │
                                             │ Report Content
                                             ▼
                                   ┌─────────────────┐
                                   │  Report Store   │
                                   │  (Database)     │
                                   └─────────────────┘
```

### 9.3 Level 2 DFD (Data Processing Detail)

```
        Data Upload and Processing - Level 2 DFD

┌────────────┐                      ┌──────────────────────────┐
│            │  File Upload         │                          │
│   Admin    ├─────────────────────>│  2.1 File Validation     │
│            │  (CSV/Excel)         │      Process             │
│            │                      │  - Format Check          │
│            │                      │  - Size Check            │
└────────────┘                      │  - Type Validation       │
                                    └────────┬─────────────────┘
                                             │
                                             │ Valid File
                                             ▼
                                    ┌──────────────────────────┐
                                    │  2.2 Hash Generation     │
                                    │      Process             │
                                    │  - SHA-256 Hash          │
                                    └────────┬─────────────────┘
                                             │
                                             │ File Hash
                                             ▼
                                    ┌──────────────────────────┐
                                    │  2.3 Duplicate Check     │
                                    │      Process             │
                                    └────────┬─────────────────┘
                                             │
                                             │ Unique File
                                             ▼
                                    ┌──────────────────────────┐
                                    │  2.4 File Parsing        │
                                    │      Process             │
                                    │  - Pandas CSV/Excel      │
                                    │  - Multi-sheet Support   │
                                    └────────┬─────────────────┘
                                             │
                                             │ Raw Data
                                             ▼
                                    ┌──────────────────────────┐
                                    │  2.5 Data Validation     │
                                    │      Process             │
                                    │  - Schema Validation     │
                                    │  - Field Validation      │
                                    └────────┬─────────────────┘
                                             │
                                             │ Validated Data
                                             ▼
                                    ┌──────────────────────────┐
                                    │  2.6 Tool Processing     │
                                    │      Process             │
                                    │  - Tool-Specific Logic   │
                                    └────────┬─────────────────┘
                                             │
                                             │ Processed Data
                                             ▼
                                    ┌──────────────────────────┐
                                    │  2.7 MITRE Mapping       │
                                    │      Process             │
                                    │  - Technique Detection   │
                                    │  - Tactic Assignment     │
                                    └────────┬─────────────────┘
                                             │
                                             │ Enriched Data
                                             ▼
                                   ┌─────────────────┐
                                   │ Security Data   │
                                   │     Store       │
                                   │  (JSON Field)   │
                                   └─────────────────┘
```

---

## 10. Entity Relationship Diagram

```
                    SOC Central - Entity Relationship Diagram

┌─────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION SCHEMA                             │
└─────────────────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────┐
         │              Company                          │
         ├──────────────────────────────────────────────┤
         │ 🔑 id (UUID)                                 │
         │    name (unique)                             │
         │    display_name                              │
         │    description                               │
         │    email_domain                              │
         │    primary_contact_email                     │
         │    phone_number                              │
         │    address                                   │
         │    enabled_tools (JSON)                      │
         │    max_users (integer, default=10)           │
         │    is_active (boolean)                       │
         │    created_at                                │
         │    updated_at                                │
         │    created_by_id (FK → User)                │
         └────────────┬─────────────────────────────────┘
                      │
                      │ 1:N
                      │
         ┌────────────▼─────────────────────────────────┐
         │     CompanyToolPermission                     │
         ├──────────────────────────────────────────────┤
         │ 🔑 id                                        │
         │ 🔗 company_id (FK → Company)                │
         │    tool_type                                 │
         │    is_enabled                                │
         │    can_view                                  │
         │    can_upload                                │
         │    can_analyze                               │
         │    can_export                                │
         │    can_manage                                │
         │    data_retention_days (default=365)         │
         │    max_upload_size_mb (default=100)          │
         │    max_records_per_upload (default=100000)   │
         │    created_at                                │
         │    updated_at                                │
         │ 🔗 created_by_id (FK → User)                │
         └──────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────┐
         │                  User                         │
         ├──────────────────────────────────────────────┤
         │ 🔑 id (UUID)                                 │
         │    email (unique)                            │
         │    password (hashed)                         │
         │    first_name                                │
         │    last_name                                 │
         │    role (super_admin|master_admin|admin|general)│
         │ 🔗 company_id (FK → Company)                │
         │    company_name (legacy)                     │
         │    job_title                                 │
         │    department                                │
         │    phone_number                              │
         │    country_code                              │
         │    is_phone_verified                         │
         │    is_email_verified                         │
         │    is_active                                 │
         │    created_at                                │
         │    updated_at                                │
         │    last_login                                │
         │    last_login_ip                             │
         │    last_otp_request                          │
         │    otp_attempts                              │
         │    password_reset_required                   │
         │    last_password_reset                       │
         │ 🔗 created_by_id (FK → User)                │
         └────────────┬─────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────────┬────────────────┐
        │             │             │                  │                │
        │ 1:N         │ 1:N         │ 1:N              │ 1:N            │ 1:N
        │             │             │                  │                │
        ▼             ▼             ▼                  ▼                ▼
┌───────────┐  ┌────────────┐ ┌──────────────┐  ┌───────────┐  ┌──────────┐
│OTPVerifi- │  │  MFACode   │ │PasswordReset │  │UserSession│  │Activity  │
│cation     │  │            │ │    Token     │  │           │  │Log       │
├───────────┤  ├────────────┤ ├──────────────┤  ├───────────┤  ├──────────┤
│🔑 id      │  │🔑 id       │ │🔑 id         │  │🔑 id      │  │🔑 id     │
│🔗 user_id │  │🔗 user_id  │ │🔗 user_id    │  │🔗 user_id │  │🔗 user_id│
│otp_code   │  │code (4-dig)│ │token (unique)│  │session_key│  │action    │
│purpose    │  │is_used     │ │token_type    │  │ip_address │  │timestamp │
│delivery   │  │attempts    │ │  (activation │  │user_agent │  │ip_address│
│method     │  │created_at  │ │   /reset)    │  │created_at │  │details   │
│is_used    │  │expires_at  │ │created_at    │  │last_activity│         │
│attempts   │  │ip_address  │ │expires_at    │  │is_active  │  │          │
│created_at │  │user_agent  │ │used_at       │  └───────────┘  └──────────┘
│expires_at │  │last_sent_at│ │is_used       │
│ip_address │  └────────────┘ │ip_address    │
│user_agent │                 │🔗 created_by │
└───────────┘                 └──────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           TOOLS SCHEMA                                   │
└─────────────────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────┐
         │         SecurityDataUpload                    │
         ├──────────────────────────────────────────────┤
         │ 🔑 id                                        │
         │    tool_type (gsuite|mdm|siem|edr|meraki|    │
         │                sonicwall)                    │
         │    file_name                                 │
         │    file_size                                 │
         │    file_hash (SHA-256, indexed)              │
         │    record_count                              │
         │    processed_data (JSON)                     │
         │    sheet_names (JSON)                        │
         │    status (pending|processing|completed|     │
         │            failed|active)                    │
         │    error_message                             │
         │    is_active                                 │
         │    activated_at                              │
         │    company_name                              │
         │    is_public_to_company                      │
         │ 🔗 uploaded_by_id (FK → User)               │
         │ 🔗 activated_by_id (FK → User)              │
         │    uploaded_at                               │
         │    processed_at                              │
         └────────────┬─────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────────┐
        │             │             │                  │
        │ 1:N         │ 1:N         │ 1:N              │ 1:N
        │             │             │                  │
        ▼             ▼             ▼                  ▼
┌───────────┐  ┌────────────┐ ┌──────────────┐  ┌──────────────┐
│DataAccess │  │Processing  │ │DataNotifica- │  │AnomalyDetec- │
│Log        │  │Log         │ │tion          │  │tion          │
├───────────┤  ├────────────┤ ├──────────────┤  ├──────────────┤
│🔑 id      │  │🔑 id       │ │🔑 id         │  │🔑 id         │
│🔗 upload_id│ │🔗 upload_id│ │🔗 upload_id  │  │🔗 upload_id  │
│🔗 user_id  │ │timestamp   │ │🔗 recipient_id│ │🔗 model_used │
│accessed_at│  │level       │ │notification_ │  │anomaly_date  │
│access_type│  │  (INFO|WARN│ │  type        │  │anomaly_score │
│user_company│ │  |ERROR)   │ │title         │  │severity      │
│data_company│ │message     │ │message       │  │confidence    │
│is_cross_  │  └────────────┘ │created_at    │  │description   │
│ company   │                 │read_at       │  │summary       │
└───────────┘                 │is_read       │  │status        │
                              └──────────────┘  │feature_values│
                                                 │feature_      │
                                                 │ importance   │
                                                 │company_name  │
                                                 │🔗 investigated│
                                                 │   _by_id     │
                                                 │investigation_│
                                                 │  notes       │
                                                 │created_at    │
                                                 │updated_at    │
                                                 │resolved_at   │
                                                 └──────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    MACHINE LEARNING SCHEMA                               │
└─────────────────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────┐
         │           AnomalyModel                        │
         ├──────────────────────────────────────────────┤
         │ 🔑 id                                        │
         │    tool_type                                 │
         │    algorithm (isolation_forest|one_class_svm │
         │               |autoencoder)                  │
         │    model_name                                │
         │    model_file_path                           │
         │    feature_columns (JSON)                    │
         │    hyperparameters (JSON)                    │
         │    training_data_size                        │
         │    contamination_rate                        │
         │    training_accuracy                         │
         │    validation_score                          │
         │    false_positive_rate                       │
         │    status (training|trained|active|deprecated│
         │           |failed)                           │
         │    is_active                                 │
         │    company_name                              │
         │    created_at                                │
         │    updated_at                                │
         │    trained_at                                │
         └────────────┬─────────────────────────────────┘
                      │
                      │ 1:N
                      │
         ┌────────────▼─────────────────────────────────┐
         │      AnomalyTrainingJob                       │
         ├──────────────────────────────────────────────┤
         │ 🔑 id                                        │
         │    tool_type                                 │
         │    algorithm                                 │
         │    company_name                              │
         │    training_data_size                        │
         │    contamination_rate                        │
         │    hyperparameters (JSON)                    │
         │    status (pending|running|completed|failed  │
         │           |cancelled)                        │
         │    progress_percentage                       │
         │    error_message                             │
         │ 🔗 trained_model_id (FK → AnomalyModel)     │
         │    training_metrics (JSON)                   │
         │ 🔗 started_by_id (FK → User)                │
         │    created_at                                │
         │    updated_at                                │
         │    started_at                                │
         │    completed_at                              │
         └──────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         REPORTS SCHEMA                                   │
└─────────────────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────┐
         │             SOCReport                         │
         ├──────────────────────────────────────────────┤
         │ 🔑 id                                        │
         │    title                                     │
         │    report_type (individual_tool|combined_    │
         │         tools|executive_summary|incident_    │
         │         report|threat_analysis)              │
         │    description                               │
         │    tool_types (JSON)                         │
         │    executive_summary (text)                  │
         │    monitoring_overview (text)                │
         │    incident_summary (text)                   │
         │    critical_threat_analysis (text)           │
         │    recommendations (text)                    │
         │    kpi_metrics (JSON)                        │
         │    charts_config (JSON)                      │
         │    appendix (text)                           │
         │    report_period_start                       │
         │    report_period_end                         │
         │    generated_at                              │
         │    ai_model_used (default: gemini-1.5-flash) │
         │    generation_prompt (text)                  │
         │    generation_time                           │
         │    status (draft|generating|completed|failed │
         │           |published)                        │
         │    company_name                              │
         │    exported_formats (JSON)                   │
         │    last_exported                             │
         │ 🔗 created_by_id (FK → User)                │
         │    created_at                                │
         │    updated_at                                │
         └────────────┬─────────────────────────────────┘
                      │
        ┌─────────────┼──────────────┬─────────────────┐
        │             │              │                 │
        │ M:N         │ 1:N          │ 1:N             │ 1:N
        │             │              │                 │
        ▼             ▼              ▼                 ▼
┌──────────────┐ ┌──────────┐  ┌──────────┐  ┌────────────────┐
│SecurityData  │ │SOCReport │  │SOCReport │  │SOCReportTemplate│
│Upload        │ │Section   │  │Export    │  │                │
│              │ ├──────────┤  ├──────────┤  ├────────────────┤
│ (M:N via     │ │🔑 id     │  │🔑 id     │  │🔑 id           │
│ data_uploads)│ │🔗 report │  │🔗 report │  │name            │
└──────────────┘ │   _id    │  │   _id    │  │description     │
                 │section_  │  │format    │  │template_type   │
                 │  type    │  │  (pdf|   │  │  (executive|   │
                 │title     │  │  docx|   │  │  technical|    │
                 │content   │  │  html)   │  │  compliance|   │
                 │order     │  │file_path │  │  incident_     │
                 │chart_data│  │file_size │  │  response)     │
                 │chart_type│  │🔗 exported│ │sections_config │
                 │is_ai_gen │  │   _by_id │  │  (JSON)        │
                 │manually_ │  │exported_ │  │default_charts  │
                 │ edited   │  │  at      │  │  (JSON)        │
                 │🔗 last_  │  │export_   │  │ai_prompts (JSON)│
                 │ edited_by│  │ settings │  │is_active       │
                 │created_at│  │  (JSON)  │  │is_default      │
                 │updated_at│  └──────────┘  │company_name    │
                 └──────────┘                 │🔗 created_by_id│
                                              │created_at      │
                                              │updated_at      │
                                              └────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          CHAT SCHEMA                                     │
└─────────────────────────────────────────────────────────────────────────┘

         ┌──────────────────────────────────────────────┐
         │          ChatConversation                     │
         ├──────────────────────────────────────────────┤
         │ 🔑 id                                        │
         │ 🔗 user_id (FK → User)                      │
         │    company_name                              │
         │    session_id                                │
         │    title                                     │
         │    created_at                                │
         │    updated_at                                │
         └────────────┬─────────────────────────────────┘
                      │
                      │ 1:N
                      │
         ┌────────────▼─────────────────────────────────┐
         │            ChatMessage                        │
         ├──────────────────────────────────────────────┤
         │ 🔑 id                                        │
         │ 🔗 conversation_id (FK → ChatConversation)  │
         │    message_type (user|bot)                   │
         │    content (text)                            │
         │    app_context_used (JSON)                   │
         │    ai_model_used                             │
         │    processing_time                           │
         │    created_at                                │
         └──────────────────────────────────────────────┘
```

**Legend:**
- 🔑 = Primary Key
- 🔗 = Foreign Key
- 1:N = One-to-Many Relationship
- M:N = Many-to-Many Relationship

---

## 11. Appendices

### Appendix A: Technology Stack Details

#### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Programming language |
| Django | 5.1.2 | Web framework |
| Django REST Framework | 3.14+ | API framework |
| djangorestframework-simplejwt | Latest | JWT authentication |
| PostgreSQL | 13+ | Production database |
| SQLite | 3+ | Development database |
| Pandas | 2.0+ | Data processing |
| openpyxl | Latest | Excel file processing |
| xlrd | Latest | Legacy Excel support |
| scikit-learn | 1.3+ | Machine learning |
| numpy | 1.24+ | Numerical computing |
| scipy | 1.10+ | Scientific computing |
| matplotlib | 3.7+ | Data visualization |
| seaborn | 0.12+ | Statistical visualization |
| Google Generative AI | 0.3+ | AI integration |
| Gunicorn | Latest | WSGI server |
| psycopg2-binary | Latest | PostgreSQL adapter |
| python-decouple | Latest | Configuration management |
| django-cors-headers | Latest | CORS support |
| WhiteNoise | Latest | Static file serving |

#### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| TypeScript | 5.5.3 | Type-safe JavaScript |
| Vite | 5.4.1 | Build tool |
| React Router DOM | 6.26.2 | Routing |
| TanStack Query | 5.56.2 | Data fetching |
| Radix UI | Latest | Accessible primitives |
| shadcn/ui | Latest | Component library |
| Tailwind CSS | 3.4.11 | Utility-first CSS |
| tailwindcss-animate | 1.0.7 | CSS animations |
| Framer Motion | 12.23.12 | Animation library |
| Recharts | 2.12.7 | Chart library |
| React Hook Form | 7.53.0 | Form management |
| Zod | 3.23.8 | Schema validation |
| Lucide React | 0.462.0 | Icon library |
| Sonner | 1.5.0 | Toast notifications |
| PapaParse | 5.5.3 | CSV parsing |

### Appendix B: API Response Formats

#### Success Response Format

```json
{
  "status": "success",
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

#### Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

### Appendix C: Security Best Practices

1. **Password Requirements:**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character

2. **JWT Token Security:**
   - Short access token lifetime (24 hours)
   - Refresh token rotation
   - Secure token storage
   - HTTPS-only transmission

3. **Rate Limiting:**
   - Login: 5 attempts per 15 minutes
   - API: 100 requests per minute
   - File upload: 10 uploads per hour
   - Password reset: 3 requests per hour

4. **Data Protection:**
   - Encryption at rest
   - Encryption in transit (TLS 1.2+)
   - Password hashing (bcrypt/PBKDF2)
   - Sensitive data masking

### Appendix D: Deployment Configuration

#### Environment Variables

```bash
# Django Settings
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/soccentral

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True

# AI Service
GOOGLE_API_KEY=your-gemini-api-key

# Frontend
VITE_API_BASE_URL=https://api.your-domain.com
VITE_ENVIRONMENT=production

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com

# Security
CSRF_TRUSTED_ORIGINS=https://your-domain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Appendix E: Glossary

| Term | Definition |
|------|------------|
| **Active Dataset** | The currently selected dataset for a specific tool that is used for dashboards and analysis |
| **Anomaly Score** | Numerical value indicating the degree of abnormality detected by ML algorithms |
| **Company Isolation** | Security mechanism ensuring data from one company is not accessible to users from another company |
| **Confidence Score** | Measure of certainty in the detection of a MITRE ATT&CK technique |
| **Data Hash** | SHA-256 cryptographic hash used for duplicate detection |
| **JWT Token** | JSON Web Token used for stateless authentication |
| **Master Admin** | Top-level administrator role for a specific company with special protection |
| **MITRE Tactic** | High-level category of adversary behavior in the ATT&CK framework |
| **MITRE Technique** | Specific method used by adversaries to achieve tactical goals |
| **Soft Delete** | Marking data as deleted without physically removing it from the database |
| **Tool Processor** | Component responsible for parsing and processing data from a specific security tool |

### Appendix F: Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-10 | Initial SRS document creation |

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Manager | | | |
| Technical Lead | | | |
| Security Lead | | | |
| QA Manager | | | |
| Stakeholder | | | |

---

**End of Document**

---

*This Software Requirements Specification document is confidential and proprietary to the SOC Central project. Unauthorized distribution or reproduction is prohibited.*
