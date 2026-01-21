// Enhanced GSuite Dashboard with Advanced Data Visualizations
// Save as: src/components/dashboards/GSuiteDashboard.tsx

import React, { useState, useMemo, useEffect } from "react";

// Import types and utilities
import { GSuiteDashboardProps } from "./GSuite/types";
import { calculateAnalyticsData, prepareChartData, filterGSuiteDataByDateRange } from "./GSuite/utils";
import { MinimalDateFilter, DateRange } from "./shared/MinimalDateFilter";
import { useToolData } from "../../contexts/ToolDataContext";
import { EnhancedGSuiteData } from "../../lib/api";

// Import components
import { DashboardHeader } from "./GSuite/components/DashboardHeader";
import { SummaryAlert } from "./GSuite/components/SummaryAlert";
import { KPIGrid } from "./GSuite/components/KPIGrid";
import { DataSummary } from "./GSuite/components/DataSummary";

// Import chart components
import { SecurityTrends } from "./GSuite/tabs/SecurityTrends";
import { SeverityAnalysis } from "./GSuite/tabs/SeverityAnalysis";
import { MonthlyTrends } from "./GSuite/tabs/MonthlyTrends";
import { MetricsOverview } from "./GSuite/tabs/MetricsOverview";

export const GSuiteDashboard: React.FC<GSuiteDashboardProps> = ({
  data: propData,
}) => {
  // DEBUG: Log that we're using the FULL GSuite Dashboard
  console.log("🎉 FULL GSuite Dashboard Loading!");
  console.log("📊 Components from src/components/dashboards/GSuite/ are active");
  console.log("🔍 PropData:", propData);
  
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });
  const [forceUpdate, setForceUpdate] = useState(0);

  const { loadFilteredData, loadActiveData, toolData, isLoadingData } =
    useToolData();

  // Use propData as base data - context data is for backend filtered results only
  const baseData = propData;

  // Apply CLIENT-SIDE date filtering if date range is set
  const data = useMemo(() => {
    // Start with the original uploaded data
    let filteredData = baseData;
    
    // Apply client-side date filtering if dates are selected
    if (dateRange.startDate && dateRange.endDate) {
      console.log("🎯 Applying CLIENT-SIDE date filtering:", {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        originalKpis: baseData.kpis
      });
      
      filteredData = filterGSuiteDataByDateRange(baseData, dateRange.startDate, dateRange.endDate);
      
      console.log("✅ Client-side filtering complete:", {
        originalPhishing: baseData.kpis.phishingAttempted,
        filteredPhishing: filteredData.kpis.phishingAttempted,
        originalEmails: baseData.kpis.emailsScanned,  
        filteredEmails: filteredData.kpis.emailsScanned
      });
    }

    // Ensure all required fields are present and normalized
    const normalizedKpis = {
      emailsScanned: filteredData.kpis.emailsScanned || 0,
      phishingAttempted: filteredData.kpis.phishingAttempted || 0,
      suspiciousEmails: filteredData.kpis.suspiciousEmails || 0,
      whitelistRequests: filteredData.kpis.whitelistRequests || 0,
      clientInvestigations: filteredData.kpis.clientInvestigations || 0,
    };

    // Ensure details structure exists
    const normalizedDetails = {
      totalEmailsScanned: filteredData.details?.totalEmailsScanned || [],
      phishingAttempted: filteredData.details?.phishingAttempted || [],
      suspiciousEmails: filteredData.details?.suspiciousEmails || [],
      whitelistedDomains: filteredData.details?.whitelistedDomains || [],
      clientInvestigations: filteredData.details?.clientInvestigations || [],
    };

    return {
      ...filteredData,
      kpis: normalizedKpis,
      details: normalizedDetails,
      analytics: filteredData.analytics || {},
      rawSheetNames: filteredData.rawSheetNames || [],
      processedAt: filteredData.processedAt || new Date().toISOString(),
    } as EnhancedGSuiteData;
  }, [baseData, dateRange]);

  // Debug: Force log the data selection
  console.log("🔍 Data selection debug:", {
    hasContextData: !!toolData.gsuite.data,
    contextKPIs: toolData.gsuite.data?.kpis,
    propKPIs: propData.kpis,
    selectedKPIs: data.kpis,
    forceUpdate,
  });

  // Debug log to track data source and KPI values
  useEffect(() => {
    const dataSource = toolData.gsuite.data
      ? "filtered context data"
      : "original prop data";
    console.log(`🔍 GSuite Dashboard using: ${dataSource}`);
    console.log(`📊 Current data KPIs:`, data.kpis);
    console.log(`📊 Context data KPIs:`, toolData.gsuite.data?.kpis);
    console.log(`📊 Prop data KPIs:`, propData.kpis);
    console.log(`📊 Phishing Attempted: ${data.kpis.phishingAttempted}`);
    console.log(`📊 Emails Scanned: ${data.kpis.emailsScanned}`);
    console.log(`📊 Loading state: ${isLoadingData}`);
  }, [data, toolData.gsuite.data, propData, isLoadingData]);

  // Separate effect to watch for toolData changes
  useEffect(() => {
    console.log("🔄 ToolData changed:", {
      hasGSuiteData: !!toolData.gsuite.data,
      kpis: toolData.gsuite.data?.kpis,
      isLoading: isLoadingData,
    });
  }, [toolData, isLoadingData]);

  // Calculate original data count for comparison (use propData for original count)
  const originalDataCount = useMemo(() => {
    if (!propData?.details) return 0;
    return (
      (propData.details.totalEmailsScanned?.length || 0) +
      (propData.details.phishingAttempted?.length || 0) +
      (propData.details.suspiciousEmails?.length || 0) +
      (propData.details.whitelistedDomains?.length || 0) +
      (propData.details.clientInvestigations?.length || 0)
    );
  }, [propData.details]);

  // Calculate current data count (filtered or original)
  const currentDataCount = useMemo(() => {
    if (!data?.details) return 0;
    return (
      (data.details.totalEmailsScanned?.length || 0) +
      (data.details.phishingAttempted?.length || 0) +
      (data.details.suspiciousEmails?.length || 0) +
      (data.details.whitelistedDomains?.length || 0) +
      (data.details.clientInvestigations?.length || 0)
    );
  }, [data.details]);

  // Memoized calculations for performance
  const analyticsData = useMemo(
    () => calculateAnalyticsData(data?.kpis || {}),
    [data?.kpis]
  );

  // Prepare data for charts
  const chartData = useMemo(
    () => prepareChartData(data || {}, analyticsData),
    [data, analyticsData]
  );

  // Handle date range changes - INSTANT CLIENT-SIDE filtering
  const handleDateRangeChange = (range: DateRange) => {
    console.log("🗓️ Date range changed (CLIENT-SIDE):", range);
    setDateRange(range);
    
    // Client-side filtering happens automatically in the useMemo above
    // No need for async operations or loading states
    
    if (range.startDate && range.endDate) {
      console.log("📅 Client-side date filter will be applied instantly");
    } else {
      console.log("🔄 No date filter - showing all data");
    }
  };

  // Reset date filter - INSTANT
  const handleResetDateFilter = () => {
    console.log("🔄 Resetting date filter (CLIENT-SIDE)");
    setDateRange({ startDate: null, endDate: null });
  };

  const handleCardClick = (detailKey: string) => {
    console.log('Card clicked:', detailKey);
    // TODO: Implement detail view functionality
  };

  // No loading state needed for client-side filtering - always show data instantly

  // Ensure we have valid data before rendering
  if (!data || !data.kpis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-gray-600">No GSuite data available</p>
            <p className="text-sm text-gray-500">
              Please upload GSuite data to view the dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Date Filter */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <DashboardHeader data={data} />
        </div>
        <div className="ml-4">
          <MinimalDateFilter
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onReset={handleResetDateFilter}
            filteredCount={currentDataCount}
            totalCount={originalDataCount}
            itemType="email records"
          />
        </div>
      </div>

      {/* Summary Alert */}
      <SummaryAlert data={data} analyticsData={analyticsData} />

      {/* Enhanced KPI Cards with Mini Charts */}
      <KPIGrid
        data={data}
        filterSeverity={filterSeverity}
        setFilterSeverity={setFilterSeverity}
        onCardClick={handleCardClick}
      />

      {/* Advanced Analytics Section with Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Security Distribution - Line Chart */}
        <SecurityTrends chartData={chartData} />

        {/* Severity Analysis - Radial Bar Chart */}
        <SeverityAnalysis chartData={chartData} />

        {/* Monthly Trends - Advanced Area Chart */}
        <MonthlyTrends chartData={chartData} />

        {/* KPI Performance Overview - Horizontal Bar Chart */}
        <MetricsOverview chartData={chartData} />
      </div>

      {/* Enhanced Data Summary with Visual Indicators */}
      <DataSummary data={data} analyticsData={analyticsData} />
    </div>
  );
};
