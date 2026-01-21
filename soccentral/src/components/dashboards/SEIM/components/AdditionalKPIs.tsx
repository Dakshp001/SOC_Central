// src/components/Dashboards/SIEM/AdditionalKPIs.tsx

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { SIEMData } from "@/lib/api";
import { hasRealDateData } from "@/lib/api";

interface AdditionalKPIsProps {
  data: SIEMData;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  actualTheme: string;
}

export const AdditionalKPIs: React.FC<AdditionalKPIsProps> = ({
  data,
  cardBg,
  textPrimary,
  textSecondary,
  actualTheme,
}) => {
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  // Calculate resolution rate
  const resolutionRate = data.kpis.totalEvents > 0 
    ? ((data.kpis.alertsResolved / data.kpis.totalEvents) * 100).toFixed(1)
    : "0";

  // Determine response time status
  const responseTime = data.kpis.averageResponseTime != null
    ? Number(data.kpis.averageResponseTime).toFixed(1)
    : "N/A";

  // False positive rate with status
  const falsePositiveRate = data.kpis.falsePositiveRate?.toFixed(1) || "N/A";
  const fpStatus = parseFloat(falsePositiveRate) > 10 ? "high" : parseFloat(falsePositiveRate) > 5 ? "medium" : "low";

  // Monthly event rate
  const monthlyRate = data.kpis.monthlyEventRate || "N/A";

  const kpiData = [
    {
      id: "resolution",
      label: "Resolution Rate",
      value: `${resolutionRate}%`,
      status: parseFloat(resolutionRate) > 80 ? "good" : parseFloat(resolutionRate) > 60 ? "medium" : "poor",
      isReal: false,
      info: {
        title: "Alert Resolution Rate",
        description: "Percentage of security alerts that have been resolved or closed",
        calculation: "Resolved Alerts ÷ Total Alerts × 100",
        benchmark: "> 80% (Good) | 60-80% (Medium) | < 60% (Needs Improvement)",
        source: "Based on alert status tracking"
      }
    },
    {
      id: "response",
      label: "Avg Response Time",
      value: responseTime === "N/A" ? "N/A" : `${responseTime}m`,
      status: responseTime === "N/A" ? "unknown" : parseFloat(responseTime) < 10 ? "good" : parseFloat(responseTime) < 20 ? "medium" : "poor",
      isReal: hasRealDateData(data),
      info: {
        title: "Average Response Time",
        description: "Mean time from alert generation to first response action",
        calculation: "Sum of (Response Time - Alert Time) ÷ Number of Responded Alerts",
        benchmark: "< 10 min (Excellent) | 10-20 min (Good) | > 20 min (Needs Improvement)",
        source: hasRealDateData(data) ? "Calculated from real timestamp data" : "Estimated based on alert patterns"
      }
    },
    {
      id: "false_positive",
      label: "False Positive Rate",
      value: falsePositiveRate === "N/A" ? "N/A" : `${falsePositiveRate}%`,
      status: fpStatus,
      isReal: hasRealDateData(data),
      info: {
        title: "False Positive Rate",
        description: "Percentage of alerts that were determined to be false alarms",
        calculation: "False Positive Alerts ÷ Total Alerts × 100",
        benchmark: "< 5% (Excellent) | 5-10% (Good) | > 10% (High - Review Rules)",
        source: hasRealDateData(data) ? "Based on alert status analysis" : "Industry standard estimate"
      }
    },
    {
      id: "monthly_rate",
      label: "Monthly Event Rate",
      value: monthlyRate === "N/A" ? "N/A" : monthlyRate.toString(),
      status: "neutral",
      isReal: hasRealDateData(data),
      info: {
        title: "Monthly Event Rate",
        description: "Average number of security events processed per month",
        calculation: "Total Events ÷ Number of Months in Dataset",
        benchmark: "Varies by organization size and security posture",
        source: hasRealDateData(data) ? "Calculated from historical data" : "Based on current event volume"
      }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "poor":
      case "high":
        return "text-red-500";
      default:
        return textSecondary;
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "poor":
      case "high":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi) => {
        const infoContent = (
          <div className="space-y-3 text-sm max-w-xs">
            <div className="font-semibold">{kpi.info.title}</div>
            
            <div className="space-y-2">
              <div>
                <div className="font-medium text-xs mb-1">Description:</div>
                <div className="text-xs text-muted-foreground">{kpi.info.description}</div>
              </div>
              
              <div>
                <div className="font-medium text-xs mb-1">How it's calculated:</div>
                <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-1 rounded">
                  {kpi.info.calculation}
                </div>
              </div>
              
              <div>
                <div className="font-medium text-xs mb-1">Benchmarks:</div>
                <div className="text-xs text-muted-foreground">{kpi.info.benchmark}</div>
              </div>
              
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground italic">{kpi.info.source}</div>
              </div>
            </div>
          </div>
        );

        return (
          <Card key={kpi.id} className={`${cardBg} transition-all hover:shadow-sm border-0 shadow-sm`}>
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header with info button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusDot(kpi.status)}`} />
                    <span className={`text-xs font-medium ${textSecondary} uppercase tracking-wide`}>
                      {kpi.label}
                    </span>
                    {kpi.isReal && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" title="Real-time data" />
                    )}
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip 
                      open={activeInfo === kpi.id} 
                      onOpenChange={(open) => setActiveInfo(open ? kpi.id : null)}
                    >
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                          onClick={() => setActiveInfo(activeInfo === kpi.id ? null : kpi.id)}
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="p-4"
                        sideOffset={5}
                      >
                        {infoContent}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Value */}
                <div className="space-y-1">
                  <div className={`text-2xl font-bold tracking-tight ${textPrimary}`}>
                    {kpi.value}
                  </div>
                  
                  {/* Status indicator */}
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${getStatusColor(kpi.status)}`}>
                      {kpi.status === "good" && "✓ Good"}
                      {kpi.status === "medium" && "◐ Fair"}
                      {kpi.status === "poor" && "⚠ Poor"}
                      {kpi.status === "high" && "⚠ High"}
                      {kpi.status === "neutral" && "– Monitoring"}
                      {kpi.status === "unknown" && "? Unknown"}
                    </span>
                    {kpi.isReal && (
                      <span className="text-xs text-green-500 font-medium">Live</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};