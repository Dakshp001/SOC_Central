// MDM Processes Component - Glass Morphism
// Save as: src/components/SOCProcesses/MDMProcesses.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Settings, 
  ArrowDown, 
  Trash2, 
  Shield, 
  RefreshCw,
  Mail,
  FileText,
  MessageSquare
} from 'lucide-react';
import { ProcessCard } from './ProcessCard';
import { FlowStep } from './FlowStep';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

export const MDMProcesses: React.FC = () => {
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
            <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-foreground">MDM Process</h2>
          </div>
          <p className="text-base text-muted-foreground">
            Mobile Device Management with compliance monitoring and lifecycle management.
          </p>
        </div>
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      {/* Main Process Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProcessCard title="Device Management Workflow" icon={Settings}>
          <div className="space-y-4">
            <FlowStep 
              number={1} 
              title="KPI Monitoring" 
              description="Track device compliance, security status, and performance metrics"
              color="purple"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={2} 
              title="Compliance Check" 
              description="Automated policy validation and violation detection"
              color="purple"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={3} 
              title="Monthly Reporting" 
              description="Comprehensive device status and security reports"
              color="purple"
            />
          </div>
        </ProcessCard>

        {/* Communication Protocol */}
        <div className="
          relative overflow-hidden
          backdrop-blur-xl 
          bg-background/40 dark:bg-background/30 
          border border-border/40 dark:border-border/30
          rounded-xl
          shadow-lg shadow-black/5 dark:shadow-black/20
          transition-all duration-200 
          hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30
          hover:bg-background/50 dark:hover:bg-background/40
        ">
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
          
          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Communication Protocol</h3>
            </div>

            <div className="space-y-3">
              <div className="
                relative overflow-hidden
                backdrop-blur-sm 
                bg-blue-50/30 dark:bg-blue-950/20
                border border-blue-200/40 dark:border-blue-800/40
                rounded-lg
                p-3
              ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-foreground">Email Only</span>
                  </div>
                  <Badge variant="outline" className="bg-background/60 backdrop-blur-sm">Standard</Badge>
                </div>
              </div>
              
              <div className="
                relative overflow-hidden
                backdrop-blur-sm 
                bg-green-50/30 dark:bg-green-950/20
                border border-green-200/40 dark:border-green-800/40
                rounded-lg
                p-3
              ">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-foreground">Monthly Reports</span>
                  </div>
                  <Badge variant="outline" className="bg-background/60 backdrop-blur-sm">Scheduled</Badge>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        </div>
      </div>

      {/* Device Lifecycle & Security Actions */}
      <ProcessCard title="Device Lifecycle & Security Actions" icon={Smartphone}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="h-4 w-4" />
              Auto-Wipe Policy
            </h4>
            <div className="
              relative overflow-hidden
              backdrop-blur-sm 
              bg-red-50/30 dark:bg-red-950/20
              border border-red-200/40 dark:border-red-800/40
              rounded-lg
              p-4
            ">
              <div className="text-sm text-center text-muted-foreground">
                <div className="font-medium text-foreground">200+ Days Offline</div>
                <ArrowDown className="h-4 w-4 mx-auto my-2" />
                <div>Device Wipe</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Shield className="h-4 w-4" />
              Compliance Monitoring
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Security policy adherence</div>
              <div>• Configuration validation</div>
              <div>• Risk assessment</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
              <RefreshCw className="h-4 w-4" />
              Bulk Patch Management
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Scripted updates</div>
              <div>• Security patches</div>
              <div>• Version control</div>
            </div>
          </div>
        </div>
      </ProcessCard>
    </div>
  );
};