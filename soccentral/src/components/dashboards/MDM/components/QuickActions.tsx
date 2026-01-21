// Quick Actions Component
// src/components/dashboards/MDM/components/QuickActions.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { EnhancedSecurityViolation } from "../types";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface QuickActionsProps {
  violations: EnhancedSecurityViolation[];
  onViolationClick: (violationType: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  violations,
  onViolationClick,
}) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  const buttonBg = actualTheme === 'dark' ? "bg-muted/50" : "bg-muted/30";
  const buttonHover = actualTheme === 'dark' ? "hover:bg-muted/70" : "hover:bg-muted/50";
  
  if (violations.length === 0) {
    return null;
  }

  return (
    <Card className={cardBg}>
      <CardHeader>
        <CardTitle className={textPrimary}>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {violations.map((violation) => (
            <Button
              key={violation.type}
              variant="outline"
              className={`h-16 flex-col gap-1 ${buttonBg} border-border ${buttonHover}`}
              onClick={() => onViolationClick(violation.type)}
            >
              <AlertTriangle
                className="h-5 w-5"
                style={{ color: violation.color }}
              />
              <span className={`text-xs ${textPrimary}`}>
                {violation.description} ({violation.count})
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};