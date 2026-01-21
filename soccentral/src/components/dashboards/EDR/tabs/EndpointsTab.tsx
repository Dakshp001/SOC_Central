// src/components/dashboards/EDR/tabs/EndpointsTab.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { EDRData } from '../types';
import { formatNumber, formatPercentage, getStatusColor, CHART_COLORS } from '../utils';
import { CustomTooltip } from '../components/CustomTooltip';
import { useTheme } from "@/pages/Main_dashboard/ThemeProvider";

interface EndpointsTabProps {
  data: EDRData;
}

export const EndpointsTab: React.FC<EndpointsTabProps> = ({ data }) => {
  const { actualTheme } = useTheme();
  const [updateStatusPage, setUpdateStatusPage] = useState(0);
  const updateStatusItemsPerPage = 10;

  const isDark = actualTheme === 'dark';

  // FIXED: Add null safety checks for analytics data
  const osDistribution = data?.analytics?.osDistribution || {};
  const updateStatusDistribution = data?.analytics?.updateStatusDistribution || {};
  const endpoints = data?.details?.endpoints || [];

  // Early return if no data is available
  if (!data || !data.analytics || !data.details) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-medium text-muted-foreground mb-2">No Data Available</div>
          <div className="text-sm text-muted-foreground">
            Please upload EDR data to view endpoint analytics.
          </div>
        </div>
      </div>
    );
  }

  // Theme-aware styles
  const cardClasses = isDark 
    ? "bg-card border-border" 
    : "bg-card border-border shadow-sm";
    
  const textPrimary = isDark ? "text-foreground" : "text-foreground";
  const textSecondary = isDark ? "text-muted-foreground" : "text-muted-foreground";
  const textMuted = "text-muted-foreground";

  const buttonClasses = isDark
    ? "bg-secondary text-secondary-foreground hover:bg-accent"
    : "bg-secondary text-secondary-foreground hover:bg-accent";

  const itemBgClasses = isDark
    ? "bg-muted/30 hover:bg-muted/50"
    : "bg-muted/50 hover:bg-muted/70";

  const gridStroke = isDark ? "hsl(var(--border))" : "hsl(var(--border))";
  const axisStroke = isDark ? "hsl(var(--muted-foreground))" : "hsl(var(--muted-foreground))";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OS Distribution */}
        <Card className={cardClasses}>
          <CardHeader>
            <CardTitle className={`${textPrimary} flex items-center justify-between`}>
              Operating Systems Distribution
              <Badge variant="outline" className="border-border text-muted-foreground">
                {Object.keys(osDistribution).length} OS types
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(osDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([os, count], index) => ({
                      name: os.length > 15 ? os.substring(0, 15) + "..." : os,
                      fullName: os,
                      count,
                      percentage: ((count / (data?.kpis?.totalEndpoints || 1)) * 100).toFixed(1),
                      fill: CHART_COLORS[index % CHART_COLORS.length],
                    }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis
                    dataKey="name"
                    stroke={axisStroke}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis stroke={axisStroke} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed List Below Chart */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(osDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([os, count], index) => (
                  <div
                    key={os}
                    className={`flex items-center justify-between py-2 px-3 ${itemBgClasses} rounded-lg transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded"
                        style={{
                          backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      ></div>
                      <span className={textSecondary}>{os}</span>
                    </div>
                    <div className="text-right">
                      <span className={`${textPrimary} font-medium`}>
                        {formatNumber(count)}
                      </span>
                      <span className={`${textMuted} text-sm ml-2`}>
                        ({formatPercentage((count / (data?.kpis?.totalEndpoints || 1)) * 100)})
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Update Status */}
        <Card className={cardClasses}>
          <CardHeader>
            <CardTitle className={`${textPrimary} flex items-center justify-between`}>
              Update Status
              <Badge variant="outline" className="border-border text-muted-foreground">
                {Object.keys(updateStatusDistribution).length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(updateStatusDistribution)
                .slice(
                  updateStatusPage * updateStatusItemsPerPage,
                  (updateStatusPage + 1) * updateStatusItemsPerPage
                )
                .map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          status.toLowerCase().includes("up to date")
                            ? "bg-[hsl(var(--low))]"
                            : "bg-[hsl(var(--critical))]"
                        }`}
                      ></div>
                      <span className={textSecondary}>{status}</span>
                    </div>
                    <div className="text-right">
                      <span className={`${textPrimary} font-medium`}>
                        {formatNumber(count)}
                      </span>
                      <span className={`${textMuted} text-sm ml-2`}>
                        ({formatPercentage((count / (data?.kpis?.totalEndpoints || 1)) * 100)})
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {Object.keys(updateStatusDistribution).length >
              updateStatusItemsPerPage && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className={`text-sm ${textMuted}`}>
                  Showing {updateStatusPage * updateStatusItemsPerPage + 1} -{" "}
                  {Math.min(
                    (updateStatusPage + 1) * updateStatusItemsPerPage,
                    Object.keys(updateStatusDistribution).length
                  )}{" "}
                  of {Object.keys(updateStatusDistribution).length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setUpdateStatusPage((prev) => Math.max(0, prev - 1))
                    }
                    disabled={updateStatusPage === 0}
                    className={`px-2 py-1 text-xs ${buttonClasses} rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    Previous
                  </button>
                  <span className={`text-sm ${textMuted}`}>
                    Page {updateStatusPage + 1} of{" "}
                    {Math.ceil(
                      Object.keys(updateStatusDistribution).length /
                        updateStatusItemsPerPage
                    )}
                  </span>
                  <button
                    onClick={() =>
                      setUpdateStatusPage((prev) =>
                        prev <
                        Math.ceil(
                          Object.keys(updateStatusDistribution).length /
                            updateStatusItemsPerPage
                        ) -
                          1
                          ? prev + 1
                          : prev
                      )
                    }
                    disabled={
                      updateStatusPage >=
                      Math.ceil(
                        Object.keys(updateStatusDistribution).length /
                          updateStatusItemsPerPage
                      ) -
                        1
                    }
                    className={`px-2 py-1 text-xs ${buttonClasses} rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Details Table */}
      <Card className={cardClasses}>
        <CardHeader>
          <CardTitle className={textPrimary}>Recent Endpoint Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={`text-left py-2 ${textMuted}`}>Endpoint</th>
                  <th className={`text-left py-2 ${textMuted}`}>OS</th>
                  <th className={`text-left py-2 ${textMuted}`}>Network Status</th>
                  <th className={`text-left py-2 ${textMuted}`}>Update Status</th>
                  <th className={`text-left py-2 ${textMuted}`}>Last User</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.slice(0, 10).map((endpoint, index) => (
                  <tr key={index} className="border-b border-border/50">
                    <td className={`py-2 ${textSecondary}`}>
                      {endpoint?.name || endpoint?.endpoint || endpoint?.['Endpoint Name'] || 'Unknown'}
                    </td>
                    <td className={`py-2 ${textSecondary}`}>{endpoint?.os || 'Unknown'}</td>
                    <td className="py-2">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(endpoint?.network_status || 'unknown')} border-current`}
                      >
                        {endpoint?.network_status || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(endpoint?.scan_status || 'unknown')} border-current`}
                      >
                        {endpoint?.scan_status || 'Unknown'}
                      </Badge>
                    </td>
                    <td className={`py-2 ${textSecondary}`}>{endpoint?.last_logged_user || 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};