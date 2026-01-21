// Tool Selection Grid Component - Glass Morphism
// Save as: src/pages/ToolsNav/ToolSelectionGrid.tsx

import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Mail, Smartphone, Shield, Activity, Wifi, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

type ToolType = 'gsuite' | 'mdm' | 'siem' | 'edr' | 'meraki' | 'sonicwall' | 'general';

interface ToolSelectionGridProps {
  selectedTool: ToolType;
  onToolSelect: (toolType: ToolType) => void;
  getDataStatusBadge: (toolId: ToolType) => React.ReactNode;
  showUploadInfo?: boolean; // New prop to control upload-related messaging
  accessibleTools?: string[]; // New prop for filtering accessible tools
}

export const ToolSelectionGrid: React.FC<ToolSelectionGridProps> = React.memo(({
  selectedTool,
  onToolSelect,
  getDataStatusBadge,
  showUploadInfo = true, // Default to true for backward compatibility
  accessibleTools = [] // Default to empty array
}) => {
  const { actualTheme } = useTheme();

  // Memoize the tool click handler to prevent unnecessary re-renders
  const handleToolClick = useCallback((toolId: ToolType) => {
    console.log('Tool selected:', toolId);
    onToolSelect(toolId);
  }, [onToolSelect]);

  const tools = [
    {
      id: 'gsuite' as ToolType,
      name: 'GSuite Security',
      icon: Mail,
      color: 'bg-blue-500/80',
      description: 'Email security and phishing analysis',
      uploadSupported: true
    },
    {
      id: 'mdm' as ToolType,
      name: 'MDM Analytics',
      icon: Smartphone,
      color: 'bg-green-500/80',
      description: 'Mobile device management insights',
      uploadSupported: true
    },
    {
      id: 'siem' as ToolType,
      name: 'SIEM Analytics',
      icon: Shield,
      color: 'bg-red-500/80',
      description: 'Security information and event management',
      uploadSupported: true
    },
    {
      id: 'edr' as ToolType,
      name: 'EDR Monitoring',
      icon: Activity,
      color: 'bg-orange-500/80',
      description: 'Endpoint detection and response',
      uploadSupported: true
    },
    {
      id: 'meraki' as ToolType,
      name: 'Meraki Network',
      icon: Wifi,
      color: 'bg-purple-500/80',
      description: 'Network security and monitoring',
      uploadSupported: true
    },
    {
      id: 'sonicwall' as ToolType,
      name: 'SonicWall Security',
      icon: ShieldCheck,
      color: 'bg-indigo-500/80',
      description: 'Firewall and intrusion prevention',
      uploadSupported: true
    }
  ];

  // Filter tools based on user access - show all if accessibleTools is empty (backward compatibility)
  const filteredTools = accessibleTools.length > 0
    ? tools.filter(tool => accessibleTools.includes(tool.id))
    : tools;

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
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground leading-tight flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Security Tools
            </h2>
            <p className="text-sm text-muted-foreground">
              {showUploadInfo 
                ? "Select a security tool for analysis and data upload"
                : "Select a security tool for analysis and SOC processes"
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.id;
              
              return (
                <div
                  key={tool.id}
                  className={`
                    relative overflow-hidden
                    backdrop-blur-xl 
                    bg-background/40 dark:bg-background/30 
                    border border-border/40 dark:border-border/30
                    rounded-xl
                    shadow-lg shadow-black/5 dark:shadow-black/20
                    transition-all duration-200 
                    hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30
                    hover:bg-background/50 dark:hover:bg-background/40
                    hover:-translate-y-0.5
                    cursor-pointer
                    ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}
                  `}
                  onClick={() => handleToolClick(tool.id)}
                >
                  {/* Card gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
                  
                  <div className="relative p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${tool.color} backdrop-blur-sm flex items-center justify-center shadow-sm`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-foreground text-sm">
                          {tool.name}
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          {tool.description}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getDataStatusBadge(tool.id)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Accent line */}
                  <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced accent lines for depth */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>
    </div>
  );
});