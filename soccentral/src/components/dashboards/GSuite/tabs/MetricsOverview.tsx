// src/components/dashboards/GSuite/tabs/MetricsOverview.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCw, Settings } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartData } from "../types";
import { CustomTooltip } from "../components/CustomTooltip";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface MetricsOverviewProps {
  chartData: ChartData;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  chartData,
}) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  const gridColor = actualTheme === 'dark' ? "#374151" : "#E5E7EB";
  const tickColor = actualTheme === 'dark' ? "#D1D5DB" : "#6B7280";
  const badgeBg = actualTheme === 'dark' ? "border-border text-muted-foreground" : "border-border text-muted-foreground";
  
  return (
    <Card className={`${cardBg} ${actualTheme === 'dark' ? 'bg-gradient-to-br from-card to-card/80' : 'bg-gradient-to-br from-card to-card/95'} lg:col-span-2`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
          <BarChart3 className="h-5 w-5 text-purple-400" />
          Security Metrics Overview
          {chartData?.kpiData?.length > 0 && (
            <Badge
              variant="outline"
              className={`ml-2 text-xs ${badgeBg}`}
            >
              {chartData.kpiData.length} metrics
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData?.kpiData?.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.kpiData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridColor}
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: tickColor, fontSize: 12 }}
                  domain={[0, "dataMax"]}
                  tickFormatter={(value) => {
                    // Handle small decimal values (likely percentages)
                    if (value < 1 && value > 0) {
                      return `${(value * 100).toFixed(0)}%`;
                    }
                    // Handle large numbers
                    if (value >= 1000000)
                      return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                    return value.toString();
                  }}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      formatter={(value: number) => {
                        // Handle small decimal values (likely percentages)
                        if (value < 1 && value > 0) {
                          return `${(value * 100).toFixed(1)}%`;
                        }
                        return value.toLocaleString();
                      }}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1200}
                  animationBegin={200}
                >
                  {chartData.kpiData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill || `hsl(${240 + index * 30}, 70%, 60%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-400/20'} rounded-full blur-xl`}></div>
              <BarChart3 className="relative h-20 w-20 text-purple-400" />
            </div>
            <h3 className={`${textPrimary} text-xl font-semibold mb-2`}>
              Security Metrics Loading
            </h3>
            <p className={`${textSecondary} text-sm mb-4 max-w-md leading-relaxed`}>
              We're processing your security data to generate comprehensive
              metrics. This includes threat analysis, incident categorization,
              and risk assessment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`${textSecondary} hover:text-foreground ${actualTheme === 'dark' ? 'hover:bg-muted/50' : 'hover:bg-muted/30'}`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure Data Source
              </Button>
            </div>

            {/* Loading animation */}
            <div className="mt-6 flex space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};