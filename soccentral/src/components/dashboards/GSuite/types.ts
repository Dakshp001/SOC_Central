// src/components/dashboards/GSuite/types.ts

export interface EnhancedGSuiteData {
  kpis: {
    emailsScanned: number;
    phishingAttempted: number;
    suspiciousEmails: number;
    whitelistRequests: number;
    clientInvestigations: number;
  };
  details: {
    totalEmailsScanned: any[];
    phishingAttempted: any[];
    suspiciousEmails: any[];
    whitelistedDomains: any[];
    clientInvestigations: any[];
  };
  analytics?: {
    dateRange?: {
      start: string;
      end: string;
    };
    monthlyTrends?: Record<string, number>;
    severityDistribution?: Record<string, number>;
  };
  rawSheetNames: string[];
  processedAt: string;
}

export interface GSuiteDashboardProps {
  data: EnhancedGSuiteData;
}

export interface KPICard {
  id: string;
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  detailKey: string;
  detailTitle: string;
  chartColor: string;
}

export interface ChartData {
  kpiData: Array<{
    name: string;
    value: number;
    fill: string;
    percentage?: number;
  }>;
  securityDistribution: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  securityTrendData: Array<{
    period: string;
    safeEmails: number;
    phishing: number;
    suspicious: number;
    whitelist: number;
  }>;
  monthlyData: Array<{
    month: string;
    count: number;
    phishing: number;
    suspicious: number;
  }>;
  severityData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: number) => string;
}

export interface PaginationData<T> {
  paginatedData: T[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface DetailTableProps {
  detailKey: string;
  title: string;
  data: EnhancedGSuiteData;
  filterSeverity: string;
  setFilterSeverity: (severity: string) => void;
}