# SOC Central v3.0 🛡️

<div align="center">
  <img src="soccentral/public/logo.png" alt="SOC Central Logo" width="200"/>

  **Enterprise Security Operations Center Management Platform**

  [![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
  [![Django](https://img.shields.io/badge/Django-5.1.2-green.svg)](https://djangoproject.com/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 🚀 What's New in Version 3.0

SOC Central v3.0 represents a complete architectural overhaul and feature expansion, transforming it into an enterprise-grade security operations platform. This major release introduces advanced authentication, comprehensive user management, intelligent data processing, and sophisticated analytics capabilities.

---

## 📋 Table of Contents

- [🔐 Authentication &amp; Security System](#-authentication--security-system)
- [👥 Advanced User Management](#-advanced-user-management)
- [🗄️ Intelligent Data Management](#️-intelligent-data-management)
- [📊 Multi-Tool Dashboard Analytics](#-multi-tool-dashboard-analytics)
- [📅 Advanced Date Filtering](#-advanced-date-filtering)
- [🎯 MITRE ATT&amp;CK Integration](#-mitre-attck-integration)
- [⚡ Performance Optimizations](#-performance-optimizations)
- [🔧 Technical Architecture](#-technical-architecture)
- [🚀 Getting Started](#-getting-started)
- [📖 API Documentation](#-api-documentation)

---

## 🔐 Authentication & Security System

### **Enterprise-Grade Authentication**

- **🔑 JWT-based Authentication** with secure refresh token rotation
- **📧 Email Verification** with automated activation workflows
- **🔄 Password Reset** system with secure token validation
- **👤 Account Activation** for admin-created users

### **Advanced Security Features**

- **⏰ Rate Limiting**: 5 login attempts per 15 minutes
- **🔒 Role-Based Access Control (RBAC)**: Super Admin, Admin, General User
- **📝 Activity Logging**: Comprehensive audit trails for all user actions
- **🌐 Session Management**: IP tracking and security monitoring
- **🔐 Password Policies**: Django-enforced complexity requirements

### **Production Security**

- **🔒 HTTPS Enforcement** with security headers middleware
- **🛡️ CSRF Protection** on all form submissions
- **🚫 XSS Protection** with input sanitization
- **📊 Security Audit Logs**: authentication.log, security.log
- **🔑 Environment Protection**: Secure secret management

```python
# Example: Secure authentication middleware
class SecurityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
  
    def __call__(self, request):
        # Rate limiting, IP tracking, security headers
        response = self.get_response(request)
        response['X-Frame-Options'] = 'DENY'
        response['X-Content-Type-Options'] = 'nosniff'
        return res
```

## 👥 Advanced User Management

### **Hierarchical User System**

- **👑 Super Admin**: Full system control, cross-company management
- **🔧 Admin**: Company-specific user management and data oversight
- **👤 General User**: Read-only access to company dashboards

### **Admin Panel Features**

- **➕ User Creation**: Automated email activation for new users
- **🔄 Role Management**: Promote/demote users between roles
- **🔐 Account Control**: Activate, deactivate, or delete user accounts
- **🔑 Password Management**: Admin-triggered password reset workflows
- **🏢 Company Isolation**: Admins manage only their company users

### **User Interface Components**

- **📊 User Statistics Dashboard** with role-based metrics
- **🔍 Advanced Search & Filtering** across user base
- **📋 Detailed User Profiles** with activity history
- **⚡ Real-time Status Updates** for user account changes
- **📈 User Analytics** and engagement tracking

```tsx
// Example: User management component
const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filterRole, setFilterRole] = useState<UserRole>('all');
  
  return (
    <div className="user-management">
      <UserStatsCards metrics={userMetrics} />
      <UserSearchFilter onFilter={handleFilter} />
      <UserTable 
        users={filteredUsers} 
        onPromote={handlePromoteUser}
        onDeactivate={handleDeactivateUser}
      />
    </div>
  );
};
```

---

## 🗄️ Intelligent Data Management

### **Multi-Tool Security Platform**

SOC Central v3 supports comprehensive data processing for major security tools:

- **📧 G Suite**: Email security, phishing detection, whitelist management
- **📱 MDM**: Mobile device compliance and security policy enforcement
- **🔍 SIEM**: Security event correlation and alert analysis
- **🛡️ EDR**: Endpoint threat detection and incident response
- **🌐 Meraki**: Network monitoring and traffic analysis
- **🔥 SonicWall**: Firewall logs and intrusion detection

### **Advanced File Processing**

- **📊 Excel Processing**: Multi-sheet support with intelligent column detection
- **🔄 Data Validation**: Comprehensive sanitization and error handling
- **🔐 SHA-256 Hashing**: Duplicate detection and data integrity
- **📈 Metadata Extraction**: Automatic record counting and analysis
- **🏢 Company Isolation**: Secure data segregation per organization

### **Intelligent Data Architecture**

```python
# Example: Data processing pipeline
class SecurityDataProcessor:
    def __init__(self, tool_type: str):
        self.tool_type = tool_type
        self.processor = self._get_processor()
  
    def process_file(self, file_path: str, company_id: str):
        # SHA-256 duplicate check
        file_hash = self._calculate_hash(file_path)
        if self._is_duplicate(file_hash, company_id):
            return {"status": "duplicate", "hash": file_hash}
      
        # Process and validate data
        data = self.processor.parse(file_path)
        validated_data = self._validate_records(data)
      
        # Store with company isolation
        return self._store_data(validated_data, company_id)
```

---

## 📊 Multi-Tool Dashboard Analytics

### **Dynamic Dashboard System**

Each security tool features a dedicated dashboard with tailored analytics:

#### **📧 G Suite Dashboard**

- **📈 Email Security Metrics**: Phishing attempts, blocked threats
- **📋 Whitelist Management**: Domain and sender analysis
- **📊 Security Trends**: Monthly threat evolution tracking
- **⚠️ Alert Correlation**: Risk-based threat prioritization

#### **📱 MDM Dashboard**

- **📱 Device Compliance**: Policy adherence metrics
- **🔒 Security Violations**: Jailbreak/root detection analytics
- **📊 Device Analytics**: OS distribution and health metrics
- **🚨 Threat Response**: Automated wipe and quarantine tracking

#### **🔍 SIEM Dashboard**

- **⚡ Real-time Alerts**: Live security event monitoring
- **📈 Severity Analysis**: Critical, High, Medium, Low categorization
- **👤 User Activity**: Behavioral analysis and anomaly detection
- **🕐 Timeline Analysis**: Attack progression visualization

#### **🛡️ EDR Dashboard**

- **🎯 Threat Detection**: Endpoint security metrics
- **🔍 Incident Response**: Response time and resolution tracking
- **📊 Endpoint Health**: System performance and security status
- **🚨 IOC Tracking**: Indicators of Compromise analysis

### **Interactive Visualization**

```tsx
// Example: Dashboard component with real-time updates
const SecurityDashboard = ({ toolType }: { toolType: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', toolType],
    queryFn: () => fetchDashboardData(toolType),
    refetchInterval: 30000 // Real-time updates
  });

  return (
    <div className="dashboard">
      <KPIGrid metrics={data.kpis} />
      <TrendChart data={data.timeSeries} />
      <AlertsTable alerts={data.recentAlerts} />
      <ThreatMap threats={data.threats} />
    </div>
  );
};
```

---

## 📅 Advanced Date Filtering

### **Intelligent Date Processing**

- **🔄 Multi-Format Support**: ISO, US, European, custom formats
- **🛠️ Tool-Specific Parsing**: Meraki, G Suite, SIEM format handling
- **📅 Smart Detection**: Automatic date field identification
- **⏰ Time Range Options**: Today, Week, Month, Quarter, Year, Custom
- **✅ Validation Engine**: Comprehensive error handling and correction

### **Real-Time Filtering**

```typescript
// Example: Date filtering system
interface DateFilter {
  startDate: Date;
  endDate: Date;
  includeWeekends: boolean;
  timezone: string;
}

const useDateFiltering = (toolData: any[], filter: DateFilter) => {
  return useMemo(() => {
    const filtered = toolData.filter(record => {
      const recordDate = parseSecurityDate(record.timestamp);
      return isWithinRange(recordDate, filter);
    });
  
    // Recalculate KPIs based on filtered data
    const kpis = calculateKPIs(filtered);
    return { filteredData: filtered, kpis };
  }, [toolData, filter]);
};
```

---

## 🎯 MITRE ATT&CK Integration

### **MITRE-Informed Security Analysis**

SOC Central integrates the industry-standard MITRE ATT&CK framework to provide contextual threat intelligence and standardized attack categorization.

#### **📋 Framework Coverage**

- **12 MITRE ATT&CK Tactics**: Complete coverage from Initial Access to Impact
- **50+ Technique Mappings**: Common techniques across all security tools
- **Tool-Specific Mappings**: Customized technique detection per security tool
- **Confidence Scoring**: Reliability-based threat attribution (0.5-1.0 scale)

#### **🔍 Automated Event Analysis**

Currently implemented for **G Suite** with expansion planned for all tools:

```python
# Real example: G Suite security event analysis
def analyze_gsuite_security_events(details):
    mitre_mapper = get_mitre_mapper()
  
    # Map phishing attempts to MITRE techniques
    mappings = mitre_mapper.map_event_to_mitre('gsuite', 'suspicious_login', {
        'severity': 'high',
        'confirmed': True
    })
  
    # Returns: T1566 (Phishing), T1078 (Valid Accounts), etc.
    # With confidence scores and tactic mappings
```

#### **🛤️ Attack Path Reconstruction**

- **Kill Chain Analysis**: Maps techniques to attack progression stages
- **Tactic Correlation**: Shows relationship between Initial Access → Persistence → Impact
- **Severity Assessment**: Automatic risk scoring (Critical/High/Medium/Low)
- **Timeline Visualization**: Ordered attack sequence for incident response

#### **📊 Security Coverage Analysis**

- **Coverage Matrix**: Shows which MITRE techniques your tools can detect
- **Gap Identification**: Highlights unmonitored attack vectors
- **Tool Effectiveness**: Measures detection capabilities per security tool
- **Coverage Percentage**: Quantifies security posture per MITRE tactic

#### **🚨 Threat Intelligence Output**

Generated for each security event:

```json
{
  "mitre_techniques": [
    {
      "technique_id": "T1566",
      "technique_name": "Phishing",
      "tactic_name": "Initial Access",
      "confidence": 0.8,
      "color": "#d32f2f"
    }
  ],
  "attack_path": {
    "tactics_count": 3,
    "severity": "high",
    "progression": [
      {"tactic": "initial-access", "techniques": ["T1566"]},
      {"tactic": "credential-access", "techniques": ["T1110"]}
    ]
  },
  "risk_score": 85,
  "recommendations": [
    "Implement email security and user training against phishing",
    "Enable multi-factor authentication on all accounts"
  ]
}
```

#### **🛡️ Practical Security Value**

- **Standardized Categorization**: Events mapped to globally recognized framework
- **Contextual Analysis**: Understands "what type of attack" not just "what happened"
- **Prioritized Response**: Risk-based scoring for incident triage
- **Mitigation Guidance**: Specific recommendations based on detected techniques
- **Coverage Planning**: Identifies where additional security controls are needed

#### **🔧 Technical Implementation**

- **Tool Mappings**: Pre-configured technique detection per security tool
- **Confidence Algorithms**: Tool reliability and event specificity scoring
- **Attack Progression**: Ordered tactic analysis following cyber kill chain
- **Extensible Architecture**: Easy addition of new tools and techniques

---

## ⚡ Performance Optimizations

### **Frontend Performance**

- **🔄 Code Splitting**: React lazy loading for 50-70% faster initial load
- **📦 Smart Bundling**: Optimized chunk splitting (vendor, dashboards, admin)
- **🗜️ Compression**: Terser + Gzip achieving 70% size reduction
- **💾 Service Worker**: Static asset caching for instant subsequent loads
- **🎯 React Optimization**: Memoization and selective re-rendering

### **Backend Performance**

- **🗃️ Database Optimization**: Strategic indexing and query optimization
- **⚡ Connection Pooling**: Efficient database connection management
- **📊 Lazy Loading**: On-demand data loading for large datasets
- **🔄 Caching Layers**: Django cache framework integration
- **📧 Email Optimization**: Connection warming and batch processing

### **Build Optimization Results**

```bash
# Production build results
dist/assets/vendor-react-CFOBPSGR.js      555.71 kB → 165.51 kB (gzip)
dist/assets/dashboards-BGuElDr7.js        687.66 kB → 83.67 kB (gzip)
dist/assets/Analytics-BCF9wtta.js         259.85 kB → 28.01 kB (gzip)
dist/assets/admin-C7QHxd9L.js             247.74 kB → 37.02 kB (gzip)

✓ Built in 38.82s with smart chunking and compression
```

---

## 🔧 Technical Architecture

### **Backend Stack**

- **🐍 Django 5.1.2**: Modern Python web framework
- **🔐 Django REST Framework**: Robust API development
- **🗄️ PostgreSQL**: Enterprise-grade database with connection pooling
- **📧 Email Integration**: Gmail SMTP with security protocols
- **🔑 JWT Authentication**: Secure token-based authentication

### **Frontend Stack**

- **⚛️ React 18.3.1**: Modern React with hooks and concurrent features
- **📘 TypeScript 5.5.3**: Type-safe development environment
- **⚡ Vite 5.4.1**: Lightning-fast build tool and dev server
- **🎨 Tailwind CSS**: Utility-first styling framework
- **🧩 Radix UI**: Accessible component primitives
- **📊 Recharts**: Interactive data visualization library

### **DevOps & Deployment**

- **🚀 Render.com**: Cloud deployment platform
- **🔧 Gunicorn**: WSGI HTTP Server for Python
- **📊 Structured Logging**: Comprehensive application monitoring
- **🔐 Environment Management**: Secure configuration handling

---

## 🚀 Getting Started

### **Prerequisites**

```bash
# Required versions
Python >= 3.10
Node.js >= 18.0
PostgreSQL >= 13.0
```

### **Quick Setup**

1. **Clone the repository**

```bash
git clone https://github.com/your-org/soc-central.git
cd soc-central
```

2. **Backend Setup**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

3. **Frontend Setup**

```bash
cd soccentral
npm install
npm run dev
```

4. **Access the Application**

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000`
- Admin Panel: `http://localhost:8000/admin`

### **Production Deployment**

1. **Environment Configuration**

```bash
# Set required environment variables
export DEBUG=False
export DATABASE_URL="postgresql://user:pass@host:port/db"
export JWT_SECRET_KEY="your-secret-key"
export EMAIL_HOST_PASSWORD="your-email-password"
```

2. **Build & Deploy**

```bash
# Build frontend
npm run build

# Collect static files
python manage.py collectstatic

# Run with Gunicorn
gunicorn core.wsgi:application
```

---

## 📖 API Documentation

### **Authentication Endpoints**

```http
POST /api/auth/login/          # User login
POST /api/auth/logout/         # User logout  
POST /api/auth/refresh/        # Token refresh
POST /api/auth/register/       # User registration
POST /api/auth/password-reset/ # Password reset request
```

### **User Management**

```http
GET    /api/users/             # List users (Admin)
POST   /api/users/             # Create user (Admin)
PUT    /api/users/{id}/        # Update user (Admin)
DELETE /api/users/{id}/        # Delete user (Super Admin)
POST   /api/users/{id}/promote/ # Promote user (Admin)
```

### **Data Management**

```http
POST /api/data/upload/         # Upload security data
GET  /api/data/{tool}/         # Get tool data
GET  /api/data/{tool}/kpis/    # Get KPIs for tool
POST /api/data/{tool}/filter/  # Apply date filters
```

### **Dashboard Analytics**

```http
GET /api/dashboard/{tool}/overview/   # Overview metrics
GET /api/dashboard/{tool}/trends/     # Trend analysis  
GET /api/dashboard/{tool}/alerts/     # Recent alerts
GET /api/dashboard/{tool}/mitre/      # MITRE mapping
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Workflow**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **MITRE ATT&CK Framework** for threat intelligence standards
- **Django** and **React** communities for excellent documentation
- **Security research community** for continuous threat intelligence
- **Open source contributors** who make projects like this possible

---

<div align="center">
  <p><strong>Built with ❤️ for the Security Operations Community</strong></p>
  <p>SOC Central v3.0 - Empowering Security Teams Worldwide</p>
</div>

#---------------------------------------------------------------------------------------------------

# OPtimizations

## Advanced Build Configuration

  Vite Configuration Enhancements:

- Enterprise chunk splitting - Separate bundles for React, UI, Charts, State Management
- Advanced minification with Terser for production
- Tree shaking optimization for smaller bundles
- Multi-browser targeting (ES2020, Chrome 87+, Firefox 78+, Safari 14+)
- Asset optimization with intelligent file naming and caching

  ⚡ Performance Optimizations

1. Critical Performance Features:

- Dependency pre-bundling for faster dev server
- CSS code splitting for optimal loading
- Asset inlining for small files (4kb threshold)
- GPU-accelerated animations with hardware acceleration
- Lazy loading with intersection observers

2. Caching Strategy:

- Intelligent service worker with cache-first for static assets
- Network-first for APIs with 5-second timeout and fallback
- Stale-while-revalidate for HTML pages
- Automatic cache cleanup for expired entries

## Security Enhancements

  HTML Security Headers:

- Content Security Policy (CSP) implementation
- X-Frame-Options: DENY for clickjacking protection
- X-XSS-Protection enabled
- Referrer Policy for privacy protection
- No-sniff content type protection

## Production-Ready Features

1. Enhanced HTML Template:

- Critical CSS inlining to prevent FOUC
- Loading spinners for better UX
- Error boundary handling with monitoring
- Performance metrics tracking
- NoScript fallback messaging

2. Service Worker Features:

- Offline functionality with intelligent fallbacks
- Background sync for analytics
- Cache versioning with automatic updates
- API caching with 5-second timeout strategy

## Deployment Infrastructure

1. Environment Configuration:

- Production environment variables (.env.production)
- Feature flags for different deployment stages
- Security settings with HTTPS enforcement
- Monitoring integration ready (Sentry, GA, Hotjar)

2. Deployment Script:

- Enterprise deployment manager (scripts/deploy.js)
- Pre-deployment checks (TypeScript, ESLint)
- Build optimization with compression
- Post-build validation and manifest generation
- Git integration with commit tracking

## Bundle Analysis Results

  Current Build Output:

- Total bundle size: ~159KB (gzipped: ~23KB CSS, ~0.7KB JS entry)
- Chunk splitting: Intelligent separation of vendor libraries
- Asset optimization: Proper image/font organization
- Build time: ~11 seconds (production-optimized)

## Industry Standards Achieved

✅ **Performance**: Sub-second load times with aggressive caching
✅ **Security**: Enterprise-grade headers and CSP implementation
✅ **Scalability**: Feature-based code splitting and lazy loading
✅ **Monitoring**: Comprehensive error tracking and performance metrics
✅ **Deployment**: Automated CI/CD ready deployment pipeline
✅ **Offline**: Progressive Web App capabilities with service worker
✅ **Cross-browser**: Modern browser support with fallbacks

---

## 🚀 Future Roadmap

### **Planned Enhancements**

- **🔒 Multi-Factor Authentication (MFA)**: TOTP and SMS-based 2FA
- **🔍 Advanced Search**: Global search across all security tools
- **📱 Mobile App**: Native iOS/Android companion apps
- **🤖 AI/ML Integration**: Automated threat detection and response
- **📈 Advanced Analytics**: Machine learning-powered insights
- **🔗 API Integrations**: Direct connector to major security tools
- **📊 Custom Reporting**: Automated report generation and scheduling
- **🔔 Real-time Notifications**: WebSocket-based live alerts

### **Version 3.1 (Next Quarter)**

- Enhanced MITRE ATT&CK coverage for all security tools
- Real-time dashboard updates with WebSocket integration
- Advanced user activity monitoring and behavioral analytics
- Automated threat correlation across multiple security tools

---

<div align="center">
  <p><strong>🛡️ Securing Organizations, One Dashboard at a Time</strong></p>
  <p><em>SOC Central v3.0 - The Future of Security Operations</em></p>

  **[⭐ Star us on GitHub](https://github.com/your-org/soc-central)** | **[📖 Documentation](https://docs.soccentral.com)** | **[🐛 Report Issues](https://github.com/your-org/soc-central/issues)**

</div>
