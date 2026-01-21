// Tool Header Component - Glass Morphism
// Save as: src/pages/ToolsNav/ToolHeader.tsx

import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Mail, Smartphone, Shield, Activity, Wifi, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

type ToolType = 'gsuite' | 'mdm' | 'siem' | 'edr' | 'meraki' | 'sonicwall' | 'general';

interface Tool {
  id: ToolType;
  name: string;
  icon: any;
  color: string;
  description: string;
  uploadSupported: boolean;
}

interface ToolHeaderProps {
  selectedTool: ToolType;
  currentData: any;
  currentUploadTime: Date | null;
  onReset: (toolType: ToolType) => void;
  getDataStatusBadge: (toolId: ToolType) => React.ReactNode;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  selectedTool,
  currentData,
  currentUploadTime,
  onReset,
  getDataStatusBadge
}) => {
  const { actualTheme } = useTheme();

  const tools: Tool[] = [
    {
      id: 'gsuite',
      name: 'GSuite Security',
      icon: Mail,
      color: 'bg-blue-500/80',
      description: 'Email security and phishing analysis',
      uploadSupported: true
    },
    {
      id: 'mdm',
      name: 'MDM Analytics',
      icon: Smartphone,
      color: 'bg-green-500/80',
      description: 'Mobile device management insights',
      uploadSupported: true
    },
    {
      id: 'siem',
      name: 'SIEM Analytics',
      icon: Shield,
      color: 'bg-red-500/80',
      description: 'Security information and event management',
      uploadSupported: true
    },
    {
      id: 'edr',
      name: 'EDR Monitoring',
      icon: Activity,
      color: 'bg-orange-500/80',
      description: 'Endpoint detection and response',
      uploadSupported: true
    },
    {
      id: 'meraki',
      name: 'Meraki Network',
      icon: Wifi,
      color: 'bg-purple-500/80',
      description: 'Network security and monitoring',
      uploadSupported: true
    },
    {
      id: 'sonicwall',
      name: 'SonicWall Security',
      icon: ShieldCheck,
      color: 'bg-indigo-500/80',
      description: 'Firewall and intrusion prevention',
      uploadSupported: true
    }
  ];

  const selectedToolData = tools.find(tool => tool.id === selectedTool);

  if (!selectedToolData) return null;

  return (
    <div className="w-[98%] max-w-8xl mx-auto mb-6">
      {/* Glass morphism container */}
      <div className="
        relative overflow-hidden
        backdrop-blur-2xl 
        bg-background/60 dark:bg-background/40 
        border border-border/30 dark:border-border/20
        rounded-2xl
        shadow-xl shadow-black/5 dark:shadow-black/20
        transition-all duration-300
        hover:shadow-2xl hover:shadow-black/8 dark:hover:shadow-black/30
        hover:bg-background/70 dark:hover:bg-background/50
      ">
        {/* Enhanced gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/5 pointer-events-none" />
        
        <div className="relative px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg ${selectedToolData.color} backdrop-blur-sm flex items-center justify-center shadow-sm`}>
                <selectedToolData.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  {selectedToolData.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedToolData.description}
                </p>
                {currentUploadTime && (
                  <p className="text-xs mt-1 text-muted-foreground/80">
                    Last uploaded: {currentUploadTime.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getDataStatusBadge(selectedTool)}
              {selectedToolData.uploadSupported && (
                <Badge variant="default" className="text-sm bg-primary/80 text-primary-foreground backdrop-blur-sm">
                  Upload Enabled
                </Badge>
              )}
              {currentData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReset(selectedTool)}
                  className="flex items-center gap-2 border-border/40 text-muted-foreground hover:bg-primary/5 transition-colors backdrop-blur-sm"
                >
                  <RefreshCw className="h-3 w-3" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced accent lines for depth */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>
    </div>
  );
};