// Processes Tab Content Component - Glass Morphism
// Save as: src/pages/ToolsNav/ProcessesTabContent.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { SOCProcesses } from '@/components/SOCProcesses';
import { Card, CardContent } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

type ToolType = 'gsuite' | 'mdm' | 'siem' | 'edr' | 'meraki' | 'sonicwall' | 'general';
type SOCToolType = 'gsuite' | 'mdm' | 'siem' | 'edr' | 'meraki' | 'sonicwall';

interface ProcessesTabContentProps {
  selectedTool: ToolType;
}

export const ProcessesTabContent: React.FC<ProcessesTabContentProps> = ({
  selectedTool
}) => {
  const { actualTheme } = useTheme();

  // Handle the case where selectedTool is 'general'
  if (selectedTool === 'general') {
    return (
      <TabsContent value="processes" className="space-y-4 m-0">
        <div className="
          relative overflow-hidden
          backdrop-blur-xl 
          bg-background/40 dark:bg-background/30 
          border border-border/40 dark:border-border/30
          rounded-xl
          shadow-lg shadow-black/5 dark:shadow-black/20
        ">
          {/* Card gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
          
          <div className="relative p-8 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Select a Security Tool
            </h3>
            <p className="text-muted-foreground">
              Choose a specific tool to view related SOC processes and workflows
            </p>
          </div>
          
          {/* Accent line */}
          <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="processes" className="space-y-4 m-0">
      <div className="
        relative overflow-hidden
        backdrop-blur-xl 
        bg-background/40 dark:bg-background/30 
        border border-border/40 dark:border-border/30
        rounded-xl
        shadow-lg shadow-black/5 dark:shadow-black/20
      ">
        {/* Card gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
        
        <div className="relative p-6 text-foreground">
          <SOCProcesses
            toolType={selectedTool as SOCToolType}
          />
        </div>
        
        {/* Accent line */}
        <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>
    </TabsContent>
  );
};