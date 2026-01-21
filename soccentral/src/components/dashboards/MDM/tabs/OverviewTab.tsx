import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Monitor, Activity, Settings } from "lucide-react";
import { ChartDataPoint } from "../types";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

// Define a consistent color palette
const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#14B8A6", // Teal
  "#F472B6", // Rose
  "#F87171", // Light Red
];

interface OverviewTabProps {
  platformChartData: ChartDataPoint[];
  enrollmentChartData: ChartDataPoint[];
  managementTypesData: ChartDataPoint[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  platformChartData,
  enrollmentChartData,
  managementTypesData,
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
              {`${entry.name || 'Devices'}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Platform and Enrollment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Distribution */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
              <Monitor className="h-5 w-5" />
              Platform Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="platform"
                    label={({ platform, count }) => `${platform}: ${count}`}
                  >
                    {platformChartData.map((entry, index) => (
                      <Cell key={`cell-platform-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Status */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
              <Activity className="h-5 w-5" />
              Enrollment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={enrollmentChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {enrollmentChartData.map((entry, index) => (
                      <Cell key={`cell-enrollment-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Types */}
      {managementTypesData.length > 0 && (
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
              <Settings className="h-5 w-5" />
              Management Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={managementTypesData}>
                  <CartesianGrid {...gridStyle} />
                  <XAxis 
                    dataKey="type" 
                    {...axisStyle} 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    {...axisStyle} 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count">
                    {managementTypesData.map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};