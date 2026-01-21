// GSuite Processes Component - Glass Morphism
// Save as: src/components/SOCProcesses/GSuiteProcesses.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  ArrowDown, 
  Settings, 
  Lock, 
  Shield 
} from 'lucide-react';
import { ProcessCard } from './ProcessCard';
import { FlowStep } from './FlowStep';
import { CommunicationMatrix } from './CommunicationMatrix';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

export const GSuiteProcesses: React.FC = () => {
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
            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-foreground">GSuite Process</h2>
          </div>
          <p className="text-base text-muted-foreground">
            Email security operations including phishing detection, policy management, and threat response.
          </p>
        </div>
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>

      {/* Main Process Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProcessCard title="Email Security Workflow" icon={Mail}>
          <div className="space-y-4">
            <FlowStep 
              number={1} 
              title="KPI Monitoring" 
              description="Track email threats, phishing attempts, and security metrics"
              color="blue"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={2} 
              title="Phishing Investigation" 
              description="Analyze headers, attachments, URLs, and sender reputation"
              color="blue"
            />
            <div className="flex justify-center">
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <FlowStep 
              number={3} 
              title="Higher Authority Reporting" 
              description="Escalate unusual activities and phishing campaigns"
              color="blue"
            />
          </div>
        </ProcessCard>

        <CommunicationMatrix tool="gsuite" />
      </div>

      {/* Security Policy Configuration */}
      <ProcessCard title="Security Policy Configuration" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
              <Lock className="h-4 w-4" />
              Email Authentication
            </h4>
            <div className="space-y-3">
              <div className="
                relative overflow-hidden
                backdrop-blur-sm 
                bg-green-50/30 dark:bg-green-950/20
                border border-green-200/40 dark:border-green-800/40
                rounded-lg
                p-3
              ">
                <div className="font-medium text-sm text-foreground">DKIM Configuration</div>
                <div className="text-xs text-muted-foreground">Domain key validation</div>
              </div>
              <div className="
                relative overflow-hidden
                backdrop-blur-sm 
                bg-green-50/30 dark:bg-green-950/20
                border border-green-200/40 dark:border-green-800/40
                rounded-lg
                p-3
              ">
                <div className="font-medium text-sm text-foreground">DMARC Policy</div>
                <div className="text-xs text-muted-foreground">Email authentication protocol</div>
              </div>
              <div className="
                relative overflow-hidden
                backdrop-blur-sm 
                bg-green-50/30 dark:bg-green-950/20
                border border-green-200/40 dark:border-green-800/40
                rounded-lg
                p-3
              ">
                <div className="font-medium text-sm text-foreground">SPF Records</div>
                <div className="text-xs text-muted-foreground">Sender verification</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Shield className="h-4 w-4" />
              Advanced Security Features
            </h4>
            <div className="space-y-3">
              {[
                { title: "Suspicious Prefix Detection", desc: "Automated threat identification" },
                { title: "Link Scanner", desc: "URL threat analysis" },
                { title: "Domain/IP Blocking", desc: "Malicious sender blocking" },
                { title: "Traffic Monitoring", desc: "Real-time email analysis" },
                { title: "Whitelist Management", desc: "Client-specific trusted domains" }
              ].map((feature, index) => (
                <div key={index} className="
                  relative overflow-hidden
                  backdrop-blur-sm 
                  bg-blue-50/30 dark:bg-blue-950/20
                  border border-blue-200/40 dark:border-blue-800/40
                  rounded-lg
                  p-3
                ">
                  <div className="font-medium text-sm text-foreground">{feature.title}</div>
                  <div className="text-xs text-muted-foreground">{feature.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProcessCard>
    </div>
  );
};