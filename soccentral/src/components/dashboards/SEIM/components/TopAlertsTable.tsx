// src/components/Dashboards/SIEM/TopAlertsTable.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

interface TopAlert {
  title: string;
  count: number;
}

interface TopAlertsTableProps {
  alerts: TopAlert[];
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  actualTheme: string;
}

export const TopAlertsTable: React.FC<TopAlertsTableProps> = ({
  alerts,
  cardBg,
  textPrimary,
  textSecondary,
  actualTheme,
}) => {
  return (
    <Card className={cardBg}>
      <CardHeader className="pb-4">
        <CardTitle className={`flex items-center gap-2 ${textPrimary} text-lg`}>
          <TrendingUp className="h-5 w-5 text-orange-400" />
          Top Alert Types
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.slice(0, 10).map((alert, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-4 ${actualTheme === 'dark' ? 'bg-muted/30 border-border hover:bg-muted/50' : 'bg-muted/20 border-border hover:bg-muted/40'} rounded-lg border transition-colors`}
            >
              <div className="flex-1 min-w-0">
                <p
                  className={`text-base font-medium truncate ${textPrimary}`}
                  title={alert.title}
                >
                  {alert.title || `Alert Type #${index + 1}`}
                </p>
                <p className={`text-sm ${textSecondary}`}>Rank #{index + 1}</p>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="secondary"
                  className="text-sm bg-muted text-muted-foreground px-3 py-1"
                >
                  {alert.count} events
                </Badge>
                <div className="w-24">
                  <Progress
                    value={
                      alerts.length > 0
                        ? (alert.count / alerts[0].count) * 100
                        : 0
                    }
                    className="h-3 bg-muted"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};