import { SIEMData, GSuiteData, EnhancedGSuiteData, isEnhancedGSuiteData } from '@/lib/api';

export const hasEnhancedSIEMFeatures = (data: SIEMData): boolean => {
  return !!(
    data.analytics?.totalAlertsCount !== undefined &&
    data.analytics?.topAlertsBySeverity &&
    data.analytics?.topUsersBySeverity
  );
};

export const hasEnhancedGSuiteFeatures = (data: GSuiteData): boolean => {
  return isEnhancedGSuiteData(data) && !!(
    (data as EnhancedGSuiteData).kpis.clientInvestigations !== undefined &&
    (data as EnhancedGSuiteData).details.clientInvestigations &&
    (data as EnhancedGSuiteData).analytics
  );
};
