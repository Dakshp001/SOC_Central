// src/components/Dashboards/SIEM/DashboardHeader.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { SIEMData } from "@/lib/api";
import { isRealDataAvailable, hasRealDateData } from "@/lib/api";

interface DashboardHeaderProps {
  data: SIEMData;
  hasEnhancedFeatures: boolean;
  textPrimary: string;
  textSecondary: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  data,
  hasEnhancedFeatures,
  textPrimary,
  textSecondary,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
      <div className="space-y-2">
        <h1 className={`text-4xl font-bold ${textPrimary}`}>
          SIEM Analytics Dashboard
        </h1>
        <p className={`text-lg ${textSecondary}`}>
          Security Information and Event Management - Real-time monitoring and
          analysis
        </p>
      </div>
      <div className="flex items-center gap-3">
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
        <Badge variant="default" className="bg-green-600 px-3 py-1">
          Live Data
        </Badge>
        <Badge variant="outline" className="px-3 py-1 border-border text-muted-foreground">
          {data.processedEvents.toLocaleString()} Events
        </Badge>
        {hasEnhancedFeatures && (
          <Badge variant="default" className="bg-purple-600 px-3 py-1">
            Enhanced Analytics
          </Badge>
        )}
        {hasRealDateData(data) && (
          <Badge variant="default" className="bg-blue-600 px-3 py-1">
            ✓ Real Date Data
          </Badge>
        )}
        {isRealDataAvailable(data) && (
          <Badge variant="default" className="bg-orange-600 px-3 py-1">
            ✓ Peak Hours
          </Badge>
        )}
      </div>
    </div>
  );
};