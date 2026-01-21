import React from 'react';
import { Zap } from 'lucide-react';
import { 
  FeatureStatus, 
  SIEMFeatureStatus, 
  GSuiteFeatureStatus, 
  MDMFeatureStatus, 
  MerakiFeatureStatus, 
  EDRFeatureStatus 
} from '../types/FeatureStatus.types';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface EnhancedAnalyticsOverviewProps {
  featureStatus: FeatureStatus;
}

export const EnhancedAnalyticsOverview: React.FC<EnhancedAnalyticsOverviewProps> = ({ featureStatus }) => {
  const { actualTheme } = useTheme();

  if (!featureStatus.enhanced) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-4 text-foreground transition-colors">
      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
        <Zap className="h-5 w-5 text-purple-400" />
        Enhanced Analytics Overview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {featureStatus.type === 'siem' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>
                <strong className="text-blue-300">Total Alerts:</strong>{' '}
                {(featureStatus as SIEMFeatureStatus).totalAlerts?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                <strong className="text-green-300">Severity Analysis:</strong> Complete breakdown available
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>
                <strong className="text-purple-300">User Analytics:</strong> Per-severity user tracking
              </span>
            </div>
          </>
        )}

        {featureStatus.type === 'gsuite' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>
                <strong className="text-blue-300">Email Processing:</strong>{' '}
                {(featureStatus as GSuiteFeatureStatus).emailsScanned?.toLocaleString()} emails analyzed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                <strong className="text-green-300">Investigation Tracking:</strong>{' '}
                {(featureStatus as GSuiteFeatureStatus).clientInvestigations} SOC investigations
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>
                <strong className="text-purple-300">Advanced Analytics:</strong>{' '}
                {(featureStatus as GSuiteFeatureStatus).hasAnalytics ? 'Available' : 'Basic'}
              </span>
            </div>
          </>
        )}

        {featureStatus.type === 'mdm' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>
                <strong className="text-blue-300">Device Management:</strong>{' '}
                {(featureStatus as MDMFeatureStatus).totalDevices} devices monitored
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                <strong className="text-green-300">Compliance Rate:</strong>{' '}
                {(featureStatus as MDMFeatureStatus).complianceRate?.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>
                <strong className="text-purple-300">Security Analytics:</strong> Comprehensive tracking
              </span>
            </div>
          </>
        )}

        {featureStatus.type === 'meraki' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>
                <strong className="text-blue-300">Network Devices:</strong>{' '}
                {(featureStatus as MerakiFeatureStatus).totalDevices} devices monitored
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                <strong className="text-green-300">Health Score:</strong>{' '}
                {(featureStatus as MerakiFeatureStatus).networkHealthScore}/100
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>
                <strong className="text-purple-300">Network Analytics:</strong>{' '}
                {(featureStatus as MerakiFeatureStatus).hasAnalytics ? 'Full suite available' : 'Basic'}
              </span>
            </div>
          </>
        )}

        {featureStatus.type === 'edr' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>
                <strong className="text-red-300">Endpoint Security:</strong>{' '}
                {(featureStatus as EDRFeatureStatus).totalEndpoints?.toLocaleString()} endpoints monitored
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                <strong className="text-green-300">Security Score:</strong>{' '}
                {(featureStatus as EDRFeatureStatus).securityScore?.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>
                <strong className="text-orange-300">Threat Detection:</strong>{' '}
                {(featureStatus as EDRFeatureStatus).totalThreats} threats processed
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
