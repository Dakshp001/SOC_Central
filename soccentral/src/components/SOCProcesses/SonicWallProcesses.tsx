import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ShieldCheck, 
  Shield, 
  Globe, 
  ArrowDown 
} from 'lucide-react';
import { ProcessCard } from './ProcessCard';
import { FlowStep } from './FlowStep';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

export const SonicWallProcesses: React.FC = () => {
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
            <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-foreground">SonicWall Process</h2>
          </div>
          <p className="text-base text-muted-foreground">
            Next-generation firewall management with advanced threat protection and network security enforcement.
          </p>
        </div>
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      {/* Main Process Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProcessCard title="Firewall Management Workflow" icon={Shield}>
          <div className="space-y-4">
            <FlowStep 
              number={1} 
              title="Rule Management" 
              description="Configure and maintain firewall policies and rules"
              color="critical"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={2} 
              title="Threat Detection" 
              description="Monitor for intrusions and malicious activities"
              color="critical"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={3} 
              title="VPN Monitoring" 
              description="Manage secure remote access connections"
              color="critical"
            />
          </div>
        </ProcessCard>

        <ProcessCard title="Security Services" icon={Globe}>
          <div className="space-y-4">
            <FlowStep 
              number={1} 
              title="Gateway Anti-Virus" 
              description="Real-time malware detection and blocking"
              color="low"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={2} 
              title="Intrusion Prevention" 
              description="Block known attack patterns and exploits"
              color="low"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={3} 
              title="Content Filtering" 
              description="Control web access and application usage"
              color="low"
            />
          </div>
        </ProcessCard>
      </div>

      {/* Advanced Security Features */}
      <ProcessCard title="Advanced Security Features" icon={ShieldCheck}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-red-600 dark:text-red-400">Threat Prevention</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Anti-malware scanning</div>
              <div>• Intrusion prevention</div>
              <div>• Anti-spyware protection</div>
              <div>• Botnet filtering</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-blue-600 dark:text-blue-400">Access Control</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Application control</div>
              <div>• Content filtering</div>
              <div>• User authentication</div>
              <div>• VPN management</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-green-600 dark:text-green-400">Network Security</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Deep packet inspection</div>
              <div>• SSL/TLS decryption</div>
              <div>• Network segmentation</div>
              <div>• Traffic shaping</div>
            </div>
          </div>
        </div>
      </ProcessCard>
    </div>
  );
};