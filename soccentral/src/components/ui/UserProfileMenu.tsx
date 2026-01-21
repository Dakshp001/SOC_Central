// src/components/ui/UserProfileMenu.tsx - User Profile Dropdown Menu for Header
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  LogOut,
  Shield,
  Crown,
  Building2,
  Mail,
  Phone,
} from "lucide-react";
import { SettingsModal } from "@/pages/Profile/SettingsModal";
import { ProfileModal } from "@/pages/Profile/ProfileModal";

export const UserProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!user) return null;

  // Get user initials for avatar
  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Get role icon
  const getRoleIcon = () => {
    switch (user.role) {
      case "super_admin":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  const handleProfile = () => {
    setIsProfileOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="
              relative h-10 w-10 rounded-full p-0
              hover:bg-accent/50 hover:shadow-lg
              focus:bg-accent/50 focus:shadow-lg
              transition-all duration-200
              border border-border/50
            "
          >
            <Avatar className="h-9 w-9 ring-2 ring-background shadow-sm">
              <AvatarImage src={undefined} alt={user.email} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(user.email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-72 p-2 backdrop-blur-xl bg-background/95 border border-border/50 shadow-xl dropdown-menu-smooth"
          align="end"
          forceMount
        >
          {/* User Info Header */}
          <DropdownMenuLabel className="p-3 bg-accent/20 rounded-lg mb-2">
            <div className="flex items-start space-x-3">
              <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                <AvatarImage src={undefined} alt={user.email} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getRoleIcon()}
                  <span className="text-sm font-semibold text-foreground capitalize">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user.email}</span>
                </div>
                
                {user.company_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{user.company_name}</span>
                  </div>
                )}
                
                {user.phone_number && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{user.country_code} {user.phone_number}</span>
                  </div>
                )}
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Menu Items */}
          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 rounded-md dropdown-item-smooth"
            onClick={handleProfile}
          >
            <User className="mr-3 h-4 w-4" />
            <span>View Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 rounded-md dropdown-item-smooth"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="mr-3 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer py-2 px-3 rounded-md dropdown-item-smooth text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};