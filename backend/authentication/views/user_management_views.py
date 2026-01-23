# backend/authentication/views/user_management_views.py
"""
Super Admin User Management Views
Handles super admin level user operations like listing, promoting, demoting, deleting users
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import models

from ..models import User, UserSession
from ..serializers import UserManagementSerializer
from ..utils import get_client_ip, get_user_agent

import logging

logger = logging.getLogger(__name__)

# ==========================================
# SUPER ADMIN USER MANAGEMENT VIEWS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    """List all users (Super Admin and Master Admin)"""
    # Allow both super admin and master admin to list users
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Master Admin or Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        # Get pagination parameters
        page = int(request.GET.get('page', 1))
        limit = min(int(request.GET.get('limit', 50)), 100)  # Max 100 per page
        offset = (page - 1) * limit

        # Get filter parameters
        search = request.GET.get('search', '').strip()
        role_filter = request.GET.get('role', '').strip()
        status_filter = request.GET.get('status', '').strip()
        company_filter = request.GET.get('company', '').strip()

        # Build query
        users_query = User.objects.all()

        # Master admin can only see users from their company
        if request.user.role == 'master_admin':
            users_query = users_query.filter(company=request.user.company)
        
        # Apply filters
        if search:
            users_query = users_query.filter(
                models.Q(email__icontains=search) |
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(company_name__icontains=search)
            )
        
        if role_filter and role_filter in ['general', 'admin', 'master_admin', 'super_admin']:
            users_query = users_query.filter(role=role_filter)
        
        if status_filter:
            if status_filter == 'active':
                users_query = users_query.filter(is_active=True)
            elif status_filter == 'inactive':
                users_query = users_query.filter(is_active=False)
        
        if company_filter:
            users_query = users_query.filter(company_name__icontains=company_filter)
        
        # Get total count
        total_count = users_query.count()
        
        # Apply pagination and ordering
        users = users_query.order_by('-created_at')[offset:offset + limit]
        
        serializer = UserManagementSerializer(users, many=True)
        
        logger.info(f" Listed {users.count()} users for {request.user.email} (total: {total_count})")
        
        return Response({
            'success': True,
            'users': serializer.data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            },
            'filters': {
                'search': search,
                'role': role_filter,
                'status': status_filter,
                'company': company_filter
            }
        })
        
    except Exception as e:
        logger.error(f" Failed to list users: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve users'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def promote_user(request):
    """Promote user to admin (Super Admin and Master Admin)"""
    # Allow both super admin and master admin to promote users
    if not request.user.can_promote_to_admin():
        return Response({
            'success': False,
            'message': 'Permission denied - Master Admin or Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({
            'success': False,
            'message': 'User ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_to_promote = User.objects.get(id=user_id)
        
        # Security checks
        if user_to_promote.id == request.user.id:
            return Response({
                'success': False,
                'message': 'You cannot promote your own account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if user_to_promote.role == 'super_admin':
            return Response({
                'success': False,
                'message': 'User is already a Super Admin'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if user_to_promote.role == 'master_admin':
            return Response({
                'success': False,
                'message': 'User is already a Master Admin'
            }, status=status.HTTP_400_BAD_REQUEST)

        if user_to_promote.role == 'admin':
            return Response({
                'success': False,
                'message': 'User is already an Admin'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get target role from request, default to 'admin'
        target_role = request.data.get('target_role', 'admin')

        # Validate target role
        if target_role not in ['admin', 'master_admin']:
            return Response({
                'success': False,
                'message': 'Invalid target role. Must be either admin or master_admin'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Master admin cannot promote to master_admin role (only super admin can)
        if target_role == 'master_admin' and request.user.role == 'master_admin':
            return Response({
                'success': False,
                'message': 'Only Super Admin can promote users to Master Admin'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check master admin limit when promoting to master_admin
        if target_role == 'master_admin':
            if user_to_promote.company:
                existing_master_admin_count = user_to_promote.company.get_master_admin_count()
                if existing_master_admin_count >= 1:
                    return Response({
                        'success': False,
                        'message': f'Company already has a Master Admin. Only one Master Admin allowed per company.'
                    }, status=status.HTTP_400_BAD_REQUEST)

        # Check admin limit when master admin is promoting to admin (max 3 admins)
        if target_role == 'admin' and request.user.role == 'master_admin':
            if user_to_promote.company:
                can_add, error_message = user_to_promote.company.can_add_admin(request.user)
                if not can_add:
                    return Response({
                        'success': False,
                        'message': error_message
                    }, status=status.HTTP_400_BAD_REQUEST)

        # Check if user being promoted is in the same company as master admin
        if request.user.role == 'master_admin':
            if user_to_promote.company != request.user.company:
                return Response({
                    'success': False,
                    'message': 'Master Admin can only promote users within their own company'
                }, status=status.HTTP_403_FORBIDDEN)

        # Store previous role for logging
        previous_role = user_to_promote.role

        # Promote user
        user_to_promote.role = target_role
        user_to_promote.save(update_fields=['role'])
        
        # Send role change notification asynchronously
        import threading
        def send_role_change_alert():
            try:
                from core.email_service.notifications import user_management_notifications
                user_management_notifications.role_changed(
                    user=user_to_promote,
                    old_role=previous_role,
                    new_role=target_role,
                    changed_by=request.user,
                    request=request
                )
            except Exception as e:
                logger.warning(f"Failed to send role change notification: {e}")
        
        threading.Thread(target=send_role_change_alert, daemon=True).start()
        
        role_display = 'Master Admin' if target_role == 'master_admin' else 'Admin'
        logger.info(f"User promoted: {user_to_promote.email} from {previous_role} to {target_role} by {request.user.email}")

        return Response({
            'success': True,
            'message': f'{user_to_promote.get_full_name()} has been promoted to {role_display}',
            'user': {
                'id': str(user_to_promote.id),
                'email': user_to_promote.email,
                'full_name': user_to_promote.get_full_name(),
                'previous_role': previous_role,
                'new_role': user_to_promote.role
            }
        })
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f" Promote user error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to promote user'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def demote_user(request):
    """Demote admin to general user (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response({
            'success': False,
            'message': 'User ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_to_demote = User.objects.get(id=user_id)
        
        # Security checks
        if user_to_demote.id == request.user.id:
            return Response({
                'success': False,
                'message': 'You cannot demote your own account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if user_to_demote.role == 'super_admin':
            return Response({
                'success': False,
                'message': 'Cannot demote Super Admin accounts for security reasons'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if user_to_demote.role == 'general':
            return Response({
                'success': False,
                'message': 'User is already a General User'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get target role from request, default to 'general'
        target_role = request.data.get('target_role', 'general')

        # Validate target role and demotion path
        if target_role not in ['general', 'admin']:
            return Response({
                'success': False,
                'message': 'Invalid target role. Must be either general or admin'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate demotion logic
        if user_to_demote.role == 'master_admin' and target_role == 'general':
            # Allow master_admin -> general demotion
            pass
        elif user_to_demote.role == 'master_admin' and target_role == 'admin':
            # Allow master_admin -> admin demotion
            pass
        elif user_to_demote.role == 'admin' and target_role == 'admin':
            return Response({
                'success': False,
                'message': 'User is already an Admin'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Store previous role for logging
        previous_role = user_to_demote.role

        # Demote user
        user_to_demote.role = target_role
        user_to_demote.save(update_fields=['role'])
        
        # Send role change notification asynchronously
        import threading
        def send_role_change_alert():
            try:
                from core.email_service.notifications import user_management_notifications
                user_management_notifications.role_changed(
                    user=user_to_demote,
                    old_role=previous_role,
                    new_role=target_role,
                    changed_by=request.user,
                    request=request
                )
            except Exception as e:
                logger.warning(f"Failed to send role change notification: {e}")
        
        threading.Thread(target=send_role_change_alert, daemon=True).start()
        
        role_display = 'Admin' if target_role == 'admin' else 'General User'
        logger.info(f"User demoted: {user_to_demote.email} from {previous_role} to {target_role} by {request.user.email}")

        return Response({
            'success': True,
            'message': f'{user_to_demote.get_full_name()} has been demoted to {role_display}',
            'user': {
                'id': str(user_to_demote.id),
                'email': user_to_demote.email,
                'full_name': user_to_demote.get_full_name(),
                'previous_role': previous_role,
                'new_role': user_to_demote.role
            }
        })
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f" Demote user error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to demote user'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_status(request):
    """Toggle user active/inactive status (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    user_id = request.data.get('user_id')
    is_active = request.data.get('is_active')
    
    if not user_id or is_active is None:
        return Response({
            'success': False,
            'message': 'User ID and is_active status are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user_to_toggle = User.objects.get(id=user_id)
        
        # Security checks
        if user_to_toggle.id == request.user.id:
            return Response({
                'success': False,
                'message': 'You cannot modify your own account status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if user_to_toggle.role == 'super_admin':
            return Response({
                'success': False,
                'message': 'Cannot modify Super Admin account status for security reasons'
            }, status=status.HTTP_400_BAD_REQUEST)

        if user_to_toggle.role == 'master_admin':
            return Response({
                'success': False,
                'message': 'Cannot modify Master Admin account status for security reasons'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Store previous status for logging
        previous_status = user_to_toggle.is_active
        action = 'activated' if is_active else 'deactivated'
        
        # Update user status
        user_to_toggle.is_active = is_active
        user_to_toggle.save(update_fields=['is_active'])
        
        # If deactivating, invalidate all user sessions
        if not is_active:
            UserSession.objects.filter(user=user_to_toggle).update(is_active=False)
            logger.info(f"Invalidated all sessions for deactivated user: {user_to_toggle.email}")
        
        logger.info(f"User {action}: {user_to_toggle.email} by {request.user.email}")
        
        return Response({
            'success': True,
            'message': f'User {user_to_toggle.get_full_name()} has been {action} successfully',
            'user': {
                'id': str(user_to_toggle.id),
                'email': user_to_toggle.email,
                'full_name': user_to_toggle.get_full_name(),
                'is_active': user_to_toggle.is_active,
                'previous_status': previous_status,
                'action': action
            }
        })
        
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f" Toggle user status error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Failed to toggle user status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request):
    """Permanently delete a user from the database (Super Admin and Master Admin)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Master Admin or Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get('user_id')

    if not user_id:
        return Response({
            'success': False,
            'message': 'User ID is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_to_delete = User.objects.get(id=user_id)

        # Security checks
        if user_to_delete.id == request.user.id:
            return Response({
                'success': False,
                'message': 'You cannot delete your own account'
            }, status=status.HTTP_400_BAD_REQUEST)

        if user_to_delete.role == 'super_admin':
            return Response({
                'success': False,
                'message': 'Cannot delete Super Admin accounts for security reasons'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Master admin specific restrictions
        if request.user.role == 'master_admin':
            # Master admin cannot delete master admins
            if user_to_delete.role == 'master_admin':
                return Response({
                    'success': False,
                    'message': 'Master Admin cannot delete other Master Admin accounts'
                }, status=status.HTTP_403_FORBIDDEN)

            # Master admin can only delete users from their own company
            if user_to_delete.company != request.user.company:
                return Response({
                    'success': False,
                    'message': 'You can only delete users from your own company'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Store user info for logging before deletion
        user_email = user_to_delete.email
        user_name = user_to_delete.get_full_name()
        user_company = user_to_delete.company_name
        user_role = user_to_delete.role
        
        # Delete related objects safely to avoid foreign key constraints
        from django.db import transaction
        
        with transaction.atomic():
            try:
                # Delete authentication-related objects
                UserSession.objects.filter(user=user_to_delete).delete()
                logger.info(f"Deleted UserSession objects for user {user_email}")
                
                # Delete tool app related objects if they exist
                try:
                    # Import models one by one to handle missing models gracefully
                    deleted_objects = []
                    
                    try:
                        from tool.models import SecurityDataUpload
                        count = SecurityDataUpload.objects.filter(uploaded_by=user_to_delete).count()
                        SecurityDataUpload.objects.filter(uploaded_by=user_to_delete).delete()
                        deleted_objects.append(f"{count} SecurityDataUpload")
                    except ImportError:
                        pass
                        
                    try:
                        from tool.models import UserProfile
                        count = UserProfile.objects.filter(user=user_to_delete).count() 
                        UserProfile.objects.filter(user=user_to_delete).delete()
                        deleted_objects.append(f"{count} UserProfile")
                    except ImportError:
                        pass
                        
                    try:
                        from tool.models import Notification
                        count = Notification.objects.filter(recipient=user_to_delete).count()
                        Notification.objects.filter(recipient=user_to_delete).delete()
                        deleted_objects.append(f"{count} Notification")
                    except ImportError:
                        pass
                        
                    try:
                        from tool.models import TrainingJob
                        count = TrainingJob.objects.filter(started_by=user_to_delete).count()
                        TrainingJob.objects.filter(started_by=user_to_delete).delete()
                        deleted_objects.append(f"{count} TrainingJob")
                    except ImportError:
                        pass
                        
                    try:
                        from tool.models import ChatConversation
                        count = ChatConversation.objects.filter(user=user_to_delete).count()
                        ChatConversation.objects.filter(user=user_to_delete).delete()
                        deleted_objects.append(f"{count} ChatConversation")
                    except ImportError:
                        pass
                        
                    try:
                        from tool.models import SOCReport
                        count = SOCReport.objects.filter(created_by=user_to_delete).count()
                        SOCReport.objects.filter(created_by=user_to_delete).delete()
                        deleted_objects.append(f"{count} SOCReport")
                    except ImportError:
                        pass
                        
                    try:
                        from tool.models import SOCReportSection
                        # Set last_edited_by to null for report sections where this user was the last editor
                        count = SOCReportSection.objects.filter(last_edited_by=user_to_delete).count()
                        SOCReportSection.objects.filter(last_edited_by=user_to_delete).update(last_edited_by=None)
                        deleted_objects.append(f"{count} SOCReportSection (updated)")
                    except ImportError:
                        pass
                        
                    try:
                        from tool.models import SOCReportExport
                        count = SOCReportExport.objects.filter(exported_by=user_to_delete).count()
                        SOCReportExport.objects.filter(exported_by=user_to_delete).delete()
                        deleted_objects.append(f"{count} SOCReportExport")
                    except ImportError:
                        pass
                    
                    if deleted_objects:
                        logger.info(f"Deleted tool app related objects for user {user_email}: {', '.join(deleted_objects)}")
                    else:
                        logger.info(f"No tool app related objects found for user {user_email}")
                        
                except Exception as tool_error:
                    logger.error(f"Error deleting tool app objects: {tool_error}")
                    # Continue with deletion - tool objects are optional
                
                # Delete the user permanently
                user_to_delete.delete()
                
                logger.warning(f"✅ User deleted: {user_email} ({user_name}) from {user_company} (role: {user_role}) by {request.user.email}")
                
                return Response({
                    'success': True,
                    'message': f'User {user_name} has been permanently deleted',
                    'deleted_user': {
                        'email': user_email,
                        'name': user_name,
                        'company': user_company,
                        'role': user_role
                    }
                })
                
            except Exception as transaction_error:
                logger.error(f"Transaction error during user deletion: {transaction_error}", exc_info=True)
                raise transaction_error
        
    except User.DoesNotExist:
        logger.warning(f"❌ User not found for deletion: {user_id}")
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"💥 Delete user error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': f'Failed to delete user: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)