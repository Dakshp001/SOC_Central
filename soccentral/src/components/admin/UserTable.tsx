// frontend/src/components/admin/UserTable.tsx - UPDATED WITH DELETE FUNCTIONALITY
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, User as UserIcon } from 'lucide-react';
import { User } from '@/types/auth';
import { UserRoleBadge } from './UserRoleBadge';
import { UserStatusBadge } from './UserStatusBadge';
import { UserDetailsDialog } from './UserDetailsDialog';
import { UserActionButtons } from './UserActionButtons';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  searchTerm: string;
  currentUserId?: string;
  actionLoading: string | null;
  onPromoteUser: (userId: string) => void;
  onDemoteUser: (userId: string) => void;
  onToggleUserStatus: (userId: string, newStatus: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onUserClick?: (user: User) => void; // New prop for user row click
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  searchTerm,
  currentUserId,
  actionLoading,
  onPromoteUser,
  onDemoteUser,
  onToggleUserStatus,
  onDeleteUser,
  onUserClick
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserFullName = (user: User): string => {
    return user.full_name || `${user.first_name} ${user.last_name}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users ({users.length})</CardTitle>
        <CardDescription>
          All registered users and their information
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="py-4 px-6 font-semibold">User</TableHead>
                  <TableHead className="py-4 px-4 font-semibold">Company</TableHead>
                  <TableHead className="py-4 px-4 font-semibold">Role</TableHead>
                  <TableHead className="py-4 px-4 font-semibold">Status</TableHead>
                  <TableHead className="py-4 px-4 font-semibold">Created</TableHead>
                  <TableHead className="py-4 px-4 font-semibold">Last Login</TableHead>
                  <TableHead className="py-4 px-4 font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className="hover:bg-muted/50 border-b cursor-pointer transition-colors"
                    onClick={() => onUserClick?.(user)}
                  >
                    <TableCell className="py-6 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-base leading-5 truncate">{getUserFullName(user)}</p>
                          <p className="text-sm text-muted-foreground mt-1 truncate">{user.email}</p>
                          <p className="text-xs text-gray-400 mt-1">ID: {user.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <div className="max-w-[150px]">
                        <p className="font-medium text-sm leading-5 truncate">{user.company_name}</p>
                        {user.department && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">{user.department}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <UserRoleBadge role={user.role} />
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <UserStatusBadge user={user} />
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <div className="text-sm">
                        <p className="leading-5">{formatDate(user.created_at)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <div className="text-sm">
                        <p className="leading-5">{formatDate(user.last_login)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <div 
                        className="flex items-center justify-center space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <UserDetailsDialog user={user} />
                        <UserActionButtons
                          user={user}
                          currentUserId={currentUserId}
                          actionLoading={actionLoading}
                          onPromote={onPromoteUser}
                          onDemote={onDemoteUser}
                          onToggleStatus={onToggleUserStatus}
                          onDeleteUser={onDeleteUser}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="text-center py-12 px-6">
            <UserIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No users found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'No users have been registered yet.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};