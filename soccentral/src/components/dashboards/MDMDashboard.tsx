// Enhanced MDM Dashboard Component - Refactored
// src/components/dashboards/MDMDashboard.tsx

import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import types and utilities
import { MDMDashboardProps, DeviceDetail, EnhancedSecurityViolation, MDMDetails } from "./MDM/types";
import { filterMDMDataByDateRange } from "./MDM/utils";
import { MinimalDateFilter, DateRange } from "./shared/MinimalDateFilter";

// Import hooks
import { useMDMData } from "./MDM/hooks/useMDMData";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

// Import components
import { DashboardHeader } from "./MDM/components/DashboardHeader";
import { KPIGrid } from "./MDM/components/KPIGrid";
import { SecurityViolations } from "./MDM/components/SecurityViolations";
import { DeviceDetailsModal } from "./MDM/components/DeviceDetailsModal";
import { EmptyStates } from "./MDM/components/EmptyStates";
import { QuickActions } from "./MDM/components/QuickActions";
import { DataSourceInfo } from "./MDM/components/DataSourceInfo";

// Import tabs
import { OverviewTab } from "./MDM/tabs/OverviewTab";
import { SecurityTab } from "./MDM/tabs/SecurityTab";
import { AnalyticsTab } from "./MDM/tabs/AnalyticsTab";
import { TrendsTab } from "./MDM/tabs/TrendsTab";

export const MDMDashboard: React.FC<MDMDashboardProps> = ({
  data,
  className = "",
}) => {
  const { actualTheme } = useTheme();
  const [selectedViolation, setSelectedViolation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });



  // Theme-aware classes using CSS variables
  const tabsListBg = "bg-card border-border";
  const tabTriggerActive = actualTheme === 'dark' 
    ? "data-[state=active]:bg-muted/50" 
    : "data-[state=active]:bg-muted/80";
  const tabTriggerHover = actualTheme === 'dark'
    ? "hover:bg-muted/30"
    : "hover:bg-muted/50";

  // Get all data from the custom hook (using original data for structure)
  const {
    rawMdmData,
    dataStatus,
    kpis: originalKpis,
    details: originalDetails,
    securityViolations: originalSecurityViolations,
    platformChartData: originalPlatformChartData,
    osChartData: originalOsChartData,
    enrollmentChartData: originalEnrollmentChartData,
    managementTypesData: originalManagementTypesData,
    weeklyWipeData: originalWeeklyWipeData,
    monthlyWipeData: originalMonthlyWipeData,
    securityBreakdownData: originalSecurityBreakdownData,
  } = useMDMData();

  // Calculate original data count for comparison
  const originalDataCount = useMemo(() => {
    return originalDetails.allUsers.length;
  }, [originalDetails]);

  // Apply date filtering to rawMdmData if available
  const filteredData = useMemo(() => {
    if (!rawMdmData) return null;
    return filterMDMDataByDateRange(rawMdmData, dateRange.startDate, dateRange.endDate);
  }, [rawMdmData, dateRange]);

  // Calculate filtered data count
  const filteredDataCount = useMemo(() => {
    return filteredData?.details.allUsers.length || originalDataCount;
  }, [filteredData, originalDataCount]);

  // Use filtered data if available, otherwise fall back to original
  const kpis = filteredData?.kpis || originalKpis;
  const details = filteredData?.details || originalDetails;
  
  // For chart data, use the data from the hook which now properly reads from Week column
  const securityViolations = originalSecurityViolations;
  const platformChartData = originalPlatformChartData;
  const osChartData = originalOsChartData;
  const enrollmentChartData = originalEnrollmentChartData;
  const managementTypesData = originalManagementTypesData;
  const weeklyWipeData = originalWeeklyWipeData;
  const monthlyWipeData = originalMonthlyWipeData;
  const securityBreakdownData = originalSecurityBreakdownData;

  // Handle date range changes
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  // Reset date filter
  const handleResetDateFilter = () => {
    setDateRange({ startDate: null, endDate: null });
  };

  // Handle empty states
  if (dataStatus === "no-data" || !rawMdmData || !rawMdmData.kpis) {
    return (
      <div className={`space-y-6 ${className}`}>
        <EmptyStates 
          dataStatus={dataStatus} 
          rawMdmData={rawMdmData} 
          kpis={kpis}
        />
      </div>
    );
  }

  const handleViolationClick = (violationType: string) => {
    setSelectedViolation(violationType);
  };

  const handleCloseModal = () => {
    setSelectedViolation(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Date Filter */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <DashboardHeader kpis={kpis} />
        </div>
        <div className="ml-4">
          <MinimalDateFilter
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onReset={handleResetDateFilter}
            filteredCount={filteredDataCount}
            totalCount={originalDataCount}
            itemType="devices"
          />
        </div>
      </div>

      {/* Comprehensive KPI Grid */}
      <KPIGrid kpis={kpis} details={details} />

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full grid-cols-4 ${tabsListBg} shadow-sm`}>
          <TabsTrigger
            value="overview"
            className={`${tabTriggerActive} ${tabTriggerHover} transition-all duration-200 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground data-[state=active]:shadow-sm`}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className={`${tabTriggerActive} ${tabTriggerHover} transition-all duration-200 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground data-[state=active]:shadow-sm`}
          >
            Security
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className={`${tabTriggerActive} ${tabTriggerHover} transition-all duration-200 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground data-[state=active]:shadow-sm`}
          >
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="trends"
            className={`${tabTriggerActive} ${tabTriggerHover} transition-all duration-200 data-[state=active]:text-foreground text-muted-foreground hover:text-foreground data-[state=active]:shadow-sm`}
          >
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <OverviewTab
            platformChartData={platformChartData}
            enrollmentChartData={enrollmentChartData}
            managementTypesData={managementTypesData}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <SecurityTab
            violations={securityViolations}
            securityBreakdownData={securityBreakdownData}
            kpis={kpis}
            onViolationClick={handleViolationClick}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-6">
          <AnalyticsTab
            osChartData={osChartData}
            kpis={kpis}
            rawMdmData={rawMdmData}
          />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 mt-6">
          <TrendsTab
            weeklyWipeData={weeklyWipeData}
            monthlyWipeData={monthlyWipeData}
            kpis={kpis}
            rawMdmData={rawMdmData}
          />
        </TabsContent>
      </Tabs>

      {/* Device Details Modal */}
      <DeviceDetailsModal
        selectedViolation={selectedViolation}
        violations={securityViolations}
        details={rawMdmData.details}
        onClose={handleCloseModal}
      />

      {/* Quick Action Buttons */}
      <QuickActions
        violations={securityViolations}
        onViolationClick={handleViolationClick}
      />

      {/* Data Source Information */}
      <DataSourceInfo data={rawMdmData} />
    </div>
  );
};