// frontend/src/components/admin/UserDetailsDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { User } from '@/types/auth';

interface UserDetailsDialogProps {
  user: User;
  onOpenChange?: (open: boolean) => void;
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({ 
  user, 
  onOpenChange 
}) => {
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

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 w-7 p-0"
        >
          <Eye className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            Complete information for {getUserFullName(user)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span>
                <p className="mt-1">{getUserFullName(user)}</p>
              </div>
              <div>
                <span className="font-medium">Email:</span>
                <p className="mt-1 break-all">{user.email}</p>
              </div>
              <div>
                <span className="font-medium">Phone:</span>
                <p className="mt-1">{user.phone_number || 'Not provided'}</p>
              </div>
              <div>
                <span className="font-medium">User ID:</span>
                <p className="mt-1 font-mono text-xs bg-muted px-2 py-1 rounded">{user.id}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Company Information</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Company:</span>
                <p className="mt-1">{user.company_name}</p>
              </div>
              <div>
                <span className="font-medium">Job Title:</span>
                <p className="mt-1">{user.job_title || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium">Department:</span>
                <p className="mt-1">{user.department || 'Not specified'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Account Information</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Role:</span>
                <p className="mt-1 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <p className="mt-1">{user.is_active !== false ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <span className="font-medium">Email Verified:</span>
                <p className="mt-1">{user.is_email_verified ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Activity</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Account Created:</span>
                <p className="mt-1">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <span className="font-medium">Last Login:</span>
                <p className="mt-1">{formatDate(user.last_login)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};