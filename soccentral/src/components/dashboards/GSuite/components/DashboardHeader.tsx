// src/components/dashboards/GSuite/components/DashboardHeader.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Home } from 'lucide-react';
import { EnhancedGSuiteData } from '../types';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface DashboardHeaderProps {
  data: EnhancedGSuiteData;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ data }) => {
  const { actualTheme } = useTheme();
  const navigate = useNavigate();

  // Theme-aware classes using CSS variables
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>GSuite Email Security Dashboard</h2>
        <p className={textSecondary}>Advanced email security analytics with interactive visualizations</p>
      </div>
      <div className="flex items-center gap-4">
        {/* Dashboard button */}
        <Button
          onClick={() => navigate("/dashboard")}
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
          <Home className="h-4 w-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </Button>
        {data.analytics?.dateRange && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className={`h-4 w-4 ${textSecondary}`} />
            <span className={textSecondary}>
              {data.analytics.dateRange.start} to {data.analytics.dateRange.end}
            </span>
          </div>
        )}
        <Badge 
          variant="secondary" 
          className={`${actualTheme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'}`}
        >
          🚀 Enhanced Dashboard
        </Badge>
      </div>
    </div>
  );
};