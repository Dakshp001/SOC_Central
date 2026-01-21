import { useMemo } from 'react';
import { AllToolData, EnhancedMerakiData } from '@/lib/api';
import { 
  isSIEMData, 
  isGSuiteData, 
  isMDMData, 
  isEDRData, 
  isMerakiData, 
  isEnhancedMeraki 
} from '../utils/typeGuards';
import { hasEnhancedSIEMFeatures, hasEnhancedGSuiteFeatures } from '../utils/featureChecks';
import { FeatureStatus } from '../types/FeatureStatus.types';

export const useFeatureStatus = (data: AllToolData, toolType: string): FeatureStatus => {
  return useMemo(() => {
    // Add explicit checks to ensure data is valid
    if (!data || typeof data !== 'object') {
      return { enhanced: false, type: 'default' };
    }

    switch (toolType) {
      case 'siem':
        if (isSIEMData(data)) {
          const hasEnhanced = hasEnhancedSIEMFeatures(data);
          return {
            enhanced: hasEnhanced,
            type: 'siem',
            totalAlerts: data.analytics?.totalAlertsCount,
            topAlertsBySeverity: Object.keys(data.analytics?.topAlertsBySeverity || {}).length,
            topUsersBySeverity: Object.keys(data.analytics?.topUsersBySeverity || {}).length,
          };
        }
        break;
        
      case 'gsuite':
        if (isGSuiteData(data)) {
          const hasEnhanced = hasEnhancedGSuiteFeatures(data);
          return {
            enhanced: hasEnhanced,
            type: 'gsuite',
            emailsScanned: data.kpis?.emailsScanned || 0,
            clientInvestigations: (data.kpis as any)?.clientInvestigations || 0,
            hasAnalytics: !!(data as any).analytics,
          };
        }
        break;
        
      case 'mdm':
        if (isMDMData(data)) {
          return {
            enhanced: true, // MDM already has enhanced features
            type: 'mdm',
            totalDevices: data.kpis?.totalDevices || 0,
            complianceRate: data.kpis?.complianceRate || 0,
            hasAnalytics: !!data.analytics,
          };
        }
        break;

      case 'edr':
        if (isEDRData(data)) {
          return {
            enhanced: true, // EDR now has enhanced features
            type: 'edr',
            totalEndpoints: data.kpis.totalEndpoints,
            securityScore: data.kpis.securityScore,
            totalThreats: data.kpis.totalThreats,
            hasAnalytics: !!data.analytics,
          };
        }
        break;

      case 'meraki':
        if (isMerakiData(data)) {
          const hasEnhanced = isEnhancedMeraki(data);
          return {
            enhanced: hasEnhanced,
            type: 'meraki',
            totalDevices: data.kpis?.totalDevices || 0,
            networkHealthScore: hasEnhanced ? (data as EnhancedMerakiData).kpis?.networkHealthScore || 0 : 0,
            hasAnalytics: hasEnhanced ? !!(data as EnhancedMerakiData).analytics : false,
            hasInsights: hasEnhanced ? !!(data as EnhancedMerakiData).insights : false,
          };
        }
        break;
    }
    
    return {
      enhanced: false,
      type: 'default'
    };
  }, [data, toolType]);
};