// Enhanced Trends Tab Component
// src/components/dashboards/MDM/tabs/TrendsTab.tsx

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, BarChart3, CheckCircle, Activity } from "lucide-react";
import { ChartDataPoint, MDMKPIs, MDMDetails } from "../types";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';
import { WipeDataModal } from "../components/WipeDataModal";

interface TrendsTabProps {
  weeklyWipeData: ChartDataPoint[];
  monthlyWipeData: ChartDataPoint[];
  kpis: MDMKPIs;
  rawMdmData: {
    details: MDMDetails;
  };
}

export const TrendsTab: React.FC<TrendsTabProps> = ({
  weeklyWipeData,
  monthlyWipeData,
  kpis,
  rawMdmData,
}) => {
  const { actualTheme } = useTheme();
  
  // State for filtering
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPeriod, setModalPeriod] = useState<string>("");
  const [modalPeriodType, setModalPeriodType] = useState<'week' | 'month'>('week');
  
  
  // Get unique weeks and months for filter options
  const availableWeeks = useMemo(() => {
    const weeks = weeklyWipeData.map(item => item.week).filter(Boolean);
    return [...new Set(weeks)].sort();
  }, [weeklyWipeData]);

  const availableMonths = useMemo(() => {
    const months = monthlyWipeData.map(item => item.month).filter(Boolean);
    return [...new Set(months)].sort();
  }, [monthlyWipeData]);

  // Transform and filter data based on selections
  const filteredWeeklyData = useMemo(() => {
    let data = weeklyWipeData;
    
    // Ensure data structure is correct
    data = data.map(item => ({
      week: item.week || 'Unknown',
      wipes: Number(item.wipes) || 0
    }));
    
    if (selectedWeek === "all") return data;
    return data.filter(item => item.week === selectedWeek);
  }, [weeklyWipeData, selectedWeek]);

  const filteredMonthlyData = useMemo(() => {
    let data = monthlyWipeData;
    
    // Ensure data structure is correct
    data = data.map(item => ({
      month: item.month || 'Unknown',
      wipes: Number(item.wipes) || 0
    }));
    
    if (selectedMonth === "all") return data;
    return data.filter(item => item.month === selectedMonth);
  }, [monthlyWipeData, selectedMonth]);
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  
  // Enhanced tooltip styling for better dark mode support
  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--card-foreground))",
    boxShadow: actualTheme === 'dark' 
      ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
      : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  };

  // Enhanced axis styling with proper color variables
  const axisStyle = {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: "12px",
    fontFamily: "inherit",
  };

  // Enhanced grid styling
  const gridStyle = {
    stroke: "hsl(var(--border))",
    strokeDasharray: "2 2",
    opacity: 0.5,
  };

  const totalWipeActions = (rawMdmData?.details?.wipeOuts?.length || 0) + kpis.wipePendingDevices;
  const successRate = totalWipeActions > 0 
    ? ((rawMdmData?.details?.wipeOuts?.length || 0) / totalWipeActions) * 100 
    : 0;

  // Custom tooltip content for better readability
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

  // Theme-aware gradient colors
  const getIconBg = (color: string) => {
    if (actualTheme === 'dark') {
      return `bg-${color}-900/30`;
    }
    return `bg-${color}-100`;
  };

  const getIconBorder = (color: string) => {
    if (actualTheme === 'dark') {
      return `border-${color}-800/50`;
    }
    return `border-${color}-200`;
  };

  // Handle bar click to open modal
  const handleWeeklyBarClick = (data: any, index?: number, event?: React.MouseEvent) => {
    console.log('Weekly bar clicked:', data, index, event); // Temporary debug
    if (data) {
      // Try different ways to get the data
      const weekData = data.activePayload?.[0]?.payload || data.payload || data;
      console.log('weekData extracted:', weekData);
      if (weekData && weekData.week) {
        setModalPeriod(weekData.week);
        setModalPeriodType('week');
        setModalOpen(true);
      }
    }
  };

  const handleMonthlyBarClick = (data: any, index?: number, event?: React.MouseEvent) => {
    console.log('Monthly bar clicked:', data, index, event); // Temporary debug
    if (data) {
      // Try different ways to get the data
      const monthData = data.activePayload?.[0]?.payload || data.payload || data;
      console.log('monthData extracted:', monthData);
      if (monthData && monthData.month) {
        setModalPeriod(monthData.month);
        setModalPeriodType('month');
        setModalOpen(true);
      }
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalPeriod("");
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card className={`${cardBg} shadow-sm`}>
        <CardHeader className="pb-4">
          <CardTitle className={`${textPrimary} text-lg font-semibold`}>
            Filter Wipe Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={`text-sm font-medium ${textSecondary}`}>Week Filter</label>
              <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select week..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Weeks</SelectItem>
                  {availableWeeks.map((week) => (
                    <SelectItem key={week} value={week}>
                      {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className={`text-sm font-medium ${textSecondary}`}>Month Filter</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select month..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {availableMonths.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${textSecondary}`}>Actions</label>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedWeek("all");
                  setSelectedMonth("all");
                }}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Enhanced Wipe Trends with better contrast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Wipe Analysis Chart */}
        <Card className={`${cardBg} shadow-sm hover:shadow-md transition-shadow duration-200`}>
          <CardHeader className="pb-4">
            <CardTitle className={`flex items-center gap-2 ${textPrimary} text-lg font-semibold`}>
              <div className={`p-2 ${getIconBg('blue')} rounded-lg ${getIconBorder('blue')} border`}>
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Weekly Wipe Analysis
              {selectedWeek !== "all" && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Filtered: {selectedWeek})
                </span>
              )}
              <span className="text-xs font-normal text-muted-foreground ml-2">
                Click bars for details
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {filteredWeeklyData.length > 0 ? (
                  <BarChart
                    data={filteredWeeklyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    onClick={handleWeeklyBarClick}
                    onMouseDown={handleWeeklyBarClick}
                  >
                    <CartesianGrid {...gridStyle} />
                    <XAxis 
                      dataKey="week"
                      {...axisStyle}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      {...axisStyle}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="wipes"
                      fill="hsl(220 70% 50%)"
                      radius={[4, 4, 0, 0]}
                      name="Wipes"
                      cursor="pointer"
                    />
                  </BarChart>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className={`text-sm ${textSecondary}`}>No weekly wipe data available</p>
                      <p className={`text-xs ${textSecondary} mt-1`}>
                        Upload MDM data with "Wipe Outs" sheet containing Week column
                      </p>
                    </div>
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Wipe Analysis Chart */}
        <Card className={`${cardBg} shadow-sm hover:shadow-md transition-shadow duration-200`}>
          <CardHeader className="pb-4">
            <CardTitle className={`flex items-center gap-2 ${textPrimary} text-lg font-semibold`}>
              <div className={`p-2 ${getIconBg('amber')} rounded-lg ${getIconBorder('amber')} border`}>
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              Monthly Wipe Analysis
              {selectedMonth !== "all" && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Filtered: {selectedMonth})
                </span>
              )}
              <span className="text-xs font-normal text-muted-foreground ml-2">
                Click bars for details
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {filteredMonthlyData.length > 0 ? (
                  <BarChart 
                    data={filteredMonthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    onClick={handleMonthlyBarClick}
                    onMouseDown={handleMonthlyBarClick}
                  >
                    <CartesianGrid {...gridStyle} />
                    <XAxis 
                      dataKey="month" 
                      {...axisStyle}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      {...axisStyle}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="wipes"
                      fill="hsl(45 93% 47%)"
                      radius={[4, 4, 0, 0]}
                      name="Wipes"
                      cursor="pointer"
                    />
                  </BarChart>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className={`text-sm ${textSecondary}`}>No monthly wipe data available</p>
                      <p className={`text-xs ${textSecondary} mt-1`}>
                        Upload MDM data with "Wipe Outs" sheet containing Month column
                      </p>
                    </div>
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Trend Summary Cards with better visual hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`${cardBg} shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${actualTheme === 'dark' ? 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-800/50' : 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-200'} rounded-xl flex items-center justify-center border shadow-sm`}>
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${textSecondary} mb-1`}>Total Wipe Actions</p>
                <p className={`text-2xl font-bold ${textPrimary} tracking-tight`}>
                  {totalWipeActions.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${cardBg} shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${actualTheme === 'dark' ? 'bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-800/50' : 'bg-gradient-to-br from-green-100 to-green-200 border-green-200'} rounded-xl flex items-center justify-center border shadow-sm`}>
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${textSecondary} mb-1`}>Success Rate</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 tracking-tight">
                  {successRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${cardBg} shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${actualTheme === 'dark' ? 'bg-gradient-to-br from-amber-900/30 to-amber-800/30 border-amber-800/50' : 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-200'} rounded-xl flex items-center justify-center border shadow-sm`}>
                <Activity className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${textSecondary} mb-1`}>Pending Actions</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
                  {kpis.wipePendingDevices.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Trend Insights with better readability */}
      <Card className={`${cardBg} shadow-sm`}>
        <CardHeader className="pb-4">
          <CardTitle className={`flex items-center gap-2 ${textPrimary} text-lg font-semibold`}>
            <div className={`p-2 ${getIconBg('purple')} rounded-lg ${getIconBorder('purple')} border`}>
              <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            Trend Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className={`font-semibold ${textPrimary} text-base border-b border-border pb-2`}>
                Key Observations
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className={`text-sm ${textSecondary} leading-relaxed`}>
                    Overall compliance rate is <span className={`font-medium ${textPrimary}`}>{kpis.complianceRate.toFixed(1)}%</span>
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className={`text-sm ${textSecondary} leading-relaxed`}>
                    <span className={`font-medium ${textPrimary}`}>{kpis.enrolledDevices.toLocaleString()}</span> out of <span className={`font-medium ${textPrimary}`}>{kpis.totalDevices.toLocaleString()}</span> devices are enrolled
                  </span>
                </div>
                {kpis.securityIssues > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className={`text-sm ${textSecondary} leading-relaxed`}>
                      <span className="font-medium text-red-600 dark:text-red-400">{kpis.securityIssues}</span> security issues require immediate attention
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className={`font-semibold ${textPrimary} text-base border-b border-border pb-2`}>
                Recommendations
              </h4>
              <div className="space-y-3">
                {kpis.enrollmentRate < 90 && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className={`text-sm ${textSecondary} leading-relaxed`}>
                      Increase enrollment rate to improve management coverage
                    </span>
                  </div>
                )}
                {kpis.devicesWithoutPassword > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className={`text-sm ${textSecondary} leading-relaxed`}>
                      Enforce password policies on <span className={`font-medium ${textPrimary}`}>{kpis.devicesWithoutPassword}</span> devices
                    </span>
                  </div>
                )}
                {kpis.unencryptedDevices > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span className={`text-sm ${textSecondary} leading-relaxed`}>
                      Enable encryption on <span className={`font-medium ${textPrimary}`}>{kpis.unencryptedDevices}</span> devices
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className={`text-sm ${textSecondary} leading-relaxed`}>
                    Current security score: <span className="font-medium text-green-600 dark:text-green-400">{kpis.securityScore}/100</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wipe Data Modal */}
      <WipeDataModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        period={modalPeriod}
        periodType={modalPeriodType}
        wipeData={rawMdmData?.details?.wipeOuts || []}
        rawMdmData={rawMdmData}
      />
    </div>
  );
};