// src/components/Dashboards/SIEM/DashboardFooter.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SIEMData } from "@/lib/api";

interface DashboardFooterProps {
  data: SIEMData;
  hasEnhancedFeatures: boolean;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({
  data,
  hasEnhancedFeatures,
  cardBg,
  textPrimary,
  textSecondary,
}) => {
  return (
    <Card className={`${cardBg} mt-8`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className={`text-lg font-medium ${textPrimary} mb-2`}>
              Dashboard Information
            </h3>
            <p className={`text-sm ${textSecondary}`}>
              Last updated: {new Date().toLocaleString()} • Processing time:
              Real-time • Data quality:{" "}
              {hasEnhancedFeatures ? "Enhanced" : "Standard"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-muted-foreground border-border">
              SIEM v2.0
            </Badge>
            {hasEnhancedFeatures && (
              <Badge variant="default" className="bg-purple-600">
                Enhanced Analytics
              </Badge>
            )}
            <Badge variant="secondary">
              {data.rawSheetNames.length} Data Sources
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};