// frontend/src/components/admin/UserStatusBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types/auth';

interface UserStatusBadgeProps {
  user: User;
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ user }) => {
  // Handle the case where is_active might be undefined (default to true)
  const isActive = user.is_active !== false;
  
  if (!isActive) {
    return (
      <Badge variant="destructive" className="text-xs px-2 py-1">
        Inactive
      </Badge>
    );
  }
  if (!user.is_email_verified) {
    return (
      <Badge variant="outline" className="text-xs px-2 py-1">
        Unverified
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1">
      Active
    </Badge>
  );
};