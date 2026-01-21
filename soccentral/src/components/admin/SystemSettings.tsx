// frontend/src/components/admin/SystemSettings.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Users,
  Database,
  Shield,
  Clock,
  Server,
  Activity,
  Info,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { User } from '@/types/auth';

interface SystemSettingsProps {
  currentUser: User | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  onRefreshUsers: () => void;
  onNavigateToDataManagement: () => void;
  onSignOut: () => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({
  currentUser,
  isLoading,
  isSuperAdmin,
  onRefreshUsers,
  onNavigateToDataManagement,
  onSignOut
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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Administrator';
      case 'admin': return 'Administrator';
      case 'general': return 'General User';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'general': return 'secondary';
      default: return 'outline';
    }
  };

  const getSystemUptime = () => {
    // This would typically come from an API endpoint
    // For now, we'll calculate based on a mock start time
    const startTime = new Date('2025-01-01T00:00:00Z');
    const now = new Date();
    const uptimeMs = now.getTime() - startTime.getTime();
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days} days, ${hours} hours`;
  };

  return (
    <div className="space-y-6">
      {/* System Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            System Information
          </CardTitle>
          <CardDescription>
            Current system status and configuration details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Information */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Current Session
              </h4>
              <div className="space-y-1">
                <p className="font-medium">
                  {currentUser?.first_name} {currentUser?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={getRoleBadgeVariant(currentUser?.role || '')}>
                    <Shield className="w-3 h-3 mr-1" />
                    {getRoleDisplayName(currentUser?.role || '')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Organization
              </h4>
              <div className="space-y-1">
                <p className="font-medium">{currentUser?.company_name}</p>
                {currentUser?.department && (
                  <p className="text-sm text-muted-foreground">{currentUser.department}</p>
                )}
                {currentUser?.job_title && (
                  <p className="text-sm text-muted-foreground">{currentUser.job_title}</p>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                System Status
              </h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Online</span>
                </div>
                <p className="text-sm text-muted-foreground">SOC Central v2.0.0</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Uptime: {getSystemUptime()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Session Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Account Created:</span>
                <p className="text-muted-foreground">{formatDate(currentUser?.created_at)}</p>
              </div>
              <div>
                <span className="font-medium">Last Login:</span>
                <p className="text-muted-foreground">{formatDate(currentUser?.last_login)}</p>
              </div>
              <div>
                <span className="font-medium">User ID:</span>
                <p className="text-muted-foreground font-mono text-xs">
                  {currentUser?.id}
                </p>
              </div>
              <div>
                <span className="font-medium">Email Verified:</span>
                <p className="text-muted-foreground">
                  {currentUser?.is_email_verified ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Administrative Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Administrative Actions
          </CardTitle>
          <CardDescription>
            Manage system operations and user data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* System Management Actions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              System Management
            </h4>

            <Button
              onClick={onRefreshUsers}
              disabled={isLoading}
              variant="outline"
              className="w-full justify-start"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Refresh User List
            </Button>

            {isSuperAdmin && (
              <Button
                onClick={onNavigateToDataManagement}
                variant="outline"
                className="w-full justify-start"
              >
                <Database className="h-4 w-4 mr-2" />
                Manage System Data
              </Button>
            )}
          </div>

          {/* Security Actions */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Security
            </h4>

            <Button
              onClick={onSignOut}
              variant="destructive"
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Capabilities Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Capabilities
          </CardTitle>
          <CardDescription>
            Available features based on your current role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Role-based capabilities */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Your Permissions:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  <Activity className="w-3 h-3 mr-1" />
                  Dashboard Access
                </Badge>

                {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
                  <Badge variant="outline" className="text-xs">
                    <Database className="w-3 h-3 mr-1" />
                    Data Analysis
                  </Badge>
                )}

                {currentUser?.role === 'super_admin' && (
                  <>
                    <Badge variant="outline" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      User Management
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      System Administration
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Feature availability notice */}
            {currentUser?.role !== 'super_admin' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Some administrative features require Super Admin privileges.
                  Contact your system administrator for access requests.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};