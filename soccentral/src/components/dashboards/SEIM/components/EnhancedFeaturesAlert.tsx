// src/components/Dashboards/SIEM/EnhancedFeaturesAlert.tsx

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { SIEMData } from "@/lib/api";
import { hasRealDateData, isRealDataAvailable } from "@/lib/api";

interface EnhancedFeaturesAlertProps {
  data: SIEMData;
  actualTheme: string;
}

export const EnhancedFeaturesAlert: React.FC<EnhancedFeaturesAlertProps> = ({
  data,
  actualTheme,
}) => {
  return (
    <Alert className={`${actualTheme === 'dark' ? 'bg-green-900/20 border-green-800' : 'bg-green-50/80 border-green-200'}`}>
      <CheckCircle className="h-4 w-4 text-green-400" />
      <AlertDescription className="text-green-600 dark:text-green-300">
        ✨ <strong>Enhanced SIEM Analytics Active!</strong> New features include:
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
            {data.analytics?.totalAlertsCount?.toLocaleString()} Total Alerts
          </Badge>
          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
            {Object.keys(data.analytics?.topAlertsBySeverity || {}).length} Severity Levels
          </Badge>
          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
            {Object.keys(data.analytics?.topUsersBySeverity || {}).length} User Analytics
          </Badge>
          {hasRealDateData(data) && (
            <Badge variant="outline" className="text-xs bg-blue-600 text-white">
              Real Date Processing
            </Badge>
          )}
          {isRealDataAvailable(data) && (
            <Badge variant="outline" className="text-xs bg-green-600 text-white">
              Peak Hour Analytics
            </Badge>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};