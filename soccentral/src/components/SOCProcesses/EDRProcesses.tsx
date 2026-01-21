import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Eye, 
  ArrowDown, 
  Settings, 
  AlertTriangle, 
  Shield 
} from 'lucide-react';
import { ProcessCard } from './ProcessCard';
import { FlowStep } from './FlowStep';
import { CommunicationMatrix } from './CommunicationMatrix';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

// EDR Processes Component - Glass Morphism
// Save as: src/components/SOCProcesses/EDRProcesses.tsx

export const EDRProcesses: React.FC = () => {
  const { actualTheme } = useTheme();
  
  return (
    <div className="w-full mx-auto space-y-6">
      {/* Header Card */}
      <div className="
        relative overflow-hidden
        backdrop-blur-2xl 
        bg-background/60 dark:bg-background/40 
        border border-border/30 dark:border-border/20
        rounded-2xl
        shadow-xl shadow-black/5 dark:shadow-black/20
      ">
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20 pointer-events-none" />
        <div className="relative px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <h2 className="text-2xl font-bold text-foreground">EDR Process</h2>
          </div>
          <p className="text-base text-muted-foreground">
            Endpoint Detection and Response with behavioral analysis and threat hunting capabilities.
          </p>
        </div>
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      {/* Main Process Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProcessCard title="Threat Detection Workflow" icon={Activity}>
          <div className="space-y-4">
            <FlowStep 
              number={1} 
              title="KPI Analysis" 
              description="Monitor critical threats, endpoints, and security metrics"
              color="red"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={2} 
              title="Report Generation" 
              description="Automated threat detection reports for critical findings"
              color="red"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={3} 
              title="Investigation & Classification" 
              description="Analyze and categorize as false positive or malicious"
              color="red"
            />
          </div>
        </ProcessCard>

        <CommunicationMatrix tool="edr" />
      </div>

      {/* Threat Response & Remediation */}
      <ProcessCard title="Threat Response & Remediation" icon={Shield}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Settings className="h-4 w-4" />
                False Positive Response
              </h4>
              <div className="space-y-3 pl-4 border-l-2 border-orange-300 dark:border-orange-700">
                <FlowStep number={1} title="Local Environment Setup" description="Download and analyze in isolated environment" color="orange" />
                <FlowStep number={2} title="Quarantine Process" description="Isolate suspected files/processes" color="orange" />
                <FlowStep number={3} title="Process Termination" description="Remote shell or manual CSU intervention" color="orange" />
                <FlowStep number={4} title="Detailed Reporting" description="Generate comprehensive analysis report" color="orange" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Critical Response
              </h4>
              <div className="space-y-3 pl-4 border-l-2 border-red-300 dark:border-red-700">
                <FlowStep number={1} title="Device Isolation" description="Disconnect from network immediately" color="red" />
                <FlowStep number={2} title="System Wipe" description="Complete system remediation if needed" color="red" />
                <FlowStep number={3} title="Recovery Process" description="System restoration and validation" color="red" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="
              relative overflow-hidden
              backdrop-blur-sm 
              bg-blue-50/30 dark:bg-blue-950/20
              border border-blue-200/40 dark:border-blue-800/40
              rounded-lg
              p-4
            ">
              <h4 className="font-medium mb-2 text-blue-600 dark:text-blue-400">
                Daily Patch Management
              </h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div>• Automated vulnerability scanning</div>
                <div>• Script-based patch deployment</div>
                <div>• Remote shell management</div>
              </div>
            </div>
            
            <div className="
              relative overflow-hidden
              backdrop-blur-sm 
              bg-green-50/30 dark:bg-green-950/20
              border border-green-200/40 dark:border-green-800/40
              rounded-lg
              p-4
            ">
              <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">
                Agent Management
              </h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div>• Agent updates and maintenance</div>
                <div>• Log retrieval optimization</div>
                <div>• Performance monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </ProcessCard>
    </div>
  );
};