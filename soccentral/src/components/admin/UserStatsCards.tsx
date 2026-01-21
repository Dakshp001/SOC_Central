// frontend/src/components/admin/UserStatsCards.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Shield, User as UserIcon, Zap } from 'lucide-react';
import { User } from '@/types/auth';

interface UserStatsCardsProps {
  users: User[];
}

export const UserStatsCards: React.FC<UserStatsCardsProps> = ({ users }) => {
  const stats = [
    {
      label: 'Total Users',
      value: users.length,
      icon: UserIcon,
      color: 'text-blue-600'
    },
    {
      label: 'Super Admins',
      value: users.filter(u => u.role === 'super_admin').length,
      icon: Crown,
      color: 'text-purple-600'
    },
    {
      label: 'Master Admins',
      value: users.filter(u => u.role === 'master_admin').length,
      icon: Zap,
      color: 'text-orange-600'
    },
    {
      label: 'Admins',
      value: users.filter(u => u.role === 'admin').length,
      icon: Shield,
      color: 'text-blue-600'
    },
    {
      label: 'General Users',
      value: users.filter(u => u.role === 'general').length,
      icon: UserIcon,
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};