# 2FA Bypass Configuration Guide

## Overview
This guide explains how to bypass two-factor authentication (2FA/MFA) for specific email addresses in the SOC Central application.

## Current Configuration

### Bypassed Email
The following email is currently configured to bypass 2FA:
- `jenish.b@cybersecurityumbrella.com`

When this user logs in:
1. ✅ Email and password are verified
2. ✅ **2FA is skipped** - No verification code sent
3. ✅ User is logged in immediately with JWT tokens

## How It Works

### Backend Implementation
**File:** `backend/authentication/views/auth_views.py`

**Location:** Lines 467-527 in the `login` function

```python
# Password is correct - check if MFA bypass is needed
# MFA bypass list - emails that skip 2FA
MFA_BYPASS_EMAILS = [
    'jenish.b@cybersecurityumbrella.com',
    # Add more emails here as needed
]

# Check if user should bypass MFA
if user.email.lower() in [email.lower() for email in MFA_BYPASS_EMAILS]:
    logger.info(f"MFA bypass for {user.email} - skipping 2FA")

    # Direct login without 2FA
    # ... (session creation and token generation)

    return Response({
        'success': True,
        'message': 'Login successful',
        'tokens': { ... },
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)

# Regular flow - require MFA for all other users
# ... (normal 2FA flow)
```

## How to Add More Bypass Emails

### Step 1: Locate the File
Navigate to: `backend/authentication/views/auth_views.py`

### Step 2: Find the Bypass List
Search for `MFA_BYPASS_EMAILS` around line 469

### Step 3: Add Email Address
Add the new email to the list:

```python
MFA_BYPASS_EMAILS = [
    'jenish.b@cybersecurityumbrella.com',
    'another.user@company.com',        # Add new email here
    'admin@company.com',                # Add another one
    # Add more emails here as needed
]
```

### Step 4: Save and Restart
1. Save the file
2. Restart the Django server:
   ```bash
   cd backend
   python manage.py runserver
   ```

## Important Notes

### Security Considerations
⚠️ **Warning:** Bypassing 2FA reduces account security. Only use for:
- Testing/development accounts
- Specific admin accounts where 2FA causes issues
- Service accounts that need automated access

### Case Sensitivity
- Email matching is **case-insensitive**
- `User@Example.com` will match `user@example.com`

### Logging
- All bypass logins are logged with: `"MFA bypass for {email} - skipping 2FA"`
- Login alerts are still sent to the user
- Session tracking continues normally

## Testing the Bypass

### Test Steps:
1. **Login with bypassed email:**
   - Enter email: `jenish.b@cybersecurityumbrella.com`
   - Enter password
   - Click "Login"

2. **Expected Result:**
   - ✅ Immediate login (no 2FA code screen)
   - ✅ Redirected to dashboard
   - ✅ JWT tokens issued

3. **Check Logs:**
   ```bash
   # In backend directory
   tail -f logs/authentication.log
   ```
   - Look for: `"MFA bypass for jenish.b@cybersecurityumbrella.com - skipping 2FA"`

### Test with Non-Bypassed Email:
1. Login with any other email
2. Should see 2FA code screen
3. Check email for verification code
4. Enter code to complete login

## Alternative Configurations

### Option 1: Environment Variable (More Secure)
Instead of hardcoding emails in the source code, use environment variables:

```python
import os

# Get bypass emails from environment variable
bypass_emails_env = os.getenv('MFA_BYPASS_EMAILS', '')
MFA_BYPASS_EMAILS = [email.strip() for email in bypass_emails_env.split(',') if email.strip()]

# Add hardcoded defaults if needed
MFA_BYPASS_EMAILS.extend([
    'jenish.b@cybersecurityumbrella.com',
])
```

Then set in `.env`:
```env
MFA_BYPASS_EMAILS=user1@company.com,user2@company.com,user3@company.com
```

### Option 2: Database Configuration
Create a database table to manage bypass emails:

```python
# In models.py
class MFABypassEmail(models.Model):
    email = models.EmailField(unique=True)
    reason = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

# In auth_views.py
bypass_emails = MFABypassEmail.objects.filter(
    is_active=True
).values_list('email', flat=True)

if user.email.lower() in [email.lower() for email in bypass_emails]:
    # Bypass 2FA
    ...
```

## Troubleshooting

### Issue: Bypass Not Working
**Symptoms:** User still receives 2FA code

**Solutions:**
1. Check email spelling in bypass list
2. Verify server was restarted
3. Check logs for "MFA bypass" message
4. Ensure email is lowercase in comparison

### Issue: All Users Bypassing 2FA
**Symptoms:** No one receives 2FA codes

**Solutions:**
1. Check if `MFA_BYPASS_EMAILS` includes `*` or empty string
2. Verify the if condition is correct
3. Check for syntax errors in the bypass list

### Issue: Bypass User Can't Login
**Symptoms:** User gets authentication error

**Solutions:**
1. Verify user account exists
2. Check password is correct
3. Ensure account is active (`is_active=True`)
4. Check for account deactivation

## Rollback Instructions

### To Remove a Bypass Email:
1. Open `backend/authentication/views/auth_views.py`
2. Remove the email from `MFA_BYPASS_EMAILS` list
3. Save file
4. Restart server

### To Remove All Bypasses:
1. Find the bypass code block (lines 467-527)
2. Comment out or remove the entire bypass section
3. Keep only the "Regular flow - require MFA" section
4. Save and restart

## Related Files

### Files Modified:
- `backend/authentication/views/auth_views.py` - Main bypass logic

### Related Files (not modified):
- `backend/authentication/models.py` - User and MFACode models
- `backend/authentication/services.py` - Email service for MFA codes
- `soccentral/src/contexts/AuthContext.tsx` - Frontend auth handling

## Security Best Practices

### DO:
- ✅ Document why each email needs bypass
- ✅ Review bypass list regularly
- ✅ Remove bypass when no longer needed
- ✅ Use environment variables for production
- ✅ Monitor bypass login logs

### DON'T:
- ❌ Bypass production admin accounts
- ❌ Add all employees to bypass list
- ❌ Leave test emails in production
- ❌ Forget to document bypass reasons
- ❌ Disable 2FA system-wide

## Support

For questions or issues:
1. Check application logs: `backend/logs/authentication.log`
2. Review this documentation
3. Test in development environment first
4. Contact system administrator

## Changelog

- **2025-01-15**: Added bypass for `jenish.b@cybersecurityumbrella.com`
- **2025-01-15**: Created initial bypass configuration
