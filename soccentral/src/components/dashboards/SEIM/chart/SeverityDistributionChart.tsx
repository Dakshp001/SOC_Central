// src/components/Dashboards/SIEM/SeverityDistributionChart.tsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Shield, AlertTriangle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartDataPoint } from '../types';

interface SeverityDistributionChartProps {
  data: ChartDataPoint[];
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  ThemedTooltip: React.ComponentType<any>;
  actualTheme: string;
}

export const SeverityDistributionChart: React.FC<SeverityDistributionChartProps> = ({
  data,
  cardBg,
  textPrimary,
  textSecondary,
  ThemedTooltip,
  actualTheme,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <Card className={`${cardBg}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-500" />
            <CardTitle className={`${textPrimary} text-base font-semibold`}>
              Severity Distribution
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className={`${textSecondary} text-sm`}>No security events data available</p>
              <p className={`${textSecondary} text-xs mt-1`}>Data will appear here when events are processed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate metrics - with safety checks
  const totalEvents = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const criticalCount = data.find(d => d.name === 'Critical')?.count || 0;
  const highCount = data.find(d => d.name === 'High')?.count || 0;
  const criticalPercent = totalEvents > 0 ? ((criticalCount / totalEvents) * 100).toFixed(1) : '0';
  const riskScore = totalEvents > 0 
    ? (((criticalCount * 4) + (highCount * 3)) / totalEvents * 10).toFixed(1)
    : '0';

  // Enhanced colors for better professional look
  const severityColors = {
    'Critical': '#991B1B',
    'High': '#DC2626', 
    'Medium': '#EA580C',
    'Low': '#16A34A',
    'Info': '#6B7280'
  };

  const infoContent = (
    <div className="space-y-3 text-sm">
      <div className="font-semibold text-base">Severity Distribution Analysis</div>
      
      <div className="space-y-2">
        <div className="font-medium">Classification System:</div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li><span className="text-red-600 font-medium">Critical:</span> Immediate threat, system compromise</li>
          <li><span className="text-orange-600 font-medium">High:</span> Significant risk, urgent action needed</li>
          <li><span className="text-yellow-600 font-medium">Medium:</span> Moderate risk, timely response</li>
          <li><span className="text-green-600 font-medium">Low:</span> Minor risk, routine handling</li>
          <li><span className="text-gray-600 font-medium">Info:</span> Informational, no action needed</li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Calculation Method:</div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Events categorized by NIST severity standards</li>
          <li>Percentage calculated from total event volume</li>
          <li>Risk score: weighted severity impact (0-40 scale)</li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Key Insights:</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Critical Events:</span>
            <span className="font-mono text-red-600">{criticalPercent}%</span>
          </div>
          <div className="flex justify-between">
            <span>Risk Score:</span>
            <span className="font-mono font-bold">{riskScore}/40</span>
          </div>
          <div className="flex justify-between">
            <span>Total Analyzed:</span>
            <span className="font-mono">{totalEvents.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border text-xs text-muted-foreground">
        Based on real-time security event classification
      </div>
    </div>
  );

  // Custom label function for professional display
  const renderLabel = ({ name, percentage }: any) => {
    return `${name}\n${percentage}%`;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: entry.color }}
          />
          <span className={textSecondary}>
            {entry.value}: <span className="font-mono font-medium">{entry.payload.count}</span>
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <Card className={`${cardBg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-red-500" />
            <CardTitle className={`${textPrimary} text-base font-semibold`}>
              Severity Distribution
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Risk indicator */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <div className={`font-mono font-bold ${parseFloat(riskScore) > 15 ? 'text-red-500' : parseFloat(riskScore) > 10 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {riskScore}
                </div>
                <div className={`${textSecondary} text-[10px]`}>Risk Score</div>
              </div>
              <div className="text-center">
                <div className={`font-mono font-bold ${parseFloat(criticalPercent) > 10 ? 'text-red-500' : 'text-orange-500'}`}>
                  {criticalPercent}%
                </div>
                <div className={`${textSecondary} text-[10px]`}>Critical</div>
              </div>
            </div>
            
            <TooltipProvider>
              <Tooltip open={showInfo} onOpenChange={setShowInfo}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${actualTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                    onClick={() => setShowInfo(!showInfo)}
                  >
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="left" 
                  className="w-80 p-4"
                  sideOffset={5}
                >
                  {infoContent}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={renderLabel}
                outerRadius={100}
                innerRadius={40}
                fill="#8884d8"
                dataKey="count"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={severityColors[entry.name as keyof typeof severityColors] || entry.fill}
                  />
                ))}
              </Pie>
              <RechartsTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className={`${actualTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} border border-border rounded-lg shadow-lg p-3`}>
                        <div className={`font-medium ${textPrimary} text-sm mb-2 flex items-center gap-2`}>
                          <AlertTriangle className="h-3 w-3" style={{ color: data.fill }} />
                          {data.name} Severity
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className={textSecondary}>Event Count:</span>
                            <span className={`font-mono font-medium ${textPrimary}`}>{data.count.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className={textSecondary}>Percentage:</span>
                            <span className={`font-mono font-medium ${textPrimary}`}>{data.percentage}%</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className={textSecondary}>Priority Level:</span>
                            <span className={`font-mono font-medium ${textPrimary}`}>{data.severity + 1}/5</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Professional footer with insights */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              <span className={textSecondary}>
                {criticalCount + highCount} High-Risk Events
              </span>
            </div>
          </div>
          <div className={`text-xs ${textSecondary} flex items-center gap-1`}>
            <span>Risk Level: </span>
            <span className={`font-medium ${
              parseFloat(riskScore) > 15 ? 'text-red-500' : 
              parseFloat(riskScore) > 10 ? 'text-yellow-500' : 'text-green-500'
            }`}>
              {parseFloat(riskScore) > 15 ? 'HIGH' : parseFloat(riskScore) > 10 ? 'MEDIUM' : 'LOW'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};