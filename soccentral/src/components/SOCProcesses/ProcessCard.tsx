// ProcessCard Component - Glass Morphism
// Save as: src/components/SOCProcesses/ProcessCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface ProcessCardProps {
  title: string;
  children: React.ReactNode;
  icon: any;
}

export const ProcessCard: React.FC<ProcessCardProps> = ({ title, children, icon: Icon }) => {
  const { actualTheme } = useTheme();
  
  return (
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
      {/* Card gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
      
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        
        <div className="space-y-4">
          {children}
        </div>
      </div>
      
      {/* Accent line */}
      <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
    </div>
  );
};