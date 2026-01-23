# backend/authentication/views/profile_views.py
"""
User Profile Management Views
Handles user profile viewing and updating
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import User
from ..serializers import UserSerializer

import logging

logger = logging.getLogger(__name__)

# ==========================================
# PROFILE MANAGEMENT VIEWS
# ==========================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get current user profile"""
    try:
        return Response({
            'success': True,
            'user': UserSerializer(request.user).data
        })
    except Exception as e:
        logger.error(f"Error retrieving profile for user {request.user.email}: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve user profile'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    try:
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Store original values for logging
            original_data = {
                'first_name': user.first_name,
                'last_name': user.last_name,
                'company_name': user.company_name,
                'job_title': user.job_title,
                'department': user.department,
                'phone_number': user.phone_number,
            }
            
            # Save the updated profile
            updated_user = serializer.save()
            
            # Log what was changed
            changes = []
            for field in original_data:
                if hasattr(updated_user, field):
                    new_value = getattr(updated_user, field)
                    if original_data[field] != new_value:
                        changes.append(f"{field}: '{original_data[field]}' -> '{new_value}'")
            
            if changes:
                logger.info(f"Profile updated for {user.email}: {', '.join(changes)}")
            else:
                logger.info(f"Profile update attempted for {user.email} but no changes made")
            
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'user': serializer.data,
                'changes_made': len(changes) > 0
            })
        else:
            logger.warning(f"Profile update failed for {user.email}: {serializer.errors}")
            return Response({
                'success': False,
                'message': 'Profile update failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error updating profile for user {request.user.email}: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to update profile'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)