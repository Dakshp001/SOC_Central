import { EnhancedMerakiData } from "@/lib/api";

export interface MerakiDashboardProps {
  data: EnhancedMerakiData;
}

export interface KPICardData {
  id: string;
  title: string;
  value: number;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  detailKey: string;
  detailTitle: string;
  chartColor: string;
  unit: string;
}

export interface ChartData {
  networkOverview: Array<{
    name: string;
    value: number;
    fill: string;
    percentage: number;
  }>;
  trafficDistribution: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  bandwidthTrends: Array<{
    time: string;
    download: number;
    total: number;
  }>;
  clientDistribution: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}