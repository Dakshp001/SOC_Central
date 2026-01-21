import React from 'react';
import { AllToolData, GSuiteData, MerakiData, EnhancedMerakiData, isEnhancedGSuiteData } from '@/lib/api';
import { 
  isSIEMData, 
  isGSuiteData, 
  isMDMData, 
  isEDRData, 
  isMerakiData, 
  isEnhancedMeraki, 
  isSonicWallData 
} from '../utils/typeGuards';

// Import individual tool dashboards
import { SIEMDashboard } from '@/components/dashboards/SIEMDashboard';
import { MDMDashboard } from '@/components/dashboards/MDMDashboard';
import { GSuiteDashboard } from '@/components/dashboards/GSuiteDashboard';
import { MerakiDashboard } from '@/components/dashboards/MerakiDashboard';
import { EDRDashboardWrapper } from '@/components/dashboards/EDRDashboardWrapper';

// Import legacy dashboards (GSuite legacy removed - always use full dashboard)
import { LegacyMerakiDashboard } from '@/components/Dashboard-Analytics/LegacyDashboards//LegacyMerakiDashboard';
import { LegacySonicWallDashboard } from '@/components/Dashboard-Analytics/LegacyDashboards//LegacySonicWallDashboard';
import { GenericDashboard } from './GenericDashboard';

interface ToolDashboardRendererProps {
  data: AllToolData;
  toolType: string;
}

export const ToolDashboardRenderer: React.FC<ToolDashboardRendererProps> = ({ data, toolType }) => {
  const renderEnhancedGSuiteDashboard = (gsData: GSuiteData) => {
    // FORCE FULL DASHBOARD - Always use GSuiteDashboard from src/components/dashboards/GSuite
    console.log("🔍 GSuite Dashboard: FORCING full dashboard render");
    console.log("📊 Data received:", {
      hasKPIs: !!(gsData as any)?.kpis,
      fileType: (gsData as any)?.fileType,
      hasDetails: !!(gsData as any)?.details,
      isEnhanced: isEnhancedGSuiteData(gsData)
    });
    
    // Always return the full dashboard - no more legacy fallback
    return <GSuiteDashboard data={gsData} />;
  };

  // Render appropriate dashboard based on tool type
  const renderToolDashboard = () => {
    switch (toolType) {
      case 'siem':
        if (isSIEMData(data)) {
          return <SIEMDashboard data={data} />;
        }
        break;
      
      case 'gsuite':
        if (isGSuiteData(data)) {
          return renderEnhancedGSuiteDashboard(data);
        }
        break;
      
      case 'mdm':
        if (isMDMData(data)) {
          return <MDMDashboard data={data} />;
        }
        break;
      
      case 'edr':
        // Always render EDR wrapper - it handles both PDF and Live API modes
        if (isEDRData(data)) {
          return <EDRDashboardWrapper data={data} />;
        } else {
          // No PDF data, but still show wrapper for Live API option
          return <EDRDashboardWrapper data={null} />;
        }
      
      case 'meraki':
        if (isMerakiData(data)) {
          if (isEnhancedMeraki(data)) {
            return <MerakiDashboard data={data} />;
          } else {
            return <LegacyMerakiDashboard merakiData={data as MerakiData} />;
          }
        }
        break;
      
      case 'sonicwall':
        if (isSonicWallData(data)) {
          return <LegacySonicWallDashboard sonicwallData={data} />;
        }
        break;
    }

    return <GenericDashboard data={data} toolType={toolType} />;
  };

  return <>{renderToolDashboard()}</>;
};
