// src/components/Dashboards/SIEM/utils.ts

import { SIEMData } from "@/lib/api";
import { 
  SeverityKPIs, 
  ChartDataPoint, 
  MonthlyTrendData, 
  TopUserData, 
  TimelineData, 
  SeverityBreakdownData,
  AlertDetail 
} from './types';
import { severityMap, alertTitles, sampleUsers } from './constants';

// Date parsing and filtering utilities for SIEM
export const parseSIEMDate = (dateString: string): Date | null => {
  try {
    if (!dateString || typeof dateString !== 'string') return null;
    
    // Handle various date formats that might appear in SIEM data
    const cleanedDate = dateString.trim();
    
    console.log('🔍 Parsing SIEM date:', cleanedDate);
    
    // PRIORITY: User's specific SIEM format: "01-04-2025 11.41.14 AM"
    const siemFormats = [
      // User's exact format: "01-04-2025 11.41.14 AM/PM"
      {
        pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2})\.(\d{2})\.(\d{2})\s+(AM|PM)$/i,
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year, hour, minute, second, ampm] = match;
          let hour24 = parseInt(hour);
          
          // Convert 12-hour to 24-hour format
          if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          
          const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute), parseInt(second));
          console.log(`✅ Parsed ${cleanedDate} -> ${result.toISOString()}`);
          return result;
        }
      },
      // Variant without seconds: "01-04-2025 11.41 AM"
      {
        pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2})\.(\d{2})\s+(AM|PM)$/i,
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year, hour, minute, ampm] = match;
          let hour24 = parseInt(hour);
          
          if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          
          const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour24, parseInt(minute));
          console.log(`✅ Parsed ${cleanedDate} -> ${result.toISOString()}`);
          return result;
        }
      },
      // 24-hour format variant: "01-04-2025 14.26.30"
      {
        pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2})\.(\d{2})\.(\d{2})$/,
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year, hour, minute, second] = match;
          const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
          console.log(`✅ Parsed ${cleanedDate} -> ${result.toISOString()}`);
          return result;
        }
      },
      // 24-hour format without seconds: "01-04-2025 14.26"
      {
        pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2})\.(\d{2})$/,
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year, hour, minute] = match;
          const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
          console.log(`✅ Parsed ${cleanedDate} -> ${result.toISOString()}`);
          return result;
        }
      },
      // Standard colon format: "01-04-2025 14:26:30"
      {
        pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/,
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year, hour, minute, second] = match;
          const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
          console.log(`✅ Parsed ${cleanedDate} -> ${result.toISOString()}`);
          return result;
        }
      },
      // Date only: "01-04-2025"
      {
        pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
        handler: (match: RegExpMatchArray) => {
          const [, day, month, year] = match;
          const result = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          console.log(`✅ Parsed ${cleanedDate} -> ${result.toISOString()}`);
          return result;
        }
      }
    ];
    
    // Try each format
    for (const format of siemFormats) {
      const match = cleanedDate.match(format.pattern);
      if (match) {
        const testDate = format.handler(match);
        if (!isNaN(testDate.getTime())) {
          return testDate;
        }
      }
    }
    
    // Fallback: try standard JavaScript Date parsing
    const fallbackDate = new Date(cleanedDate);
    if (!isNaN(fallbackDate.getTime())) {
      console.log(`✅ Fallback parsed ${cleanedDate} -> ${fallbackDate.toISOString()}`);
      return fallbackDate;
    }
    
    console.warn('❌ Failed to parse SIEM date:', cleanedDate);
    return null;
  } catch (error) {
    console.warn('❌ Error parsing SIEM date:', dateString, error);
    return null;
  }
};

export const filterSIEMDataByDateRange = (
  data: SIEMData,
  startDate: Date | null,
  endDate: Date | null
): SIEMData => {
  if (!startDate || !endDate) return data;

  console.log('🔍 Starting SIEM date filtering:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    originalData: data.kpis
  });

  // Set time bounds: start of startDate to end of endDate
  const filterStartDate = new Date(startDate);
  filterStartDate.setHours(0, 0, 0, 0);
  
  const filterEndDate = new Date(endDate);
  filterEndDate.setHours(23, 59, 59, 999);

  console.log('📅 Date range bounds:', {
    filterStartDate: filterStartDate.toISOString(),
    filterEndDate: filterEndDate.toISOString()
  });

  const filterDetailData = (detailArray: any[], sheetName: string) => {
    if (!Array.isArray(detailArray)) return detailArray;
    
    console.log(`🔄 Filtering ${sheetName} with ${detailArray.length} items`);
    
    // Log first item to understand the structure
    if (detailArray.length > 0) {
      console.log('📋 Sample item structure:', Object.keys(detailArray[0]));
    }
    
    const filtered = detailArray.filter(item => {
      // USER'S SPECIFIC SIEM COLUMNS: "date","severity","tag_time","title","username"
      // Priority order: exact match first, then case variations
      const possibleDateFields = [
        'date',           // User's exact column name
        'Date', 
        'tag_time',       // User mentioned this column
        'tag-time',
        'Tag_Time',
        'timestamp', 
        'Timestamp'
      ];
      
      // Find the actual date field in this item
      let dateFieldFound = null;
      let dateValue = null;
      
      for (const field of possibleDateFields) {
        if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
          dateFieldFound = field;
          dateValue = item[field];
          break;
        }
      }
      
      if (!dateFieldFound) {
        console.log('⚠️ No date field found in item:', Object.keys(item));
        return false; // Skip items without date fields
      }
      
      // Parse the date using our updated parser
      const itemDate = parseSIEMDate(dateValue);
      if (itemDate) {
        const isInRange = itemDate >= filterStartDate && itemDate <= filterEndDate;
        console.log(`📊 ${dateFieldFound}: "${dateValue}" -> ${itemDate.toISOString()} -> ${isInRange ? 'INCLUDED' : 'EXCLUDED'}`);
        return isInRange;
      } else {
        console.log(`❌ Failed to parse date from ${dateFieldFound}: "${dateValue}"`);
        return false;
      }
    });
    
    console.log(`✅ ${sheetName} filtered: ${detailArray.length} -> ${filtered.length} items`);
    return filtered;
  };

  // Filter each sheet in details
  const filteredDetails = data.details ? Object.keys(data.details).reduce((acc, sheetName) => {
    const sheetData = data.details[sheetName];
    if (Array.isArray(sheetData)) {
      acc[sheetName] = filterDetailData(sheetData, sheetName);
    } else {
      acc[sheetName] = sheetData;
    }
    return acc;
  }, {} as Record<string, any[]>) : data.details;

  // Recalculate KPIs based on filtered data
  const recalculateKPIs = () => {
    if (!filteredDetails) return data.kpis;
    
    // Count severity levels from filtered data
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    let totalFilteredEvents = 0;
    
    // Process all filtered arrays to count events by severity
    Object.entries(filteredDetails).forEach(([sheetName, detailArray]) => {
      if (Array.isArray(detailArray)) {
        console.log(`🔢 Counting events in ${sheetName}: ${detailArray.length} items`);
        
        detailArray.forEach(item => {
          totalFilteredEvents++;
          
          // USER'S SPECIFIC SEVERITY MAPPING: 0-info, 1-low, 2-medium, 3-high, 4-critical
          // Look for the exact 'severity' column the user mentioned
          const severityFields = ['severity', 'Severity', 'Severity_Numeric', 'Alert_Severity', 'Level'];
          let severityValue = null;
          let severityFieldFound = null;
          
          for (const field of severityFields) {
            if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
              severityValue = item[field];
              severityFieldFound = field;
              break;
            }
          }
          
          console.log(`🔍 Severity analysis for item: ${severityFieldFound} = "${severityValue}" (type: ${typeof severityValue})`);
          
          // Parse severity value according to user's specification
          if (severityValue !== null) {
            let numericSeverity = null;
            
            // Convert to number if it's a string
            if (typeof severityValue === 'string') {
              const trimmed = severityValue.trim();
              if (!isNaN(Number(trimmed))) {
                numericSeverity = Number(trimmed);
              }
            } else if (typeof severityValue === 'number') {
              numericSeverity = severityValue;
            }
            
            // Apply user's severity mapping: 0-info, 1-low, 2-medium, 3-high, 4-critical
            if (numericSeverity !== null) {
              switch (numericSeverity) {
                case 0:
                  severityCounts.info++;
                  console.log(`✅ Counted as INFO (0)`);
                  break;
                case 1:
                  severityCounts.low++;
                  console.log(`✅ Counted as LOW (1)`);
                  break;
                case 2:
                  severityCounts.medium++;
                  console.log(`✅ Counted as MEDIUM (2)`);
                  break;
                case 3:
                  severityCounts.high++;
                  console.log(`✅ Counted as HIGH (3)`);
                  break;
                case 4:
                  severityCounts.critical++;
                  console.log(`✅ Counted as CRITICAL (4)`);
                  break;
                default:
                  // For any other numeric value, default to info
                  severityCounts.info++;
                  console.log(`⚠️ Unknown severity ${numericSeverity}, counted as INFO`);
                  break;
              }
            } else {
              // If we can't parse as number, try string matching as fallback
              const severityLower = String(severityValue).toLowerCase().trim();
              if (severityLower.includes('critical')) {
                severityCounts.critical++;
                console.log(`✅ String matched as CRITICAL`);
              } else if (severityLower.includes('high')) {
                severityCounts.high++;
                console.log(`✅ String matched as HIGH`);
              } else if (severityLower.includes('medium')) {
                severityCounts.medium++;
                console.log(`✅ String matched as MEDIUM`);
              } else if (severityLower.includes('low')) {
                severityCounts.low++;
                console.log(`✅ String matched as LOW`);
              } else {
                severityCounts.info++;
                console.log(`✅ String defaulted to INFO`);
              }
            }
          } else {
            // If no severity found, default to info
            severityCounts.info++;
            console.log(`⚠️ No severity field found, defaulted to INFO`);
          }
        });
      }
    });
    
    console.log('📊 SIEM KPIs recalculated from filtered data:', {
      totalFilteredEvents,
      severityCounts,
      originalTotal: data.kpis.totalEvents,
      percentageFiltered: ((totalFilteredEvents / data.kpis.totalEvents) * 100).toFixed(1) + '%'
    });
    
    return {
      ...data.kpis,
      totalEvents: totalFilteredEvents,
      criticalAlerts: severityCounts.critical,
      highSeverityEvents: severityCounts.high,
      mediumSeverityEvents: severityCounts.medium,
      lowSeverityEvents: severityCounts.low,
      infoEvents: severityCounts.info,
    };
  };

  const result = {
    ...data,
    details: filteredDetails,
    kpis: recalculateKPIs(),
  };
  
  console.log('🎯 Final filtered SIEM data:', {
    originalEvents: data.kpis.totalEvents,
    filteredEvents: result.kpis.totalEvents,
    originalHigh: data.kpis.highSeverityEvents,
    filteredHigh: result.kpis.highSeverityEvents
  });
  
  return result;
};

export const getSeverityKPIs = (data: SIEMData): SeverityKPIs => {
  const kpis = data.kpis;
  const infoCount =
    kpis.infoEvents !== undefined
      ? kpis.infoEvents
      : Math.max(
          0,
          kpis.totalEvents -
            (kpis.criticalAlerts +
              kpis.highSeverityEvents +
              kpis.mediumSeverityEvents +
              kpis.lowSeverityEvents)
        );

  return {
    critical: kpis.criticalAlerts || 0,
    high: kpis.highSeverityEvents || 0,
    medium: kpis.mediumSeverityEvents || 0,
    low: kpis.lowSeverityEvents || 0,
    info: infoCount,
  };
};

export const generateSeverityChartData = (data: SIEMData): ChartDataPoint[] => {
  const severityKPIs = getSeverityKPIs(data);
  
  return Object.entries(severityMap)
    .map(([severity, config]) => {
      const severityNum = parseInt(severity);
      let count = 0;

      switch (severityNum) {
        case 4:
          count = severityKPIs.critical;
          break;
        case 3:
          count = severityKPIs.high;
          break;
        case 2:
          count = severityKPIs.medium;
          break;
        case 1:
          count = severityKPIs.low;
          break;
        case 0:
          count = severityKPIs.info;
          break;
      }

      return {
        severity: severityNum,
        name: config.name,
        count,
        fill: config.color,
        percentage:
          data.kpis.totalEvents > 0
            ? ((count / data.kpis.totalEvents) * 100).toFixed(1)
            : "0",
      };
    })
    .filter((item) => item.count > 0);
};

export const generateMonthlyTrendData = (data: SIEMData): MonthlyTrendData[] => {
  const monthlyTrends = data.analytics.monthlyTrends || {};

  if (Object.keys(monthlyTrends).length === 0) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month, index) => ({
      month,
      count: Math.floor(data.kpis.totalEvents / 6) + Math.floor(Math.random() * 100),
      events: Math.floor(data.kpis.totalEvents / 6) + Math.floor(Math.random() * 100),
    }));
  }

  return Object.entries(monthlyTrends)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      count: typeof count === "number" ? count : 0,
      events: typeof count === "number" ? count : 0,
    }));
};

export const generateTopUserData = (data: SIEMData): TopUserData[] => {
  const userActivity = data.analytics.userActivity || {};

  if (Object.keys(userActivity).length === 0) {
    return sampleUsers.map((user, index) => ({
      user,
      fullUser: user,
      count: Math.floor(Math.random() * 50) + 10,
      events: Math.floor(Math.random() * 50) + 10,
    }));
  }

  return Object.entries(userActivity)
    .sort(
      ([, a], [, b]) =>
        (typeof b === "number" ? b : 0) - (typeof a === "number" ? a : 0)
    )
    .slice(0, 10)
    .map(([user, count]) => ({
      user: user.length > 20 ? user.substring(0, 20) + "..." : user,
      fullUser: user,
      count: typeof count === "number" ? count : 0,
      events: typeof count === "number" ? count : 0,
    }));
};

export const generateTimelineData = (): TimelineData[] => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      events: Math.floor(Math.random() * 200) + 50,
      critical: Math.floor(Math.random() * 10) + 2,
      high: Math.floor(Math.random() * 15) + 5,
      medium: Math.floor(Math.random() * 25) + 10,
    });
  }
  return days;
};

export const generateSeverityBreakdownData = (data: SIEMData): SeverityBreakdownData[] => {
  const severityKPIs = getSeverityKPIs(data);
  
  return Object.entries(severityKPIs)
    .filter(([severity, count]) => count > 0)
    .map(([severity, count]) => {
      const severityNum =
        severity === "critical"
          ? 4
          : severity === "high"
          ? 3
          : severity === "medium"
          ? 2
          : severity === "low"
          ? 1
          : 0;

      const config = severityMap[severityNum];

      return {
        severity: severity.charAt(0).toUpperCase() + severity.slice(1),
        count: count,
        fill: config.color,
        percentage:
          data.kpis.totalEvents > 0
            ? ((count / data.kpis.totalEvents) * 100).toFixed(1)
            : "0",
        kpis: data.kpis,
      };
    })
    .sort((a, b) => {
      const order = { Critical: 4, High: 3, Medium: 2, Low: 1, Info: 0 };
      return (
        (order[b.severity as keyof typeof order] || 0) -
        (order[a.severity as keyof typeof order] || 0)
      );
    });
};

export const generateRealAlerts = (severity: number, data: any, severityKPIs: SeverityKPIs): AlertDetail[] => {
  console.log('🔍 Generating REAL alerts for severity:', severity);
  console.log('📊 Available data sheets:', Object.keys(data.details || {}));
  
  const severityName = severityMap[severity as keyof typeof severityMap].name;
  const realAlerts: AlertDetail[] = [];

  // Extract real alerts from the actual data based on severity
  if (data.details) {
    Object.entries(data.details).forEach(([sheetName, sheetData]) => {
      if (Array.isArray(sheetData)) {
        console.log(`🔄 Processing ${sheetName} with ${sheetData.length} items`);
        
        sheetData.forEach((item, index) => {
          // Check if this item matches the requested severity
          const itemSeverity = item.Severity_Numeric || item.severity || item.Severity;
          
          if (itemSeverity === severity) {
            // USER'S EXACT COLUMNS: "date","severity","tag_time","title","username"
            // Map to the correct fields from user's Excel structure
            const alertTitle = item.title || item.Title || item['Alert Type'] || 'Unknown Alert';
            const alertUsername = item.username || item.Username || 'Unknown User';
            const alertDate = item.date || item.Date;
            
            // Format date properly
            let formattedDate = new Date().toISOString().split("T")[0]; // fallback
            if (alertDate) {
              try {
                const dateObj = new Date(alertDate);
                if (!isNaN(dateObj.getTime())) {
                  formattedDate = dateObj.toISOString().split("T")[0];
                }
              } catch (e) {
                console.warn('Failed to parse date:', alertDate);
              }
            }
            
            console.log(`✅ Found matching severity ${severity} item:`, {
              title: alertTitle,
              username: alertUsername,
              date: formattedDate,
              severity: itemSeverity,
              rawItem: item  // Log the full item for debugging
            });
            
            realAlerts.push({
              id: `real-alert-${severity}-${sheetName}-${index}`,
              title: alertTitle,
              username: alertUsername,
              date: formattedDate,
              severity,
              severityName,
              description: alertTitle, // Use the actual alert title as description
              status: (item.Status || item.status || 'open') as any,
            });
          }
        });
      }
    });
  }

  console.log(`🎯 Generated ${realAlerts.length} real alerts for severity ${severity}`);
  
  // If we have real alerts, return them. Otherwise, show a message
  if (realAlerts.length > 0) {
    return realAlerts;
  }

  // Fallback: if no real data found, return empty array with explanation
  console.log('⚠️ No real alerts found - returning empty array');
  return [];
};

// Keep old function name for compatibility but use real data
export const generateMockAlerts = (severity: number, kpis: SeverityKPIs, userActivity: any, data?: any): AlertDetail[] => {
  console.log('⚠️ DEPRECATED: generateMockAlerts called - switching to real data');
  
  if (data) {
    return generateRealAlerts(severity, data, kpis);
  }
  
  // Ultimate fallback - should not happen with proper data
  console.error('❌ No data provided to generateMockAlerts - this should not happen');
  return [];
};

export const getThemeStyles = (actualTheme: string) => ({
  cardBg: "bg-card border-border",
  textPrimary: "text-foreground",
  textSecondary: "text-muted-foreground",
  inputBg: "bg-background border-border",
  modalBg: actualTheme === 'dark' ? "bg-card/95" : "bg-card/95",
});

export const getTooltipStyle = (actualTheme: string) => ({
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