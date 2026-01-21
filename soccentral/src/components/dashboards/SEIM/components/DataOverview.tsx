// src/components/Dashboards/SIEM/DataOverview.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { SIEMData } from "@/lib/api";

interface DataOverviewProps {
  data: SIEMData;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
}

export const DataOverview: React.FC<DataOverviewProps> = ({
  data,
  cardBg,
  textPrimary,
  textSecondary,
}) => {
  return (
    <Card className={cardBg}>
      <CardHeader className="pb-4">
        <CardTitle className={`flex items-center gap-2 ${textPrimary} text-xl`}>
          <Shield className="h-6 w-6 text-blue-400" />
          Data Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <p className={`${textSecondary} text-sm`}>Data Period</p>
            <p className={`font-medium ${textPrimary} text-lg`}>
              {data.dateRange.start && data.dateRange.end
                ? `${data.dateRange.start} to ${data.dateRange.end}`
                : "Full dataset"}
            </p>
          </div>
          <div className="space-y-2">
            <p className={`${textSecondary} text-sm`}>Total Events</p>
            <p className={`font-bold ${textPrimary} text-2xl`}>
              {data.kpis.totalEvents.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <p className={`${textSecondary} text-sm`}>Unique Users</p>
            <p className={`font-bold ${textPrimary} text-2xl`}>
              {data.kpis.uniqueUsers}
            </p>
          </div>
          <div className="space-y-2">
            <p className={`${textSecondary} text-sm`}>Data Sources</p>
            <p className={`font-bold ${textPrimary} text-2xl`}>
              {data.rawSheetNames.length} sheets
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};