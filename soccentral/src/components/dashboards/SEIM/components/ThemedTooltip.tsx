// src/components/Dashboards/SIEM/ThemedTooltip.tsx

import React from "react";

interface ThemedTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  textPrimary: string;
  textSecondary: string;
  getTooltipStyle: (actualTheme: string) => any;
  actualTheme: string;
}

export const ThemedTooltip: React.FC<ThemedTooltipProps> = ({
  active,
  payload,
  label,
  textPrimary,
  textSecondary,
  getTooltipStyle,
  actualTheme,
}) => {
  if (active && payload && payload.length) {
    return (
      <div style={getTooltipStyle(actualTheme)} className="p-3">
        <p className={`${textPrimary} text-sm font-medium mb-1`}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className={`${textSecondary} text-sm`}>
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.name}:
            </span>
            <span className="ml-1">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};