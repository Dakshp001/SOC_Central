# =€ SOC Central v3.0 Deployment Guide

<div align="center">
  <img src="soccentral/public/logo.png" alt="SOC Central Logo" width="150"/>
  
  **Production Deployment Guide for Enterprise Security Operations Platform**
  
  [![Django](https://img.shields.io/badge/Django-5.1.2-green.svg)](https://djangoproject.com/)
  [![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
  [![Production Ready](https://img.shields.io/badge/Production-Ready-success.svg)]()
</div>

---

## =Ë Table of Contents

- [<× Infrastructure Requirements](#-infrastructure-requirements)
- [™ Environment Setup](#-environment-setup)
- [=' Backend Deployment](#-backend-deployment)
- [<¨ Frontend Deployment](#-frontend-deployment)
- [=Ä Database Configuration](#-database-configuration)
- [= Security Configuration](#-security-configuration)
- [=Ê Monitoring & Logging](#-monitoring--logging)
- [= CI/CD Pipeline](#-cicd-pipeline)
- [=à Troubleshooting](#-troubleshooting)

---

## <× Infrastructure Requirements

### **Minimum Production Requirements**

| Component | Minimum | Recommended | Enterprise |
|-----------|---------|-------------|------------|
| **CPU** | 2 cores | 4 cores | 8+ cores |
| **RAM** | 4GB | 8GB | 16+ GB |
| **Storage** | 20GB SSD | 50GB SSD | 100+ GB NVMe |
| **Network** | 100 Mbps | 1 Gbps | 10+ Gbps |
| **Database** | PostgreSQL 13+ | PostgreSQL 15+ | PostgreSQL 15+ HA |

### **Supported Platforms**
- ** Cloud**: AWS, GCP, Azure, Render, DigitalOcean, Heroku
- **=3 Containers**: Docker, Kubernetes, Docker Swarm
- **=¥ On-Premise**: Ubuntu 20.04+, CentOS 8+, RHEL 8+
- **=' Platform Services**: Vercel (Frontend), Railway, PythonAnywhere

---

## ™ Environment Setup

### **1. System Dependencies**

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y \
    python3.10 python3.10-venv python3-pip \
    nodejs npm postgresql postgresql-contrib \
    nginx redis-server git curl

# CentOS/RHEL
sudo yum install -y \
    python3.10 python3-pip nodejs npm \
    postgresql-server postgresql-contrib \
    nginx redis git curl
```

### **2. Environment Variables**

Create production environment files:

**Backend (.env.production)**
```bash
# Core Settings
DEBUG=False
SECRET_KEY=your-super-secure-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/soccentral_prod
DB_NAME=soccentral_prod
DB_USER=soccentral_user
DB_PASSWORD=secure_db_password
DB_HOST=localhost
DB_PORT=5432

# JWT Authentication
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=86400

# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@company.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=SOC Central <noreply@yourdomain.com>

# Security Settings
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_BROWSER_XSS_FILTER=True
SECURE_CONTENT_TYPE_NOSNIFF=True
X_FRAME_OPTIONS=DENY

# File Upload
MAX_UPLOAD_SIZE=100MB
UPLOAD_PATH=/var/www/soccentral/uploads

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/soccentral/django.log
```

**Frontend (.env.production)**
```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com/ws

# Build Settings
VITE_BUILD_MODE=production
VITE_PUBLIC_PATH=/

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=true
VITE_ENABLE_PWA=true

# External Services
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
VITE_GA_TRACKING_ID=GA-XXXX-XX
```

---

## =' Backend Deployment

### **1. Application Setup**

```bash
# Create application user
sudo useradd -m -s /bin/bash soccentral
sudo usermod -aG sudo soccentral

# Switch to application user
sudo -u soccentral -i

# Clone repository
git clone https://github.com/your-org/soc-central.git /home/soccentral/soc-central
cd /home/soccentral/soc-central/backend

# Create virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

### **2. Database Migration**

```bash
# Activate virtual environment
source /home/soccentral/soc-central/backend/venv/bin/activate

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Create necessary directories
mkdir -p /var/log/soccentral
mkdir -p /var/www/soccentral/uploads
sudo chown -R soccentral:soccentral /var/log/soccentral
sudo chown -R soccentral:soccentral /var/www/soccentral
```

### **3. Gunicorn Configuration**

Create `/home/soccentral/soc-central/backend/gunicorn.conf.py`:

```python
# Gunicorn configuration for SOC Central
bind = "127.0.0.1:8000"
workers = 4  # 2 * CPU cores + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2

# Logging
accesslog = "/var/log/soccentral/gunicorn_access.log"
errorlog = "/var/log/soccentral/gunicorn_error.log"
loglevel = "info"

# Process naming
proc_name = "soccentral_backend"

# Server socket
backlog = 2048

# Worker processes
preload_app = True
worker_tmp_dir = "/dev/shm"

# Security
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
```

### **4. Systemd Service**

Create `/etc/systemd/system/soccentral.service`:

```ini
[Unit]
Description=SOC Central Backend
After=network.target postgresql.service

[Service]
Type=forking
User=soccentral
Group=soccentral
WorkingDirectory=/home/soccentral/soc-central/backend
Environment=PATH=/home/soccentral/soc-central/backend/venv/bin
ExecStart=/home/soccentral/soc-central/backend/venv/bin/gunicorn --config gunicorn.conf.py core.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and start the service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable soccentral
sudo systemctl start soccentral
sudo systemctl status soccentral
```

---

## <¨ Frontend Deployment

### **1. Build Process**

```bash
cd /home/soccentral/soc-central/soccentral

# Install dependencies
npm install --production

# Build for production
npm run build

# Verify build
ls -la dist/
```

### **2. Nginx Configuration**

Create `/etc/nginx/sites-available/soccentral`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security Headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss://api.yourdomain.com;" always;
    
    # Frontend
    location / {
        root /home/soccentral/soc-central/soccentral/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # Django Admin
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads
    client_max_body_size 100M;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/soccentral /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## =Ä Database Configuration

### **1. PostgreSQL Setup**

```sql
-- Connect as postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE soccentral_prod;
CREATE USER soccentral_user WITH PASSWORD 'secure_db_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE soccentral_prod TO soccentral_user;
ALTER USER soccentral_user CREATEDB;

-- Enable required extensions
\c soccentral_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

### **2. Database Optimization**

Edit `/etc/postgresql/15/main/postgresql.conf`:

```conf
# Memory settings (adjust based on available RAM)
shared_buffers = 256MB                  # 25% of RAM
effective_cache_size = 1GB              # 75% of RAM
work_mem = 4MB
maintenance_work_mem = 64MB

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Connection settings
max_connections = 200

# Logging
log_min_duration_statement = 1000      # Log slow queries
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Performance
random_page_cost = 1.1                 # For SSD storage
effective_io_concurrency = 200
```

### **3. Database Backup Strategy**

Create `/home/soccentral/scripts/backup_db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/soccentral"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="soccentral_prod"

mkdir -p $BACKUP_DIR

# Create backup
pg_dump $DB_NAME | gzip > "$BACKUP_DIR/soccentral_$DATE.sql.gz"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "soccentral_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: soccentral_$DATE.sql.gz"
```

**Set up automated backups:**
```bash
chmod +x /home/soccentral/scripts/backup_db.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /home/soccentral/scripts/backup_db.sh" | sudo crontab -u soccentral -
```

---

## = Security Configuration

### **1. SSL Certificate with Let's Encrypt**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### **2. Firewall Configuration**

```bash
# Ubuntu UFW
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 5432/tcp    # PostgreSQL (if external access needed)
sudo ufw enable

# CentOS/RHEL Firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

### **3. Security Hardening**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install fail2ban
sudo apt install fail2ban

# Configure fail2ban for Django
sudo tee /etc/fail2ban/jail.local << EOF
[django]
enabled = true
port = http,https
filter = django
logpath = /var/log/soccentral/django.log
maxretry = 5
bantime = 3600
EOF

# Restart fail2ban
sudo systemctl restart fail2ban
```

---

## =Ê Monitoring & Logging

### **1. Log Management**

Configure log rotation in `/etc/logrotate.d/soccentral`:

```conf
/var/log/soccentral/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    sharedscripts
    postrotate
        systemctl reload soccentral
    endscript
}
```

### **2. System Monitoring**

**Install monitoring tools:**
```bash
# System monitoring
sudo apt install htop iotop nethogs

# Application monitoring
pip install sentry-sdk
```

**Django settings for Sentry:**
```python
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

if not DEBUG:
    sentry_sdk.init(
        dsn="your-sentry-dsn-here",
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
    )
```

### **3. Health Check Endpoints**

Add to Django `urls.py`:
```python
# Health check endpoint
path('health/', views.health_check, name='health_check'),
```

**Health check view:**
```python
from django.http import JsonResponse
from django.db import connection

def health_check(request):
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'version': '3.0.0'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e)
        }, status=500)
```

---

## = CI/CD Pipeline

### **1. GitHub Actions Workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v3
        with:
          python-version: '3.10'
          
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          
      - name: Run tests
        run: |
          cd backend
          python manage.py test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /home/soccentral/soc-central
            git pull origin main
            
            # Backend deployment
            cd backend
            source venv/bin/activate
            pip install -r requirements.txt
            python manage.py migrate
            python manage.py collectstatic --noinput
            sudo systemctl restart soccentral
            
            # Frontend deployment
            cd ../soccentral
            npm install --production
            npm run build
            sudo systemctl reload nginx
```

### **2. Deployment Script**

Create `/home/soccentral/scripts/deploy.sh`:

```bash
#!/bin/bash
set -e

PROJECT_DIR="/home/soccentral/soc-central"
BACKUP_DIR="/var/backups/soccentral"

echo "Starting deployment..."

# Create backup
echo "Creating database backup..."
/home/soccentral/scripts/backup_db.sh

# Pull latest code
echo "Pulling latest code..."
cd $PROJECT_DIR
git pull origin main

# Backend deployment
echo "Deploying backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Frontend deployment
echo "Deploying frontend..."
cd ../soccentral
npm ci --production
npm run build

# Restart services
echo "Restarting services..."
sudo systemctl restart soccentral
sudo systemctl reload nginx

echo "Deployment completed successfully!"
```

---

## =à Troubleshooting

### **Common Issues**

**1. Gunicorn won't start:**
```bash
# Check logs
sudo journalctl -u soccentral -f

# Check configuration
/home/soccentral/soc-central/backend/venv/bin/gunicorn --check-config core.wsgi:application
```

**2. Database connection errors:**
```bash
# Test database connection
sudo -u postgres psql -c "\l"
sudo -u soccentral psql soccentral_prod -c "SELECT version();"
```

**3. Static files not loading:**
```bash
# Recollect static files
cd /home/soccentral/soc-central/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# Check Nginx configuration
sudo nginx -t
```

**4. SSL certificate issues:**
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### **Performance Optimization**

**1. Database optimization:**
```sql
-- Analyze table statistics
ANALYZE;

-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
```

**2. Application optimization:**
```bash
# Monitor memory usage
ps aux | grep gunicorn
htop

# Check disk space
df -h
du -sh /var/log/soccentral/*
```

---

## =Þ Support & Maintenance

### **Scheduled Maintenance Tasks**

**Daily:**
- Database backups (automated)
- Log rotation (automated)
- Security updates check

**Weekly:**
- System package updates
- SSL certificate check
- Performance monitoring review

**Monthly:**
- Database maintenance (VACUUM, ANALYZE)
- Security audit
- Backup restoration test

### **Emergency Contacts**

- **System Admin**: admin@yourdomain.com
- **Developer Team**: dev@yourdomain.com
- **Security Team**: security@yourdomain.com

### **Documentation Links**

- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/)
- [Nginx Production Configuration](https://nginx.org/en/docs/)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

---

<div align="center">
  <p><strong>=€ Production Deployment Complete!</strong></p>
  <p><em>SOC Central v3.0 is now running securely in production</em></p>
  
  **Need help?** Check our [documentation](https://docs.soccentral.com) or [create an issue](https://github.com/your-org/soc-central/issues)
</div>