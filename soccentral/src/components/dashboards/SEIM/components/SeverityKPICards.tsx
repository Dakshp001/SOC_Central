// src/components/Dashboards/SIEM/SeverityKPICards.tsx

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
import { SeverityKPIs } from '../types';
import { severityMap } from '../constants';

interface SeverityKPICardsProps {
  severityKPIs: SeverityKPIs;
  data: SIEMData;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  onSeverityClick: (severity: number) => void;
}

export const SeverityKPICards: React.FC<SeverityKPICardsProps> = ({
  severityKPIs,
  data,
  cardBg,
  textPrimary,
  textSecondary,
  onSeverityClick,
}) => {
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  const severityOrder = ['critical', 'high', 'medium', 'low', 'info'] as const;

  const getSeverityInfo = (severity: string, severityNum: number) => {
    const descriptions = {
      critical: "Immediate system compromise or imminent threat requiring instant response",
      high: "Significant security risk requiring urgent attention within hours", 
      medium: "Moderate security concern requiring timely investigation",
      low: "Minor security issue for routine review and response",
      info: "Informational events for awareness and audit purposes"
    };

    const actions = {
      critical: "Immediate escalation • War room activation • Executive notification",
      high: "Urgent team assignment • Stakeholder notification • Priority investigation",
      medium: "Standard workflow • Timely assignment • Regular monitoring",
      low: "Queue for routine review • Standard SLA • Documentation",
      info: "Log for compliance • No immediate action • Regular audit review"
    };

    return {
      title: `${severityMap[severityNum].name} Severity Events`,
      description: descriptions[severity as keyof typeof descriptions],
      priority: `Priority Level: ${severityNum + 1}/5`,
      response: actions[severity as keyof typeof actions],
      source: "Events classified using NIST cybersecurity framework standards"
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626'; // red-600
      case 'high': return '#EA580C';     // orange-600
      case 'medium': return '#D97706';   // amber-600
      case 'low': return '#16A34A';      // green-600
      case 'info': return '#6B7280';     // gray-500
      default: return '#6B7280';
    }
  };

  const getRiskLevel = (severity: string, percentage: number) => {
    if (severity === 'critical' && percentage > 5) return { level: 'EXTREME', color: 'text-red-600' };
    if (severity === 'critical' && percentage > 1) return { level: 'HIGH', color: 'text-red-500' };
    if (severity === 'high' && percentage > 15) return { level: 'HIGH', color: 'text-orange-600' };
    if (severity === 'high' && percentage > 8) return { level: 'ELEVATED', color: 'text-orange-500' };
    if (severity === 'medium' && percentage > 25) return { level: 'ELEVATED', color: 'text-yellow-600' };
    return { level: 'NORMAL', color: 'text-green-600' };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {severityOrder.map((severity) => {
        const count = severityKPIs[severity];
        const severityNum = severity === "critical" ? 4 : severity === "high" ? 3 : severity === "medium" ? 2 : severity === "low" ? 1 : 0;
        const config = severityMap[severityNum as keyof typeof severityMap];
        const percentage = data.kpis.totalEvents > 0 ? ((count / data.kpis.totalEvents) * 100).toFixed(1) : "0";
        const severityColor = getSeverityColor(severity);
        const riskLevel = getRiskLevel(severity, parseFloat(percentage));
        const info = getSeverityInfo(severity, severityNum);

        const infoContent = (
          <div className="space-y-3 text-sm max-w-sm">
            <div className="font-semibold">{info.title}</div>
            
            <div className="space-y-2">
              <div>
                <div className="font-medium text-xs mb-1">Definition:</div>
                <div className="text-xs text-muted-foreground">{info.description}</div>
              </div>
              
              <div>
                <div className="font-medium text-xs mb-1">Response Actions:</div>
                <div className="text-xs text-muted-foreground">{info.response}</div>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{info.priority}</span>
                <span className={`font-medium ${riskLevel.color}`}>{riskLevel.level} RISK</span>
              </div>
              
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground italic">{info.source}</div>
              </div>
            </div>
          </div>
        );

        return (
          <Card
            key={severity}
            className={`${cardBg} cursor-pointer transition-all hover:shadow-md border-0 shadow-sm hover:scale-[1.02] group`}
            onClick={() => onSeverityClick(severityNum)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: severityColor }}
                    />
                    <span className={`text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>
                      {severity}
                    </span>
                  </div>
                  
                  <TooltipProvider>
                    <Tooltip 
                      open={activeInfo === severity} 
                      onOpenChange={(open) => setActiveInfo(open ? severity : null)}
                    >
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveInfo(activeInfo === severity ? null : severity);
                          }}
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

                {/* Main metric */}
                <div className="space-y-1">
                  <div className={`text-3xl font-bold tracking-tight ${textPrimary} group-hover:scale-105 transition-transform`}>
                    {count.toLocaleString()}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${textSecondary}`}>
                      {percentage}% of total
                    </span>
                    <span className={`text-xs font-medium ${riskLevel.color}`}>
                      {riskLevel.level}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full bg-muted/50 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-300 group-hover:opacity-80"
                      style={{ 
                        width: `${Math.min(parseFloat(percentage) * 2, 100)}%`,
                        backgroundColor: severityColor
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Click for details
                    </span>
                    {count > 0 && (
                      <span 
                        className="text-xs font-medium"
                        style={{ color: severityColor }}
                      >
                        {count > 100 ? 'High Volume' : count > 10 ? 'Active' : 'Low'}
                      </span>
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