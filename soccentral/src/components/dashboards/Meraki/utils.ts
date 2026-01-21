import { EnhancedMerakiData } from "@/lib/api";

export const getChartColors = (actualTheme: 'light' | 'dark') => ({
  primary: actualTheme === 'dark' ? "#3B82F6" : "#1D4ED8",
  secondary: actualTheme === 'dark' ? "#10B981" : "#059669",
  accent: actualTheme === 'dark' ? "#F59E0B" : "#D97706",
  danger: actualTheme === 'dark' ? "#EF4444" : "#DC2626",
  warning: actualTheme === 'dark' ? "#F97316" : "#EA580C",
  info: actualTheme === 'dark' ? "#06B6D4" : "#0891B2",
  purple: actualTheme === 'dark' ? "#8B5CF6" : "#7C3AED",
  pink: actualTheme === 'dark' ? "#EC4899" : "#DB2777",
  gradient: actualTheme === 'dark' 
    ? ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#F97316", "#8B5CF6", "#EC4899", "#06B6D4"]
    : ["#1D4ED8", "#059669", "#D97706", "#DC2626", "#EA580C", "#7C3AED", "#DB2777", "#0891B2"],
  network: actualTheme === 'dark' ? "#00D4AA" : "#10B981",
  wireless: actualTheme === 'dark' ? "#0EA5E9" : "#0284C7",
  security: actualTheme === 'dark' ? "#EF4444" : "#DC2626",
});

export const getTooltipStyle = (actualTheme: 'light' | 'dark') => ({
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  color: "hsl(var(--card-foreground))",
  boxShadow: actualTheme === 'dark' 
    ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
    : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
});

export const getAxisStyle = () => ({
  stroke: "hsl(var(--muted-foreground))",
  fontSize: "12px",
  fontFamily: "inherit",
});

export const getGridStyle = () => ({
  stroke: "hsl(var(--border))",
  strokeDasharray: "2 2",
  opacity: 0.5,
});

// Date parsing utilities for Meraki Time field format: 2025/04/01 00:00:00.000000 +00:00
export const parseMerakiTimeDate = (timeString: string): Date | null => {
  try {
    // Handle format: "2025/04/01 00:00:00.000000 +00:00"
    if (!timeString) return null;
    
    // First, try parsing directly (works for some formats)
    const directParsed = new Date(timeString);
    if (!isNaN(directParsed.getTime())) {
      return directParsed;
    }
    
    // If direct parsing fails, clean up the Meraki format
    let cleanedString = timeString.trim();
    
    // Convert Meraki format to ISO format
    // "2025/04/01 00:00:00.000000 +00:00" -> "2025-04-01T00:00:00.000Z"
    if (cleanedString.includes('/') && cleanedString.includes('+00:00')) {
      cleanedString = cleanedString
        .replace(/\//g, '-')  // Replace / with -
        .replace(' ', 'T')    // Replace space with T
        .replace(/\.(\d{6})/, '.000')  // Reduce microseconds to milliseconds
        .replace(' +00:00', 'Z');      // Replace timezone with Z
    }
    // Handle format without timezone
    else if (cleanedString.includes('/') && cleanedString.includes('.')) {
      cleanedString = cleanedString
        .replace(/\//g, '-')  // Replace / with -
        .replace(' ', 'T')    // Replace space with T
        .replace(/\.(\d{6})/, '.000')  // Reduce microseconds to milliseconds
        + 'Z';                // Add UTC timezone
    }
    // Handle simple date format
    else if (cleanedString.includes('/')) {
      cleanedString = cleanedString
        .replace(/\//g, '-')  // Replace / with -
        .replace(' ', 'T')    // Replace space with T (if there's a time part)
        + (cleanedString.includes(' ') ? 'Z' : 'T00:00:00.000Z'); // Add time if missing
    }
    
    const parsedDate = new Date(cleanedString);
    
    if (isNaN(parsedDate.getTime())) {
      console.warn('Failed to parse Meraki time after cleanup:', timeString, 'cleaned to:', cleanedString);
      return null;
    }
    
    return parsedDate;
  } catch (error) {
    console.warn('Failed to parse Meraki time:', timeString, error);
    return null;
  }
};

export const isDateInRange = (date: Date | null, startDate: Date | null, endDate: Date | null): boolean => {
  if (!date) return false;
  
  // If no filters are set, include all dates
  if (!startDate && !endDate) return true;
  
  // Convert to date-only for comparison (ignore time)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
  const endDateOnly = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;
  
  // Check start date constraint
  if (startDateOnly && dateOnly < startDateOnly) return false;
  
  // Check end date constraint
  if (endDateOnly && dateOnly > endDateOnly) return false;
  
  return true;
};

// Helper function to parse Date field format used in static sheets: DD-MM-YYYY
export const parseMerakiDateField = (dateString: string): Date | null => {
  try {
    if (!dateString) return null;
    
    // Handle DD-MM-YYYY format from backend synthetic dates
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
      const year = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Fallback to regular date parsing
    return new Date(dateString);
  } catch (error) {
    console.warn('Failed to parse Meraki date field:', dateString, error);
    return null;
  }
};

// Helper function to determine if a sheet item has a date and should be filtered
const getItemDate = (item: any): Date | null => {
  // First check for Time field (time-based sheets)
  if (item.Time) {
    return parseMerakiTimeDate(item.Time);
  }
  
  // Then check for Date field (static sheets with synthetic dates)
  if (item.Date) {
    return parseMerakiDateField(item.Date);
  }
  
  return null;
};

export const filterMerakiDataByDateRange = (
  data: EnhancedMerakiData,
  startDate: Date | null,
  endDate: Date | null
): EnhancedMerakiData => {
  if (!startDate && !endDate) return data;
  
  console.log('Filtering Meraki data from', startDate?.toISOString(), 'to', endDate?.toISOString());
  
  // Filter ONLY time-based sheets that have Time fields
  const filteredDetails = { ...data.details };
  
  // Define time-based sheets that should be filtered by date
  const timeBasedSheets = [
    "Number of sessions over time",
    "Usage over time", 
    "Clients per day"
  ];
  
  let totalOriginalRecords = 0;
  let totalFilteredRecords = 0;
  
  // Filter each time-based sheet if it exists
  timeBasedSheets.forEach(sheetName => {
    if (filteredDetails[sheetName] && Array.isArray(filteredDetails[sheetName])) {
      const originalCount = filteredDetails[sheetName].length;
      totalOriginalRecords += originalCount;
      
      filteredDetails[sheetName] = filteredDetails[sheetName].filter(item => {
        const itemDate = parseMerakiTimeDate(item.Time);
        
        // If no date found, exclude the item (strict filtering)
        if (!itemDate) {
          console.warn(`No valid Time field in ${sheetName} item:`, item);
          return false;
        }
        
        return isDateInRange(itemDate, startDate, endDate);
      });
      
      const filteredCount = filteredDetails[sheetName].length;
      totalFilteredRecords += filteredCount;
      
      console.log(`${sheetName}: ${originalCount} → ${filteredCount} records (${filteredCount > 0 ? 'FILTERED' : 'EMPTY'})`);
    }
  });
  
  console.log(`Total filtering result: ${totalOriginalRecords} → ${totalFilteredRecords} records`);
  
  // Debug: Show what date range we're filtering for
  if (startDate && endDate) {
    console.log(`Date range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    
    // Show sample dates from each sheet for debugging
    timeBasedSheets.forEach(sheetName => {
      if (data.details[sheetName] && data.details[sheetName].length > 0) {
        const sampleItem = data.details[sheetName][0];
        const parsedDate = parseMerakiTimeDate(sampleItem.Time);
        console.log(`${sheetName} sample date: "${sampleItem.Time}" → ${parsedDate ? parsedDate.toLocaleDateString() : 'FAILED TO PARSE'}`);
      }
    });
  }
  
  // Static sheets remain unchanged - they represent current network state
  // (Top devices, Top clients by usage, etc. are not filtered by date)
  
  // Recalculate KPIs based on filtered data
  const sessionsData = filteredDetails["Number of sessions over time"] || [];
  const usageData = filteredDetails["Usage over time"] || [];
  const clientsData = filteredDetails["Clients per day"] || [];
  
  // Calculate averages and totals from filtered data
  const avgSessionsPerTimeSlot = sessionsData.length > 0 
    ? sessionsData.reduce((sum, item) => sum + (item.Sessions || 0), 0) / sessionsData.length 
    : 0;
    
  const avgDownloadBps = usageData.length > 0
    ? usageData.reduce((sum, item) => sum + (item["Download (b/s)"] || 0), 0) / usageData.length
    : 0;
    
  const avgTotalBandwidthBps = usageData.length > 0
    ? usageData.reduce((sum, item) => sum + (item["Total (b/s)"] || 0), 0) / usageData.length
    : 0;
    
  const avgClientsPerDay = clientsData.length > 0
    ? clientsData.reduce((sum, item) => sum + (item.Clients || 0), 0) / clientsData.length
    : 0;
    
  const peakSessions = sessionsData.length > 0
    ? Math.max(...sessionsData.map(item => item.Sessions || 0))
    : 0;
    
  const peakBandwidthBps = usageData.length > 0
    ? Math.max(...usageData.map(item => item["Total (b/s)"] || 0))
    : 0;
    
  const peakClientsPerDay = clientsData.length > 0
    ? Math.max(...clientsData.map(item => item.Clients || 0))
    : 0;

  return {
    ...data,
    details: filteredDetails,
    kpis: {
      ...data.kpis,
      // Update time-based KPIs from filtered data
      avgSessionsPerTimeSlot,
      avgDownloadBps,
      avgTotalBandwidthBps,
      avgClientsPerDay,
      peakSessions,
      peakBandwidthBps,
      peakClientsPerDay,
      // Keep infrastructure KPIs unchanged as they represent current network state
      // totalDevices, totalSSIDs, totalClients, etc. remain from original data
    }
  };
};

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export const prepareChartData = (data: EnhancedMerakiData, CHART_COLORS: any) => {
  // Network Overview Data - with null safety
  const networkOverview = [
    {
      name: "Total Devices",
      value: data.kpis?.totalDevices || 0,
      fill: CHART_COLORS.primary,
      percentage: 100,
    },
    {
      name: "Total SSIDs",
      value: data.kpis?.totalSSIDs || 0,
      fill: CHART_COLORS.wireless,
      percentage:
        (data.kpis?.totalDevices || 0) > 0
          ? ((data.kpis?.totalSSIDs || 0) / (data.kpis?.totalDevices || 1)) * 100
          : 0,
    },
    {
      name: "Connected Clients",
      value: data.kpis?.totalClients || 0,
      fill: CHART_COLORS.network,
      percentage:
        (data.kpis?.totalDevices || 0) > 0
          ? ((data.kpis?.totalClients || 0) / (data.kpis?.totalDevices || 1)) * 100
          : 0,
    },
    {
      name: "Device Models",
      value: data.kpis?.totalDeviceModels || 0,
      fill: CHART_COLORS.accent,
      percentage:
        (data.kpis?.totalDevices || 0) > 0
          ? ((data.kpis?.totalDeviceModels || 0) / (data.kpis?.totalDevices || 1)) * 100
          : 0,
    },
  ].filter((item) => item.value > 0);

  // Traffic Distribution - with null safety
  const trafficDistribution = [
    {
      name: "Client Traffic",
      value: data.kpis?.totalClientTrafficKB || 0,
      fill: CHART_COLORS.primary,
    },
    {
      name: "Device Usage",
      value: data.kpis?.totalDeviceUsageKB || 0,
      fill: CHART_COLORS.secondary,
    },
    {
      name: "SSID Usage",
      value: data.kpis?.totalSSIDUsageKB || 0,
      fill: CHART_COLORS.warning,
    },
  ].filter((item) => item.value > 0);

  // Bandwidth Trends - FROM REAL DATA
  const usageOverTime = data.details?.["Usage over time"] || [];
  const bandwidthTrends = usageOverTime.map(item => ({
    time: item.Time ? new Date(parseMerakiTimeDate(item.Time)!).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }) : 'Unknown',
    download: item["Download (b/s)"] || 0,
    total: item["Total (b/s)"] || 0,
    upload: (item["Total (b/s)"] || 0) - (item["Download (b/s)"] || 0)
  })).filter(item => item.time !== 'Unknown')
    .sort((a, b) => a.time.localeCompare(b.time));

  // Client Distribution - FROM REAL DATA  
  const clientsPerDay = data.details?.["Clients per day"] || [];
  
  // Calculate actual client load distribution from real data
  const clientCounts = clientsPerDay.map(item => item.Clients || 0);
  const totalClientEntries = clientCounts.length;
  
  if (totalClientEntries > 0) {
    const highLoad = clientCounts.filter(count => count > 25).length;
    const optimalLoad = clientCounts.filter(count => count >= 10 && count <= 25).length; 
    const lowLoad = clientCounts.filter(count => count < 10).length;
    
    var clientDistribution = [
      {
        name: "High Load (>25 clients)",
        value: highLoad,
        fill: CHART_COLORS.danger,
      },
      {
        name: "Optimal (10-25 clients)",
        value: optimalLoad,
        fill: CHART_COLORS.secondary,
      },
      {
        name: "Low Load (<10 clients)",
        value: lowLoad,
        fill: CHART_COLORS.warning,
      },
    ].filter(item => item.value > 0);
  } else {
    // Fallback if no real data available
    var clientDistribution = [];
  }

  return {
    networkOverview,
    trafficDistribution,
    bandwidthTrends,
    clientDistribution,
  };
};
