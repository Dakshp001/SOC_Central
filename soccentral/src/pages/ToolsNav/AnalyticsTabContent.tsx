// Analytics Tab Content Component - Glass Morphism
// Save as: src/pages/ToolsNav/AnalyticsTabContent.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { BarChart3, Upload } from 'lucide-react';
import { AnalyticsDashboard } from '@/components/Dashboard-Analytics/AnalyticsDashboard';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

type ToolType = 'gsuite' | 'mdm' | 'siem' | 'edr' | 'meraki' | 'sonicwall' | 'general';

interface AnalyticsTabContentProps {
  selectedTool: ToolType;
  selectedToolName: string;
  currentData: any;
  onSetActiveTab: (tab: 'upload' | 'processes' | 'analytics') => void;
}

export const AnalyticsTabContent: React.FC<AnalyticsTabContentProps> = ({
  selectedTool,
  selectedToolName,
  currentData,
  onSetActiveTab,
}) => {
  const { actualTheme } = useTheme();

  // EDR dashboard should always be shown (even without data) for Live API access
  const shouldAlwaysShowDashboard = selectedTool === 'edr';

  return (
    <TabsContent value="analytics" className="space-y-4 m-0">
      {(currentData || shouldAlwaysShowDashboard) ? (
        <div
          className="
            relative overflow-hidden
            backdrop-blur-xl
            bg-background/40 dark:bg-background/30
            border border-border/40 dark:border-border/30
            rounded-xl
            shadow-lg shadow-black/5 dark:shadow-black/20
          "
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />

          <div className="relative p-6 text-foreground">
            <AnalyticsDashboard data={currentData} toolType={selectedTool} />
          </div>

          {/* Accent line */}
          <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        </div>
      ) : (
        <div
          className="
            relative overflow-hidden
            backdrop-blur-xl
            bg-background/40 dark:bg-background/30
            border border-border/40 dark:border-border/30
            rounded-xl
            shadow-lg shadow-black/5 dark:shadow-black/20
          "
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />

          <div className="relative p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              No Data Available
            </h3>
            <p className="mb-4 text-muted-foreground">
              Upload a {selectedToolName} file to view analytics and insights.
            </p>
            <Button
              onClick={() => onSetActiveTab('upload')}
              className="
                flex items-center gap-2
                bg-primary/80 text-primary-foreground
                hover:bg-primary/90
                backdrop-blur-sm shadow-lg
              "
            >
              <Upload className="h-4 w-4" />
              Upload Data
            </Button>
          </div>

          {/* Accent line */}
          <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        </div>
      )}
    </TabsContent>
  );
};
