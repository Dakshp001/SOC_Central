// Security Tab Component
// src/components/dashboards/MDM/tabs/SecurityTab.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Shield, PieChart as PieChartIcon } from "lucide-react";
import { 
  EnhancedSecurityViolation, 
  ChartDataPoint, 
  MDMKPIs 
} from "../types";
import { SecurityViolations } from "../components/SecurityViolations";
import { NoSecurityIssues } from "../components/EmptyStates";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface SecurityTabProps {
  violations: EnhancedSecurityViolation[];
  securityBreakdownData: ChartDataPoint[];
  kpis: MDMKPIs;
  onViolationClick: (violationType: string) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
  violations,
  securityBreakdownData,
  kpis,
  onViolationClick,
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

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={tooltipStyle} className="p-3">
          <p className={`font-medium ${textPrimary} mb-1`}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Handle case where there are no security violations
  if (violations.length === 0 && kpis.totalDevices > 0) {
    return <NoSecurityIssues kpis={kpis} />;
  }

  return (
    <div className="space-y-6">
      {/* Security Violations Grid */}
      <SecurityViolations 
        violations={violations} 
        onViolationClick={onViolationClick} 
      />

      {/* Security Breakdown Chart and Metrics */}
      {securityBreakdownData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
                <PieChartIcon className="h-5 w-5" />
                Security Issues Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={securityBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      onClick={(data) => {
                        const labelToType: Record<string, string> = {
                          Compromised: "compromised",
                          "No Password": "no_password",
                          "Not Encrypted": "not_encrypted",
                          "Non-Compliant": "non_compliant",
                        };
                        const type = labelToType[data.name!];
                        if (type) {
                          onViolationClick(type);
                        }
                      }}
                    >
                      {securityBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Security Metrics Summary */}
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
                <Shield className="h-5 w-5" />
                Security Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className={textSecondary}>
                  Overall Security Score
                </span>
                <div className="flex items-center gap-2">
                  <Progress
                    value={kpis.securityScore}
                    className="w-20 h-2"
                  />
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    {kpis.securityScore}/100
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className={textSecondary}>
                  Devices Without Password
                </span>
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  {kpis.devicesWithoutPassword}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={textSecondary}>Unencrypted Devices</span>
                <span className="text-orange-600 dark:text-orange-400 font-semibold">
                  {kpis.unencryptedDevices}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={textSecondary}>Compromised Devices</span>
                <span className="text-red-600 dark:text-red-500 font-semibold">
                  {kpis.compromisedDevices}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={textSecondary}>Wipe Pending</span>
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold">
                  {kpis.wipePendingDevices}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};