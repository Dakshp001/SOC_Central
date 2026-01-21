// Data Source Info Component
// src/components/dashboards/MDM/components/DataSourceInfo.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";
import { MDMData } from "../types";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface DataSourceInfoProps {
  data: MDMData;
}

export const DataSourceInfo: React.FC<DataSourceInfoProps> = ({ data }) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textSecondary = "text-muted-foreground";
  
  return (
    <Card className={cardBg}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className={`h-4 w-4 ${textSecondary}`} />
            <span className={`text-sm ${textSecondary}`}>
              Data Source: {data.rawSheetNames.length} Excel sheet(s)
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
              {Object.keys(data.details).length} Data Categories
            </Badge>
            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
              {data.details.allUsers?.length || 0} Total Records
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};