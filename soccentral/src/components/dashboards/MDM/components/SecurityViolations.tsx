// Security Violations Component
// src/components/dashboards/MDM/components/SecurityViolations.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Lock } from "lucide-react";
import { EnhancedSecurityViolation } from "../types";
import { getSeverityColor, formatNumber, formatPercentage } from "../utils";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface SecurityViolationsProps {
  violations: EnhancedSecurityViolation[];
  onViolationClick: (violationType: string) => void;
}

export const SecurityViolations: React.FC<SecurityViolationsProps> = ({
  violations,
  onViolationClick,
}) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const cardContent = actualTheme === 'dark' ? "bg-muted/50" : "bg-muted/30";
  const cardHover = actualTheme === 'dark' ? "hover:bg-muted/70" : "hover:bg-muted/50";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  
  if (violations.length === 0) {
    return null;
  }

  return (
    <Card className={cardBg}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
          <Lock className="h-5 w-5 text-red-500" />
          Security Violations & Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {violations.map((violation) => (
            <Card
              key={violation.type}
              className={`${cardContent} border-border cursor-pointer ${cardHover} transition-all`}
              onClick={() => onViolationClick(violation.type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border ${getSeverityColor(
                      violation.severity
                    )}`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <Badge
                    variant={
                      violation.severity === "critical"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {violation.severity}
                  </Badge>
                </div>
                <p className={`text-2xl font-bold ${textPrimary} mb-1`}>
                  {formatNumber(violation.count)}
                </p>
                <p className={`text-xs ${textSecondary} mb-2`}>
                  {violation.description}
                </p>
                <p className={`text-xs ${textSecondary} mb-2`}>
                  {formatPercentage(violation.percentage)} of total devices
                </p>
                <Progress
                  value={violation.percentage}
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};