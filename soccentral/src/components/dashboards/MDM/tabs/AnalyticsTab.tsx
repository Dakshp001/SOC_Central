// Analytics Tab Component
// src/components/dashboards/MDM/tabs/AnalyticsTab.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Monitor, CheckCircle, Activity, Trash2, Key, Target } from "lucide-react";
import { ChartDataPoint, MDMKPIs, MDMDetails } from "../types";
import { formatPercentage, calculatePercentage } from "../utils";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface AnalyticsTabProps {
  osChartData: ChartDataPoint[];
  kpis: MDMKPIs;
  rawMdmData: {
    details: MDMDetails;
  };
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  osChartData,
  kpis,
  rawMdmData,
}) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  
  // Theme-aware chart styling
  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--card-foreground))",
    boxShadow: actualTheme === 'dark' 
      ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
      : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  };

  const axisStyle = {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: "12px",
    fontFamily: "inherit",
  };

  const gridStyle = {
    stroke: "hsl(var(--border))",
    strokeDasharray: "2 2",
    opacity: 0.5,
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={tooltipStyle} className="p-3">
          <p className={`font-medium ${textPrimary} mb-1`}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name || 'Count'}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* OS Distribution and Compliance Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {osChartData.length > 0 && (
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
                <Monitor className="h-5 w-5" />
                OS Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={osChartData}>
                    <CartesianGrid {...gridStyle} />
                    <XAxis
                      dataKey="os"
                      {...axisStyle}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      {...axisStyle} 
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={cardBg}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
              <CheckCircle className="h-5 w-5" />
              Compliance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={textSecondary}>Compliant Devices</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={kpis.complianceRate}
                    className="w-24 h-2"
                  />
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {kpis.compliantDevices}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={textSecondary}>Non-Compliant Devices</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={
                      kpis.totalDevices > 0
                        ? calculatePercentage(kpis.nonCompliantDevices, kpis.totalDevices)
                        : 0
                    }
                    className="w-24 h-2"
                  />
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {kpis.nonCompliantDevices}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={textSecondary}>Enrollment Rate</span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={kpis.enrollmentRate}
                    className="w-24 h-2"
                  />
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {formatPercentage(kpis.enrollmentRate)}
                  </span>
                </div>
              </div>

              {/* Detailed Analytics */}
              <div className={`mt-6 pt-4 border-t border-border`}>
                <h4 className={`text-sm font-semibold ${textPrimary} mb-3`}>
                  Device Analytics
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {kpis.enrolledDevices}
                    </p>
                    <p className={`text-xs ${textSecondary}`}>Enrolled</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${textSecondary}`}>
                      {kpis.totalDevices - kpis.enrolledDevices}
                    </p>
                    <p className={`text-xs ${textSecondary}`}>Not Enrolled</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Management Actions */}
      <Card className={cardBg}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
            <Activity className="h-5 w-5" />
            Management Actions & Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Wipe Actions */}
            <div className="space-y-3">
              <h4 className={`font-semibold ${textPrimary} flex items-center gap-2`}>
                <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                Wipe Status
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`${textSecondary} text-sm`}>Completed</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {rawMdmData?.details?.wipeOuts?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`${textSecondary} text-sm`}>Pending</span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                    {kpis.wipePendingDevices}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Status */}
            <div className="space-y-3">
              <h4 className={`font-semibold ${textPrimary} flex items-center gap-2`}>
                <Key className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                Security Status
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`${textSecondary} text-sm`}>Protected</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {kpis.totalDevices -
                      kpis.devicesWithoutPassword -
                      kpis.unencryptedDevices}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`${textSecondary} text-sm`}>At Risk</span>
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {kpis.devicesWithoutPassword + kpis.unencryptedDevices}
                  </span>
                </div>
              </div>
            </div>

            {/* Overall Health */}
            <div className="space-y-3">
              <h4 className={`font-semibold ${textPrimary} flex items-center gap-2`}>
                <Target className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                Overall Health
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`${textSecondary} text-sm`}>Healthy</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    {kpis.compliantDevices}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`${textSecondary} text-sm`}>Issues</span>
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {kpis.securityIssues}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};