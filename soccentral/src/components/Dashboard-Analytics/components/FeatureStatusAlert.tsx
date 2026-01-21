import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import { 
  FeatureStatus, 
  SIEMFeatureStatus, 
  GSuiteFeatureStatus, 
  MDMFeatureStatus, 
  MerakiFeatureStatus, 
  EDRFeatureStatus 
} from '../types/FeatureStatus.types';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface FeatureStatusAlertProps {
  featureStatus: FeatureStatus;
}

export const FeatureStatusAlert: React.FC<FeatureStatusAlertProps> = ({ featureStatus }) => {
  const { actualTheme } = useTheme(); // ✅ Get current theme

  if (!featureStatus.enhanced) return null;

  return (
    <Alert
      className={`border border-border rounded-md transition-colors ${
        actualTheme === 'dark'
          ? 'bg-card text-green-400'
          : 'bg-white text-green-600'
      }`}
    >
      <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
      <AlertDescription>
        {featureStatus.type === 'siem' && (
          <>
            ✨ <strong>Enhanced SIEM Analytics Active!</strong> Processing{' '}
            {(featureStatus as SIEMFeatureStatus).totalAlerts?.toLocaleString()} alerts with advanced severity analysis and user tracking.
          </>
        )}
        {featureStatus.type === 'gsuite' && (
          <>
            ✨ <strong>Enhanced GSuite Dashboard Active!</strong> Processing{' '}
            {(featureStatus as GSuiteFeatureStatus).emailsScanned?.toLocaleString()} emails with{' '}
            {(featureStatus as GSuiteFeatureStatus).clientInvestigations} client investigations and advanced analytics.
          </>
        )}
        {featureStatus.type === 'mdm' && (
          <>
            ✨ <strong>Enhanced MDM Analytics Active!</strong> Monitoring{' '}
            {(featureStatus as MDMFeatureStatus).totalDevices} devices with{' '}
            {(featureStatus as MDMFeatureStatus).complianceRate?.toFixed(1)}% compliance rate and comprehensive security analytics.
          </>
        )}
        {featureStatus.type === 'meraki' && (
          <>
            ✨ <strong>Enhanced Meraki Analytics Active!</strong> Monitoring{' '}
            {(featureStatus as MerakiFeatureStatus).totalDevices} network devices with health score{' '}
            {(featureStatus as MerakiFeatureStatus).networkHealthScore}/100 and comprehensive network insights.
          </>
        )}
        {featureStatus.type === 'edr' && (
          <>
            ✨ <strong>Enhanced EDR Analytics Active!</strong> Monitoring{' '}
            {(featureStatus as EDRFeatureStatus).totalEndpoints?.toLocaleString()} endpoints with security score{' '}
            {(featureStatus as EDRFeatureStatus).securityScore?.toFixed(1)}% and{' '}
            {(featureStatus as EDRFeatureStatus).totalThreats} threats processed.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};
