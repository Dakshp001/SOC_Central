// Analytics Tabs Component - Full Width Glass Morphism
// Save as: src/pages/ToolsNav/AnalyticsTabs.tsx

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Settings, BarChart3 } from 'lucide-react';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

type ToolType = 'gsuite' | 'mdm' | 'siem' | 'edr' | 'meraki' | 'sonicwall' | 'general';

interface AnalyticsTabsProps {
  activeTab: 'upload' | 'processes' | 'analytics';
  onTabChange: (value: string) => void;
  currentData: any;
  children: React.ReactNode;
  showUploadTab?: boolean; // New prop to conditionally show upload tab
}

export const AnalyticsTabs: React.FC<AnalyticsTabsProps> = ({
  activeTab,
  onTabChange,
  currentData,
  children,
  showUploadTab = true, // Default to true for backward compatibility
}) => {
  const { actualTheme } = useTheme();

  return (
    <div className="w-full">
      {/* Glass morphism container - Full Width */}
      <div className="
        w-full
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
        
        <div className="relative w-full px-8 py-6">
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full space-y-6">
            <div className="
              w-full
              backdrop-blur-xl 
              bg-background/40 dark:bg-background/30 
              border border-border/40 dark:border-border/30
              rounded-xl
              p-1
            ">
              <TabsList className={`grid w-full ${showUploadTab ? 'grid-cols-3' : 'grid-cols-2'} bg-transparent border-0 gap-1 relative z-20 pointer-events-auto`}>
                {showUploadTab && (
                  <TabsTrigger 
                    value="upload" 
                    className="
                      flex items-center gap-2 
                      text-muted-foreground 
                      data-[state=active]:text-foreground 
                      data-[state=active]:bg-background/60 
                      data-[state=active]:backdrop-blur-sm
                      data-[state=active]:shadow-sm
                      transition-all duration-200
                      rounded-lg
                      py-2.5
                      relative
                      z-20
                      pointer-events-auto
                    "
                  >
                    <Upload className="h-4 w-4" />
                    <span className="font-medium">Upload Data</span>
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="processes" 
                  className="
                    flex items-center gap-2 
                    text-muted-foreground 
                    data-[state=active]:text-foreground 
                    data-[state=active]:bg-background/60 
                    data-[state=active]:backdrop-blur-sm
                    data-[state=active]:shadow-sm
                    transition-all duration-200
                    rounded-lg
                    py-2.5
                    relative
                    z-20
                    pointer-events-auto
                  "
                >
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">SOC Processes</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="
                    flex items-center gap-2 
                    text-muted-foreground 
                    data-[state=active]:text-foreground 
                    data-[state=active]:bg-background/60 
                    data-[state=active]:backdrop-blur-sm
                    data-[state=active]:shadow-sm
                    transition-all duration-200
                    rounded-lg
                    py-2.5
                    relative
                    z-20
                    pointer-events-auto
                  "
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">Analytics</span>
                  {!currentData && (
                    <span className="text-xs text-muted-foreground/60 ml-1">
                      (No Data)
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="w-full space-y-4">
              {children}
            </div>
          </Tabs>
        </div>

        {/* Enhanced accent lines for depth */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>
    </div>
  );
};