// frontend/src/components/admin/UserRoleBadge.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Shield, User as UserIcon, Zap } from 'lucide-react';

interface UserRoleBadgeProps {
  role: 'general' | 'admin' | 'master_admin' | 'super_admin';
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ role }) => {
  switch (role) {
    case 'super_admin':
      return (
        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-1">
          <Crown className="w-3 h-3 mr-1" />
          Super Admin
        </Badge>
      );
    case 'master_admin':
      return (
        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs px-2 py-1">
          <Zap className="w-3 h-3 mr-1" />
          Master Admin
        </Badge>
      );
    case 'admin':
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-1">
          <Shield className="w-3 h-3 mr-1" />
          Admin
        </Badge>
      );
    case 'general':
      return (
        <Badge variant="secondary" className="text-xs px-2 py-1">
          <UserIcon className="w-3 h-3 mr-1" />
          General
        </Badge>
      );
    default:
      return <Badge variant="outline" className="text-xs px-2 py-1">{role}</Badge>;
  }
};