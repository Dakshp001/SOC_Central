import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wifi, 
  Router, 
  Shield, 
  ArrowDown 
} from 'lucide-react';
import { ProcessCard } from './ProcessCard';
import { FlowStep } from './FlowStep';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

export const MerakiProcesses: React.FC = () => {
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
            <Wifi className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-foreground">Meraki Process</h2>
          </div>
          <p className="text-base text-muted-foreground">
            Network security monitoring and wireless infrastructure management with comprehensive visibility.
          </p>
        </div>
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      {/* Main Process Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProcessCard title="Network Monitoring Workflow" icon={Router}>
          <div className="space-y-4">
            <FlowStep 
              number={1} 
              title="Infrastructure Monitoring" 
              description="Monitor access points, switches, and security appliances"
              color="info"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={2} 
              title="Traffic Analysis" 
              description="Analyze network patterns and identify anomalies"
              color="info"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={3} 
              title="Security Policy Enforcement" 
              description="Apply and monitor network security policies"
              color="info"
            />
          </div>
        </ProcessCard>

        <ProcessCard title="Threat Detection & Response" icon={Shield}>
          <div className="space-y-4">
            <FlowStep 
              number={1} 
              title="Intrusion Detection" 
              description="Monitor for unauthorized access attempts"
              color="high"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={2} 
              title="Content Filtering" 
              description="Block malicious websites and content"
              color="high"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={3} 
              title="Incident Response" 
              description="Isolate threats and implement countermeasures"
              color="high"
            />
          </div>
        </ProcessCard>
      </div>

      {/* Network Security Features */}
      <ProcessCard title="Network Security Features" icon={Wifi}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-blue-600 dark:text-blue-400">Access Control</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• SSID management</div>
              <div>• User authentication</div>
              <div>• Device identification</div>
              <div>• Guest network isolation</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-green-600 dark:text-green-400">Threat Protection</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Advanced malware protection</div>
              <div>• Intrusion detection/prevention</div>
              <div>• Content filtering</div>
              <div>• Application visibility</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-yellow-600 dark:text-yellow-400">Monitoring & Analytics</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• Real-time network visibility</div>
              <div>• Traffic analysis</div>
              <div>• Performance monitoring</div>
              <div>• Security event logging</div>
            </div>
          </div>
        </div>
      </ProcessCard>
    </div>
  );
};