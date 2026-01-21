// src/components/dashboards/Meraki/charts/ThemedTooltip.tsx
import React from "react";

interface ThemedTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  actualTheme?: 'light' | 'dark';
}

export const ThemedTooltip: React.FC<ThemedTooltipProps> = ({ 
  active, 
  payload, 
  label, 
  actualTheme = 'dark' 
}) => {
  if (active && payload && payload.length) {
    return (
      <div className={`
        border rounded-lg p-3 shadow-xl
        ${actualTheme === 'dark' 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
        }
      `}>
        <p className={`text-sm font-medium mb-1 ${
          actualTheme === 'dark' ? 'text-slate-200' : 'text-gray-800'
        }`}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className={`text-sm ${
            actualTheme === 'dark' ? 'text-slate-300' : 'text-gray-700'
          }`}>
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