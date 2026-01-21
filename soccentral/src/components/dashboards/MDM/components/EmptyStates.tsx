// Empty States Component
// src/components/dashboards/MDM/components/EmptyStates.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, AlertTriangle, CheckCircle } from "lucide-react";
import { MDMData, MDMKPIs } from "../types";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface EmptyStatesProps {
  dataStatus: string;
  rawMdmData: MDMData | null;
  kpis?: MDMKPIs;
}

export const EmptyStates: React.FC<EmptyStatesProps> = ({
  dataStatus,
  rawMdmData,
  kpis,
}) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  
  // Handle no data state
  if (dataStatus === "no-data") {
    return (
      <Card className={cardBg}>
        <CardContent className="p-8 text-center">
          <Database className={`h-16 w-16 mx-auto mb-4 ${textSecondary}`} />
          <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>
            No MDM Data Available
          </h3>
          <p className={textSecondary}>
            Upload an MDM Excel file to view comprehensive device analytics
            and security insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handle invalid data
  if (!rawMdmData || !rawMdmData.kpis) {
    return (
      <Card className={cardBg}>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>
            Invalid MDM Data
          </h3>
          <p className={textSecondary}>
            The uploaded file appears to be corrupted or in an invalid format.
          </p>
          <div className={`mt-4 text-sm ${textSecondary}`}>
            {rawMdmData && (
              <div>
                <p>File type: {rawMdmData.fileType || "Unknown"}</p>
                <p>Sheets: {rawMdmData.rawSheetNames?.length || 0}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

// No Security Issues State Component
interface NoSecurityIssuesProps {
  kpis: MDMKPIs;
}

export const NoSecurityIssues: React.FC<NoSecurityIssuesProps> = ({ kpis }) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  
  return (
    <Card className={cardBg}>
      <CardContent className="p-8 text-center">
        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <h3 className={`text-lg font-semibold ${textPrimary} mb-2`}>
          No Security Violations Detected
        </h3>
        <p className={textSecondary}>
          All {kpis.totalDevices} devices are compliant and secure.
          Excellent security posture!
        </p>
        <div className="mt-4">
          <Badge variant="default" className="bg-green-600">
            Security Score: {kpis.securityScore}/100
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};