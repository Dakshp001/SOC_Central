// src/components/dashboards/Meraki/NetworkInsights.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, AlertTriangle, CheckCircle, Info, Signal, Activity, Eye } from "lucide-react";
import { EnhancedMerakiData } from "@/lib/api";

interface NetworkInsightsProps {
  data: EnhancedMerakiData;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  actualTheme: 'light' | 'dark';
  analyticsData: {
    networkEfficiency: number;
    securityScore: number;
    totalTraffic: number;
  };
}

export const NetworkInsights: React.FC<NetworkInsightsProps> = ({
  data,
  cardBg,
  textPrimary,
  textSecondary,
  actualTheme,
  analyticsData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Key Insights */}
      <Card className={cardBg}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
            <Zap className="h-5 w-5 text-yellow-400" />
            Network Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.insights?.alerts && data.insights.alerts.length > 0 && (
              <div>
                <h4 className={`text-sm font-medium text-red-400 mb-2 flex items-center gap-2`}>
                  <AlertTriangle className="h-4 w-4" />
                  Critical Alerts ({data.insights.alerts.length})
                </h4>
                <div className="space-y-2">
                  {data.insights.alerts
                    .slice(0, 3)
                    .map((alert: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 ${actualTheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                              {alert.title}
                            </p>
                            <p className={`text-xs ${actualTheme === 'dark' ? 'text-red-400' : 'text-red-600'} mt-1`}>
                              {alert.description}
                            </p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {data.insights?.recommendations &&
              data.insights.recommendations.length > 0 && (
                <div>
                  <h4 className={`text-sm font-medium text-blue-400 mb-2 flex items-center gap-2`}>
                    <CheckCircle className="h-4 w-4" />
                    Recommendations ({data.insights.recommendations.length})
                  </h4>
                  <div className="space-y-2">
                    {data.insights.recommendations
                      .slice(0, 3)
                      .map((rec: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 ${actualTheme === 'dark' ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'} border rounded-lg`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={`text-sm font-medium ${actualTheme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                                {rec.title}
                              </p>
                              <p className={`text-xs ${actualTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'} mt-1`}>
                                {rec.description}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {rec.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Network Summary */}
      <Card className={cardBg}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
            <Info className="h-5 w-5 text-cyan-400" />
            Network Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className={textSecondary}>
                Efficiency Score
              </p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-cyan-400">
                  {analyticsData.networkEfficiency.toFixed(1)} MB
                </p>
                <div className={`w-8 h-8 rounded-full ${actualTheme === 'dark' ? 'bg-cyan-600/20' : 'bg-cyan-100'} flex items-center justify-center`}>
                  <Signal className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <p className={`text-xs ${textSecondary}`}>Per client efficiency</p>
            </div>

            <div className="space-y-2">
              <p className={textSecondary}>
                Total Traffic
              </p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-cyan-400">
                  {(analyticsData.totalTraffic / 1000000).toFixed(1)} GB
                </p>
                <div className={`w-8 h-8 rounded-full ${actualTheme === 'dark' ? 'bg-cyan-600/20' : 'bg-cyan-100'} flex items-center justify-center`}>
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <p className={`text-xs ${textSecondary}`}>Total client traffic</p>
            </div>

            <div className="space-y-2">
              <p className={textSecondary}>
                Data Sources
              </p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-cyan-400">
                  {data.rawSheetNames.length}
                </p>
                <div className={`w-8 h-8 rounded-full ${actualTheme === 'dark' ? 'bg-cyan-600/20' : 'bg-cyan-100'} flex items-center justify-center`}>
                  <Eye className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <p className={`text-xs ${textSecondary}`}>Processed sheets</p>
            </div>

            <div className="space-y-2">
              <p className={textSecondary}>
                Processing Status
              </p>
              <div className="flex items-center gap-3">
                <p className="text-sm text-cyan-400 font-medium">
                  Complete
                </p>
                <div className={`w-8 h-8 rounded-full ${actualTheme === 'dark' ? 'bg-cyan-600/20' : 'bg-cyan-100'} flex items-center justify-center`}>
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <p className={`text-xs ${textSecondary}`}>
                {new Date(
                  data.metadata?.processedAt || ""
                ).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress indicators */}
          <div className={`mt-6 pt-6 border-t border-border`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-medium ${textPrimary}`}>
                Data Processing Status:
              </p>
              <Badge
                variant="outline"
                className="border-green-600 text-green-400"
              >
                {data.rawSheetNames.length} / {data.rawSheetNames.length}{" "}
                Complete
              </Badge>
            </div>

            <div className={`w-full ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} rounded-full h-2 mb-4`}>
              <div
                className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: "100%" }}
              ></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.rawSheetNames.slice(0, 6).map((sheet, index) => (
                <div
                  key={sheet}
                  className={`flex items-center gap-2 p-2 rounded-lg ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} border border-border`}
                >
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span
                    className={`text-xs ${textPrimary} truncate`}
                    title={sheet}
                  >
                    {sheet.length > 20
                      ? `${sheet.substring(0, 20)}...`
                      : sheet}
                  </span>
                </div>
              ))}
              {data.rawSheetNames.length > 6 && (
                <div className={`flex items-center justify-center p-2 rounded-lg ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} border border-border`}>
                  <span className={`text-xs ${textSecondary}`}>
                    +{data.rawSheetNames.length - 6} more
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};