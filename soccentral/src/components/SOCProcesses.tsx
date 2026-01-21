import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SIEMProcesses } from './SOCProcesses/SIEMProcesses';
import { MDMProcesses } from './SOCProcesses/MDMProcesses';
import { EDRProcesses } from './SOCProcesses/EDRProcesses';
import { GSuiteProcesses } from './SOCProcesses/GSuiteProcesses';
import { MerakiProcesses } from './SOCProcesses/MerakiProcesses';
import { SonicWallProcesses } from './SOCProcesses/SonicWallProcesses';
import { SOCGuidelines } from './SOCProcesses/SOCGuidelines';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

type ToolType = 'gsuite' | 'mdm' | 'siem' | 'edr' | 'meraki' | 'sonicwall';

interface SOCProcessesProps {
  toolType: ToolType;
}

export const SOCProcesses: React.FC<SOCProcessesProps> = ({ toolType }) => {
  const { actualTheme  } = useTheme();
  
  // Main render function
  const renderProcesses = () => {
    switch (toolType) {
      case 'gsuite':
        return <GSuiteProcesses />;
      case 'mdm':
        return <MDMProcesses />;
      case 'siem':
        return <SIEMProcesses />;
      case 'edr':
        return <EDRProcesses />;
      case 'meraki':
        return <MerakiProcesses />;
      case 'sonicwall':
        return <SonicWallProcesses />;
      default:
        return (
          <Card className={actualTheme  === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
            <CardContent className="p-8 text-center">
              <p className={actualTheme  === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Select a tool to view SOC processes</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderProcesses()}
      
      {/* SOC Best Practices */}
      <SOCGuidelines />
    </div>
  );
};