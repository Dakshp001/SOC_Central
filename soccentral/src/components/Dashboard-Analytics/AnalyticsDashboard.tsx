import React from "react";
import { AllToolData } from "@/lib/api";
import { ToolHeader } from "./components/ToolHeader";
import { FeatureStatusAlert } from "./components/FeatureStatusAlert";
import { EnhancedAnalyticsOverview } from "./components/EnhancedAnalyticsOverview";
import { ToolDashboardRenderer } from "./components/ToolDashboardRenderer";
import { useFeatureStatus } from "./hooks/useFeatureStatus";
import { useTheme } from "@/pages/Main_dashboard/ThemeProvider";
import { Moon, Sun, Monitor } from "lucide-react";

interface AnalyticsDashboardProps {
  data: AllToolData;
  toolType: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  toolType,
}) => {
  // DEBUG: Log Analytics Dashboard usage
  console.log("📊 AnalyticsDashboard loaded with tool:", toolType);
  console.log("📊 Data received:", data);
  
  const featureStatus = useFeatureStatus(data, toolType);
  const { theme, actualTheme, toggleTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Moon className="h-4 w-4" />;
    }
  };

  return (
    <div>
      {/* Theme Toggle Header - Full Width */}
      <div className="w-full px-6 py-4 border-b border-border bg-background">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            Analytics Dashboard
          </h1>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card hover:bg-card-hover border border-border transition-all duration-200 text-card-foreground"
            title={`Current theme: ${theme}${
              theme === "system" ? ` (${actualTheme})` : ""
            }`}
          >
            {getThemeIcon()}
            <span className="capitalize text-sm">{theme}</span>
          </button>
        </div>
      </div>

      {/* Main Content - Full Width */}
      
      {/* Tool Type Header - Full Width */}
      <div className="w-full px-6 py-4 bg-muted/30">
        <ToolHeader
          toolType={toolType}
          data={data}
          featureStatus={featureStatus}
        />
      </div>

      {/* Enhanced Feature Status Alerts - Full Width */}
      <div className="w-full px-6 py-4">
        <FeatureStatusAlert featureStatus={featureStatus} />
      </div>

      {/* Feature Overview for Enhanced Tools - Full Width */}
      <div className="w-full px-6 py-4 bg-muted/10">
        <EnhancedAnalyticsOverview featureStatus={featureStatus} />
      </div>

      {/* Render appropriate dashboard - Full Width with comprehensive view */}
      <div className="w-full px-6 py-6">
        <ToolDashboardRenderer data={data} toolType={toolType} />
      </div>
    </div>
  );
};
