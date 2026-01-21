export interface BaseFeatureStatus {
  enhanced: boolean;
  type: string;
}

export interface SIEMFeatureStatus extends BaseFeatureStatus {
  type: 'siem';
  totalAlerts?: number;
  topAlertsBySeverity?: number;
  topUsersBySeverity?: number;
}

export interface EDRFeatureStatus extends BaseFeatureStatus {
  type: 'edr';
  totalEndpoints?: number;
  securityScore?: number;
  totalThreats?: number;
  hasAnalytics?: boolean;
}

export interface GSuiteFeatureStatus extends BaseFeatureStatus {
  type: 'gsuite';
  emailsScanned?: number;
  clientInvestigations?: number;
  hasAnalytics?: boolean;
}

export interface MDMFeatureStatus extends BaseFeatureStatus {
  type: 'mdm';
  totalDevices?: number;
  complianceRate?: number;
  hasAnalytics?: boolean;
}

export interface MerakiFeatureStatus extends BaseFeatureStatus {
  type: 'meraki';
  totalDevices?: number;
  networkHealthScore?: number;
  hasAnalytics?: boolean;
  hasInsights?: boolean;
}

export interface DefaultFeatureStatus extends BaseFeatureStatus {
  type: 'default';
}

export type FeatureStatus = 
  | SIEMFeatureStatus 
  | GSuiteFeatureStatus 
  | MDMFeatureStatus 
  | MerakiFeatureStatus 
  | EDRFeatureStatus 
  | DefaultFeatureStatus;
