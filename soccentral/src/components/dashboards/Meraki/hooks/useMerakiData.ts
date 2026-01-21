import { useState, useMemo } from "react";
import { EnhancedMerakiData } from "@/lib/api";
import { useTheme } from "@/pages/Main_dashboard/ThemeProvider";
import { getChartColors, prepareChartData } from "../utils";

export const useMerakiData = (data: EnhancedMerakiData) => {
  const { actualTheme } = useTheme();
  const CHART_COLORS = getChartColors(actualTheme);
  
  const [selectedDetailView, setSelectedDetailView] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");

  // Memoized analytics calculations
  const analyticsData = useMemo(() => {
    const networkEfficiency = data.kpis?.networkEfficiencyMBPerClient || 0;
    const securityScore = data.kpis?.networkHealthScore || 0;
    const totalTraffic = data.kpis?.totalClientTrafficKB || 0;

    return { networkEfficiency, securityScore, totalTraffic };
  }, [data.kpis]);

  // Prepare chart data
  const chartData = useMemo(() => 
    prepareChartData(data, CHART_COLORS), 
    [data, CHART_COLORS]
  );

  return {
    actualTheme,
    CHART_COLORS,
    selectedDetailView,
    setSelectedDetailView,
    filterSeverity,
    setFilterSeverity,
    analyticsData,
    chartData,
  };
};
