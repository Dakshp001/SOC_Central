// src/components/dashboards/GSuite/components/SummaryAlert.tsx

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity } from 'lucide-react';
import { EnhancedGSuiteData } from '../types';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface SummaryAlertProps {
  data: EnhancedGSuiteData;
  analyticsData: {
    totalSecurityEvents: number;
    securityEventRate: string;
  };
}

export const SummaryAlert: React.FC<SummaryAlertProps> = ({ data, analyticsData }) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes
  const alertBg = actualTheme === 'dark' 
    ? "bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-800" 
    : "bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-blue-300";
  
  const alertTextColor = actualTheme === 'dark' ? "text-blue-300" : "text-blue-700";
  const iconColor = actualTheme === 'dark' ? "text-blue-400" : "text-blue-600";
  
  return (
    <Alert className={alertBg}>
      <Activity className={`h-4 w-4 ${iconColor}`} />
      <AlertDescription className={alertTextColor}>
        <strong>Security Overview:</strong> {analyticsData.totalSecurityEvents.toLocaleString()} security events detected 
        from {data.kpis.emailsScanned.toLocaleString()} emails scanned ({analyticsData.securityEventRate}% detection rate).
        {data.kpis.clientInvestigations > 0 && (
          <> {data.kpis.clientInvestigations} investigations coordinated with client SOC.</>
        )}
      </AlertDescription>
    </Alert>
  );
};