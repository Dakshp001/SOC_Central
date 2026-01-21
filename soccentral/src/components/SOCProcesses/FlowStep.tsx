// FlowStep Component - Glass Morphism
// Save as: src/components/SOCProcesses/FlowStep.tsx

import React from 'react';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface FlowStepProps {
  number: number;
  title: string;
  description: string;
  color?: string;
}

export const FlowStep: React.FC<FlowStepProps> = ({ number, title, description, color = "blue" }) => {
  const { actualTheme } = useTheme();
  
  const getColorStyles = (color: string) => {
    switch (color) {
      case 'red':
      case 'critical':
        return {
          backgroundColor: actualTheme === 'dark' ? 'hsl(0, 100%, 50%, 0.2)' : 'hsl(0, 84%, 95%)',
          color: actualTheme === 'dark' ? 'hsl(0, 100%, 50%)' : 'hsl(0, 84%, 60%)',
          borderColor: actualTheme === 'dark' ? 'hsl(0, 100%, 50%, 0.3)' : 'hsl(0, 84%, 80%)'
        };
      case 'orange':
      case 'high':
        return {
          backgroundColor: actualTheme === 'dark' ? 'hsl(24, 100%, 50%, 0.2)' : 'hsl(24, 100%, 95%)',
          color: actualTheme === 'dark' ? 'hsl(24, 100%, 50%)' : 'hsl(24, 100%, 50%)',
          borderColor: actualTheme === 'dark' ? 'hsl(24, 100%, 50%, 0.3)' : 'hsl(24, 100%, 80%)'
        };
      case 'green':
      case 'low':
        return {
          backgroundColor: actualTheme === 'dark' ? 'hsl(142, 76%, 36%, 0.2)' : 'hsl(142, 76%, 95%)',
          color: 'hsl(142, 76%, 36%)',
          borderColor: actualTheme === 'dark' ? 'hsl(142, 76%, 36%, 0.3)' : 'hsl(142, 76%, 80%)'
        };
      case 'blue':
      case 'info':
        return {
          backgroundColor: actualTheme === 'dark' ? 'hsl(210, 100%, 60%, 0.2)' : 'hsl(220, 100%, 95%)',
          color: actualTheme === 'dark' ? 'hsl(210, 100%, 60%)' : 'hsl(220, 100%, 50%)',
          borderColor: actualTheme === 'dark' ? 'hsl(210, 100%, 60%, 0.3)' : 'hsl(220, 100%, 80%)'
        };
      case 'purple':
        return {
          backgroundColor: actualTheme === 'dark' ? 'hsl(270, 50%, 60%, 0.2)' : 'hsl(270, 50%, 95%)',
          color: actualTheme === 'dark' ? 'hsl(270, 50%, 60%)' : 'hsl(270, 50%, 50%)',
          borderColor: actualTheme === 'dark' ? 'hsl(270, 50%, 60%, 0.3)' : 'hsl(270, 50%, 80%)'
        };
      case 'cyan':
        return {
          backgroundColor: actualTheme === 'dark' ? 'hsl(180, 100%, 60%, 0.2)' : 'hsl(180, 100%, 95%)',
          color: actualTheme === 'dark' ? 'hsl(180, 100%, 60%)' : 'hsl(180, 100%, 40%)',
          borderColor: actualTheme === 'dark' ? 'hsl(180, 100%, 60%, 0.3)' : 'hsl(180, 100%, 80%)'
        };
      default:
        return {
          backgroundColor: actualTheme === 'dark' ? 'hsl(210, 100%, 60%, 0.2)' : 'hsl(220, 100%, 95%)',
          color: actualTheme === 'dark' ? 'hsl(210, 100%, 60%)' : 'hsl(220, 100%, 50%)',
          borderColor: actualTheme === 'dark' ? 'hsl(210, 100%, 60%, 0.3)' : 'hsl(220, 100%, 80%)'
        };
    }
  };

  const colorStyles = getColorStyles(color);
  
  return (
    <div className="flex items-start gap-3">
      <div 
        className="
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
          backdrop-blur-sm border shadow-sm
          transition-all duration-200
        "
        style={{
          backgroundColor: colorStyles.backgroundColor,
          color: colorStyles.color,
          borderColor: colorStyles.borderColor
        }}
      >
        {number}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-foreground text-sm">{title}</h4>
        <p className="text-sm mt-1 text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};