// Dashboard Header Component
// src/components/dashboards/MDM/components/DashboardHeader.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { MDMKPIs } from "../types";
import { formatNumber } from "../utils";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface DashboardHeaderProps {
  kpis: MDMKPIs;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ kpis }) => {
  const { actualTheme } = useTheme();
  const navigate = useNavigate();

  // Theme-aware classes using CSS variables
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className={`text-3xl font-bold ${textPrimary}`}>
          MDM Dashboard
        </h1>
        <p className={textSecondary}>
          Complete Mobile Device Management & Security Overview
        </p>
      </div>
      <div className="flex items-center gap-2">
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
        <Badge variant="default" className="bg-green-600">
          Live Data
        </Badge>
        <Badge variant="outline" className="border-border text-muted-foreground">
          {formatNumber(kpis.totalDevices)} Total Devices
        </Badge>
        
      </div>
    </div>
  );
};