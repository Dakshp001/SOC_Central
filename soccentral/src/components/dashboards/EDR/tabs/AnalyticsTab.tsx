// src/components/dashboards/EDR/tabs/AnalyticsTab.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, CheckCircle2 } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar
} from "recharts";
import { EDRData } from '../types';
import { formatNumber, formatPercentage, ACTION_COLORS, POLICY_COLORS, COLORS } from '../utils';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface AnalyticsTabProps {
  data: EDRData;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ data }) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  // Calculate additional metrics
  const threatDetectionRate = data.kpis.totalThreats > 0
    ? ((data.kpis.maliciousThreats + data.kpis.suspiciousThreats) / data.kpis.totalThreats) * 100
    : 0;

  const endpointHealth = data.kpis.totalEndpoints > 0
    ? ((data.kpis.connectedEndpoints + data.kpis.upToDateEndpoints) / (data.kpis.totalEndpoints * 2)) * 100
    : 0;

  const pieData = data.analytics.actionDistribution
    ? Object.entries(data.analytics.actionDistribution)
        .sort(([, a], [, b]) => b - a)
        .map(([action, count], index) => ({
          name: action.charAt(0).toUpperCase() + action.slice(1),
          value: Number(count),
          fill: COLORS[index % COLORS.length],
        }))
    : [];

  // Theme-aware colors
  const cardBg = isDark ? 'bg-card border-border' : 'bg-card border-border';
  const textPrimary = isDark ? 'text-foreground' : 'text-foreground';
  const textSecondary = isDark ? 'text-muted-foreground' : 'text-muted-foreground';
  const badgeVariant = isDark ? 'outline' : 'outline';
  const gridStroke = isDark ? '#27272a' : '#e4e4e7';
  const axisStroke = isDark ? '#71717a' : '#52525b';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Response Actions */}
        {data.analytics.actionDistribution && Object.keys(data.analytics.actionDistribution).length > 0 && (
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={`${textPrimary} flex items-center justify-between`}>
                Response Actions
                <Badge variant={badgeVariant} className={`border-border ${textSecondary}`}>
                  {Object.keys(data.analytics.actionDistribution).length} actions
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={4}
                      cornerRadius={4}
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const { name, value } = payload[0];
                          return (
                            <div className={`${isDark ? 'bg-popover text-popover-foreground' : 'bg-popover text-popover-foreground'} border border-border p-2 rounded shadow`}>
                              <p className="font-semibold">{name}</p>
                              <p className="text-primary">Count: {value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      align="center"
                      verticalAlign="bottom"
                      iconType="circle"
                      formatter={(value) => <span className={textSecondary}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(data.analytics.actionDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([action, count], index) => (
                    <div
                      key={action}
                      className={`flex items-center justify-between py-2 px-3 ${isDark ? 'bg-muted/20 hover:bg-muted/40' : 'bg-muted/20 hover:bg-muted/40'} rounded-lg transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: ACTION_COLORS[index % ACTION_COLORS.length],
                          }}
                        ></div>
                        <span className={`${textSecondary} capitalize font-medium`}>{action}</span>
                      </div>
                      <span className={`${textPrimary} font-bold`}>{formatNumber(count)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Threats Trend */}
        {data.analytics.monthlyThreats && Object.keys(data.analytics.monthlyThreats).length > 0 && (
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={`${textPrimary} flex items-center justify-between`}>
                Monthly Threat Trends
                <Badge variant={badgeVariant} className={`border-border ${textSecondary}`}>
                  {Object.keys(data.analytics.monthlyThreats).length} months
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={Object.entries(data.analytics.monthlyThreats)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([month, count]) => ({
                        month: month.length > 10 ? month.substring(0, 10) + "..." : month,
                        fullMonth: month,
                        threats: count,
                      }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      dataKey="month"
                      stroke={axisStroke}
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke={axisStroke} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                              <p className={`${textPrimary} font-medium`}>
                                {payload[0].payload.fullMonth}
                              </p>
                              <p className="text-primary">
                                Threats: <span className="font-bold">{payload[0].value?.toLocaleString()}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="threats"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className={`text-center p-2 ${isDark ? 'bg-muted/30' : 'bg-muted/30'} rounded`}>
                  <p className={textSecondary}>Peak Month</p>
                  <p className="text-primary font-medium">
                    {Object.entries(data.analytics.monthlyThreats)
                      .sort(([, a], [, b]) => b - a)[0]?.[1]?.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className={`text-center p-2 ${isDark ? 'bg-muted/30' : 'bg-muted/30'} rounded`}>
                  <p className={textSecondary}>Average</p>
                  <p className="text-primary font-medium">
                    {Math.round(
                      Object.values(data.analytics.monthlyThreats).reduce((a, b) => a + b, 0) /
                        Object.keys(data.analytics.monthlyThreats).length
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Policy Distribution */}
        {data.analytics.policyDistribution && Object.keys(data.analytics.policyDistribution).length > 0 && (
          <Card className={`${cardBg} w-full`}>
            <CardHeader>
              <CardTitle className={`${textPrimary} flex items-center justify-between`}>
                Detection Policies
                <Badge variant={badgeVariant} className={`border-border ${textSecondary}`}>
                  {Object.keys(data.analytics.policyDistribution).length} policies
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center items-center w-full mb-4">
                <div className="h-72 w-full max-w-5xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={Object.entries(data.analytics.policyDistribution)
                        .map(([policy, count]) => ({
                          name: policy.charAt(0).toUpperCase() + policy.slice(1),
                          value: Number(count),
                          percentage: (
                            (count / Object.values(data.analytics.policyDistribution).reduce((a, b) => a + b, 0)) * 100
                          ).toFixed(1),
                          fill: POLICY_COLORS[policy.toLowerCase() as keyof typeof POLICY_COLORS] || "#8B5CF6",
                        }))
                        .sort((a, b) => b.value - a.value)}
                      margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                      barCategoryGap={20}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis
                        type="number"
                        stroke={axisStroke}
                        fontSize={12}
                        tickFormatter={(v) => v.toLocaleString()}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke={axisStroke}
                        width={30}
                        fontSize={12}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                <p className={`${textPrimary} font-medium`}>{d.name} Policy</p>
                                <p className="text-primary">
                                  Count: <span className="font-bold">{d.value.toLocaleString()}</span>
                                </p>
                                <p className={`${textSecondary} text-sm`}>{d.percentage}% of policies</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={true}>
                        {Object.entries(data.analytics.policyDistribution).map(([policy], index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={POLICY_COLORS[policy.toLowerCase() as keyof typeof POLICY_COLORS] || "#8B5CF6"}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-2 w-full max-w-5xl mx-auto">
                {Object.entries(data.analytics.policyDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([policy, count]) => (
                    <div key={policy} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: POLICY_COLORS[policy.toLowerCase() as keyof typeof POLICY_COLORS] || "#8B5CF6",
                          }}
                        ></div>
                        <span className={`${textSecondary} capitalize text-sm`}>{policy}</span>
                      </div>
                      <span className={`${textPrimary} font-medium text-sm`}>{formatNumber(count)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Threat Distribution */}
        {data.analytics.dailyThreats && Object.keys(data.analytics.dailyThreats).length > 0 && (
          <Card className={cardBg}>
            <CardHeader>
              <CardTitle className={`${textPrimary} flex items-center justify-between`}>
                Threats by Day of Week
                <Badge variant={badgeVariant} className={`border-border ${textSecondary}`}>
                  Weekly pattern
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                      (day) => ({
                        day: day.substring(0, 3),
                        fullDay: day,
                        threats: data.analytics.dailyThreats[day] || 0,
                      })
                    )}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis dataKey="day" stroke={axisStroke} />
                    <YAxis stroke={axisStroke} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                              <p className={`${textPrimary} font-medium`}>{payload[0].payload.fullDay}</p>
                              <p className="text-secondary">
                                Threats: <span className="font-bold">{payload[0].value?.toLocaleString()}</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="threats"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className={`text-center p-2 ${isDark ? 'bg-muted/30' : 'bg-muted/30'} rounded`}>
                  <p className={textSecondary}>Busiest Day</p>
                  <p className="text-secondary font-medium">
                    {Object.entries(data.analytics.dailyThreats).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"}
                  </p>
                </div>
                <div className={`text-center p-2 ${isDark ? 'bg-muted/30' : 'bg-muted/30'} rounded`}>
                  <p className={textSecondary}>Peak Count</p>
                  <p className="text-secondary font-medium">
                    {Object.entries(data.analytics.dailyThreats)
                      .sort(([, a], [, b]) => b - a)[0]?.[1]?.toLocaleString() || "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Enhanced Analytics Summary */}
      <Card className={cardBg}>
        <CardHeader>
          <CardTitle className={textPrimary}>Analytics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`text-center p-6 ${isDark ? 'bg-gradient-to-br from-destructive/20 to-destructive/10' : 'bg-gradient-to-br from-destructive/20 to-destructive/10'} border border-destructive/30 rounded-lg`}>
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-destructive/20 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <p className={`text-sm ${textSecondary} mb-2`}>Threat Detection Rate</p>
              <p className="text-3xl font-bold text-destructive mb-1">
                {formatPercentage(threatDetectionRate)}
              </p>
              <p className={`text-xs ${textSecondary}`}>Malicious + Suspicious threats</p>
              <div className={`mt-3 w-full ${isDark ? 'bg-muted' : 'bg-muted'} rounded-full h-2`}>
                <div
                  className="bg-destructive h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, threatDetectionRate)}%` }}
                ></div>
              </div>
            </div>

            <div className={`text-center p-6 ${isDark ? 'bg-gradient-to-br from-primary/20 to-primary/10' : 'bg-gradient-to-br from-primary/20 to-primary/10'} border border-primary/30 rounded-lg`}>
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className={`text-sm ${textSecondary} mb-2`}>Endpoint Health</p>
              <p className="text-3xl font-bold text-primary mb-1">
                {formatPercentage(endpointHealth)}
              </p>
              <p className={`text-xs ${textSecondary}`}>Connected + Updated endpoints</p>
              <div className={`mt-3 w-full ${isDark ? 'bg-muted' : 'bg-muted'} rounded-full h-2`}>
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, endpointHealth)}%` }}
                ></div>
              </div>
            </div>

            <div className={`text-center p-6 ${isDark ? 'bg-gradient-to-br from-green-500/20 to-green-500/10' : 'bg-gradient-to-br from-green-500/20 to-green-500/10'} border border-green-500/30 rounded-lg`}>
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-green-500/20 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className={`text-sm ${textSecondary} mb-2`}>False Positive Rate</p>
              <p className="text-3xl font-bold text-green-500 mb-1">
                {data.kpis.totalThreats > 0
                  ? formatPercentage((data.kpis.falsePositives / data.kpis.totalThreats) * 100)
                  : "0%"}
              </p>
              <p className={`text-xs ${textSecondary}`}>
                {formatNumber(data.kpis.falsePositives)} false positives
              </p>
              <div className={`mt-3 w-full ${isDark ? 'bg-muted' : 'bg-muted'} rounded-full h-2`}>
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      data.kpis.totalThreats > 0
                        ? Math.min(100, (data.kpis.falsePositives / data.kpis.totalThreats) * 100)
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};