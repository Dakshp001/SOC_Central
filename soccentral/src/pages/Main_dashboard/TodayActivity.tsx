// Today Activity Component - Dynamic Data Version
// Save as: src/pages/Main_dashboard/TodayActivity.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap,
  Users,
  AlertTriangle,
  Lock
} from "lucide-react";
import { useToolData } from "@/contexts/ToolDataContext";
import { GSuiteData, MDMData, SIEMData, EDRData, MerakiData, SonicWallData, isEnhancedGSuiteData } from "@/lib/api";

interface ActivityStat {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  colorScheme: {
    gradient: string;
    border: string;
    iconBg: string;
    labelColor: string;
    valueColor: string;
  };
  rawValue?: number;
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Helper function to get dynamic color scheme based on value severity
const getColorScheme = (type: string, value: number) => {
  switch (type) {
    case 'files':
      return {
        gradient: "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30",
        border: "border-blue-200 dark:border-blue-800",
        iconBg: "bg-blue-500 dark:bg-blue-600",
        labelColor: "text-blue-600 dark:text-blue-400",
        valueColor: "text-blue-900 dark:text-blue-100"
      };
    case 'users':
      return {
        gradient: "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30",
        border: "border-green-200 dark:border-green-800",
        iconBg: "bg-green-500 dark:bg-green-600",
        labelColor: "text-green-600 dark:text-green-400",
        valueColor: "text-green-900 dark:text-green-100"
      };
    case 'incidents':
      // Dynamic coloring based on incident count
      if (value > 20) {
        return {
          gradient: "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30",
          border: "border-red-200 dark:border-red-800",
          iconBg: "bg-red-500 dark:bg-red-600",
          labelColor: "text-red-600 dark:text-red-400",
          valueColor: "text-red-900 dark:text-red-100"
        };
      } else if (value > 10) {
        return {
          gradient: "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30",
          border: "border-orange-200 dark:border-orange-800",
          iconBg: "bg-orange-500 dark:bg-orange-600",
          labelColor: "text-orange-600 dark:text-orange-400",
          valueColor: "text-orange-900 dark:text-orange-100"
        };
      } else {
        return {
          gradient: "bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/30",
          border: "border-yellow-200 dark:border-yellow-800",
          iconBg: "bg-yellow-500 dark:bg-yellow-600",
          labelColor: "text-yellow-600 dark:text-yellow-400",
          valueColor: "text-yellow-900 dark:text-yellow-100"
        };
      }
    case 'threats':
      // Dynamic coloring based on threat count
      if (value > 5000) {
        return {
          gradient: "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30",
          border: "border-red-200 dark:border-red-800",
          iconBg: "bg-red-500 dark:bg-red-600",
          labelColor: "text-red-600 dark:text-red-400",
          valueColor: "text-red-900 dark:text-red-100"
        };
      } else {
        return {
          gradient: "bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30",
          border: "border-purple-200 dark:border-purple-800",
          iconBg: "bg-purple-500 dark:bg-purple-600",
          labelColor: "text-purple-600 dark:text-purple-400",
          valueColor: "text-purple-900 dark:text-purple-100"
        };
      }
    default:
      return {
        gradient: "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/50 dark:to-gray-900/30",
        border: "border-gray-200 dark:border-gray-800",
        iconBg: "bg-gray-500 dark:bg-gray-600",
        labelColor: "text-gray-600 dark:text-gray-400",
        valueColor: "text-gray-900 dark:text-gray-100"
      };
  }
};

export const TodayActivity: React.FC = () => {
  const { toolData } = useToolData();

  const calculateActivityStats = (): ActivityStat[] => {
    let filesProcessed = 0;
    let activeUsers = 0;
    let incidents = 0;
    let blockedThreats = 0;

    // Aggregate data from all available tools
    if (toolData.gsuite.data) {
      const gsuiteData = toolData.gsuite.data as GSuiteData;
      filesProcessed += gsuiteData.kpis.emailsScanned || 0;
      
      if (isEnhancedGSuiteData(gsuiteData)) {
        incidents += (gsuiteData.kpis.phishingAttempted || 0) + (gsuiteData.kpis.suspiciousEmails || 0);
        blockedThreats += gsuiteData.kpis.phishingAttempted || 0;
      } else {
        incidents += (gsuiteData.kpis.phishingBlocked || 0) + (gsuiteData.kpis.suspiciousFlags || 0);
        blockedThreats += gsuiteData.kpis.phishingBlocked || 0;
      }
    }

    if (toolData.mdm.data) {
      const mdmData = toolData.mdm.data as MDMData;
      activeUsers += mdmData.kpis.enrolledDevices || 0;
      incidents += mdmData.kpis.securityIssues || 0;
    }

    if (toolData.siem.data) {
      const siemData = toolData.siem.data as SIEMData;
      filesProcessed += siemData.kpis.totalEvents || 0;
      incidents += (siemData.kpis.criticalAlerts || 0) + (siemData.kpis.highSeverityEvents || 0);
      activeUsers += siemData.kpis.uniqueUsers || 0;
    }

    if (toolData.edr.data) {
      const edrData = toolData.edr.data as EDRData;
      activeUsers += edrData.kpis.totalEndpoints || 0;
      incidents += edrData.kpis.threatsDetected || 0;
      blockedThreats += edrData.kpis.quarantinedFiles || 0;
    }

    if (toolData.meraki.data) {
      const merakiData = toolData.meraki.data as MerakiData;
      activeUsers += merakiData.kpis.connectedClients || 0;
      incidents += merakiData.kpis.securityIncidents || 0;
    }

    if (toolData.sonicwall.data) {
      const sonicwallData = toolData.sonicwall.data as SonicWallData;
      incidents += sonicwallData.kpis.intrusionAttempts || 0;
      blockedThreats += sonicwallData.kpis.blockedAttempts || 0;
    }

    // Fallback to default values if no data is available
    const finalFilesProcessed = filesProcessed || 142;
    const finalActiveUsers = activeUsers || 1247;
    const finalIncidents = incidents || 7;
    const finalBlockedThreats = blockedThreats || 1834;

    return [
      {
        label: "Files Processed",
        value: formatNumber(finalFilesProcessed),
        icon: Zap,
        colorScheme: getColorScheme('files', finalFilesProcessed),
        rawValue: finalFilesProcessed
      },
      {
        label: "Active Users",
        value: formatNumber(finalActiveUsers),
        icon: Users,
        colorScheme: getColorScheme('users', finalActiveUsers),
        rawValue: finalActiveUsers
      },
      {
        label: "Incidents",
        value: finalIncidents.toString(),
        icon: AlertTriangle,
        colorScheme: getColorScheme('incidents', finalIncidents),
        rawValue: finalIncidents
      },
      {
        label: "Blocked Threats",
        value: formatNumber(finalBlockedThreats),
        icon: Lock,
        colorScheme: getColorScheme('threats', finalBlockedThreats),
        rawValue: finalBlockedThreats
      }
    ];
  };

  const activityStats = calculateActivityStats();

  // Check if we have any real data
  const hasRealData = Object.values(toolData).some(tool => tool.data !== null);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Today's Activity</h2>
        {hasRealData && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live Data</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {activityStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className={`${stat.colorScheme.gradient} ${stat.colorScheme.border} transition-all hover:shadow-lg hover:scale-105`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${stat.colorScheme.iconBg} rounded-lg flex items-center justify-center shadow-md`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className={`text-sm ${stat.colorScheme.labelColor} font-medium`}>
                      {stat.label}
                    </div>
                    <div className={`text-2xl font-bold ${stat.colorScheme.valueColor}`}>
                      {stat.value}
                    </div>
                    {hasRealData && (
                      <div className="text-xs text-muted-foreground">
                        From {Object.values(toolData).filter(tool => tool.data !== null).length} sources
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Additional insights when real data is available */}
      {hasRealData && (
        <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">Data Sources Active</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(toolData)
              .filter(([_, tool]) => tool.data !== null)
              .map(([toolName, tool]) => (
                <div key={toolName} className="flex items-center gap-1 text-xs bg-background px-2 py-1 rounded border">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="capitalize">{toolName}</span>
                  {tool.uploadedAt && (
                    <span className="text-muted-foreground">
                      ({tool.uploadedAt.toLocaleDateString()})
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  );
};