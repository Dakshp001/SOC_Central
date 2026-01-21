// src/components/dashboards/EDR/components/CustomTooltip.tsx
import React from "react";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground border border-border rounded-lg p-3 shadow-lg">
        <p className={`${isDark ? 'text-foreground' : 'text-foreground'} font-medium`}>{label}</p>
        <p className="text-primary">
          Count: <span className="font-bold">{payload[0].value.toLocaleString()}</span>
        </p>
        <p className={`${isDark ? 'text-muted-foreground' : 'text-muted-foreground'} text-sm`}>
          {payload[0].payload.percentage}% of endpoints
        </p>
      </div>
    );
  }
  return null;
};