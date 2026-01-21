// frontend/src/components/admin/UserActionButtons.tsx - UPDATED WITH DELETE BUTTON
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  UserCheck, 
  UserX, 
  Loader2, 
  AlertTriangle,
  Shield,
  Trash2
} from 'lucide-react';
import { User } from '@/types/auth';

interface UserActionButtonsProps {
  user: User;
  currentUserId?: string;
  actionLoading: string | null;
  onPromote: (userId: string) => void;
  onDemote: (userId: string) => void;
  onToggleStatus: (userId: string, newStatus: boolean) => void;
  onDeleteUser: (userId: string) => void; // New prop for delete action
}

export const UserActionButtons: React.FC<UserActionButtonsProps> = ({
  user,
  currentUserId,
  actionLoading,
  onPromote,
  onDemote,
  onToggleStatus,
  onDeleteUser // New prop
}) => {
  const canToggleUserStatus = (user: User) => {
    // Can't toggle your own status
    if (user.id === currentUserId) return false;
    // Can't toggle super admins (security measure)
    if (user.role === 'super_admin') return false;
    return true;
  };

  const canDeleteUser = (user: User) => {
    // Can't delete yourself
    if (user.id === currentUserId) return false;
    // Can't delete super admins (security measure)
    if (user.role === 'super_admin') return false;
    return true;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserFullName = (user: User): string => {
    return user.full_name || `${user.first_name} ${user.last_name}`;
  };

  // Determine if user is active (assuming user.is_active boolean field exists)
  const isUserActive = user.is_active !== false; // Default to true if undefined
  const toggleAction = isUserActive ? 'deactivate' : 'activate';
  const newStatus = !isUserActive;

  return (
    <div className="flex items-center gap-2">
      {/* Promote Button - Only for General Users */}
      {user.role === 'general' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              disabled={actionLoading === `promote-${user.id}`}
            >
              {actionLoading === `promote-${user.id}` ? (
                <Loader2 className="w-3 h-3" />
              ) : (
                'Promote'
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Promote User to Admin</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to promote {getUserFullName(user)} to Admin role? 
                This will give them admin privileges.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onPromote(user.id)}>
                Promote to Admin
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Demote Button - Only for Admin Users */}
      {user.role === 'admin' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              disabled={actionLoading === `demote-${user.id}`}
            >
              {actionLoading === `demote-${user.id}` ? (
                <Loader2 className="w-3 h-3" />
              ) : (
                'Demote'
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Demote Admin to General User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to demote {getUserFullName(user)} to General User role? 
                This will remove their admin privileges.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDemote(user.id)}>
                Demote to General
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Active/Inactive Toggle Button */}
      {canToggleUserStatus(user) && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant={isUserActive ? "destructive" : "default"}
              size="sm"
              className={`h-7 w-7 p-0 ${
                isUserActive 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
              disabled={actionLoading === `${toggleAction}-${user.id}`}
              title={isUserActive ? "Deactivate User" : "Activate User"}
            >
              {actionLoading === `${toggleAction}-${user.id}` ? (
                <Loader2 className="w-3 h-3" />
              ) : isUserActive ? (
                <UserX className="w-3 h-3" />
              ) : (
                <UserCheck className="w-3 h-3" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className={`flex items-center ${
                isUserActive ? 'text-red-600' : 'text-green-600'
              }`}>
                {isUserActive ? (
                  <>
                    <UserX className="w-5 h-5 mr-2" />
                    Deactivate User Account
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5 mr-2" />
                    Activate User Account
                  </>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p className="font-semibold">
                  Are you sure you want to {toggleAction} {getUserFullName(user)}'s account?
                </p>
                
                <div className={`p-3 rounded-lg border ${
                  isUserActive 
                    ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                    : 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                }`}>
                  <p className={`text-sm font-medium ${
                    isUserActive 
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-green-800 dark:text-green-200'
                  }`}>
                    {isUserActive ? '⚠️ Deactivation Effects:' : '✅ Activation Effects:'}
                  </p>
                  <ul className={`text-xs mt-2 space-y-1 ${
                    isUserActive 
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-green-700 dark:text-green-300'
                  }`}>
                    {isUserActive ? (
                      <>
                        <li>• User will be immediately logged out</li>
                        <li>• User cannot log in until reactivated</li>
                        <li>• All user data is preserved</li>
                        <li>• User account can be reactivated anytime</li>
                      </>
                    ) : (
                      <>
                        <li>• User will be able to log in again</li>
                        <li>• All previous permissions will be restored</li>
                        <li>• User data remains intact</li>
                        <li>• User will receive access to their account</li>
                      </>
                    )}
                  </ul>
                </div>
                
                <div className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <strong>User Details:</strong><br/>
                  Email: {user.email}<br/>
                  Company: {user.company_name}<br/>
                  Role: {user.role}<br/>
                  Current Status: {isUserActive ? 'Active' : 'Inactive'}<br/>
                  Joined: {formatDate(user.created_at)}<br/>
                  ID: {user.id}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onToggleStatus(user.id, newStatus)}
                className={isUserActive 
                  ? "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                  : "bg-green-600 hover:bg-green-700 focus:ring-green-600"
                }
              >
                {isUserActive ? 'Deactivate User' : 'Activate User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Permanent Delete Button - Super Admin Only */}
      {canDeleteUser(user) && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="h-7 w-7 p-0 bg-red-700 hover:bg-red-800"
              disabled={actionLoading === `delete-${user.id}`}
              title="Permanently Delete User"
            >
              {actionLoading === `delete-${user.id}` ? (
                <Loader2 className="w-3 h-3" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-4xl w-full">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center text-red-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Permanently Delete User
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                  {/* Left Column - Warning and User Info */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                      <div className="font-semibold text-red-800 dark:text-red-200 mb-2">
                        ⚠️ DANGER: This action cannot be undone!
                      </div>
                      <div className="text-sm">
                        Are you absolutely sure you want to permanently delete <strong>{getUserFullName(user)}</strong>'s account?
                      </div>
                    </div>
                    
                    <div className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <div className="font-semibold block mb-2">User to be deleted:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><strong>Name:</strong> {getUserFullName(user)}</div>
                        <div><strong>Email:</strong> {user.email}</div>
                        <div><strong>Company:</strong> {user.company_name}</div>
                        <div><strong>Role:</strong> {user.role}</div>
                        <div><strong>Status:</strong> {isUserActive ? 'Active' : 'Inactive'}</div>
                        <div><strong>Joined:</strong> {formatDate(user.created_at)}</div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <strong>ID:</strong> {user.id}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Effects and Alternative */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                      <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                        🗑️ This will permanently remove:
                      </div>
                      <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                        <li>• User account and all profile data</li>
                        <li>• All user sessions and login history</li>
                        <li>• Any associated tokens and permissions</li>
                        <li>• All data related to this user</li>
                        <li><strong>• This action is IRREVERSIBLE</strong></li>
                      </ul>
                    </div>
                    
                    <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                      <div className="text-sm text-amber-800 dark:text-amber-200">
                        💡 <strong>Alternative:</strong> Consider deactivating the user instead of deleting. 
                        Deactivation preserves data while preventing access.
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex justify-between pt-6">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDeleteUser(user.id)}
                className="bg-red-700 hover:bg-red-800 focus:ring-red-700"
              >
                Yes, Permanently Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Status Badges - Show user status and other info */}
      <div className="flex flex-row gap-1 ml-2">
        {/* User Status Badge */}
        {canToggleUserStatus(user) && (
          <Badge 
            variant={isUserActive ? "default" : "secondary"}
            className={`text-xs px-2 py-0 h-5 whitespace-nowrap ${
              isUserActive 
                ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100" 
                : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-100"
            }`}
          >
            {isUserActive ? 'Active' : 'Inactive'}
          </Badge>
        )}
        
        {/* Super Admin Protection Badge */}
        {user.role === 'super_admin' && (
          <Badge variant="outline" className="text-xs px-2 py-0 h-5 whitespace-nowrap">
            <Shield className="w-3 h-3 mr-1" />
            Protected
          </Badge>
        )}
        
        {/* Current User Badge */}
        {user.id === currentUserId && (
          <Badge variant="outline" className="text-xs px-2 py-0 h-5 whitespace-nowrap">
            You
          </Badge>
        )}
      </div>
    </div>
  );
};