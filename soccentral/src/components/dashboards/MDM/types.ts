// MDM Types
// src/components/dashboards/MDM/types.ts

export interface MDMKPIs {
  totalDevices: number;
  enrolledDevices: number;
  compliantDevices: number;
  complianceRate: number;
  compromisedDevices: number;
  securityIssues: number;
  wipePendingDevices: number;
  devicesWithoutPassword: number;
  unencryptedDevices: number;
  nonCompliantDevices: number;
  enrollmentRate: number;
  securityScore: number;
}

export interface MDMDetails {
  allUsers: any[];
  wipeOuts: any[];
  wipePending: any[];
  noPass: any[];
  notEncrypted: any[];
  nonCompliant: any[];
}

export interface MDMAnalytics {
  platformDistribution: Record<string, number>;
  enrollmentStatus: Record<string, number>;
  complianceStatus: Record<string, number>;
  osDistribution: Record<string, number>;
  managementTypes: Record<string, number>;
  weeklyWipeAnalysis: Record<string, number>;
  monthlyWipeAnalysis: Record<string, number>;
  securityBreakdown: {
    compromised: number;
    noPassword: number;
    notEncrypted: number;
    nonCompliant: number;
  };
}

export interface MDMData {
  fileType: string;
  kpis: MDMKPIs;
  details: MDMDetails;
  analytics: MDMAnalytics;
  rawSheetNames: string[];
}

export interface EnhancedSecurityViolation {
  type: string;
  count: number;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  color: string;
  percentage: number;
  devices: any[];
}

export interface DeviceDetail {
  id: string;
  username: string;
  email: string;
  platform: string;
  serialNumber: string;
  lastSeen: string;
  enrollment: string;
  compliance: string;
  violationType: string;
}

export interface ChartDataPoint {
  platform?: string;
  count?: number;
  fill?: string;
  os?: string;
  status?: string;
  type?: string;
  week?: string;
  month?: string;
  wipes?: number;
  name?: string;
  value?: number;
}

export interface MDMDashboardProps {
  data: MDMData;
  className?: string;
}