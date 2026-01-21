// MDM Utility Functions
// src/components/dashboards/MDM/utils.ts

import { MDMData } from './types';

// Date parsing and filtering utilities for MDM
export const parseMDMDate = (dateString: string): Date | null => {
  try {
    if (!dateString || typeof dateString !== 'string') return null;
    
    // Handle various date formats that might appear in MDM data
    const cleanedDate = dateString.trim();
    
    // Try parsing as standard date
    const parsedDate = new Date(cleanedDate);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
    
    // If direct parsing fails, try common MDM date formats
    // Format: MM/dd/yyyy, dd/MM/yyyy, yyyy-MM-dd, ISO format, etc.
    const dateFormats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // MM/dd/yyyy or dd/MM/yyyy
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // yyyy-MM-dd
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // MM-dd-yyyy or dd-MM-yyyy
    ];
    
    for (const format of dateFormats) {
      const match = cleanedDate.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        // Assume MM/dd/yyyy format for most MDM exports
        const testDate = new Date(`${part1}/${part2}/${part3}`);
        if (!isNaN(testDate.getTime())) {
          return testDate;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse MDM date:', dateString, error);
    return null;
  }
};

export const filterMDMDataByDateRange = (
  data: MDMData,
  startDate: Date | null,
  endDate: Date | null
): MDMData => {
  if (!startDate || !endDate) return data;

  const filterDeviceData = (deviceArray: any[]) => {
    return deviceArray.filter(device => {
      // Comprehensive list of potential date fields in MDM data
      const dateFields = [
        'Date', 'Last Seen', 'lastSeen', 'Enrollment Date', 'Created Date', 'Modified Date',
        'Registration Date', 'Last Check-in', 'Last Updated', 'Last Contact',
        'Activation Date', 'Deactivation Date', 'Wipe Date', 'Compliance Date',
        'Policy Update Date', 'Certificate Date', 'Profile Install Date',
        'App Install Date', 'Sync Date', 'Backup Date', 'Restore Date'
      ];
      
      for (const field of dateFields) {
        if (device[field]) {
          const deviceDate = parseMDMDate(device[field]);
          if (deviceDate && deviceDate >= startDate && deviceDate <= endDate) {
            return true;
          }
        }
      }
      
      // If no date field found, include the device (preserve non-date records)
      return !dateFields.some(field => field in device);
    });
  };

  // Filter all detail arrays
  const filteredDetails = {
    allUsers: filterDeviceData(data.details.allUsers),
    wipeOuts: filterDeviceData(data.details.wipeOuts),
    wipePending: filterDeviceData(data.details.wipePending),
    noPass: filterDeviceData(data.details.noPass),
    notEncrypted: filterDeviceData(data.details.notEncrypted),
    nonCompliant: filterDeviceData(data.details.nonCompliant),
  };

  // Recalculate KPIs based on filtered data
  const filteredKpis = {
    totalDevices: filteredDetails.allUsers.length,
    enrolledDevices: filteredDetails.allUsers.filter(device => device.enrollment === 'Enrolled' || device.Enrollment === 'Enrolled').length,
    compliantDevices: filteredDetails.allUsers.filter(device => device.compliance === 'Compliant' || device.Compliance === 'Compliant').length,
    complianceRate: 0, // Will be calculated below
    compromisedDevices: 0, // Calculated from filtered data
    securityIssues: filteredDetails.noPass.length + filteredDetails.notEncrypted.length + filteredDetails.nonCompliant.length,
    wipePendingDevices: filteredDetails.wipePending.length,
    devicesWithoutPassword: filteredDetails.noPass.length,
    unencryptedDevices: filteredDetails.notEncrypted.length,
    nonCompliantDevices: filteredDetails.nonCompliant.length,
    enrollmentRate: 0, // Will be calculated below
    securityScore: 0, // Will be calculated below
  };

  // Calculate rates and scores
  if (filteredKpis.totalDevices > 0) {
    filteredKpis.complianceRate = (filteredKpis.compliantDevices / filteredKpis.totalDevices) * 100;
    filteredKpis.enrollmentRate = (filteredKpis.enrolledDevices / filteredKpis.totalDevices) * 100;
    filteredKpis.securityScore = Math.max(0, 100 - (filteredKpis.securityIssues / filteredKpis.totalDevices) * 100);
  }

  // Recalculate analytics based on filtered data
  const filteredAnalytics = {
    ...data.analytics,
    // Platform distribution will be recalculated from filtered allUsers
    platformDistribution: filteredDetails.allUsers.reduce((acc, device) => {
      const platform = device.platform || device.Platform || 'Unknown';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    // Security breakdown
    securityBreakdown: {
      compromised: 0, // Calculate from filtered data
      noPassword: filteredDetails.noPass.length,
      notEncrypted: filteredDetails.notEncrypted.length,
      nonCompliant: filteredDetails.nonCompliant.length,
    },
  };

  return {
    ...data,
    kpis: filteredKpis,
    details: filteredDetails,
    analytics: filteredAnalytics,
  };
};

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    iOS: "#007AFF",
    Android: "#3DDC84",
    Windows: "#0078D4",
    macOS: "#000000",
    iPadOS: "#007AFF",
    Linux: "#FCC419",
  };
  return colors[platform] || "#6B7280";
}

export function getOSColor(os: string): string {
  const colors: Record<string, string> = {
    "iOS 17": "#007AFF",
    "iOS 16": "#0056CC",
    "Android 14": "#3DDC84",
    "Android 13": "#2DB86A",
    "Windows 11": "#0078D4",
    "Windows 10": "#005A9E",
    macOS: "#000000",
  };
  return colors[os] || "#6B7280";
}

export function getEnrollmentColor(status: string): string {
  const colors: Record<string, string> = {
    Enrolled: "#10B981",
    Pending: "#F59E0B",
    Failed: "#EF4444",
    "Not Enrolled": "#6B7280",
  };
  return colors[status] || "#6B7280";
}

export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: "bg-red-900/30 border-red-800 text-red-400 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400",
    high: "bg-orange-900/30 border-orange-800 text-orange-400 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400",
    medium: "bg-yellow-900/30 border-yellow-800 text-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-400",
    low: "bg-blue-900/30 border-blue-800 text-blue-400 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400",
  };
  return colors[severity] || colors.medium;
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`;
}

export function calculatePercentage(value: number, total: number): number {
  return total > 0 ? (value / total) * 100 : 0;
}

export function getSeverityFromPercentage(percentage: number, violationType: string): "critical" | "high" | "medium" | "low" {
  if (violationType === "compromised" && percentage > 0) return "critical";
  if (percentage > 15) return "high";
  if (percentage > 5) return "medium";
  if (percentage > 0) return "low";
  return "low";
}