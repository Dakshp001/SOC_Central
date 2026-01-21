// frontend/src/pages/Profile/ProfileDropdown.tsx - UPDATED WITH ADMIN REQUEST
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Settings,
  LogOut,
  Shield,
  Users,
  Crown,
  UserCog,
  Activity,
  Bell,
  Key,
  UserPlus,  // ✅ NEW ICON
  Brain
} from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { SettingsModal } from './SettingsModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { AdminSetup } from '@/components/AdminSetup';  // ✅ NEW IMPORT
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';  // ✅ NEW IMPORT
import { toast } from '@/hooks/use-toast';

export const ProfileDropdown: React.FC = () => {
  const { user, signOut, canWrite, canManageUsers } = useAuth();
  const navigate = useNavigate();
  
  // Modal states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAdminRequestModalOpen, setIsAdminRequestModalOpen] = useState(false);  // ✅ NEW STATE
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  // Get user initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get role icon and color
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { 
          icon: Crown, 
          color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
          label: 'Super Admin'
        };
      case 'admin':
        return { 
          icon: Shield, 
          color: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white',
          label: 'Admin'
        };
      default:
        return { 
          icon: User, 
          color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
          label: 'General User'
        };
    }
  };

  const roleConfig = getRoleConfig(user.role);
  const RoleIcon = roleConfig.icon;

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an issue logging out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-10 w-10 rounded-full p-0 hover:bg-background/50 focus:bg-background/50 transition-all duration-200"
          >
            <Avatar className="h-10 w-10 border-2 border-border/20 shadow-md hover:shadow-lg transition-all duration-200">
              <AvatarImage src="" alt={user.first_name} />
              <AvatarFallback className={roleConfig.color}>
                {getInitials(user.first_name, user.last_name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Online status indicator */}
            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background shadow-sm"></div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-80 p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-xl" 
          align="end"
        >
          {/* User Info Header */}
          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 border-2 border-border/30">
                <AvatarImage src="" alt={user.first_name} />
                <AvatarFallback className={roleConfig.color}>
                  {getInitials(user.first_name, user.last_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">
                    {user.first_name} {user.last_name}
                  </h4>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-2 py-0.5 ${roleConfig.color} border-0`}
                  >
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {roleConfig.label}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground truncate">
                  {user.email}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{user.company_name}</span>
                  {(user as any).department && (
                    <>
                      <span>•</span>
                      <span>{(user as any).department}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <DropdownMenuItem 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">View Profile</div>
                <div className="text-xs text-muted-foreground">Manage your account details</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">Settings</div>
                <div className="text-xs text-muted-foreground">Preferences and configuration</div>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Key className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">Change Password</div>
                <div className="text-xs text-muted-foreground">Update your password</div>
              </div>
            </DropdownMenuItem>

            {/* ML Anomaly - Admin/Super Admin Only */}
            {canWrite() && (
              <DropdownMenuItem
                onClick={() => navigate('/ml-anomaly')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Brain className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <div className="font-medium">ML Anomaly Detection</div>
                  <div className="text-xs text-muted-foreground">Advanced anomaly detection</div>
                </div>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem 
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">Activity Log</div>
                <div className="text-xs text-muted-foreground">View your recent activity</div>
              </div>
            </DropdownMenuItem>

            {/* ✅ NEW: Admin Request for General Users Only */}
            {user.role === 'general' && !canWrite() && (
              <>
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem 
                  onClick={() => setIsAdminRequestModalOpen(true)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <UserPlus className="h-4 w-4 text-orange-500" />
                  <div className="flex-1">
                    <div className="font-medium text-orange-600 dark:text-orange-400">Request Admin Access</div>
                    <div className="text-xs text-muted-foreground">Submit admin access request</div>
                  </div>
                  <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">
                    Upgrade
                  </Badge>
                </DropdownMenuItem>
              </>
            )}

            {/* Admin-only items */}
            {canWrite() && (
              <>
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem 
                  onClick={() => navigate('/analytics')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <UserCog className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <div className="font-medium text-blue-600 dark:text-blue-400">Admin Tools</div>
                    <div className="text-xs text-muted-foreground">Advanced analytics and tools</div>
                  </div>
                  <Badge variant="outline" className="text-xs">Admin</Badge>
                </DropdownMenuItem>
              </>
            )}

            {/* Super Admin-only items */}
            {canManageUsers() && (
              <DropdownMenuItem 
                onClick={() => navigate('/admin/users')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <Users className="h-4 w-4 text-yellow-500" />
                <div className="flex-1">
                  <div className="font-medium text-yellow-600 dark:text-yellow-400">User Management</div>
                  <div className="text-xs text-muted-foreground">Manage all users and permissions</div>
                </div>
                <Badge variant="outline" className="text-xs">Super Admin</Badge>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="my-2" />

            {/* Logout */}
            <DropdownMenuItem 
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isLoggingOut ? 'Please wait...' : 'Sign out of your account'}
                </div>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Existing Modals */}
      <ProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* ✅ NEW: Admin Request Modal */}
      <Dialog open={isAdminRequestModalOpen} onOpenChange={setIsAdminRequestModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-orange-500" />
              Request Administrative Access
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <AdminSetup />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};