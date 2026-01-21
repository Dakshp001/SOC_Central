export const formatNumber = (num: number) => num.toLocaleString();
export const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "connected":
    case "compliant":
    case "up to date":
    case "completed":
    case "resolved":
      return "text-green-400";
    case "disconnected":
    case "non-compliant":
    case "out of date":
    case "failed":
    case "pending":
      return "text-red-400";
    case "suspicious":
    case "malicious":
      return "text-orange-400";
    default:
      return "text-gray-400";
  }
};

export const getSecurityScoreColor = (score: number) => {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
};

export const getSecurityScoreLabel = (score: number) => {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
};

// Chart Colors
export const CHART_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];

export const ACTION_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899",
];

export const TREND_COLORS = ["#06B6D4", "#8B5CF6", "#F59E0B"];
export const POLICY_COLORS = { protect: "#10B981", detect: "#3B82F6" };
export const DAY_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4",
];

export const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

// Date parsing utilities for scan_status field
export const parseScanStatusDate = (scanStatus: string): Date | null => {
  try {
    // Extract date from format: "Completed(Apr 03, 2025 04:19:06 PM)"
    const dateMatch = scanStatus.match(/\(([^)]+)\)/);
    if (!dateMatch) return null;
    
    const dateString = dateMatch[1];
    // Parse the extracted date string
    const parsedDate = new Date(dateString);
    
    // Check if the date is valid and reasonable
    if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 1900) return null;
    
    return parsedDate;
  } catch (error) {
    console.warn('Failed to parse scan status date:', scanStatus, error);
    return null;
  }
};

export const isDateInRange = (date: Date | null, startDate: Date | null, endDate: Date | null): boolean => {
  if (!date) return false;
  
  // If no filters are set, include all dates
  if (!startDate && !endDate) return true;
  
  // Convert to date-only for comparison (ignore time and timezone)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
  const endDateOnly = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : null;
  
  console.log(`🔍 Date range check:`, {
    date: dateOnly.toISOString().split('T')[0],
    startDate: startDateOnly?.toISOString().split('T')[0],
    endDate: endDateOnly?.toISOString().split('T')[0]
  });
  
  // Check start date constraint
  if (startDateOnly && dateOnly < startDateOnly) {
    console.log(`❌ Date ${dateOnly.toISOString().split('T')[0]} is before start ${startDateOnly.toISOString().split('T')[0]}`);
    return false;
  }
  
  // Check end date constraint
  if (endDateOnly && dateOnly > endDateOnly) {
    console.log(`❌ Date ${dateOnly.toISOString().split('T')[0]} is after end ${endDateOnly.toISOString().split('T')[0]}`);
    return false;
  }
  
  console.log(`✅ Date ${dateOnly.toISOString().split('T')[0]} is in range`);
  return true;
};

// Enhanced date parsing for multiple EDR field formats
export const parseEDRDate = (dateString: string): Date | null => {
  try {
    if (!dateString || typeof dateString !== 'string') return null;
    
    // Handle scan_status format: "Completed(Apr 03, 2025 04:19:06 PM)"
    const scanStatusMatch = dateString.match(/\(([^)]+)\)/);
    if (scanStatusMatch) {
      const parsedDate = new Date(scanStatusMatch[1]);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1900) return parsedDate;
    }
    
    // Handle standard date formats (including ISO formats)
    const cleanedDate = dateString.trim();
    const parsedDate = new Date(cleanedDate);
    if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1900) {
      console.log(`✅ Parsed standard format: "${cleanedDate}" -> ${parsedDate.toISOString()}`);
      return parsedDate;
    }
    
    // USER'S SPECIFIC EDR FORMAT: "04-04-2025 12.39" (DD-MM-YYYY HH.MM)
    const userEDRFormat = /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2})\.(\d{2})$/;
    const userMatch = cleanedDate.match(userEDRFormat);
    if (userMatch) {
      const [, day, month, year, hour, minute] = userMatch;
      const testDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      if (!isNaN(testDate.getTime()) && testDate.getFullYear() > 1900) {
        console.log(`✅ Parsed user EDR format: "${cleanedDate}" -> ${testDate.toISOString()}`);
        return testDate;
      }
    }
    
    // Handle various other formats
    const dateFormats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // MM/dd/yyyy
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // yyyy-MM-dd
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // DD-MM-yyyy (without time)
      /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2})$/,   // DD-MM-yyyy HH:MM
    ];
    
    for (const format of dateFormats) {
      const match = cleanedDate.match(format);
      if (match) {
        if (match.length === 4) {
          // Date only formats
          const [, part1, part2, part3] = match;
          const testDate = new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1));
          if (!isNaN(testDate.getTime()) && testDate.getFullYear() > 1900) return testDate;
        } else if (match.length === 6) {
          // Date with time formats
          const [, day, month, year, hour, minute] = match;
          const testDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
          if (!isNaN(testDate.getTime()) && testDate.getFullYear() > 1900) return testDate;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse EDR date:', dateString, error);
    return null;
  }
};

export const filterEndpointsByDateRange = (
  endpoints: Array<any>, 
  startDate: Date | null, 
  endDate: Date | null
): Array<any> => {
  if (!startDate && !endDate) return endpoints;
  
  console.log(`🔍 Filtering ${endpoints.length} endpoints by date range:`, {
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString()
  });
  
  const filtered = endpoints.filter(endpoint => {
    // FIXED: Use the 'Date' field created by EDR processor from Scan Status
    // The EDR processor extracts dates from Scan Status and creates a 'Date' field
    const dateField = endpoint['Date'] || endpoint['date'] || endpoint['extracted_date'];
    
    if (!dateField) {
      console.log('⚠️ No Date field found for endpoint:', Object.keys(endpoint));
      return false; // Exclude endpoints without date fields when filtering
    }
    
    // Handle string dates from EDR processor
    let parsedDate: Date | null = null;
    if (typeof dateField === 'string') {
      // Try direct parsing first (handles ISO formats like "2025-07-29T00:00:00")
      let testDate = new Date(dateField);
      
      // If that fails, try adding time component for YYYY-MM-DD format
      if (isNaN(testDate.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateField)) {
        testDate = new Date(dateField + 'T00:00:00');
      }
      
      // Validate the date is actually valid and reasonable
      if (!isNaN(testDate.getTime()) && testDate.getFullYear() > 1900) {
        parsedDate = testDate;
      }
    } else {
      parsedDate = parseEDRDate(dateField);
    }
    
    if (!parsedDate) {
      console.log(`⚠️ Could not parse date field: "${dateField}" - excluding endpoint`);
      return false; // Exclude endpoints with unparseable dates when filtering
    }
    
    const isInRange = isDateInRange(parsedDate, startDate, endDate);
    
    console.log(`📊 Endpoint filtering: "${dateField}" -> ${parsedDate.toISOString()} -> ${isInRange ? 'INCLUDED' : 'EXCLUDED'}`);
    
    return isInRange;
  });
  
  console.log(`✅ EDR endpoint filtering result: ${endpoints.length} -> ${filtered.length} endpoints`);
  return filtered;
};

// Filter threats by date range
export const filterThreatsByDateRange = (
  threats: Array<any>,
  startDate: Date | null,
  endDate: Date | null
): Array<any> => {
  if (!startDate && !endDate) return threats;
  
  return threats.filter(threat => {
    // Check multiple date fields in threats
    const dateFields = [
      'reported_time',
      'identifying_time',
      'created_date',
      'resolved_date',
      'last_updated'
    ];
    
    for (const field of dateFields) {
      if (threat[field]) {
        const date = parseEDRDate(threat[field]);
        if (isDateInRange(date, startDate, endDate)) {
          return true;
        }
      }
    }
    
    return false;
  });
};

// Helper function to get date range statistics
export const getDateRangeStats = (endpoints: Array<any>) => {
  const dates = endpoints
    .map(ep => parseScanStatusDate(ep.scan_status || ''))
    .filter(date => date !== null) as Date[];
  
  if (dates.length === 0) return null;
  
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
  
  return {
    earliest: sortedDates[0],
    latest: sortedDates[sortedDates.length - 1],
    totalWithDates: dates.length,
    uniqueDates: new Set(dates.map(d => d.toDateString())).size
  };
};

// Helper function to format date range for display
export const formatDateRangeDisplay = (startDate: Date | null, endDate: Date | null): string => {
  if (!startDate && !endDate) return 'All Time';
  if (startDate && !endDate) return `From ${startDate.toLocaleDateString()}`;
  if (!startDate && endDate) return `Until ${endDate.toLocaleDateString()}`;
  if (startDate && endDate) {
    const start = startDate.toLocaleDateString();
    const end = endDate.toLocaleDateString();
    if (start === end) return start;
    return `${start} - ${end}`;
  }
  return 'All Time';
};