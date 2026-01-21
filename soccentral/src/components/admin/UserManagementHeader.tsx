// frontend/src/components/admin/UserManagementHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2, RefreshCcw, Moon, Sun, Home, LogOut, Clock, RotateCcw } from 'lucide-react';

interface UserManagementHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
  autoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
  lastUpdated?: Date;
}

export const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({
  isLoading,
  onRefresh,
  onSignOut,
  autoRefresh = false,
  onToggleAutoRefresh,
  lastUpdated
}) => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      return date.toLocaleTimeString();
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight flex items-center text-gray-900 dark:text-white">
            User Management
          </h1>
          {/* ✅ Virtual DOM: Auto-refresh indicator */}
          {autoRefresh && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <RotateCcw className="h-3 w-3 animate-spin" />
              Auto-refresh
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-gray-600 dark:text-gray-400">
            Manage user accounts, roles, and permissions
          </p>
          {/* ✅ Virtual DOM: Last updated timestamp */}
          {lastUpdated && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3" />
              Updated {formatLastUpdated(lastUpdated)}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="
            h-10 w-10 p-0 rounded-xl
            border-gray-300 hover:border-gray-400
            bg-white hover:bg-gray-50
            shadow-md hover:shadow-lg
            transition-all duration-200
          "
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Dashboard Button */}
        <Button 
          variant="outline" 
          size="sm"
          className="
            h-10 px-4 py-2 rounded-xl
            border-blue-300 text-blue-600 hover:bg-blue-50 
            hover:text-blue-700 hover:border-blue-400
            dark:border-blue-700 dark:text-blue-400 
            dark:hover:bg-blue-950 dark:hover:text-blue-300
            shadow-md hover:shadow-lg
            transition-all duration-200 font-medium
          "
          onClick={() => navigate('/dashboard')}
        >
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>

        {/* ✅ Virtual DOM: Auto-refresh toggle */}
        {onToggleAutoRefresh && (
          <Button 
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            className="
              h-10 px-4 py-2 rounded-xl
              shadow-md hover:shadow-lg
              transition-all duration-200 font-medium
            "
            onClick={onToggleAutoRefresh}
            title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
          >
            <RotateCcw className={`mr-2 h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
        )}
        
        {/* Refresh Button */}
        <Button 
          variant="outline"
          size="sm"
          className="
            h-10 px-4 py-2 rounded-xl
            border-green-300 text-green-600 hover:bg-green-50 
            hover:text-green-700 hover:border-green-400
            dark:border-green-700 dark:text-green-400 
            dark:hover:bg-green-950 dark:hover:text-green-300
            shadow-md hover:shadow-lg
            transition-all duration-200 font-medium
          "
          onClick={onRefresh} 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>

        {/* Sign Out Button - Enhanced red styling */}
        <Button 
          variant="outline" 
          size="sm"
          className="
            relative overflow-hidden group
            h-10 px-4 py-2 rounded-xl
            bg-gradient-to-r from-red-500 to-rose-600
            hover:from-red-600 hover:to-rose-700
            text-white border-red-400 hover:border-red-500
            shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/40
            transition-all duration-300 ease-out font-semibold
          "
          onClick={onSignOut}
        >
          <LogOut className="mr-2 h-4 w-4 relative z-10" />
          <span className="relative z-10">Sign Out</span>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-300/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
        </Button>
      </div>
    </div>
  );
};