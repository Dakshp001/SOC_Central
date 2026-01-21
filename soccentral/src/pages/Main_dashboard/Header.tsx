// frontend/src/pages/Main_dashboard/Header.tsx - UPDATED WITH REFRESH BUTTON
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToolData } from "@/contexts/ToolDataContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  Shield,
  Crown,
  RefreshCw,
  Building2,
  FileText,
} from "lucide-react";
// Session countdown hidden from UI per request
import { ThemeToggle } from "./ThemeToggle";
import { HeaderLogo } from "./HeaderLogo";
import { UserProfileMenu } from "@/components/ui/UserProfileMenu";
import { useToast } from "@/hooks/use-toast";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, canWrite, canManageUsers } = useAuth();
  const { loadActiveData, isLoadingData, lastSyncAt } = useToolData();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ensure header stays sticky
  React.useEffect(() => {
    const ensureHeaderPosition = () => {
      const headerElement = document.querySelector(
        ".dashboard-header"
      ) as HTMLElement;
      if (headerElement) {
        headerElement.style.position = "fixed";
        headerElement.style.top = "12px";
        headerElement.style.left = "50%";
        headerElement.style.transform = "translateX(-50%)";
        headerElement.style.zIndex = "2147483647";
        headerElement.style.width = "calc(100vw - 32px)";
        headerElement.style.maxWidth = "none";
      }
    };

    // Run immediately and on scroll
    ensureHeaderPosition();
    window.addEventListener("scroll", ensureHeaderPosition);
    window.addEventListener("resize", ensureHeaderPosition);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", ensureHeaderPosition);
      window.removeEventListener("resize", ensureHeaderPosition);
    };
  }, []);

  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadActiveData();
      toast({
        title: "Data Refreshed! 🔄",
        description: "Latest data has been loaded from the server.",
      });
    } catch (error) {
      console.error("Refresh failed:", error);
      toast({
        title: "Refresh Failed ❌",
        description: "Failed to load latest data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get role-specific info
  const getRoleInfo = () => {
    if (!user) return null;

    switch (user.role) {
      case "super_admin":
        return {
          icon: Crown,
          color: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
          label: "Super Admin",
        };
      case "master_admin":
        return {
          icon: Shield,
          color: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
          label: "Master Admin",
        };
      case "admin":
        return {
          icon: Shield,
          color: "bg-gradient-to-r from-blue-500 to-purple-500 text-white",
          label: "Admin",
        };
      default:
        return {
          icon: Shield,
          color: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
          label: "General User",
        };
    }
  };

  const roleInfo = getRoleInfo();
  const RoleIcon = roleInfo?.icon;

  // Format last sync time
  const getLastSyncText = () => {
    if (!lastSyncAt) return "Never";
    const now = new Date();
    const diff = now.getTime() - lastSyncAt.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return lastSyncAt.toLocaleDateString();
  };

  return (
    <>
      {/* Spacer to prevent content jump */}
      <div className="h-20" />

      {/* Header - Fixed positioning */}
      <header
        className="dashboard-header fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[98%] max-w-8xl"
      >
        {/* Main glass morphism container */}
        <div
          className="
          relative overflow-hidden
          backdrop-blur-2xl 
          bg-background/60 dark:bg-background/40 
          border border-border/30 dark:border-border/20
          rounded-2xl
          shadow-xl shadow-black/5 dark:shadow-black/20
          transition-all duration-300
          hover:shadow-2xl hover:shadow-black/8 dark:hover:shadow-black/30
          hover:bg-background/70 dark:hover:bg-background/50
        "
        >
          {/* Enhanced gradient overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/5 pointer-events-none" />

          <div className="relative px-8 py-3">
            <div className="flex items-center justify-between">
              {/* Logo and title section */}
              <div className="flex items-center gap-3">
                {/* Enhanced logo with floating effect */}
                <div className="relative">
                  <HeaderLogo />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Title */}
                  <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">
                    SOC Central
                  </h1>

                  {/* Role badge */}
                  {user && roleInfo && (
                    <Badge
                      variant="outline"
                      className={`text-xs px-2 py-0.5 ${roleInfo.color} border-0`}
                    >
                      {RoleIcon && <RoleIcon className="h-3 w-3 mr-1" />}
                      {roleInfo.label}
                    </Badge>
                  )}

                  {/* Company badge */}
                  {user?.company_name && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                      title={`Viewing data for: ${user.company_name}`}
                    >
                      <Building2 className="h-3 w-3 mr-1" />
                      {user.company_name}
                    </Badge>
                  )}

                  {/* Sync badge */}
                  {user && (
                    <Badge
                      variant="secondary"
                      className="text-xs px-2 py-0.5 bg-muted/50 text-muted-foreground border-0"
                      title={`Last data sync: ${
                        lastSyncAt ? lastSyncAt.toLocaleString() : "Never"
                      }`}
                    >
                      Synced {getLastSyncText()}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Controls section */}
              <div className="flex items-center gap-3">
                {/* Security Monitor removed from UI */}

                {/* Enhanced theme toggle with floating effect */}
                <div className="relative">
                  <ThemeToggle />
                </div>

                {/* Conditional navigation buttons based on user role */}
                <div className="flex items-center gap-3">
                  {/* Analytics Portal button */}
                  <Button
                    onClick={() => navigate("/analytics")}
                    variant="outline"
                    size="sm"
                    className="
                      bg-white hover:bg-gray-100
                      dark:bg-black dark:hover:bg-gray-900
                      border border-black hover:border-black/70
                      dark:border-gray-400 dark:hover:border-gray-300
                      text-foreground hover:text-foreground/80
                      rounded-lg px-3 py-2 h-9
                      transition-all duration-200
                      flex items-center gap-2
                      hover:scale-105 hover:shadow-lg
                    "
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Analytics</span>
                  </Button>

                  {/* SOC Reports button */}
                  {canManageUsers() && (
                    <Button
                      onClick={() => navigate("/reports")}
                      variant="outline"
                      size="sm"
                      className="
                        bg-white hover:bg-gray-100
                        dark:bg-black dark:hover:bg-gray-900
                        border border-black hover:border-black/70
                        dark:border-gray-400 dark:hover:border-gray-300
                        text-foreground hover:text-foreground/80
                        rounded-lg px-3 py-2 h-9
                        transition-all duration-200
                        flex items-center gap-2
                        hover:scale-105 hover:shadow-lg
                      "
                    >
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Reports</span>
                    </Button>
                  )}

                  {/* User Management button */}
                  {canManageUsers() && (
                    <Button
                      onClick={() => navigate("/admin/users")}
                      variant="outline"
                      size="sm"
                      className="
                        bg-white hover:bg-gray-100
                        dark:bg-black dark:hover:bg-gray-900
                        border border-black hover:border-black/70
                        dark:border-gray-400 dark:hover:border-gray-300
                        text-foreground hover:text-foreground/80
                        rounded-lg px-3 py-2 h-9
                        transition-all duration-200
                        flex items-center gap-2
                        hover:scale-105 hover:shadow-lg
                      "
                    >
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Users</span>
                    </Button>
                  )}
                </div>

                {/* User Profile Menu */}
                {user && <UserProfileMenu />}
              </div>
            </div>
          </div>

          {/* Enhanced accent lines for depth */}
          <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        </div>
      </header>
    </>
  );
};
