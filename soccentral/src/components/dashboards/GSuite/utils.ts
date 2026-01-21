// src/components/dashboards/GSuite/utils.ts

import { EnhancedGSuiteData, ChartData } from './types';

// Date parsing and filtering utilities
import { parse } from "date-fns";  // add this at top

export const parseGSuiteDate = (dateString: string): Date | null => {
  try {
    if (!dateString || typeof dateString !== "string") return null;
    const cleanedDate = dateString.trim();

    // 1. Try native JS parsing first (handles ISO formats from backend)
    const parsedDate = new Date(cleanedDate);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    // 2. Try common GSuite formats with date-fns (for raw Excel data)
    const knownFormats = [
      "MMM dd, yyyy, hh:mm a",  // "Apr 16, 2025, 02:28 PM" - Phishing data
      "MMM dd, yyyy, h:mm a",   // "Apr 16, 2025, 2:28 PM" - Phishing data (single digit)
      "dd-MM-yyyy h.mm.ss a",   // "16-07-2025 8.44.00 AM" - Mail scanned data
      "dd-MM-yyyy H.mm.ss",     // "16-07-2025 8.44.00" - Mail scanned data (24hr)
      "dd-MM-yyyy",             // "04-02-2025" - Client investigations
      "yyyy-MM-dd HH:mm:ss",    // "2025-07-16 08:44:00" - Already parsed timestamps
      "yyyy-MM-dd",             // ISO date format
      "MM/dd/yyyy",             // US format fallback
    ];

    for (const fmt of knownFormats) {
      try {
        const d = parse(cleanedDate, fmt, new Date());
        if (!isNaN(d.getTime())) return d;
      } catch {
        continue;
      }
    }

    return null;
  } catch (error) {
    console.warn("Failed to parse GSuite date:", dateString, error);
    return null;
  }
};

export const filterGSuiteDataByDateRange = (
  data: EnhancedGSuiteData,
  startDate: Date | null,
  endDate: Date | null
): EnhancedGSuiteData => {
  if (!startDate || !endDate) return data;

  const filterSheetData = (sheetData: any[]) => {
    return sheetData.filter(item => {
      // GSuite-specific date fields based on ACTUAL Excel sheet structure
      const dateFields = [
        // PRIMARY: Exact field names from the actual Excel sheets
        'Date',           // "total number of mail scanned" sheet - "16-07-2025 8.44.00 AM"
        'Date Reported',  // "Phishing Attempted data" sheet - "Apr 16, 2025, 02:28 PM" (backend standardized)
        'date reported',  // "Phishing Attempted data" sheet - original case variation
        'date',           // "Client Coordinated email invest" sheet - "04-02-2025"
        
        // SECONDARY: Backend normalized fields (from data_filter_service.py)
        'Request Date', 'Investigation Date', 'Scan Date',
        'Timestamp', 'Created Date', 'Modified Date',
        'Sent Date', 'Received Date', 'Alert Date',
        'Resolution Date', 'Last Updated', 'Event Date', 
        'Detection Date', 'Processing Date'
      ];
      
      // Debug logging for troubleshooting
      if (process.env.NODE_ENV === 'development' && item && typeof item === 'object') {
        const hasAnyDateField = dateFields.some(field => field in item);
        if (!hasAnyDateField) {
          console.log('🔍 Item with no recognized date fields:', Object.keys(item));
        }
      }
      
      for (const field of dateFields) {
        if (item[field]) {
          const itemDate = parseGSuiteDate(item[field]);
          if (itemDate && itemDate >= startDate && itemDate <= endDate) {
            return true;
          }
        }
      }
      
      // If no date field found, include the item (preserve non-date records like domain lists)
      return !dateFields.some(field => field in item);
    });
  };

  // Filter all detail sheets - Handle BOTH actual sheet names AND legacy keys
  // IMPORTANT: Check what data structure we actually have
  console.log("🔍 Available data structure:", Object.keys(data.details || {}));
  
  const filteredDetails: any = {
    // Legacy normalized keys (for backward compatibility)
    totalEmailsScanned: filterSheetData(data.details?.totalEmailsScanned || []),
    phishingAttempted: filterSheetData(data.details?.phishingAttempted || []),
    suspiciousEmails: filterSheetData(data.details?.suspiciousEmails || []),
    whitelistedDomains: filterSheetData(data.details?.whitelistedDomains || []),
    clientInvestigations: filterSheetData(data.details?.clientInvestigations || []),
  };
  
  // CRITICAL: Also filter the actual sheet names if they exist
  if (data.details) {
    const detailsObj = data.details as any;
    
    // Check for actual Excel sheet names and filter them too
    const actualSheetNames = [
      "total number of mail scanned",
      "Phishing Attempted data", 
      "whitelisted domains",
      "Client Coordinated email invest"
    ];
    
    for (const sheetName of actualSheetNames) {
      if (detailsObj[sheetName]) {
        console.log(`🗂️ Filtering sheet: "${sheetName}" with ${detailsObj[sheetName].length} records`);
        filteredDetails[sheetName] = filterSheetData(detailsObj[sheetName]);
        console.log(`✅ Filtered to: ${filteredDetails[sheetName].length} records`);
      }
    }
  }

  // Recalculate KPIs based on filtered data - PRIORITIZE actual sheet data
  const filteredKpis = {
    emailsScanned: filteredDetails["total number of mail scanned"]?.length || 
                   filteredDetails.totalEmailsScanned?.length || 0,
    
    phishingAttempted: filteredDetails["Phishing Attempted data"]?.length || 
                       filteredDetails.phishingAttempted?.length || 0,
    
    suspiciousEmails: filteredDetails.suspiciousEmails?.length || 0,
    
    whitelistRequests: filteredDetails["whitelisted domains"]?.length || 
                       filteredDetails.whitelistedDomains?.length || 0,
    
    clientInvestigations: filteredDetails["Client Coordinated email invest"]?.length || 
                          filteredDetails.clientInvestigations?.length || 0,
  };
  
  console.log("📊 Filtered KPIs calculated:", filteredKpis);

  return {
    ...data,
    kpis: filteredKpis,
    details: filteredDetails,
  };
};

// Color palette for consistent theming
export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  gradient: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4']
};

// Analytics data calculation
export const calculateAnalyticsData = (kpis: EnhancedGSuiteData['kpis']) => {
  const totalSecurityEvents = kpis.phishingAttempted + kpis.suspiciousEmails;
  const securityEventRate = kpis.emailsScanned > 0 
    ? ((totalSecurityEvents / kpis.emailsScanned) * 100).toFixed(2)
    : '0';
  
  return { totalSecurityEvents, securityEventRate };
};

// Prepare chart data - Enhanced to use actual filtered data
export const prepareChartData = (data: EnhancedGSuiteData, analyticsData: { totalSecurityEvents: number; securityEventRate: string }): ChartData => {
  // KPI Overview Data for Radial Chart - Filter out zero values for better visualization
  const allKpiData = [
    {
      name: 'Emails Scanned',
      value: data.kpis.emailsScanned,
      fill: CHART_COLORS.primary,
      percentage: 100
    },
    {
      name: 'Phishing Attempts',
      value: data.kpis.phishingAttempted,
      fill: CHART_COLORS.danger,
      percentage: data.kpis.emailsScanned > 0 ? (data.kpis.phishingAttempted / data.kpis.emailsScanned) * 100 : 0
    },
    {
      name: 'Suspicious Emails',
      value: data.kpis.suspiciousEmails,
      fill: CHART_COLORS.warning,
      percentage: data.kpis.emailsScanned > 0 ? (data.kpis.suspiciousEmails / data.kpis.emailsScanned) * 100 : 0
    },
    {
      name: 'Whitelist Requests',
      value: data.kpis.whitelistRequests,
      fill: CHART_COLORS.secondary,
      percentage: data.kpis.emailsScanned > 0 ? (data.kpis.whitelistRequests / data.kpis.emailsScanned) * 100 : 0
    },
    {
      name: 'Investigations',
      value: data.kpis.clientInvestigations,
      fill: CHART_COLORS.purple,
      percentage: data.kpis.emailsScanned > 0 ? (data.kpis.clientInvestigations / data.kpis.emailsScanned) * 100 : 0
    }
  ];

  // Always show actual filtered data - NO FAKE DATA fallback
  // Even if values are 0, show the real filtered data
  console.log("📊 Chart data - using filtered KPIs:", data.kpis);
  
  const kpiData = allKpiData; // Show all metrics, even if zero

  // Generate actual trend data from filtered records
  const generateRealTrendData = () => {
    const trendData = [];
    
    // Get filtered phishing data for trend analysis
    const phishingData = data.details?.["Phishing Attempted data"] || 
                        data.details?.phishingAttempted || [];
    
    // Get filtered email data for trend analysis  
    const emailData = data.details?.["total number of mail scanned"] || 
                     data.details?.totalEmailsScanned || [];
                     
    console.log("📈 Generating trend from filtered data:", {
      phishingRecords: phishingData.length,
      emailRecords: emailData.length
    });
    
    // If we have actual filtered data, create weekly breakdown
    if (phishingData.length > 0 || emailData.length > 0) {
      // Group by week/period based on actual dates
      const weeklyData = new Map();
      
      // Process phishing data
      phishingData.forEach((record: any) => {
        const dateFields = ['Date Reported', 'date reported', 'Date', 'date'];
        let recordDate = null;
        
        for (const field of dateFields) {
          if (record[field]) {
            recordDate = parseGSuiteDate(record[field]);
            break;
          }
        }
        
        if (recordDate) {
          const weekKey = `Week ${Math.ceil(recordDate.getDate() / 7)}`;
          if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, { phishing: 0, suspicious: 0, emails: 0, whitelist: 0 });
          }
          weeklyData.get(weekKey).phishing++;
        }
      });
      
      // Process email data
      emailData.forEach((record: any) => {
        const dateFields = ['Date', 'date', 'Timestamp'];
        let recordDate = null;
        
        for (const field of dateFields) {
          if (record[field]) {
            recordDate = parseGSuiteDate(record[field]);
            break;
          }
        }
        
        if (recordDate) {
          const weekKey = `Week ${Math.ceil(recordDate.getDate() / 7)}`;
          if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, { phishing: 0, suspicious: 0, emails: 0, whitelist: 0 });
          }
          weeklyData.get(weekKey).emails++;
        }
      });
      
      // Convert to array format
      for (const [week, counts] of weeklyData.entries()) {
        trendData.push({
          period: week,
          safeEmails: Math.max(0, counts.emails - counts.phishing - counts.suspicious),
          phishing: counts.phishing,
          suspicious: counts.suspicious,
          whitelist: counts.whitelist
        });
      }
      
      // Sort by week number
      trendData.sort((a, b) => {
        const weekA = parseInt(a.period.replace('Week ', ''));
        const weekB = parseInt(b.period.replace('Week ', ''));
        return weekA - weekB;
      });
    }
    
    // If no data or not enough for trends, create simple summary
    if (trendData.length === 0) {
      trendData.push({
        period: 'Filtered Period',
        safeEmails: Math.max(0, data.kpis.emailsScanned - data.kpis.phishingAttempted - data.kpis.suspiciousEmails),
        phishing: data.kpis.phishingAttempted,
        suspicious: data.kpis.suspiciousEmails,
        whitelist: data.kpis.whitelistRequests
      });
    }
    
    return trendData;
  };

  // Security Distribution Pie Chart Data - Always show actual data
  const securityDistribution = [
    { name: 'Safe Emails', value: Math.max(0, data.kpis.emailsScanned - analyticsData.totalSecurityEvents), fill: CHART_COLORS.secondary },
    { name: 'Phishing Attempts', value: data.kpis.phishingAttempted, fill: CHART_COLORS.danger },
    { name: 'Suspicious Emails', value: data.kpis.suspiciousEmails, fill: CHART_COLORS.warning }
  ]; // Don't filter out zero values - show actual filtered state

  // Use real trend data from filtered records
  const securityTrendData = generateRealTrendData();

  // Generate actual monthly data from filtered records
  const generateRealMonthlyData = () => {
    const monthlyData = [];
    const phishingData = data.details?.["Phishing Attempted data"] || data.details?.phishingAttempted || [];
    const emailData = data.details?.["total number of mail scanned"] || data.details?.totalEmailsScanned || [];
    
    // Group by month
    const monthlyStats = new Map();
    
    [...phishingData, ...emailData].forEach((record: any) => {
      const dateFields = ['Date Reported', 'date reported', 'Date', 'date'];
      let recordDate = null;
      
      for (const field of dateFields) {
        if (record[field]) {
          recordDate = parseGSuiteDate(record[field]);
          break;
        }
      }
      
      if (recordDate) {
        const monthKey = recordDate.toLocaleDateString('en-US', { month: 'short' });
        if (!monthlyStats.has(monthKey)) {
          monthlyStats.set(monthKey, { count: 0, phishing: 0, suspicious: 0 });
        }
        
        monthlyStats.get(monthKey).count++;
        
        // Check if it's phishing data
        if (record['Date Reported'] || record['date reported']) {
          monthlyStats.get(monthKey).phishing++;
        }
      }
    });
    
    // Convert to array
    for (const [month, stats] of monthlyStats.entries()) {
      monthlyData.push({
        month,
        count: stats.count,
        phishing: stats.phishing,
        suspicious: stats.suspicious
      });
    }
    
    // If no monthly breakdown possible, create single entry
    if (monthlyData.length === 0 && (data.kpis.emailsScanned > 0 || data.kpis.phishingAttempted > 0)) {
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
      monthlyData.push({
        month: currentMonth,
        count: data.kpis.emailsScanned,
        phishing: data.kpis.phishingAttempted,
        suspicious: data.kpis.suspiciousEmails
      });
    }
    
    return monthlyData;
  };

  const monthlyData = generateRealMonthlyData();

  // Generate severity data from actual filtered phishing records
  const generateRealSeverityData = () => {
    const severityCount = new Map();
    const phishingData = data.details?.["Phishing Attempted data"] || data.details?.phishingAttempted || [];
    
    // Count actual severity levels from filtered data
    phishingData.forEach((record: any) => {
      const severity = record.Severity || record.severity || 'Unknown';
      const severityKey = severity.toLowerCase();
      
      severityCount.set(severityKey, (severityCount.get(severityKey) || 0) + 1);
    });
    
    // Convert to chart format
    const severityData = [];
    const colorMap = {
      critical: CHART_COLORS.danger,
      high: CHART_COLORS.warning,
      medium: CHART_COLORS.accent,
      low: CHART_COLORS.info,
      info: CHART_COLORS.primary,
      unknown: CHART_COLORS.purple
    };
    
    for (const [severity, count] of severityCount.entries()) {
      severityData.push({
        name: severity.charAt(0).toUpperCase() + severity.slice(1),
        value: count,
        fill: colorMap[severity] || CHART_COLORS.primary
      });
    }
    
    // If no severity data, create placeholder showing filtered state
    if (severityData.length === 0 && data.kpis.phishingAttempted > 0) {
      severityData.push({
        name: 'Filtered Data',
        value: data.kpis.phishingAttempted,
        fill: CHART_COLORS.warning
      });
    }
    
    return severityData;
  };

  const severityData = generateRealSeverityData();

  console.log("📊 Final chart data prepared:", {
    kpiData: kpiData.length,
    securityDistribution: securityDistribution.length,
    securityTrendData: securityTrendData.length,
    monthlyData: monthlyData.length,
    severityData: severityData.length
  });

  return { kpiData, securityDistribution, securityTrendData, monthlyData, severityData };
};