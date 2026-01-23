# backend/authentication/views/company_management_views.py
"""
Company Management Views
Handles company creation, tool permissions management, and company administration
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Q

from ..models import Company, CompanyToolPermission, User
from ..serializers import (
    CompanySerializer, CompanyCreateSerializer, CompanyToolPermissionSerializer,
    UserWithCompanySerializer
)
from ..utils import get_client_ip, get_user_agent

import logging

logger = logging.getLogger(__name__)

# ==========================================
# COMPANY MANAGEMENT VIEWS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_companies(request):
    """List all companies (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        # Get pagination parameters
        page = int(request.GET.get('page', 1))
        limit = min(int(request.GET.get('limit', 50)), 100)  # Max 100 per page
        offset = (page - 1) * limit

        # Get filter parameters
        search = request.GET.get('search', '').strip()
        status_filter = request.GET.get('status', '').strip()

        # Build query
        companies_query = Company.objects.all()

        # Apply filters
        if search:
            companies_query = companies_query.filter(
                Q(name__icontains=search) |
                Q(display_name__icontains=search) |
                Q(email_domain__icontains=search) |
                Q(primary_contact_email__icontains=search)
            )

        if status_filter:
            if status_filter == 'active':
                companies_query = companies_query.filter(is_active=True)
            elif status_filter == 'inactive':
                companies_query = companies_query.filter(is_active=False)

        # Get total count
        total_count = companies_query.count()

        # Apply pagination and ordering
        companies = companies_query.order_by('-created_at')[offset:offset + limit]

        serializer = CompanySerializer(companies, many=True)

        logger.info(f"Listed {companies.count()} companies for {request.user.email} (total: {total_count})")

        return Response({
            'success': True,
            'companies': serializer.data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': (total_count + limit - 1) // limit
            },
            'filters': {
                'search': search,
                'status': status_filter
            }
        })

    except Exception as e:
        logger.error(f"Failed to list companies: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve companies'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_company(request):
    """Create a new company with tool permissions (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        serializer = CompanyCreateSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            with transaction.atomic():
                # Set created_by field
                validated_data = serializer.validated_data
                validated_data['created_by'] = request.user

                company = serializer.save()

                logger.info(f"Company created: {company.name} by {request.user.email}")

                # Return the created company with all details
                response_serializer = CompanySerializer(company)

                return Response({
                    'success': True,
                    'message': f'Company "{company.display_name}" created successfully',
                    'company': response_serializer.data
                }, status=status.HTTP_201_CREATED)

        else:
            return Response({
                'success': False,
                'message': 'Invalid data provided',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Failed to create company: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to create company: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_company_details(request, company_id):
    """Get detailed company information (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        company = Company.objects.prefetch_related('tool_permissions').get(id=company_id)
        serializer = CompanySerializer(company)

        return Response({
            'success': True,
            'company': serializer.data
        })

    except Company.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Company not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to get company details: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve company details'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_company(request, company_id):
    """Update company information (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        company = Company.objects.get(id=company_id)

        serializer = CompanySerializer(company, data=request.data, partial=True)

        if serializer.is_valid():
            # Track whether enabled_tools is part of this update
            updating_enabled_tools = 'enabled_tools' in serializer.validated_data or 'enabled_tools' in request.data

            company = serializer.save()

            # If enabled_tools changed, synchronize CompanyToolPermission records
            if updating_enabled_tools:
                try:
                    enabled_list = company.enabled_tools if isinstance(company.enabled_tools, list) else []

                    # Ensure a permission row exists and is enabled for each tool in enabled_tools
                    for tool in enabled_list:
                        permission, _created = CompanyToolPermission.objects.get_or_create(
                            company=company,
                            tool_type=tool,
                            defaults={
                                'created_by': request.user,
                                'is_enabled': True,
                                'can_view': True
                            }
                        )
                        if permission.is_enabled is False:
                            permission.is_enabled = True
                            permission.save()

                    # Disable permissions for tools not in enabled_tools
                    existing_perms = CompanyToolPermission.objects.filter(company=company)
                    for perm in existing_perms:
                        if perm.tool_type not in enabled_list and perm.is_enabled:
                            perm.is_enabled = False
                            perm.save()

                except Exception as sync_error:
                    logger.error(f"Failed to sync tool permissions for company {company.id}: {sync_error}")

            logger.info(f"Company updated: {company.name} by {request.user.email}")

            return Response({
                'success': True,
                'message': f'Company "{company.display_name}" updated successfully',
                'company': serializer.data
            })

        else:
            return Response({
                'success': False,
                'message': 'Invalid data provided',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

    except Company.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Company not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to update company: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to update company: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_company_status(request, company_id):
    """Toggle company active/inactive status (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        company = Company.objects.get(id=company_id)

        # Toggle status
        company.is_active = not company.is_active
        company.save()

        action = 'activated' if company.is_active else 'deactivated'

        logger.info(f"Company {action}: {company.name} by {request.user.email}")

        return Response({
            'success': True,
            'message': f'Company "{company.display_name}" has been {action} successfully',
            'company': {
                'id': str(company.id),
                'name': company.name,
                'display_name': company.display_name,
                'is_active': company.is_active,
                'action': action
            }
        })

    except Company.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Company not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to toggle company status: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to toggle company status: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_company(request, company_id):
    """Delete a company permanently (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        company = Company.objects.get(id=company_id)

        # Check if company has users
        users_count = User.objects.filter(
            Q(company=company) | Q(company_name=company.name)
        ).count()

        if users_count > 0:
            return Response({
                'success': False,
                'message': f'Cannot delete company. {users_count} users are still assigned to this company. Please reassign or delete users first.',
                'users_count': users_count
            }, status=status.HTTP_400_BAD_REQUEST)

        # Store company info for response
        company_info = {
            'id': str(company.id),
            'name': company.name,
            'display_name': company.display_name,
            'enabled_tools': company.enabled_tools,
            'user_count': users_count
        }

        # Delete the company (this will cascade to related objects)
        company.delete()

        logger.warning(f"Company permanently deleted: {company_info['name']} by {request.user.email}")

        return Response({
            'success': True,
            'message': f'Company "{company_info["display_name"]}" has been permanently deleted',
            'deleted_company': company_info
        })

    except Company.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Company not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to delete company: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to delete company: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# TOOL PERMISSIONS MANAGEMENT
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_company_tool_permissions(request, company_id):
    """Get tool permissions for a company (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        company = Company.objects.get(id=company_id)
        permissions = CompanyToolPermission.objects.filter(company=company)

        serializer = CompanyToolPermissionSerializer(permissions, many=True)

        return Response({
            'success': True,
            'company': {
                'id': str(company.id),
                'name': company.name,
                'display_name': company.display_name
            },
            'tool_permissions': serializer.data
        })

    except Company.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Company not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to get tool permissions: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve tool permissions'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_tool_permissions(request, company_id):
    """Update tool permissions for a company (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        company = Company.objects.get(id=company_id)

        tool_type = request.data.get('tool_type')
        permissions_data = request.data.get('permissions', {})

        if not tool_type:
            return Response({
                'success': False,
                'message': 'Tool type is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate tool type
        valid_tools = [choice[0] for choice in Company.TOOL_CHOICES]
        if tool_type not in valid_tools:
            return Response({
                'success': False,
                'message': f'Invalid tool type: {tool_type}'
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Get or create tool permission
            permission, created = CompanyToolPermission.objects.get_or_create(
                company=company,
                tool_type=tool_type,
                defaults={
                    'created_by': request.user
                }
            )

            # Update permissions
            for field, value in permissions_data.items():
                if hasattr(permission, field):
                    setattr(permission, field, value)

            permission.save()

            # Update company's enabled_tools list
            if permissions_data.get('is_enabled', True):
                if tool_type not in company.enabled_tools:
                    company.enabled_tools.append(tool_type)
            else:
                if tool_type in company.enabled_tools:
                    company.enabled_tools.remove(tool_type)

            company.save()

            action = 'created' if created else 'updated'
            logger.info(f"Tool permission {action}: {tool_type} for {company.name} by {request.user.email}")

            serializer = CompanyToolPermissionSerializer(permission)

            return Response({
                'success': True,
                'message': f'Tool permissions for {tool_type} {action} successfully',
                'permission': serializer.data
            })

    except Company.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Company not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to update tool permissions: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to update tool permissions: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_tool_permission(request, company_id, tool_type):
    """Remove tool permission from company (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        company = Company.objects.get(id=company_id)

        with transaction.atomic():
            # Remove from company's enabled_tools
            if tool_type in company.enabled_tools:
                company.enabled_tools.remove(tool_type)
                company.save()

            # Delete permission record
            deleted_count = CompanyToolPermission.objects.filter(
                company=company,
                tool_type=tool_type
            ).delete()[0]

            if deleted_count > 0:
                logger.info(f"Tool permission removed: {tool_type} from {company.name} by {request.user.email}")

                return Response({
                    'success': True,
                    'message': f'Tool permission for {tool_type} removed successfully'
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Tool permission not found'
                }, status=status.HTTP_404_NOT_FOUND)

    except Company.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Company not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to remove tool permission: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to remove tool permission: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# COMPANY USERS MANAGEMENT
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_company_users(request, company_id):
    """Get users in a company (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        company = Company.objects.get(id=company_id)

        # Get users associated with this company (both FK and legacy)
        users = User.objects.filter(
            Q(company=company) | Q(company_name=company.name)
        ).order_by('-created_at')

        serializer = UserWithCompanySerializer(users, many=True)

        return Response({
            'success': True,
            'company': {
                'id': str(company.id),
                'name': company.name,
                'display_name': company.display_name
            },
            'users': serializer.data,
            'total_users': users.count()
        })

    except Company.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Company not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to get company users: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve company users'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assign_user_to_company(request, company_id):
    """Assign a user to a company (Super Admin only)"""
    if not request.user.can_manage_users():
        return Response({
            'success': False,
            'message': 'Permission denied - Super Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        company = Company.objects.get(id=company_id)
        user_id = request.data.get('user_id')

        if not user_id:
            return Response({
                'success': False,
                'message': 'User ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(id=user_id)

        # Assign user to company
        user.company = company
        user.company_name = company.name  # Also update legacy field
        user.save()

        logger.info(f"User assigned to company: {user.email} to {company.name} by {request.user.email}")

        serializer = UserWithCompanySerializer(user)

        return Response({
            'success': True,
            'message': f'User {user.get_full_name()} assigned to {company.display_name} successfully',
            'user': serializer.data
        })

    except Company.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Company not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Failed to assign user to company: {str(e)}")
        return Response({
            'success': False,
            'message': f'Failed to assign user to company: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# UTILITY VIEWS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_tools(request):
    """Get list of all available tools"""
    try:
        tools = [
            {
                'value': choice[0],
                'label': choice[1]
            }
            for choice in Company.TOOL_CHOICES
        ]

        return Response({
            'success': True,
            'tools': tools
        })

    except Exception as e:
        logger.error(f"Failed to get available tools: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve available tools'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_accessible_tools(request):
    """Get tools accessible to the current user"""
    try:
        available_tools = request.user.get_available_tools()
        tools = [
            {
                'value': tool,
                'label': dict(Company.TOOL_CHOICES).get(tool, tool)
            }
            for tool in available_tools
        ]

        # Enhanced logging for debugging
        logger.info(f"User {request.user.email} (role: {request.user.role}) requesting accessible tools")
        logger.info(f"User's company: {request.user.company}")
        logger.info(f"Available tools: {available_tools}")

        if request.user.company:
            company_permissions = request.user.company.tool_permissions.filter(is_enabled=True)
            logger.info(f"Company permissions: {[p.tool_type for p in company_permissions]}")
            logger.info(f"Company enabled_tools: {request.user.company.enabled_tools}")

        return Response({
            'success': True,
            'tools': tools,
            'user_role': request.user.role,
            'company': request.user.get_company_display_name() if request.user.company else request.user.company_name,
            'debug_info': {
                'available_tools_count': len(available_tools),
                'company_id': str(request.user.company.id) if request.user.company else None,
                'has_company_permissions': bool(request.user.company and request.user.company.tool_permissions.filter(is_enabled=True).exists()) if request.user.company else False
            }
        })

    except Exception as e:
        logger.error(f"Failed to get user accessible tools for {request.user.email}: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve accessible tools'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)