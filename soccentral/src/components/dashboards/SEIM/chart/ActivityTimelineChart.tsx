// src/components/Dashboards/SIEM/ActivityTimelineChart.tsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TimelineData } from '../types';

interface ActivityTimelineChartProps {
  data: TimelineData[];
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  ThemedTooltip: React.ComponentType<any>;
  getGridStyle: () => any;
  actualTheme: string;
}

export const ActivityTimelineChart: React.FC<ActivityTimelineChartProps> = ({
  data,
  cardBg,
  textPrimary,
  textSecondary,
  ThemedTooltip,
  getGridStyle,
  actualTheme,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  // Calculate metrics for professional display
  const totalEvents = data.reduce((sum, day) => sum + day.events, 0);
  const avgEvents = Math.round(totalEvents / data.length);
  const maxEvents = Math.max(...data.map(d => d.events));
  const trend = data[data.length - 1].events > data[0].events ? 'up' : 'down';
  const trendPercent = Math.abs(
    ((data[data.length - 1].events - data[0].events) / data[0].events) * 100
  ).toFixed(1);

  const infoContent = (
    <div className="space-y-3 text-sm">
      <div className="font-semibold text-base">Activity Timeline Calculation</div>
      
      <div className="space-y-2">
        <div className="font-medium">Data Sources:</div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Security events aggregated by day</li>
          <li>Critical alerts overlay (red area)</li>
          <li>Total event volume (blue area)</li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Calculation Method:</div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Events counted per 24-hour period</li>
          <li>Critical events (severity 4) highlighted separately</li>
          <li>Rolling 7-day window for trend analysis</li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Key Metrics:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Avg Daily: <span className="font-mono">{avgEvents}</span></div>
          <div>Peak Day: <span className="font-mono">{maxEvents}</span></div>
          <div>7-Day Trend: <span className="font-mono">{trendPercent}% {trend}</span></div>
          <div>Total: <span className="font-mono">{totalEvents.toLocaleString()}</span></div>
        </div>
      </div>

      <div className="pt-2 border-t border-border text-xs text-muted-foreground">
        Based on real-time security event data
      </div>
    </div>
  );

  return (
    <Card className={`${cardBg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <CardTitle className={`${textPrimary} text-base font-semibold`}>
              7-Day Activity Timeline
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Key metrics display */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <div className={`font-mono font-bold ${textPrimary}`}>{avgEvents}</div>
                <div className={`${textSecondary} text-[10px]`}>Daily Avg</div>
              </div>
              <div className="text-center">
                <div className={`font-mono font-bold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {trendPercent}%
                </div>
                <div className={`${textSecondary} text-[10px]`}>
                  {trend === 'up' ? '↗' : '↘'} Trend
                </div>
              </div>
            </div>
            
            <TooltipProvider>
              <Tooltip open={showInfo} onOpenChange={setShowInfo}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${actualTheme === 'dark' ? 'hover:bg-white-800' : 'hover:bg-gray-100'}`}
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
            <AreaChart 
              data={data} 
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="eventsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#DC2626" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#DC2626" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="1 1" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
                vertical={false}
              />
              
              <XAxis
                dataKey="day"
                tick={{ 
                  fill: "hsl(var(--muted-foreground))", 
                  fontSize: 11,
                  fontFamily: "system-ui"
                }}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                tickLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                tickMargin={8}
              />
              
              <YAxis
                tick={{ 
                  fill: "hsl(var(--muted-foreground))", 
                  fontSize: 11,
                  fontFamily: "system-ui"
                }}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={40}
              />
              
              {/* Average line reference */}
              <ReferenceLine 
                y={avgEvents} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="2 2" 
                strokeOpacity={0.5}
                label={{ 
                  value: `Avg: ${avgEvents}`, 
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))"
                }}
              />
              
              <RechartsTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const events = payload.find(p => p.dataKey === 'events')?.value || 0;
                    const critical = payload.find(p => p.dataKey === 'critical')?.value || 0;
                    const high = payload.find(p => p.dataKey === 'high')?.value || 0;
                    const medium = payload.find(p => p.dataKey === 'medium')?.value || 0;
                    
                    return (
                      <div className={`${actualTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} border border-border rounded-lg shadow-lg p-3`}>
                        <div className={`font-medium ${textPrimary} text-sm mb-2`}>{label}</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className={textSecondary}>Total Events:</span>
                            <span className={`font-mono font-medium ${textPrimary}`}>{events}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-red-500">Critical:</span>
                            <span className="font-mono font-medium text-red-500">{critical}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-orange-500">High:</span>
                            <span className="font-mono font-medium text-orange-500">{high}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-yellow-500">Medium:</span>
                            <span className="font-mono font-medium text-yellow-500">{medium}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              <Area
                type="monotone"
                dataKey="events"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#eventsGradient)"
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: "#3B82F6",
                  stroke: "#ffffff",
                  strokeWidth: 2
                }}
              />
              
              <Area
                type="monotone"
                dataKey="critical"
                stroke="#DC2626"
                strokeWidth={1.5}
                fill="url(#criticalGradient)"
                dot={false}
                activeDot={{ 
                  r: 3, 
                  fill: "#DC2626",
                  stroke: "#ffffff",
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Professional footer with legend */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-blue-500 rounded-sm opacity-60"></div>
              <span className={textSecondary}>Total Events</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-red-500 rounded-sm opacity-60"></div>
              <span className={textSecondary}>Critical Overlay</span>
            </div>
          </div>
          <div className={`text-xs ${textSecondary}`}>
            7-day rolling window
          </div>
        </div>
      </CardContent>
    </Card>
  );
};