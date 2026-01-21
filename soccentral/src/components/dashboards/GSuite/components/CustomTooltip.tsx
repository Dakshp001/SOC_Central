// src/components/dashboards/GSuite/components/CustomTooltip.tsx

import React from 'react';
import { CustomTooltipProps } from '../types';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

// Custom tooltip component for enhanced interactivity
export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, formatter }) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const tooltipBg = "bg-popover border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  
  if (active && payload && payload.length) {
    return (
      <div className={`${tooltipBg} rounded-lg p-3 shadow-xl`}>
        {label && <p className={`${textSecondary} font-medium mb-2`}>{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className={`${textPrimary} text-sm`}>
              {entry.name}: <span className="font-semibold">{formatter ? formatter(entry.value) : entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};