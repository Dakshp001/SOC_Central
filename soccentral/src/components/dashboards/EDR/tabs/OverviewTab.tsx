import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarChart3, AlertTriangle } from "lucide-react";
import { EDRData } from '../types';
import { formatNumber, formatPercentage } from '../utils';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface OverviewTabProps {
  data: EDRData;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ data }) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  // Theme-aware colors
  const cardBg = isDark ? 'bg-card border-border' : 'bg-card border-border';
  const textPrimary = isDark ? 'text-foreground' : 'text-foreground';
  const textSecondary = isDark ? 'text-muted-foreground' : 'text-muted-foreground';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle className={`${textPrimary} flex items-center gap-2`}>
              <BarChart3 className="h-5 w-5" />
              Endpoint Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.analytics?.networkStatusDistribution || {}).map(
                ([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          status.toLowerCase() === "connected" ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span className={`${textSecondary} capitalize`}>{status}</span>
                    </div>
                    <div className="text-right">
                      <span className={`${textPrimary} font-medium`}>
                        {formatNumber(count)}
                      </span>
                      <span className={`${textSecondary} text-sm ml-2`}>
                        ({formatPercentage((count / data.kpis.totalEndpoints) * 100)})
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Threat Breakdown */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle className={`${textPrimary} flex items-center gap-2`}>
              <AlertTriangle className="h-5 w-5" />
              Threat Confidence Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.analytics?.confidenceLevelDistribution || {}).map(
                ([level, count]) => (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          level.toLowerCase() === "malicious"
                            ? "bg-red-500"
                            : level.toLowerCase() === "suspicious"
                            ? "bg-orange-500"
                            : "bg-gray-500"
                        }`}
                      ></div>
                      <span className={`${textSecondary} capitalize`}>{level}</span>
                    </div>
                    <div className="text-right">
                      <span className={`${textPrimary} font-medium`}>
                        {formatNumber(count)}
                      </span>
                      <span className={`${textSecondary} text-sm ml-2`}>
                        (
                        {data.kpis.totalThreats > 0
                          ? formatPercentage((count / data.kpis.totalThreats) * 100)
                          : "0%"}
                        )
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle className={textPrimary}>Security Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recommendations.slice(0, 5).map((rec, index) => (
                <Alert
                  key={index}
                  className={`
                    ${
                      rec.priority === "Critical"
                        ? isDark 
                          ? "bg-red-500/10 border-red-500/30" 
                          : "bg-red-50 border-red-300"
                        : rec.priority === "High"
                        ? isDark 
                          ? "bg-orange-500/10 border-orange-500/30" 
                          : "bg-orange-50 border-orange-300"
                        : isDark 
                          ? "bg-blue-500/10 border-blue-500/30" 
                          : "bg-blue-50 border-blue-300"
                    }
                  `}
                >
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={`
                              ${
                                rec.priority === "Critical"
                                  ? "border-red-500 text-red-500"
                                  : rec.priority === "High"
                                  ? "border-orange-500 text-orange-500"
                                  : "border-blue-500 text-blue-500"
                              }
                            `}
                          >
                            {rec.priority}
                          </Badge>
                          <span className={`${textSecondary} text-sm`}>{rec.category}</span>
                        </div>
                        <p className={textPrimary}>{rec.recommendation}</p>
                        <p className={`${textSecondary} text-sm mt-1`}>{rec.metric}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};