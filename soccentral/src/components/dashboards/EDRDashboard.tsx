// EDRDashboard.tsx - EDR Dashboard Component (mode switching handled by wrapper)
import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EDRData, ModalData } from "./EDR/types";
import { useModalData } from "./EDR/hooks/useModalData";
import { useToolData } from "@/contexts/ToolDataContext";
import { DateRange } from "./shared/MinimalDateFilter";
import { filterEndpointsByDateRange, filterThreatsByDateRange } from "./EDR/utils";


// Component imports
import { DashboardHeader } from "./EDR/components/DashboardHeader";
import { KeyMetricsGrid } from "./EDR/components/KeyMetricsGrid";
import { SecondaryMetrics } from "./EDR/components/SecondaryMetrics";
import { DataSummaryFooter } from "./EDR/components/DataSummaryFooter";
import { DetailModal } from "./EDR/components/DetailModal";

// Tab imports
import { OverviewTab } from "./EDR/tabs/OverviewTab";
import { EndpointsTab } from "./EDR/tabs/EndpointsTab";
import { IncidentsTab } from "./EDR/tabs/IncidentsTab";
import { AnalyticsTab } from "./EDR/tabs/AnalyticsTab";

interface EDRDashboardProps {
  data: EDRData;
}

export const EDRDashboard: React.FC<EDRDashboardProps> = ({ data }) => {
  const { loadFilteredData, isLoadingData, clearToolData, setEDRData } = useToolData();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedModal, setSelectedModal] = useState<ModalData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });

  // DEBUG: Log the data being received
  console.log("🔍 EDR Dashboard received data:", {
    hasData: !!data,
    kpis: data?.kpis,
    endpointsCount: data?.details?.endpoints?.length || 0,
    threatsCount: data?.details?.threats?.length || 0,
    totalEndpoints: data?.kpis?.totalEndpoints,
    sampleEndpoint: data?.details?.endpoints?.[0],
    sampleEndpointDates: data?.details?.endpoints?.slice(0, 3)?.map(ep => ({
      endpoint: ep?.endpoint || ep?.last_logged_user || 'Unknown',
      scan_status: ep?.scan_status
    }))
  });

  // DEBUG: Check if this is filtered data or original data
  console.log("🔍 EDR Data Analysis:", {
    isLikelyFilteredData: data?.kpis?.totalEndpoints !== data?.details?.endpoints?.length,
    kpiEndpoints: data?.kpis?.totalEndpoints,
    actualEndpoints: data?.details?.endpoints?.length,
    endpointDates: data?.details?.endpoints?.map(ep => ep?.name || 'No date field').filter(Boolean).slice(0, 5)
  });

  // FIXED: Use backend filtering instead of double filtering
  const filteredData = useMemo(() => {
    console.log("🔄 EDR Dashboard filtering logic:", {
      hasLocalDateRange: !!(dateRange.startDate || dateRange.endDate),
      dateRange,
      originalKpis: data?.kpis,
      originalEndpointsCount: data?.details?.endpoints?.length,
      backendTotalEndpoints: data?.kpis?.totalEndpoints
    });

    // IMPORTANT: Always use backend data directly - it's already filtered correctly
    // The backend filtering handles date ranges properly, no need for double filtering
    console.log("✅ Using data directly");
    console.log("📊 KPIs being used:", data?.kpis);
    return data;

    // REMOVED: Client-side filtering - causes double filtering and date parsing issues
    // The backend already handles date filtering correctly


  }, [data, dateRange]);

  // Get modal data functions from custom hook
  const {
    getEndpointsModalData,
    getConnectedEndpointsData,
    getDisconnectedEndpointsData,
    getAllThreatsData,
    getMaliciousThreatsData,
    getSuspiciousThreatsData,
    getUpToDateEndpointsData,
  } = useModalData(filteredData);

  const openModal = (modalData: ModalData) => {
    setSelectedModal(modalData);
  };

  const closeModal = () => {
    setSelectedModal(null);
  };

  // FIXED: Update local state immediately, trigger backend only when both dates selected
  const handleDateRangeChange = async (range: DateRange) => {
    console.log("🔄 EDR Dashboard date range changed:", range);
    
    // Always update local state immediately for UI responsiveness
    setDateRange(range);
    
    // Only trigger backend filtering when both dates are selected
    if (range.startDate && range.endDate) {
      console.log("🔄 Triggering backend filtering for EDR with date range:", range);
      try {
        await loadFilteredData({
          timeRange: 'custom',
          dateRange: {
            from: range.startDate.toISOString().split('T')[0],
            to: range.endDate.toISOString().split('T')[0]
          },
          dataSource: 'edr'
        });
        console.log("✅ Backend filtering completed for EDR");
      } catch (error) {
        console.error("❌ Backend filtering failed for EDR:", error);
        // On error, keep the local state but show error
      }
    }
  };

  const handleDateReset = async () => {
    console.log("🔄 Resetting EDR date filter");

    // Reset to original data by calling loadFilteredData without date filters
    try {
      await loadFilteredData({
        dataSource: 'edr'
      });
      console.log("✅ EDR data reset to original");
      setDateRange({ startDate: null, endDate: null });
    } catch (error) {
      console.error("❌ Failed to reset EDR data:", error);
    }
  };

  return (
    <div className="w-full min-h-screen space-y-6 p-6">

      {/* Header with integrated date filter */}
      <DashboardHeader
        securityScore={filteredData.kpis.securityScore}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onDateReset={handleDateReset}
        filteredCount={filteredData.details.endpoints.length}
        totalCount={filteredData.details.endpoints.length} // Backend handles the total count
      />

      {/* Key Metrics Grid */}
      <KeyMetricsGrid
        data={filteredData}
        openModal={openModal}
        getEndpointsModalData={getEndpointsModalData}
        getConnectedEndpointsData={getConnectedEndpointsData}
        getDisconnectedEndpointsData={getDisconnectedEndpointsData}
        getAllThreatsData={getAllThreatsData}
        getMaliciousThreatsData={getMaliciousThreatsData}
        getSuspiciousThreatsData={getSuspiciousThreatsData}
        getUpToDateEndpointsData={getUpToDateEndpointsData}
      />

      {/* Secondary Metrics */}
      <SecondaryMetrics data={filteredData} />

      {/* Detailed Analytics Tabs */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <div className="border-b border-border bg-muted/50 rounded-t-lg">
            <TabsList className="grid w-full grid-cols-4 bg-transparent border-none h-14 p-1">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground transition-all duration-200 font-medium"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="endpoints"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground transition-all duration-200 font-medium"
              >
                Endpoints
              </TabsTrigger>
              <TabsTrigger
                value="threats"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground transition-all duration-200 font-medium"
              >
                Incidents
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:text-foreground transition-all duration-200 font-medium"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="overview" className="mt-0">
              <OverviewTab data={filteredData} />
            </TabsContent>

            <TabsContent value="endpoints" className="mt-0">
              <EndpointsTab data={filteredData} />
            </TabsContent>

            <TabsContent value="threats" className="mt-0">
              <IncidentsTab
                data={filteredData}
                openModal={openModal}
                getAllThreatsData={getAllThreatsData}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsTab data={filteredData} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Data Summary Footer */}
      <DataSummaryFooter data={filteredData} />

      {/* Detail Modal */}
      {selectedModal && (
        <DetailModal modalData={selectedModal} onClose={closeModal} />
      )}
    </div>
  );
};