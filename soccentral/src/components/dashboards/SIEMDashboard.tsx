// Enhanced SIEM Dashboard Component - Improved Version
// Save as: src/components/Dashboards/SIEMDashboard.tsx

import React, { useState, useMemo, useCallback } from "react";
import { Clock, Activity, AlertCircle, Shield, TrendingUp } from "lucide-react";
import { SIEMData } from "@/lib/api";
import { isRealDataAvailable, hasRealDateData } from "@/lib/api";
import { useTheme } from "@/pages/Main_dashboard/ThemeProvider";
import { useToolData } from "@/contexts/ToolDataContext";
import { MinimalDateFilter, DateRange } from "./shared/MinimalDateFilter";

// Import sub-components
import { DashboardHeader } from "@/components/dashboards/SEIM/components/DashboardHeader";
import { EnhancedFeaturesAlert } from "@/components/dashboards/SEIM/components/EnhancedFeaturesAlert";
import { DataOverview } from "@/components/dashboards/SEIM/components/DataOverview";
import { SeverityKPICards } from "@/components/dashboards/SEIM/components/SeverityKPICards";
import { AdditionalKPIs } from "@/components/dashboards/SEIM/components/AdditionalKPIs";
import { SeverityDistributionChart } from "@/components/dashboards/SEIM/chart/SeverityDistributionChart";
import { ActivityTimelineChart } from "@/components/dashboards/SEIM/chart/ActivityTimelineChart";
import { MonthlyTrendsChart } from "@/components/dashboards/SEIM/chart/MonthlyTrendsChart";
import { TopUsersChart } from "@/components/dashboards/SEIM/chart/TopUsersChart";
import { PeakActivityChart } from "@/components/dashboards/SEIM/chart/PeakActivityChart";
import { DailyDistributionChart } from "@/components/dashboards/SEIM/chart/DailyDistributionChart";
import { TopAlertsTable } from "@/components/dashboards/SEIM/components/TopAlertsTable";
import { AlertModal } from "@/components/dashboards/SEIM/components/AlertModal";
import { ThemedTooltip } from "@/components/dashboards/SEIM/components/ThemedTooltip";
import { DashboardFooter } from "@/components/dashboards/SEIM/components/DashboardFooter";

// Import utilities and types
import {
  getSeverityKPIs,
  generateSeverityChartData,
  generateMonthlyTrendData,
  generateTopUserData,
  generateTimelineData,
  generateMockAlerts,
  getThemeStyles,
  getTooltipStyle,
  getGridStyle,
  filterSIEMDataByDateRange,
} from "@/components/dashboards/SEIM/utils";
import { SeverityFilter, TimeFilter, AlertDetail } from "@/components/dashboards/SEIM/types";

interface SIEMDashboardProps {
  data: SIEMData;
  className?: string;
}

export const SIEMDashboard: React.FC<SIEMDashboardProps> = ({
  data: propData,
  className = "",
}) => {
  const { actualTheme } = useTheme();
  const { loadFilteredData, loadActiveData, toolData } = useToolData();
  
  // Use propData as base data - apply CLIENT-SIDE filtering
  const baseData = propData;

  // State management - moved dateRange before useMemo to fix initialization order
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  // Apply CLIENT-SIDE date filtering if date range is set
  const data = useMemo(() => {
    // Start with the original uploaded data
    let filteredData = baseData;
    
    // Apply client-side date filtering if dates are selected
    if (dateRange.startDate && dateRange.endDate) {
      console.log("🎯 Applying CLIENT-SIDE SIEM date filtering:", {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        originalKpis: baseData.kpis
      });
      
      filteredData = filterSIEMDataByDateRange(baseData, dateRange.startDate, dateRange.endDate);
      
      console.log("✅ SIEM client-side filtering complete:", {
        originalHigh: baseData.kpis.highSeverityEvents,
        filteredHigh: filteredData.kpis.highSeverityEvents,
        originalTotal: baseData.kpis.totalEvents,  
        filteredTotal: filteredData.kpis.totalEvents
      });
    }

    return filteredData;
  }, [baseData, dateRange]);

  // Get theme-aware styles
  const themeStyles = useMemo(() => getThemeStyles(actualTheme), [actualTheme]);
  const { cardBg, textPrimary, textSecondary, inputBg, modalBg } = themeStyles;

  // State management
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>({
    critical: true,
    high: true,
    medium: true,
    low: true,
    info: true,
  });

  const [timeFilter, setTimeFilter] = useState<TimeFilter>({
    range: "month",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<number | null>(null);
  const [alertDetails, setAlertDetails] = useState<AlertDetail[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Calculate original data count for comparison (from base data)
  const originalDataCount = useMemo(() => {
    if (!baseData.details) return 0;
    return Object.values(baseData.details).reduce((total, value) => {
      if (Array.isArray(value)) {
        return total + value.length;
      }
      return total;
    }, 0);
  }, [baseData.details]);

  // Calculate filtered data count (from filtered data)
  const filteredDataCount = useMemo(() => {
    if (!data.details) return 0;
    return Object.values(data.details).reduce((total, value) => {
      if (Array.isArray(value)) {
        return total + value.length;
      }
      return total;
    }, 0);
  }, [data.details]);

  // Memoized data processing for better performance
  const processedData = useMemo(() => {
    const severityKPIs = getSeverityKPIs(data);
    const severityChartData = generateSeverityChartData(data);
    const monthlyTrendData = generateMonthlyTrendData(data);
    const topUserData = generateTopUserData(data);
    const timelineData = generateTimelineData();

    return {
      severityKPIs,
      severityChartData,
      monthlyTrendData,
      topUserData,
      timelineData,
    };
  }, [data]);

  // Handle date range changes - INSTANT CLIENT-SIDE filtering
  const handleDateRangeChange = (range: DateRange) => {
    console.log("🗓️ SIEM Date range changed (CLIENT-SIDE):", range);
    
    // DEBUG: Check what data we actually have
    if (baseData && baseData.details) {
      console.log("🔍 DEBUG - Base data structure:", {
        totalKpis: baseData.kpis,
        sheetsAvailable: Object.keys(baseData.details),
        sampleData: Object.keys(baseData.details).map(sheetName => ({
          sheetName,
          itemCount: Array.isArray(baseData.details[sheetName]) ? baseData.details[sheetName].length : 'not array',
          sampleItem: Array.isArray(baseData.details[sheetName]) && baseData.details[sheetName].length > 0 
            ? baseData.details[sheetName][0] 
            : 'no items'
        }))
      });
    }
    
    setDateRange(range);
    
    // Client-side filtering happens automatically in the useMemo above
    // No need for async operations or loading states
    
    if (range.startDate && range.endDate) {
      console.log("📅 SIEM Client-side date filter will be applied instantly");
    } else {
      console.log("🔄 No SIEM date filter - showing all data");
    }
  };

  // Reset date filter - INSTANT
  const handleResetDateFilter = () => {
    console.log("🔄 Resetting SIEM date filter (CLIENT-SIDE)");
    setDateRange({ startDate: null, endDate: null });
  };

  // Check if enhanced features are available
  const hasEnhancedFeatures = useMemo(() => 
    !!(
      data.analytics?.totalAlertsCount !== undefined &&
      data.analytics?.topAlertsBySeverity &&
      data.analytics?.topUsersBySeverity
    ), [data.analytics]
  );

  // Handle severity click to show detailed alerts
  const handleSeverityClick = useCallback((severity: number) => {
    console.log('🖱️ Severity card clicked:', severity);
    setSelectedSeverity(severity);
    
    // Use REAL data instead of mock alerts
    const realAlerts = generateMockAlerts(
      severity,
      processedData.severityKPIs,
      data.analytics.userActivity,
      data  // Pass the actual data object
    );
    
    console.log('📋 Setting alert details:', realAlerts);
    setAlertDetails(realAlerts);
    setShowAlertModal(true);
  }, [processedData.severityKPIs, data.analytics.userActivity, data]);

  // Filter alerts based on search term
  const filteredAlerts = useMemo(() => 
    alertDetails.filter(
      (alert) =>
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [alertDetails, searchTerm]
  );

  // Create themed tooltip component
  const ThemedTooltipComponent = useCallback((props: any) => (
    <ThemedTooltip
      {...props}
      textPrimary={textPrimary}
      textSecondary={textSecondary}
      getTooltipStyle={getTooltipStyle}
      actualTheme={actualTheme}
    />
  ), [textPrimary, textSecondary, actualTheme]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setShowAlertModal(false);
    setSelectedSeverity(null);
    setAlertDetails([]);
    setSearchTerm("");
  }, []);

  return (
    <div className={`space-y-8 ${className} relative`}>
      {/* Header Section with Date Filter */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <DashboardHeader
            data={data}
            hasEnhancedFeatures={hasEnhancedFeatures}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
          />
        </div>
        <div className="ml-4">
          <MinimalDateFilter
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onReset={handleResetDateFilter}
            filteredCount={filteredDataCount}
            totalCount={originalDataCount}
            itemType="security events"
          />
        </div>
      </div>

      {/* Enhanced Features Alert */}
      {hasEnhancedFeatures && (
        <EnhancedFeaturesAlert data={data} actualTheme={actualTheme} />
      )}

      {/* Data Overview Card */}
      <DataOverview
        data={data}
        cardBg={cardBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />

      {/* Severity KPIs - Clickable Cards */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-red-500" />
          <h2 className={`text-2xl font-bold ${textPrimary}`}>
            Security Alert Overview
          </h2>
        </div>
        <SeverityKPICards
          severityKPIs={processedData.severityKPIs}
          data={data}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          onSeverityClick={handleSeverityClick}
        />
      </div>

      {/* Additional KPIs */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-blue-500" />
          <h2 className={`text-2xl font-bold ${textPrimary}`}>
            Performance Metrics
          </h2>
        </div>
        <AdditionalKPIs
          data={data}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          actualTheme={actualTheme}
        />
      </div>

      {/* Charts Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-purple-500" />
          <h2 className={`text-2xl font-bold ${textPrimary}`}>
            Security Analytics
          </h2>
        </div>

        {/* Row 1: Severity Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SeverityDistributionChart
            data={processedData.severityChartData}
            cardBg={cardBg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            ThemedTooltip={ThemedTooltipComponent}
            actualTheme={actualTheme}
          />

          <ActivityTimelineChart
            data={processedData.timelineData}
            cardBg={cardBg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            ThemedTooltip={ThemedTooltipComponent}
            getGridStyle={getGridStyle}
            actualTheme={actualTheme}
          />
        </div>

        {/* Row 2: Trend Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MonthlyTrendsChart
            data={processedData.monthlyTrendData}
            cardBg={cardBg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            ThemedTooltip={ThemedTooltipComponent}
            getGridStyle={getGridStyle}
            actualTheme={actualTheme}
          />

          <TopUsersChart
            data={processedData.topUserData}
            cardBg={cardBg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            getGridStyle={getGridStyle}
            getTooltipStyle={getTooltipStyle}
            actualTheme={actualTheme}
          />
        </div>
      </div>

      {/* Real-Time Analytics Section */}
      {(data.analytics?.peakActivityHours || data.analytics?.dailyDistribution) && (
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-green-500" />
            <h2 className={`text-2xl font-bold ${textPrimary}`}>
              Time-Based Analytics
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Peak Activity Hours Chart */}
            {data.analytics?.peakActivityHours &&
              Object.keys(data.analytics.peakActivityHours).length > 0 && (
                <PeakActivityChart
                  data={data.analytics.peakActivityHours}
                  cardBg={cardBg}
                  textPrimary={textPrimary}
                  textSecondary={textSecondary}
                  getGridStyle={getGridStyle}
                  getTooltipStyle={getTooltipStyle}
                  actualTheme={actualTheme}
                />
              )}

            {/* Daily Distribution Chart */}
            {data.analytics?.dailyDistribution &&
              Object.keys(data.analytics.dailyDistribution).length > 0 && (
                <DailyDistributionChart
                  data={data.analytics.dailyDistribution}
                  cardBg={cardBg}
                  textPrimary={textPrimary}
                  textSecondary={textSecondary}
                  getGridStyle={getGridStyle}
                  getTooltipStyle={getTooltipStyle}
                  actualTheme={actualTheme}
                />
              )}
          </div>
        </div>
      )}

      {/* Top Alerts Table */}
      {data.analytics.topAlerts && data.analytics.topAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-orange-500" />
            <h2 className={`text-2xl font-bold ${textPrimary}`}>
              Most Frequent Alerts
            </h2>
          </div>
          <TopAlertsTable
            alerts={data.analytics.topAlerts}
            cardBg={cardBg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            actualTheme={actualTheme}
          />
        </div>
      )}

      {/* Enhanced Features Section */}
      {hasEnhancedFeatures && data.analytics?.topAlertsBySeverity && (
        <div className="space-y-8">
          <div className="border-t border-border pt-8">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="h-6 w-6 text-purple-500" />
              <h2 className={`text-2xl font-bold ${textPrimary}`}>
                Advanced Threat Intelligence
              </h2>
            </div>

            {/* Enhanced analytics components would be added here */}
            <div className={`p-6 ${cardBg} rounded-xl border border-border`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${textPrimary}`}>
                    Advanced Analytics Available
                  </h3>
                  <p className={`text-sm ${textSecondary}`}>
                    Enhanced features are active and processing security data
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} rounded-lg`}>
                  <div className={`text-2xl font-bold ${textPrimary}`}>
                    {data.analytics.totalAlertsCount?.toLocaleString()}
                  </div>
                  <div className={`text-sm ${textSecondary}`}>Total Alerts Analyzed</div>
                </div>
                
                <div className={`p-4 ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} rounded-lg`}>
                  <div className={`text-2xl font-bold ${textPrimary}`}>
                    {Object.keys(data.analytics.topAlertsBySeverity || {}).length}
                  </div>
                  <div className={`text-sm ${textSecondary}`}>Severity Categories</div>
                </div>
                
                <div className={`p-4 ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} rounded-lg`}>
                  <div className={`text-2xl font-bold ${textPrimary}`}>
                    {Object.keys(data.analytics.topUsersBySeverity || {}).length}
                  </div>
                  <div className={`text-sm ${textSecondary}`}>User Profiles Analyzed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Details Modal - Rendered via Portal */}
      <AlertModal
        isOpen={showAlertModal}
        onClose={handleCloseModal}
        selectedSeverity={selectedSeverity}
        alertDetails={alertDetails}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filteredAlerts={filteredAlerts}
        modalBg={modalBg}
        cardBg={cardBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        inputBg={inputBg}
        actualTheme={actualTheme}
      />

      {/* Footer Information */}
      <DashboardFooter
        data={data}
        hasEnhancedFeatures={hasEnhancedFeatures}
        cardBg={cardBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
    </div>
  );
};