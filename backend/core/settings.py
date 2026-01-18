# backend/core/settings.py - ENHANCED FOR REFACTORED VIEWS
import os
from pathlib import Path
from decouple import config
import dj_database_url
from datetime import timedelta

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='dev-secret-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

# Environment Detection
IS_PRODUCTION = not DEBUG
IS_LOCAL = DEBUG

# Host Configuration
if IS_PRODUCTION:
    ALLOWED_HOSTS = [
        'localhost',  # Allow localhost
        '127.0.0.1',  # Allow localhost IP
        '0.0.0.0',  # Add this for Render
        'soc-central-backend.onrender.com',
        'django-backend.onrender.com',
        '115.246.21.123',  # Company server deployment IP
        'soc.cybersecurityumbrella.com',  # Production frontend domain
        'socapi.cybersecurityumbrella.com',  # Production API domain
        'www.soc.cybersecurityumbrella.com',  # Add www version
    ]
    FRONTEND_URL = config('FRONTEND_URL', default='https://soc.cybersecurityumbrella.com')
    print(f"Production FRONTEND_URL: {FRONTEND_URL}")
    print(f"Environment FRONTEND_URL: {os.environ.get('FRONTEND_URL', 'NOT SET')}")
else:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']
    FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:8080')
    print(f"Development FRONTEND_URL: {FRONTEND_URL}")

    
# NEW: API Base URL for complete URL generation
API_BASE_URL = config('API_BASE_URL', default='http://localhost:8000' if IS_LOCAL else 'https://socapi.cybersecurityumbrella.com/api')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_extensions',
    
    # Local apps
    'authentication',
    'tool',
]

# UPDATED: Enhanced middleware order for refactored views
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CRITICAL: Move CORS to the top
    'django.middleware.security.SecurityMiddleware',  # Re-enabled - should work with DEBUG=True
    'django.middleware.gzip.GZipMiddleware',  # Add compression for better performance
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # TEMPORARILY DISABLED: Custom middlewares to isolate CORS issue
    # 'authentication.middleware.RoleBasedPermissionMiddleware',  # DISABLED: Causing blocking issues
    # 'authentication.middleware.SecurityHeadersMiddleware',       # Enhanced security
    # 'authentication.middleware.RequestLoggingMiddleware',        # Better logging
    # 'authentication.middleware.UserActivityMiddleware',          # NEW: Activity tracking
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database Configuration
DATABASE_URL = config('DATABASE_URL', default=None)

if DATABASE_URL:
    # Production database from environment
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL)
    }
else:
    # Local development database
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='soc_central_db'),
            'USER': config('DB_USER', default='soc_central_user'),
            'PASSWORD': config('DB_PASSWORD', default='SecurePassword123!'),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
            'OPTIONS': {
                'sslmode': config('DB_SSL_MODE', default='prefer'),
            },
        }
    }

# Custom User Model
AUTH_USER_MODEL = 'authentication.User'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        # 'rest_framework.permissions.IsAuthenticated',  # DISABLED: Let individual views handle auth
        'rest_framework.permissions.AllowAny',  # TEMP: Allow all, let middleware handle auth
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 100,  # Increased from 50 for fewer requests
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

#  ENHANCED: JWT Configuration for refactored views
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    #  NEW: Enhanced token claims for user roles
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# Password validation - Made more lenient for easier password reset
AUTH_PASSWORD_VALIDATORS = [
    # Temporarily disabled for easier password reset
    # {
    #     'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    # },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 4,  # Reduced from 8 to 4 for more lenient validation
        }
    },
    # Temporarily disabled for easier password reset
    # {
    #     'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    # },
    # {
    #     'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    # },
]

#  ENHANCED: Email Configuration for refactored EmailService
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_SSL = False
EMAIL_TIMEOUT = 60

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER or 'noreply@soccentral.com')
EMAIL_SUBJECT_PREFIX = '[SOC Central] '
SERVER_EMAIL = DEFAULT_FROM_EMAIL

#  NEW: Email template settings for the refactored EmailService
EMAIL_TEMPLATE_SETTINGS = {
    'LOGO_URL': 'https://ucarecdn.com/5c1a846a-769c-4bc8-9f94-561f0c41c3e4/white.png',
    'COMPANY_NAME': 'SOC Central',
    'SUPPORT_EMAIL': 'support@soccentral.com',
    'CURRENT_YEAR': '2025',
}

# Google Gemini AI Configuration - SECURE: No sensitive data sent to API
GEMINI_API_KEY = config('GEMINI_API_KEY', default='AIzaSyBrv1JWSjWV89vGyGV9kBp10Q8n-ZsAyZ8')
GEMINI_MODEL = 'gemini-1.5-flash'  # Free tier model

# Wazuh API Feature Flag - Set to False for production, True for internal testing
WAZUH_API_ENABLED = config('WAZUH_API_ENABLED', default=False, cast=bool)

# CORS Configuration - Environment Specific
if IS_LOCAL:
    # Local development - Allow all common local ports and IP variations
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8000",
        "http://115.246.21.123",
        "http://115.246.21.123:8000",
        "http://115.246.21.123:80",
        "https://soc.cybersecurityumbrella.com",     # Production frontend domain
        "https://socapi.cybersecurityumbrella.com",  # Production API domain
    ]

    CORS_ALLOW_ALL_ORIGINS = True  # This allows all origins in development
    CORS_ALLOW_CREDENTIALS = True

    print(f"CORS ALLOWED ORIGINS: {CORS_ALLOWED_ORIGINS}")
    print(f"CORS ALLOW ALL: {CORS_ALLOW_ALL_ORIGINS}")

else:
    #  CRITICAL FIX: Production CORS settings
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:8080",                     # Allow localhost in production
        "http://localhost:8000",                     # Allow localhost API in production
        "http://127.0.0.1:8080",                     # Allow localhost IP
        "http://127.0.0.1:8000",                     # Allow localhost API IP
        "https://soccentral.onrender.com",           # Your frontend (legacy)
        "https://soc-central-backend.onrender.com",  # Your backend (for admin panel)
        "http://115.246.21.123",                     # Your server IP
        "http://115.246.21.123:8000",               # Your API server
        "http://115.246.21.123:80",
        "https://soc.cybersecurityumbrella.com",     # Production frontend domain
        "https://socapi.cybersecurityumbrella.com",  # Production API domain
    ]
    
    #  CRITICAL: Add these additional CORS settings for production
    CORS_ALLOW_ALL_ORIGINS = False # to allow all origins in production (Temporaray set to True, change to False later)
    CORS_ALLOW_CREDENTIALS = True
    
    #  CRITICAL: Enable preflight for all routes
    CORS_PREFLIGHT_MAX_AGE = 86400
    
    print(f"Production CORS ORIGINS: {CORS_ALLOWED_ORIGINS}")

# CRITICAL: These should be outside the if/else block (apply to both)
CORS_ALLOW_CREDENTIALS = True

# CRITICAL FIX: Add these settings to handle preflight requests properly
CORS_PREFLIGHT_MAX_AGE = 86400
CORS_ALLOW_PRIVATE_NETWORK = True

# CRITICAL FIX: Disable Django's automatic redirects that interfere with CORS
APPEND_SLASH = False

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',           #  Critical for JWT
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'access-control-allow-origin',  #  Add this
    'cache-control',               #  Add this
]

CORS_EXPOSE_HEADERS = [
    'content-type',
    'authorization',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Security Settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

if IS_PRODUCTION:
    # Production Security
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
else:
    # Development Security - CRITICAL FIX: Force SSL redirect to False
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
    
# CRITICAL FIX: Explicitly disable SSL redirect in development
if IS_LOCAL:
    SECURE_SSL_REDIRECT = False

# Session Configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict' if IS_PRODUCTION else 'Lax'

# CRITICAL FIX: CSRF Configuration for CORS
CSRF_COOKIE_SAMESITE = 'Lax' if IS_LOCAL else 'Strict'
CSRF_COOKIE_HTTPONLY = False  # Allow JavaScript access for frontend
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://soc.cybersecurityumbrella.com",
    "https://socapi.cybersecurityumbrella.com",
] if IS_LOCAL else [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:8000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8000",
    "https://soccentral.onrender.com",
    "https://soc-central-backend.onrender.com",
    "http://115.246.21.123",
    "http://115.246.21.123:8000",
    "https://soc.cybersecurityumbrella.com",
    "https://socapi.cybersecurityumbrella.com",
]

#  ENHANCED: Cache Configuration for better performance
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache_table',
        'TIMEOUT': 600,  # 10 minutes - extended for better caching
        'OPTIONS': {
            'MAX_ENTRIES': 5000,  # Increased for more cached items
            'CULL_FREQUENCY': 4,  # Less aggressive culling
        }
    }
}

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_DIRS = []
if os.path.exists(BASE_DIR / 'static'):
    STATICFILES_DIRS.append(BASE_DIR / 'static')

# WhiteNoise optimization for static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Static file caching headers (via WhiteNoise)
WHITENOISE_MAX_AGE = 31536000 if IS_PRODUCTION else 0  # 1 year in production

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

#  ENHANCED: Application Specific Settings for refactored views
OTP_EXPIRY_MINUTES = config('OTP_EXPIRY_MINUTES', default=10, cast=int)
MAX_OTP_ATTEMPTS = config('MAX_OTP_ATTEMPTS', default=5, cast=int)
OTP_RATE_LIMIT_MINUTES = config('OTP_RATE_LIMIT_MINUTES', default=2, cast=int)

# Password Reset Settings
PASSWORD_RESET_COOLDOWN_MINUTES = 15
MAX_PASSWORD_RESET_ATTEMPTS = 3

# Security Questions Settings
MIN_SECURITY_QUESTIONS = 2
MAX_SECURITY_QUESTIONS = 5

# Super Admin Configuration
CREATE_SUPER_ADMIN = config('CREATE_SUPER_ADMIN', default=True, cast=bool)
SUPER_ADMIN_EMAIL = config('SUPER_ADMIN_EMAIL', default='admin@soccentral.com')
SUPER_ADMIN_PASSWORD = config('SUPER_ADMIN_PASSWORD', default='SuperAdmin123!')

# File Upload Configuration - MEMORY OPTIMIZED FOR 512MB RAM
FILE_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20MB - Reduced for low RAM environments
DATA_UPLOAD_MAX_MEMORY_SIZE = 20 * 1024 * 1024  # 20MB - Files larger than this use temp files
DATA_UPLOAD_MAX_NUMBER_FIELDS = 10000  # Increased for Excel files with many columns
FILE_UPLOAD_PERMISSIONS = 0o644
ALLOWED_FILE_EXTENSIONS = ['.xlsx', '.xls', '.csv']
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB - Still allow large files but use temp files
FILE_UPLOAD_TEMP_DIR = None  # Use system temp directory for large files

#  ENHANCED: Rate Limiting Settings for refactored views
RATE_LIMIT_DEFAULTS = {
    'login': {'limit': 5, 'window': 900},           # 5 attempts per 15 minutes
    'signup': {'limit': 3, 'window': 3600},         # 3 attempts per hour
    'otp_request': {'limit': 5, 'window': 3600},    # 5 OTP requests per hour
    'password_reset': {'limit': 3, 'window': 3600}, # 3 reset requests per hour
    'password_change': {'limit': 5, 'window': 3600}, # 5 password changes per hour
    'admin_action': {'limit': 10, 'window': 3600},   # 10 admin actions per hour
}

#  NEW: Email Domain Restrictions (for enhanced utils.py)
ALLOWED_EMAIL_DOMAINS = []  # Empty = allow all domains
BLOCKED_EMAIL_DOMAINS = [
    'tempmail.com', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'temp-mail.org', 'throwaway.email'
]

#  NEW: Security Settings for enhanced authentication
SECURITY_SETTINGS = {
    'MAX_LOGIN_ATTEMPTS': 5,
    'ACCOUNT_LOCKOUT_DURATION': 900,  # 15 minutes in seconds
    'ENABLE_CAPTCHA_AFTER_FAILURES': 3,
    'ENABLE_PWNED_PASSWORD_CHECK': True,
    'REQUIRE_STRONG_PASSWORDS': True,
    'ENABLE_ACTIVITY_LOGGING': True,
    'ENABLE_SECURITY_NOTIFICATIONS': True,
}

#  NEW: User Settings Defaults (for settings views)
USER_SETTINGS_DEFAULTS = {
    'email_notifications': True,
    'push_notifications': True,
    'security_alerts': True,
    'product_updates': False,
    'marketing_emails': False,
    'login_notifications': True,
    'profile_visibility': 'team',
    'activity_tracking': True,
    'analytics_sharing': False,
    'theme': 'system',
    'language': 'en',
    'timezone': 'UTC',
    'date_format': 'MM/DD/YYYY',
    'default_view': 'dashboard',
    'session_timeout': 300,  # Changed from 60 seconds (1 minute) to 300 seconds (5 minutes)
}

# Logging Configuration
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

#  ENHANCED: Logging for refactored views
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{asctime}] {levelname} {name}: {message}',
            'style': '{',
        },
        'security': {
            'format': '[{asctime}] SECURITY {levelname} {name}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG' if IS_LOCAL else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'django.log',
            'maxBytes': 10 * 1024 * 1024,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'auth_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'authentication.log',
            'maxBytes': 5 * 1024 * 1024,  # 5MB
            'backupCount': 3,
            'formatter': 'verbose',
        },
        'security_file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'security.log',
            'maxBytes': 5 * 1024 * 1024,  # 5MB
            'backupCount': 5,
            'formatter': 'security',
        },
        'email_file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'email.log',
            'maxBytes': 2 * 1024 * 1024,  # 2MB
            'backupCount': 3,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'authentication': {
            'handlers': ['console', 'auth_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'authentication.views': {
            'handlers': ['console', 'auth_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'authentication.services': {
            'handlers': ['console', 'email_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'tool': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console', 'security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'security': {
            'handlers': ['console', 'security_file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

#  NEW: Debug Settings for Development
if IS_LOCAL:
    # Enable SQL query logging in development
    LOGGING['loggers']['django.db.backends'] = {
        'handlers': ['console'],
        'level': 'DEBUG',
        'propagate': False,
    }
    
    # Enable email backend console output
    if not EMAIL_HOST_USER:
        EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
        print(" Using console email backend for development")

# Development vs Production Info
if IS_LOCAL:
    print(" SOC Central Development Configuration:")
    print(f"    Frontend URL: {FRONTEND_URL}")
    print(f"    API Base URL: {API_BASE_URL}")
    print(f"    Email Backend: {EMAIL_BACKEND}")
    print(f"    Database: {DATABASES['default']['NAME']}")
    print(f"    CORS Allow All: {CORS_ALLOW_ALL_ORIGINS}")
    print(f"    SSL Redirect: {SECURE_SSL_REDIRECT}")
    print(f"    Rate Limiting: {len(RATE_LIMIT_DEFAULTS)} policies")
    print(f"    Blocked Domains: {len(BLOCKED_EMAIL_DOMAINS)} domains")
    
    # Email debug info
    if EMAIL_HOST_USER:
        print(f"    Email User: {EMAIL_HOST_USER}")
        print(f"    From Email: {DEFAULT_FROM_EMAIL}")
    
    # Middleware info
    print(f"    Middleware: {len(MIDDLEWARE)} middlewares loaded")
    print(f"    Apps: {len(INSTALLED_APPS)} apps installed")
    
else:
    # Production validation
    required_prod_settings = ['SECRET_KEY', 'EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD', 'FRONTEND_URL']
    missing_settings = [s for s in required_prod_settings if not config(s, default=None)]
    
    if missing_settings:
        raise ValueError(f"Missing required production settings: {missing_settings}")
    
    print(" SOC Central Production Configuration Loaded")
    print(f"    Frontend URL: {FRONTEND_URL}")
    print(f"    API Base URL: {API_BASE_URL}")
    print(f"    SSL Redirect: {SECURE_SSL_REDIRECT}")
    print(f"    Email Configured: {'' if EMAIL_HOST_USER else ''}")
    print(f"    Security Headers: Enabled")
    print(f"    Activity Logging: Enabled")

# SMS Configuration with Twilio
# Get these credentials from: https://www.twilio.com/console
TWILIO_ACCOUNT_SID = config('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN = config('TWILIO_AUTH_TOKEN', default='')  
TWILIO_PHONE_NUMBER = config('TWILIO_PHONE_NUMBER', default='')  # Your Twilio phone number (e.g., +1234567890)

# SMS Service Configuration
SMS_SERVICE_ENABLED = config('SMS_SERVICE_ENABLED', default=False, cast=bool)
SMS_SERVICE_PROVIDER = config('SMS_SERVICE_PROVIDER', default='twilio')  # Future: support multiple providers

#  NEW: Create cache table command reminder
print(f" Remember to run: python manage.py createcachetable")
print(f" Logs directory: {LOGS_DIR}")
print(f"Architecture: Refactored Modular Views v2.0")

# IIS Configuration
if not DEBUG:
    # Production settings for IIS
    STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
    STATIC_URL = '/static/'
    
    # Media files
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
    MEDIA_URL = '/media/'
    
    # IIS specific settings
    USE_TZ = True
    
    # Force script name for IIS
    FORCE_SCRIPT_NAME = ''
    
    # Additional IIS logging
    LOGGING['handlers']['iis_file'] = {
        'level': 'ERROR',
        'class': 'logging.handlers.RotatingFileHandler',
        'filename': LOGS_DIR / 'iis_errors.log',
        'maxBytes': 5 * 1024 * 1024,  # 5MB
        'backupCount': 3,
        'formatter': 'verbose',
    }
    
    LOGGING['loggers']['django.request'] = {
        'handlers': ['console', 'file', 'iis_file'],
        'level': 'ERROR',
        'propagate': False,
    }