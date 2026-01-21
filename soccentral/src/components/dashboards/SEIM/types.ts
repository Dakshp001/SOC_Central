// src/components/Dashboards/SIEM/types.ts

export interface SeverityFilter {
  critical: boolean;
  high: boolean;
  medium: boolean;
  low: boolean;
  info: boolean;
}

export interface TimeFilter {
  range: "today" | "week" | "month" | "quarter" | "year" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface AlertDetail {
  id: string;
  title: string;
  username: string;
  date: string;
  severity: number;
  severityName: string;
  description?: string;
  status: "open" | "investigating" | "resolved" | "false_positive";
}

export interface SeverityConfig {
  name: string;
  color: string;
  bgColor: string;
}

export interface SeverityMapType {
  [key: number]: SeverityConfig;
}

export interface ChartDataPoint {
  severity: number;
  name: string;
  count: number;
  fill: string;
  percentage: string;
}

export interface TopUserData {
  user: string;
  fullUser: string;
  count: number;
  events: number;
}

export interface MonthlyTrendData {
  month: string;
  count: number;
  events: number;
}

export interface TimelineData {
  day: string;
  events: number;
  critical: number;
  high: number;
  medium: number;
}

export interface SeverityBreakdownData {
  severity: string;
  count: number;
  fill: string;
  percentage: string;
  kpis: any;
}

export interface SeverityKPIs {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}