// Enhanced Meraki Dashboard - Refactored Version
// Save as: src/components/dashboards/MerakiDashboard.tsx

import React, { useState, useMemo } from "react";
import {
  Wifi,
  Router,
  Shield,
  Activity,
  Users,
  TrendingUp,
  Network,
  Globe,
  PieChart,
  Settings,
} from "lucide-react";
import { EnhancedMerakiData } from "@/lib/api";
import { useTheme } from "@/pages/Main_dashboard/ThemeProvider";
import { DateRange, filterMerakiDataByDateRange } from "./Meraki/utils";


// Import refactored components
import { MerakiHeader } from "./Meraki/components/MerakiHeader";
import { NetworkHealthAlert } from "./Meraki/components/NetworkHealthAlert";
import { KPICard } from "./Meraki/components/KPICard";
import { NetworkOverviewChart } from "./Meraki/charts/NetworkOverviewChart";
import { BandwidthTrendsChart } from "./Meraki/charts/BandwidthTrendsChart";
import { TrafficDistributionChart } from "./Meraki/charts/TrafficDistributionChart";
import { ClientLoadDistributionChart } from "./Meraki/charts/ClientLoadDistributionChart";
import { AvailableDataSections } from "./Meraki/components/AvailableDataSections";
import { NetworkInsights } from "./Meraki/components/NetworkInsights";
import { MerakiErrorComponent } from "./Meraki/components/MerakiErrorComponent";

// Import hooks and utilities
import { useMerakiData } from "./Meraki/hooks/useMerakiData";
import { KPICardData, MerakiDashboardProps } from "./Meraki/types";

export const MerakiDashboard: React.FC<MerakiDashboardProps> = ({ data }) => {
  const { actualTheme } = useTheme();
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";

  // Filter data based on date range
  const filteredData = useMemo(() => {
    return filterMerakiDataByDateRange(data, dateRange.startDate, dateRange.endDate);
  }, [data, dateRange]);

  const {
    CHART_COLORS,
    selectedDetailView,
    setSelectedDetailView,
    filterSeverity,
    setFilterSeverity,
    analyticsData,
    chartData,
  } = useMerakiData(filteredData);

  // Calculate filtered record counts for the date filter with detailed logging
  const getTotalSessionRecords = () => {
    const sessionsData = data.details["Number of sessions over time"] || [];
    const usageData = data.details["Usage over time"] || [];
    const clientsData = data.details["Clients per day"] || [];
    const total = sessionsData.length + usageData.length + clientsData.length;
    console.log('Total records:', { sessions: sessionsData.length, usage: usageData.length, clients: clientsData.length, total });
    return total;
  };

  const getFilteredSessionRecords = () => {
    const sessionsData = filteredData.details["Number of sessions over time"] || [];
    const usageData = filteredData.details["Usage over time"] || [];
    const clientsData = filteredData.details["Clients per day"] || [];
    const total = sessionsData.length + usageData.length + clientsData.length;
    console.log('Filtered records:', { sessions: sessionsData.length, usage: usageData.length, clients: clientsData.length, total });
    
    // Debug: Show sample data from each sheet
    if (sessionsData.length > 0) {
      console.log('Sample session data:', sessionsData[0]);
    }
    if (usageData.length > 0) {
      console.log('Sample usage data:', usageData[0]);  
    }
    if (clientsData.length > 0) {
      console.log('Sample client data:', clientsData[0]);
    }
    
    return total;
  };

  // Date range handlers
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const handleDateReset = () => {
    setDateRange({ startDate: null, endDate: null });
  };

  // Safety check for data structure
  if (!data || !data.kpis || !data.details) {
    return (
      <MerakiErrorComponent
        data={data}
        actualTheme={actualTheme}
        cardBg={cardBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />
    );
  }

  // KPI Cards configuration using filtered data
  const kpiCards: KPICardData[] = [
    {
      id: "networkHealth",
      title: "Network Health Score",
      value: data.kpis.networkHealthScore || 0,
      icon: Shield,
      color:
        (data.kpis.networkHealthScore || 0) >= 80
          ? "text-green-400"
          : (data.kpis.networkHealthScore || 0) >= 60
          ? "text-yellow-400"
          : "text-red-400",
      bgColor:
        (data.kpis.networkHealthScore || 0) >= 80
          ? actualTheme === 'dark' ? "bg-green-900/20 border-green-800/50" : "bg-green-50/80 border-green-200/50"
          : (data.kpis.networkHealthScore || 0) >= 60
          ? actualTheme === 'dark' ? "bg-yellow-900/20 border-yellow-800/50" : "bg-yellow-50/80 border-yellow-200/50"
          : actualTheme === 'dark' ? "bg-red-900/20 border-red-800/50" : "bg-red-50/80 border-red-200/50",
      description: "Overall network health and performance score",
      detailKey: "Top devices",
      detailTitle: "Network Device Health Analysis",
      chartColor: CHART_COLORS.secondary,
      unit: "/100",
    },
    {
      id: "totalDevices",
      title: "Network Devices",
      value: data.kpis.totalDevices || 0,
      icon: Router,
      color: "text-blue-400",
      bgColor: actualTheme === 'dark' ? "bg-blue-900/20 border-blue-800/50" : "bg-blue-50/80 border-blue-200/50",
      description: "Total network devices actively monitored",
      detailKey: "Top devices",
      detailTitle: "Network Device Details",
      chartColor: CHART_COLORS.primary,
      unit: "",
    },
    {
      id: "totalClients",
      title: "Connected Clients",
      value: data.kpis.totalClients || 0,
      icon: Users,
      color: "text-cyan-400",
      bgColor: actualTheme === 'dark' ? "bg-cyan-900/20 border-cyan-800/50" : "bg-cyan-50/80 border-cyan-200/50",
      description: "Total clients connected across all networks",
      detailKey: "Top clients by usage",
      detailTitle: "Client Connection Details",
      chartColor: CHART_COLORS.network,
      unit: "",
    },
    {
      id: "totalSSIDs",
      title: "Active SSIDs",
      value: data.kpis.totalSSIDs || 0,
      icon: Wifi,
      color: "text-purple-400",
      bgColor: actualTheme === 'dark' ? "bg-purple-900/20 border-purple-800/50" : "bg-purple-50/80 border-purple-200/50",
      description: "Wireless networks (SSIDs) broadcasting",
      detailKey: "Top SSIDs by usage",
      detailTitle: "SSID Configuration Details",
      chartColor: CHART_COLORS.purple,
      unit: "",
    },
    {
      id: "avgBandwidth",
      title: "Avg Bandwidth",
      value: Math.round((filteredData.kpis.avgTotalBandwidthBps || 0) / 1000000),
      icon: Activity,
      color: "text-green-400",
      bgColor: actualTheme === 'dark' ? "bg-green-900/20 border-green-800/50" : "bg-green-50/80 border-green-200/50",
      description: "Average total bandwidth utilization",
      detailKey: "Usage over time",
      detailTitle: "Bandwidth Usage Trends",
      chartColor: CHART_COLORS.secondary,
      unit: " Mbps",
    },
    {
      id: "peakClients",
      title: "Peak Clients/Day",
      value: filteredData.kpis.peakClientsPerDay || 0,
      icon: TrendingUp,
      color: "text-orange-400",
      bgColor: actualTheme === 'dark' ? "bg-orange-900/20 border-orange-800/50" : "bg-orange-50/80 border-orange-200/50",
      description: "Maximum clients connected in a single day",
      detailKey: "Clients per day",
      detailTitle: "Daily Client Trends",
      chartColor: CHART_COLORS.warning,
      unit: "",
    },
    {
      id: "deviceModels",
      title: "Device Models",
      value: data.kpis.totalDeviceModels || 0,
      icon: Settings,
      color: "text-indigo-400",
      bgColor: actualTheme === 'dark' ? "bg-indigo-900/20 border-indigo-800/50" : "bg-indigo-50/80 border-indigo-200/50",
      description: "Different device models in network",
      detailKey: "Top devices models by usage",
      detailTitle: "Device Model Analysis",
      chartColor: CHART_COLORS.info,
      unit: "",
    },
    {
      id: "manufacturers",
      title: "Manufacturers",
      value: data.kpis.totalManufacturers || 0,
      icon: Globe,
      color: "text-pink-400",
      bgColor: actualTheme === 'dark' ? "bg-pink-900/20 border-pink-800/50" : "bg-pink-50/80 border-pink-200/50",
      description: "Device manufacturers represented",
      detailKey: "Top manufactures by usage",
      detailTitle: "Manufacturer Distribution",
      chartColor: CHART_COLORS.pink,
      unit: "",
    },
    {
      id: "operatingSystems",
      title: "Operating Systems",
      value: data.kpis.totalOperatingSystems || 0,
      icon: PieChart,
      color: "text-yellow-400",
      bgColor: actualTheme === 'dark' ? "bg-yellow-900/20 border-yellow-800/50" : "bg-yellow-50/80 border-yellow-200/50",
      description: "Different OS types on network",
      detailKey: "Top operating systems by usage",
      detailTitle: "Operating System Analysis",
      chartColor: CHART_COLORS.accent,
      unit: "",
    },
  ].filter((card) => card.value !== undefined && card.value !== null);

  return (
    <div className="space-y-6">
      {/* Header with integrated date filter */}
      <MerakiHeader
        data={filteredData}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onDateReset={handleDateReset}
        filteredCount={getFilteredSessionRecords()}
        totalCount={getTotalSessionRecords()}
      />

      {/* Network Health Alert */}
      <NetworkHealthAlert data={filteredData} actualTheme={actualTheme} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card) => (
          <KPICard
            key={card.id}
            card={card}
            data={filteredData}
            cardBg={cardBg}
            textPrimary={textPrimary}
            textSecondary={textSecondary}
            setSelectedDetailView={setSelectedDetailView}
          />
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Overview - Pie Chart */}
        <NetworkOverviewChart
          chartData={chartData}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          actualTheme={actualTheme}
        />

        {/* Bandwidth Trends - Line Chart */}
        <BandwidthTrendsChart
          chartData={chartData}
          cardBg={cardBg}
          textPrimary={textPrimary}
          CHART_COLORS={CHART_COLORS}
          actualTheme={actualTheme}
        />

        {/* Traffic Distribution - Bar Chart */}
        <TrafficDistributionChart
          chartData={chartData}
          cardBg={cardBg}
          textPrimary={textPrimary}
          actualTheme={actualTheme}
        />

        {/* Client Load Distribution - Donut Chart */}
        <ClientLoadDistributionChart
          chartData={chartData}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          actualTheme={actualTheme}
        />
      </div>

      {/* Available Data Sections - Quick Access */}
      <AvailableDataSections
        data={filteredData}
        cardBg={cardBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        actualTheme={actualTheme}
      />

      {/* Network Insights and Recommendations */}
      {filteredData.insights && (
        <NetworkInsights
          data={filteredData}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          actualTheme={actualTheme}
          analyticsData={analyticsData}
        />
      )}
    </div>
  );
};