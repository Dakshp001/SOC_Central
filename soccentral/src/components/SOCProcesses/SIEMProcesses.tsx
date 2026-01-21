// SIEM Processes Component - Glass Morphism
// Save as: src/components/SOCProcesses/SIEMProcesses.tsx

import React from 'react';
import { Shield, Activity, ArrowDown, XCircle, CheckCircle } from 'lucide-react';
import { ProcessCard } from './ProcessCard';
import { FlowStep } from './FlowStep';
import { CommunicationMatrix } from './CommunicationMatrix';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

export const SIEMProcesses: React.FC = () => {
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
            <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h2 className="text-2xl font-bold text-foreground">SIEM Process</h2>
          </div>
          <p className="text-base text-muted-foreground">
            Security Information and Event Management with real-time threat detection and response coordination.
          </p>
        </div>
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      {/* Main Process Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProcessCard title="Alert Processing Workflow" icon={Activity}>
          <div className="space-y-4">
            <FlowStep 
              number={1} 
              title="KPI Monitoring" 
              description="Monitor Critical, High, Medium, Low, and Info alerts with color-coded severity"
              color="info"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={2} 
              title="Ticket Generation" 
              description="Automated/manual ticket creation for each alert"
              color="info"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={3} 
              title="Initial Investigation" 
              description="Preliminary analysis and threat assessment"
              color="info"
            />
          </div>
        </ProcessCard>

        <CommunicationMatrix tool="siem" />
      </div>

      {/* Threat Classification & Response */}
      <ProcessCard title="Threat Classification & Response" icon={Shield}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
              <XCircle className="h-4 w-4" />
              False Positive Path
            </h4>
            <div className="space-y-3 pl-4 border-l-2 border-green-300 dark:border-green-700">
              <div className="text-sm text-muted-foreground">• Flag identification</div>
              <div className="text-sm text-muted-foreground">• Documentation</div>
              <div className="text-sm text-muted-foreground">• Case closure</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
              <CheckCircle className="h-4 w-4" />
              True Positive Path
            </h4>
            <div className="space-y-3 pl-4 border-l-2 border-red-300 dark:border-red-700">
              <div className="text-sm text-muted-foreground">• Access Management</div>
              <div className="text-sm text-muted-foreground">• Credential Rotation</div>
              <div className="text-sm text-muted-foreground">• User Restrictions/Termination</div>
              <div className="text-sm text-muted-foreground">• Damage Monitoring</div>
              <div className="text-sm text-muted-foreground">• EDR Scanning</div>
            </div>
          </div>
        </div>
      </ProcessCard>
    </div>
  );
};