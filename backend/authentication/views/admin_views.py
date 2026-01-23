# backend/authentication/views/admin_views.py
"""
Admin User Management Views
Handles admin-level user creation, management, and operations
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.conf import settings
from django.core.cache import cache

from ..models import User, UserSession, Company
from ..utils import get_client_ip, get_user_agent
from ..fast_email_service import FastEmailService

import logging
import secrets

logger = logging.getLogger(__name__)

# ==========================================
# ADMIN USER MANAGEMENT VIEWS
# ==========================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user_by_admin(request):
    """Create new user account by admin and send activation email"""
    try:
        # Check admin permissions
        if not request.user.can_write():
            logger.warning(f"Unauthorized user creation attempt by {request.user.email}")
            return Response({
                'success': False,
                'error': 'Admin privileges required for user creation',
                'user_role': request.user.role
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Extract and validate input data
        email = request.data.get('email', '').lower().strip()
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        company_name = request.data.get('company_name', '').strip()
        company_id = request.data.get('company_id', '').strip()
        role = request.data.get('role', 'general').lower()

        logger.info(f"User creation request: email={email}, company_name={company_name}, company_id={company_id}, role={role}")
        
        # Validation
        if not all([email, first_name, last_name, company_name]):
            return Response({
                'success': False,
                'error': 'Email, first name, last name, and company name are required',
                'missing_fields': [
                    field for field, value in {
                        'email': email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'company_name': company_name
                    }.items() if not value
                ]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate email format
        from django.core.validators import validate_email
        try:
            validate_email(email)
        except ValidationError:
            return Response({
                'success': False,
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'success': False,
                'error': 'A user with this email already exists',
                'email': email
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate role
        valid_roles = ['general', 'admin', 'master_admin', 'super_admin']
        if role not in valid_roles:
            return Response({
                'success': False,
                'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}',
                'provided_role': role
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user can create accounts with this role
        if role == 'super_admin' and request.user.role != 'super_admin':
            return Response({
                'success': False,
                'error': 'Only super admins can create super admin accounts'
            }, status=status.HTTP_403_FORBIDDEN)

        if role == 'master_admin' and request.user.role != 'super_admin':
            return Response({
                'success': False,
                'error': 'Only super admins can create master admin accounts'
            }, status=status.HTTP_403_FORBIDDEN)

        if role == 'admin' and request.user.role not in ['super_admin', 'master_admin']:
            return Response({
                'success': False,
                'error': 'Only super admins and master admins can create admin accounts'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Handle company assignment based on user role
        target_company = None
        if request.user.role == 'super_admin':
            # Super admin can assign users to any company
            if company_id:
                try:
                    target_company = Company.objects.get(id=company_id, is_active=True)
                    company_name = target_company.name  # Use the company's actual name
                    logger.info(f"Super admin assigning user to company: {target_company.name} ({target_company.id})")

                    # Check if company has reached user limit
                    if not target_company.can_add_users(1):
                        return Response({
                            'success': False,
                            'error': f'Company "{target_company.display_name}" has reached its maximum user limit of {target_company.max_users}',
                            'current_users': target_company.get_user_count(),
                            'max_users': target_company.max_users,
                            'remaining_slots': 0
                        }, status=status.HTTP_400_BAD_REQUEST)

                    # Check master admin limit (1 per company)
                    if role == 'master_admin':
                        existing_master_admin_count = target_company.get_master_admin_count()
                        if existing_master_admin_count >= 1:
                            return Response({
                                'success': False,
                                'error': f'Company "{target_company.display_name}" already has a Master Admin. Only one Master Admin allowed per company.'
                            }, status=status.HTTP_400_BAD_REQUEST)

                except Company.DoesNotExist:
                    return Response({
                        'success': False,
                        'error': 'Selected company not found or inactive',
                        'company_id': company_id
                    }, status=status.HTTP_400_BAD_REQUEST)
            # If no company_id provided, use company_name as fallback for manual entry
        else:
            # Admin or Master Admin can only create users for their own company
            if company_name != request.user.company_name:
                return Response({
                    'success': False,
                    'error': 'You can only create users for your own company',
                    'your_company': request.user.company_name,
                    'requested_company': company_name
                }, status=status.HTTP_403_FORBIDDEN)

            # Check if company has reached user limit
            if request.user.company:
                if not request.user.company.can_add_users(1):
                    return Response({
                        'success': False,
                        'error': f'Your company has reached its maximum user limit of {request.user.company.max_users}',
                        'current_users': request.user.company.get_user_count(),
                        'max_users': request.user.company.max_users,
                        'remaining_slots': 0
                    }, status=status.HTTP_400_BAD_REQUEST)

                # Check admin limit for master_admin creating admins (max 3)
                if role == 'admin' and request.user.role == 'master_admin':
                    can_add, error_message = request.user.company.can_add_admin(request.user)
                    if not can_add:
                        return Response({
                            'success': False,
                            'error': error_message
                        }, status=status.HTTP_400_BAD_REQUEST)

                # Assign the company for non-super-admin creators
                target_company = request.user.company
        
        # Create user with temporary password
        temp_password = secrets.token_urlsafe(32)
        
        # Create user with company association
        user_kwargs = {
            'username': email,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'company_name': company_name,
            'role': role,
            'password': temp_password,
            'is_email_verified': False,
            'password_reset_required': True,
            'created_by': request.user,
            'is_active': True
        }

        # Add company relationship if company was selected
        if target_company:
            user_kwargs['company'] = target_company

        user = User.objects.create_user(**user_kwargs)

        # Log company tool inheritance
        if target_company:
            tools_count = len(target_company.enabled_tools)
            logger.info(f"User {user.email} created with company {target_company.name} - inheriting {tools_count} tools: {target_company.enabled_tools}")
        else:
            logger.info(f"User {user.email} created without specific company assignment")
        
        # Send activation email asynchronously
        import threading
        def send_activation_email():
            try:
                # Send activation email
                email_service = FastEmailService()
                activation_sent = email_service.send_activation_email(user, created_by=request.user)
            except Exception as e:
                logger.warning(f"Failed to send activation email: {e}")
        
        threading.Thread(target=send_activation_email, daemon=True).start()
        
        # Log successful user creation
        logger.info(f"User {user.email} created successfully by {request.user.email}")
        
        return Response({
            'success': True,
            'message': 'User created successfully and activation email sent',
            'user': {
                'id': str(user.id),
                'email': user.email,
                'full_name': user.get_full_name(),
                'company_name': user.company_name,
                'company_id': str(target_company.id) if target_company else None,
                'company_tools': target_company.enabled_tools if target_company else [],
                'role': user.role,
                'created_at': user.created_at.isoformat(),
                'created_by': {
                    'name': request.user.get_full_name(),
                    'email': request.user.email
                }
            },
            'email_status': 'sent',
            'next_steps': 'User will receive an email with instructions to set their password'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to create user account',
            'details': str(e) if settings.DEBUG else 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user_by_admin(request, user_id):
    """Update user details by admin"""
    try:
        # Check admin permissions
        if not request.user.can_write():
            return Response({
                'success': False,
                'error': 'Admin privileges required for user management'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get the user to update
        try:
            user_to_update = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if admin can manage this user
        if not user_to_update.can_be_managed_by(request.user):
            return Response({
                'success': False,
                'error': 'You do not have permission to manage this user'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Update allowed fields
        updated_fields = []
        
        if 'first_name' in request.data:
            user_to_update.first_name = request.data['first_name'].strip()
            updated_fields.append('first_name')
        
        if 'last_name' in request.data:
            user_to_update.last_name = request.data['last_name'].strip()
            updated_fields.append('last_name')
        
        if 'company_name' in request.data:
            # Only super admin can change company
            if request.user.role == 'super_admin':
                user_to_update.company_name = request.data['company_name'].strip()
                updated_fields.append('company_name')
            elif request.data['company_name'] != user_to_update.company_name:
                return Response({
                    'success': False,
                    'error': 'Only super admins can change user company'
                }, status=status.HTTP_403_FORBIDDEN)
        
        if 'role' in request.data:
            new_role = request.data['role'].lower()
            if new_role not in ['general', 'admin', 'master_admin', 'super_admin']:
                return Response({
                    'success': False,
                    'error': 'Invalid role'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Only super admin can create/modify super admin accounts
            if new_role == 'super_admin' and request.user.role != 'super_admin':
                return Response({
                    'success': False,
                    'error': 'Only super admins can manage super admin accounts'
                }, status=status.HTTP_403_FORBIDDEN)

            # Only super admin can create/modify master admin accounts
            if new_role == 'master_admin' and request.user.role != 'super_admin':
                return Response({
                    'success': False,
                    'error': 'Only super admins can manage master admin accounts'
                }, status=status.HTTP_403_FORBIDDEN)

            # Check master admin limit when changing to master_admin
            if new_role == 'master_admin' and user_to_update.role != 'master_admin':
                if user_to_update.company:
                    existing_master_admin_count = user_to_update.company.get_master_admin_count()
                    if existing_master_admin_count >= 1:
                        return Response({
                            'success': False,
                            'error': f'Company already has a Master Admin. Only one Master Admin allowed per company.'
                        }, status=status.HTTP_400_BAD_REQUEST)

            # Only super admin and master admin can create/modify admin accounts
            if new_role == 'admin' and request.user.role not in ['super_admin', 'master_admin']:
                return Response({
                    'success': False,
                    'error': 'Only super admins and master admins can manage admin accounts'
                }, status=status.HTTP_403_FORBIDDEN)

            user_to_update.role = new_role
            updated_fields.append('role')
        
        if updated_fields:
            user_to_update.save()
            logger.info(f"User {user_to_update.email} updated by {request.user.email}: {updated_fields}")
        
        return Response({
            'success': True,
            'message': f'User updated successfully. Fields updated: {", ".join(updated_fields)}',
            'user': {
                'id': str(user_to_update.id),
                'email': user_to_update.email,
                'full_name': user_to_update.get_full_name(),
                'company_name': user_to_update.company_name,
                'role': user_to_update.role,
                'is_active': user_to_update.is_active,
                'updated_fields': updated_fields
            }
        })
        
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to update user',
            'details': str(e) if settings.DEBUG else 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_password_reset_by_admin(request, user_id):
    """Send password reset email to user (admin action)"""
    try:
        # Check admin permissions
        if not request.user.can_write():
            return Response({
                'success': False,
                'error': 'Admin privileges required for user management'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get the user
        try:
            user_to_reset = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if admin can manage this user
        if not user_to_reset.can_be_managed_by(request.user):
            return Response({
                'success': False,
                'error': 'You do not have permission to manage this user'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Send password reset email
        try:
            email_service = FastEmailService()
            email_sent = email_service.send_password_reset_email(user_to_reset, created_by=request.user)
            
            if email_sent:
                logger.info(f"Password reset email sent to {user_to_reset.email} by admin {request.user.email}")
                return Response({
                    'success': True,
                    'message': f'Password reset email sent to {user_to_reset.email}',
                    'user': {
                        'id': str(user_to_reset.id),
                        'email': user_to_reset.email,
                        'full_name': user_to_reset.get_full_name()
                    }
                })
            else:
                return Response({
                    'success': False,
                    'error': 'Failed to send password reset email',
                    'details': 'Email service may be unavailable'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error sending password reset email: {str(e)}")
            return Response({
                'success': False,
                'error': 'Failed to send password reset email',
                'details': str(e) if settings.DEBUG else 'Email service error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Error in password reset by admin: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to process password reset request',
            'details': str(e) if settings.DEBUG else 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_activation(request, user_id):
    """Activate or deactivate user account"""
    try:
        # Check admin permissions
        if not request.user.can_write():
            return Response({
                'success': False,
                'error': 'Admin privileges required for user management'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get the user
        try:
            user_to_toggle = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if admin can manage this user
        if not user_to_toggle.can_be_managed_by(request.user):
            return Response({
                'success': False,
                'error': 'You do not have permission to manage this user'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Prevent self-deactivation
        if user_to_toggle.id == request.user.id:
            return Response({
                'success': False,
                'error': 'You cannot deactivate your own account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Toggle activation status
        new_status = not user_to_toggle.is_active
        user_to_toggle.is_active = new_status
        user_to_toggle.save()
        
        # If deactivating, invalidate all user sessions
        if not new_status:
            UserSession.objects.filter(user=user_to_toggle).update(is_active=False)
            logger.info(f"Invalidated all sessions for deactivated user: {user_to_toggle.email}")
        
        action = 'activated' if new_status else 'deactivated'
        logger.info(f"User {user_to_toggle.email} {action} by admin {request.user.email}")
        
        return Response({
            'success': True,
            'message': f'User {action} successfully',
            'user': {
                'id': str(user_to_toggle.id),
                'email': user_to_toggle.email,
                'full_name': user_to_toggle.get_full_name(),
                'is_active': user_to_toggle.is_active,
                'action': action
            }
        })
        
    except Exception as e:
        logger.error(f"Error toggling user activation: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to update user status',
            'details': str(e) if settings.DEBUG else 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user_by_admin(request, user_id):
    """Permanently delete user account (super admin only)"""
    try:
        # Check super admin permissions
        if request.user.role != 'super_admin':
            return Response({
                'success': False,
                'error': 'Super admin privileges required for user deletion'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get the user
        try:
            user_to_delete = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Prevent self-deletion
        if user_to_delete.id == request.user.id:
            return Response({
                'success': False,
                'error': 'You cannot delete your own account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store user info for response
        user_info = {
            'id': str(user_to_delete.id),
            'email': user_to_delete.email,
            'full_name': user_to_delete.get_full_name(),
            'company_name': user_to_delete.company_name,
            'role': user_to_delete.role
        }
        
        # Delete the user (this will cascade to related objects)
        user_to_delete.delete()
        
        logger.warning(f"User {user_info['email']} permanently deleted by super admin {request.user.email}")
        
        return Response({
            'success': True,
            'message': 'User permanently deleted',
            'deleted_user': user_info
        })
        
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        return Response({
            'success': False,
            'error': 'Failed to delete user',
            'details': str(e) if settings.DEBUG else 'Internal server error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_admin_access(request):
    """Request admin access - sends notification to super admins"""
    try:
        user = request.user
        
        # Check if user is already admin, master admin or super admin
        if user.role in ['admin', 'master_admin', 'super_admin']:
            return Response({
                'success': False,
                'message': 'You already have admin privileges',
                'current_role': user.role
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user account is active and verified
        if not user.is_active:
            return Response({
                'success': False,
                'message': 'Your account is not active. Contact support.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.is_email_verified:
            return Response({
                'success': False,
                'message': 'Please verify your email first'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Rate limiting for admin access requests
        client_ip = get_client_ip(request)
        rate_limit_key = f"admin_request_{user.id}"
        
        last_request = cache.get(rate_limit_key)
        
        if last_request:
            return Response({
                'success': False,
                'message': 'You can only request admin access once per day',
                'retry_after': 86400  # 24 hours
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Set rate limit (24 hours)
        cache.set(rate_limit_key, timezone.now().isoformat(), 86400)
        
        # Get all super admins to notify
        super_admins = User.objects.filter(
            role='super_admin', 
            is_active=True, 
            is_email_verified=True
        )
        
        if not super_admins.exists():
            logger.error("No super admins found to notify about admin access request")
            return Response({
                'success': False,
                'message': 'No administrators available. Please contact support directly.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Prepare request details
        request_details = {
            'user_id': str(user.id),
            'user_email': user.email,
            'user_name': user.get_full_name(),
            'company': user.company_name,
            'job_title': user.job_title,
            'department': user.department,
            'current_role': user.role,
            'account_created': user.created_at.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'request_timestamp': timezone.now().isoformat(),
            'request_ip': client_ip,
            'justification': request.data.get('justification', 'No justification provided')
        }
        
        # Send notification emails to super admins
        successful_notifications = 0
        email_service = FastEmailService()
        
        for super_admin in super_admins:
            try:
                email_sent = email_service.send_admin_access_request_email(super_admin, user, request_details)
                if email_sent:
                    successful_notifications += 1
            except Exception as e:
                logger.error(f"Failed to send admin request notification to {super_admin.email}: {str(e)}")
        
        # Log the admin access request
        logger.info(f"Admin access requested by {user.email} ({user.get_full_name()}) from {user.company_name}")
        
        if successful_notifications > 0:
            return Response({
                'success': True,
                'message': f'Your admin access request has been sent to {successful_notifications} administrator(s)',
                'request_details': {
                    'user_name': user.get_full_name(),
                    'user_email': user.email,
                    'company': user.company_name,
                    'current_role': user.role,
                    'request_time': timezone.now().isoformat(),
                    'administrators_notified': successful_notifications
                },
                'next_steps': 'You will be notified via email once your request is reviewed'
            })
        else:
            return Response({
                'success': False,
                'message': 'Failed to send notifications to administrators. Please contact support directly.',
                'error_code': 'NOTIFICATION_FAILED'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Error processing admin access request: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Failed to process admin access request',
            'error_code': 'REQUEST_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)