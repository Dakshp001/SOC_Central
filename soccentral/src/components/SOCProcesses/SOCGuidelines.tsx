// SOC Guidelines Component - Glass Morphism
// Save as: src/components/SOCProcesses/SOCGuidelines.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

export const SOCGuidelines: React.FC = () => {
  const { actualTheme } = useTheme();
  
  return (
    <div className="w-full mx-auto mb-6">
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
            <h2 className="text-2xl font-bold text-foreground leading-tight">SOC Response Guidelines</h2>
            <p className="text-base text-muted-foreground">
              Standard operating procedures for incident response and escalation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Response Time Targets */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground text-lg">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Response Time Targets
              </h3>
              <div className="space-y-3">
                <div className="
                  relative overflow-hidden
                  backdrop-blur-sm 
                  bg-red-50/30 dark:bg-red-950/20
                  border border-red-200/40 dark:border-red-800/40
                  rounded-lg
                  p-3
                  transition-all duration-200
                  hover:shadow-lg
                ">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Critical incidents</span>
                    <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 backdrop-blur-sm">
                      Immediate
                    </Badge>
                  </div>
                </div>

                <div className="
                  relative overflow-hidden
                  backdrop-blur-sm 
                  bg-orange-50/30 dark:bg-orange-950/20
                  border border-orange-200/40 dark:border-orange-800/40
                  rounded-lg
                  p-3
                  transition-all duration-200
                  hover:shadow-lg
                ">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">High severity</span>
                    <Badge className="bg-orange-600 hover:bg-orange-700 text-white border-0 backdrop-blur-sm">
                      15 min
                    </Badge>
                  </div>
                </div>

                <div className="
                  relative overflow-hidden
                  backdrop-blur-sm 
                  bg-yellow-50/30 dark:bg-yellow-950/20
                  border border-yellow-200/40 dark:border-yellow-800/40
                  rounded-lg
                  p-3
                  transition-all duration-200
                  hover:shadow-lg
                ">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Medium severity</span>
                    <Badge className="bg-yellow-600 hover:bg-yellow-700 text-black border-0 backdrop-blur-sm">
                      15-24 hrs
                    </Badge>
                  </div>
                </div>

                <div className="
                  relative overflow-hidden
                  backdrop-blur-sm 
                  bg-blue-50/30 dark:bg-blue-950/20
                  border border-blue-200/40 dark:border-blue-800/40
                  rounded-lg
                  p-3
                  transition-all duration-200
                  hover:shadow-lg
                ">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Low severity</span>
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0 backdrop-blur-sm">
                      3 days
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Escalation Matrix */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-foreground text-lg">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                Escalation Matrix
              </h3>
              <div className="space-y-3">
                <div className="
                  relative overflow-hidden
                  backdrop-blur-sm 
                  bg-blue-50/30 dark:bg-blue-950/20
                  border border-blue-200/40 dark:border-blue-800/40
                  rounded-lg
                  p-3
                  transition-all duration-200
                  hover:shadow-lg
                ">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">L1 Analyst</span>
                    <span className="text-sm text-muted-foreground">Initial triage</span>
                  </div>
                </div>

                <div className="
                  relative overflow-hidden
                  backdrop-blur-sm 
                  bg-green-50/30 dark:bg-green-950/20
                  border border-green-200/40 dark:border-green-800/40
                  rounded-lg
                  p-3
                  transition-all duration-200
                  hover:shadow-lg
                ">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">L2 Analyst</span>
                    <span className="text-sm text-muted-foreground">Investigation</span>
                  </div>
                </div>

                <div className="
                  relative overflow-hidden
                  backdrop-blur-sm 
                  bg-yellow-50/30 dark:bg-yellow-950/20
                  border border-yellow-200/40 dark:border-yellow-800/40
                  rounded-lg
                  p-3
                  transition-all duration-200
                  hover:shadow-lg
                ">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">L3 Specialist</span>
                    <span className="text-sm text-muted-foreground">Advanced analysis</span>
                  </div>
                </div>

                <div className="
                  relative overflow-hidden
                  backdrop-blur-sm 
                  bg-background/40 dark:bg-background/30
                  border border-border/40 dark:border-border/30
                  rounded-lg
                  p-3
                  transition-all duration-200
                  hover:shadow-lg
                ">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">SOC Manager</span>
                    <span className="text-sm text-muted-foreground">Incident commander</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Guidelines Section */}
          <div className="mt-8 pt-6 border-t border-border/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="
                relative overflow-hidden
                backdrop-blur-sm 
                bg-background/40 dark:bg-background/30
                border border-border/40 dark:border-border/30
                rounded-lg
                p-4
                text-center
              ">
                <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring Coverage</div>
              </div>

              <div className="
                relative overflow-hidden
                backdrop-blur-sm 
                bg-background/40 dark:bg-background/30
                border border-border/40 dark:border-border/30
                rounded-lg
                p-4
                text-center
              ">
                <div className="text-2xl font-bold text-primary mb-1">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime Target</div>
              </div>

              <div className="
                relative overflow-hidden
                backdrop-blur-sm 
                bg-background/40 dark:bg-background/30
                border border-border/40 dark:border-border/30
                rounded-lg
                p-4
                text-center
              ">
                <div className="text-2xl font-bold text-primary mb-1">&lt;5min</div>
                <div className="text-sm text-muted-foreground">Critical Response</div>
              </div>
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