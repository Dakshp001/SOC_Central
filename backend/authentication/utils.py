# backend/authentication/utils.py - ENHANCED FOR REFACTORED VIEWS
from django.core.cache import cache
from django.conf import settings
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
import re
import logging
import os

logger = logging.getLogger(__name__)

# ==========================================
# REQUEST UTILITIES
# ==========================================

def get_client_ip(request):
    """
    Get client IP address from request with enhanced detection
    ✅ ENHANCED: Better IP detection for various proxy setups
    """
    # Check for X-Forwarded-For header (common with load balancers)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # Take the first IP in the chain (original client)
        ip = x_forwarded_for.split(',')[0].strip()
        return ip
    
    # Check for X-Real-IP header (nginx)
    x_real_ip = request.META.get('HTTP_X_REAL_IP')
    if x_real_ip:
        return x_real_ip.strip()
    
    # Check for CF-Connecting-IP (Cloudflare)
    cf_connecting_ip = request.META.get('HTTP_CF_CONNECTING_IP')
    if cf_connecting_ip:
        return cf_connecting_ip.strip()
    
    # Fallback to REMOTE_ADDR
    remote_addr = request.META.get('REMOTE_ADDR', '127.0.0.1')
    return remote_addr

def get_user_agent(request):
    """
    Get user agent from request with sanitization
    ✅ ENHANCED: Sanitize and limit length
    """
    user_agent = request.META.get('HTTP_USER_AGENT', 'Unknown')
    
    # Limit length to prevent database issues
    if len(user_agent) > 500:
        user_agent = user_agent[:500] + '...'
    
    return user_agent

def get_request_metadata(request):
    """
    Get comprehensive request metadata for logging
    ✅ NEW: Comprehensive request information
    """
    return {
        'ip_address': get_client_ip(request),
        'user_agent': get_user_agent(request),
        'method': request.method,
        'path': request.path,
        'referer': request.META.get('HTTP_REFERER', ''),
        'accept_language': request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
        'is_secure': request.is_secure(),
        'host': request.get_host(),
    }

# ==========================================
# RATE LIMITING UTILITIES
# ==========================================

def rate_limit_check(key, action, limit=5, window=900):
    """
    Enhanced rate limiting using Redis cache
    ✅ ENHANCED: Better error handling and logging
    
    Args:
        key: Identifier (usually IP address)
        action: Action being performed ('login', 'signup', etc.)
        limit: Maximum attempts allowed
        window: Time window in seconds
    
    Returns:
        bool: True if under limit, False if over limit
    """
    cache_key = f"rate_limit:{action}:{key}"
    
    try:
        current_attempts = cache.get(cache_key, 0)
        
        if current_attempts >= limit:
            logger.warning(f"Rate limit exceeded for {action} from {key}: {current_attempts}/{limit}")
            return False
        
        # Increment counter with expiration
        cache.set(cache_key, current_attempts + 1, window)
        
        # Log if approaching limit
        if current_attempts >= limit * 0.8:  # 80% of limit
            logger.info(f"Rate limit warning for {action} from {key}: {current_attempts + 1}/{limit}")
        
        return True
        
    except Exception as e:
        logger.error(f"Rate limiting error for {action} from {key}: {str(e)}")
        # If cache fails, allow the request (fail open for availability)
        return True

def get_rate_limit_status(key, action):
    """
    Get current rate limit status for a key/action
    ✅ NEW: Check rate limit status without incrementing
    """
    cache_key = f"rate_limit:{action}:{key}"
    
    try:
        current_attempts = cache.get(cache_key, 0)
        ttl = cache.ttl(cache_key) if hasattr(cache, 'ttl') else None
        
        return {
            'current_attempts': current_attempts,
            'remaining_time': ttl,
            'is_limited': current_attempts >= getattr(settings, f'{action.upper()}_RATE_LIMIT', 5)
        }
    except Exception:
        return {
            'current_attempts': 0,
            'remaining_time': None,
            'is_limited': False
        }

def reset_rate_limit(key, action):
    """
    Reset rate limit for a specific key/action
    ✅ NEW: Manual rate limit reset (for admin use)
    """
    cache_key = f"rate_limit:{action}:{key}"
    try:
        cache.delete(cache_key)
        logger.info(f"Rate limit reset for {action} from {key}")
        return True
    except Exception as e:
        logger.error(f"Failed to reset rate limit for {action} from {key}: {str(e)}")
        return False

def is_rate_limited(key, limit=5, window=900):
    """
    Simple rate limiting check - returns True if rate limited
    This is a wrapper around rate_limit_check for convenience
    """
    try:
        result = rate_limit_check(key, 'general', limit, window)
        return not result['allowed']
    except Exception as e:
        logger.error(f"Rate limiting check failed: {str(e)}")
        return False

# ==========================================
# EMAIL UTILITIES
# ==========================================

def clean_and_validate_email(email):
    """
    Clean and validate email address with enhanced validation
    ✅ ENHANCED: Better email validation
    """
    if not email:
        return None
    
    email = email.lower().strip()
    
    # Remove any surrounding whitespace and normalize
    email = re.sub(r'\s+', '', email)
    
    # Enhanced email regex validation
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_regex, email):
        return None
    
    # Additional checks
    local_part, domain = email.split('@', 1)
    
    # Check local part length (max 64 characters per RFC)
    if len(local_part) > 64:
        return None
    
    # Check domain part
    if len(domain) > 253:
        return None
    
    # Check for consecutive dots
    if '..' in email:
        return None
    
    return email

def mask_email(email):
    """
    Mask email for security purposes with improved masking
    ✅ ENHANCED: Better email masking algorithm
    """
    if not email or '@' not in email:
        return email
    
    local, domain = email.split('@', 1)
    
    if len(local) <= 2:
        masked_local = '*' * len(local)
    elif len(local) <= 4:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
    else:
        # For longer emails, show first 2 and last 1 character
        masked_local = local[:2] + '*' * (len(local) - 3) + local[-1]
    
    # Also mask domain for extra privacy
    domain_parts = domain.split('.')
    if len(domain_parts) >= 2:
        masked_domain = domain_parts[0][0] + '*' * (len(domain_parts[0]) - 1)
        for part in domain_parts[1:]:
            masked_domain += '.' + part
    else:
        masked_domain = domain
    
    return f"{masked_local}@{masked_domain}"

