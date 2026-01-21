export interface EDRData {
  kpis: {
    totalEndpoints: number;
    connectedEndpoints: number;
    disconnectedEndpoints: number;
    upToDateEndpoints: number;
    totalThreats: number;
    maliciousThreats: number;
    suspiciousThreats: number;
    falsePositives: number;
    securityScore: number;
    endpointAvailabilityRate: number;
    updateComplianceRate: number;
    scanSuccessRate: number;
  };
  analytics: {
    networkStatusDistribution: Record<string, number>;
    confidenceLevelDistribution: Record<string, number>;
    osDistribution: Record<string, number>;
    updateStatusDistribution: Record<string, number>;
    threatTypeDistribution: Record<string, number>;
    classificationDistribution: Record<string, number>;
    actionDistribution?: Record<string, number>;
    monthlyThreats?: Record<string, number>;
    policyDistribution?: Record<string, number>;
    dailyThreats?: Record<string, number>;
  };
  details: {
    endpoints: Array<{
      name?: string;
      endpoint?: string;
      os: string;
      network_status: string;
      scan_status: string;
      last_logged_user: string;
      serial_number: string;
    }>;
    threats: Array<{
      threat_details: string;
      confidence_level: string;
      threat_type: string;
      endpoints: string;
      classification: string;
    }>;
    detailedStatus: Array<any>;
  };
  recommendations?: Array<{
    priority: string;
    category: string;
    recommendation: string;
    metric: string;
  }>;
  rawSheetNames: string[];
}

export interface ModalData {
  title: string;
  data: Array<any>;
  columns: string[];
  type: string;
}