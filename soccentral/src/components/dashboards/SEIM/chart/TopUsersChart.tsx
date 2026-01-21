// src/components/Dashboards/SIEM/TopUsersChart.tsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, Users, User, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TopUserData } from '../types';

interface TopUsersChartProps {
  data: TopUserData[];
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  getGridStyle: () => any;
  getTooltipStyle: (actualTheme: string) => any;
  actualTheme: string;
}

export const TopUsersChart: React.FC<TopUsersChartProps> = ({
  data,
  cardBg,
  textPrimary,
  textSecondary,
  getGridStyle,
  getTooltipStyle,
  actualTheme,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  // Calculate user analytics
  const totalEvents = data.reduce((sum, user) => sum + user.count, 0);
  const avgEventsPerUser = Math.round(totalEvents / data.length);
  const topUser = data[0];
  const topUserPercent = totalEvents > 0 ? ((topUser.count / totalEvents) * 100).toFixed(1) : '0';
  
  // Identify high-activity users (above 150% of average)
  const highActivityThreshold = avgEventsPerUser * 1.5;
  const highActivityUsers = data.filter(user => user.count > highActivityThreshold).length;
  
  // Calculate distribution metrics
  const medianEvents = data.length > 0 ? data[Math.floor(data.length / 2)].count : 0;
  const concentration = data.slice(0, 3).reduce((sum, user) => sum + user.count, 0);
  const concentrationPercent = totalEvents > 0 ? ((concentration / totalEvents) * 100).toFixed(1) : '0';

  const infoContent = (
    <div className="space-y-3 text-sm">
      <div className="font-semibold text-base">Top Users Analysis</div>
      
      <div className="space-y-2">
        <div className="font-medium">User Activity Tracking:</div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Events aggregated by unique username</li>
          <li>All severity levels included in user counts</li>
          <li>Service accounts and human users combined</li>
          <li>Top 10 most active users displayed</li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Risk Assessment:</div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>High activity: &gt;150% of average ({highActivityThreshold}+ events)</li>
          <li>Concentration risk: Top 3 users represent {concentrationPercent}%</li>
          <li>Anomaly detection based on statistical outliers</li>
          <li>Behavioral pattern analysis for insider threats</li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Key Metrics:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Avg per User: <span className="font-mono">{avgEventsPerUser}</span></div>
          <div>Median: <span className="font-mono">{medianEvents}</span></div>
          <div>High Activity: <span className="font-mono text-orange-500">{highActivityUsers} users</span></div>
          <div>Top 3 Share: <span className="font-mono">{concentrationPercent}%</span></div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Security Insights:</div>
        <div className="text-xs space-y-1">
          <div>• Top user ({topUser?.user || 'N/A'}) represents {topUserPercent}% of activity</div>
          <div>• {highActivityUsers > 2 ? 'Multiple' : highActivityUsers === 0 ? 'No' : 'Few'} users show elevated activity patterns</div>
          <div>• Activity concentration: {parseFloat(concentrationPercent) > 50 ? 'High' : parseFloat(concentrationPercent) > 30 ? 'Medium' : 'Low'} risk</div>
        </div>
      </div>

      <div className="pt-2 border-t border-border text-xs text-muted-foreground">
        Updated in real-time as events are processed
      </div>
    </div>
  );

  return (
    <Card className={`${cardBg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            <CardTitle className={`${textPrimary} text-base font-semibold`}>
              Top Active Users
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {/* Key metrics display */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <div className={`font-mono font-bold ${textPrimary}`}>{avgEventsPerUser}</div>
                <div className={`${textSecondary} text-[10px]`}>Avg/User</div>
              </div>
              <div className="text-center">
                <div className={`font-mono font-bold ${highActivityUsers > 2 ? 'text-orange-500' : 'text-green-500'}`}>
                  {highActivityUsers}
                </div>
                <div className={`${textSecondary} text-[10px]`}>High Activity</div>
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
            <BarChart 
              data={data} 
              margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
              layout="vertical"
            >
              <defs>
                <linearGradient id="userBarGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="1 1" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
                horizontal={false}
              />
              
              <XAxis
                type="number"
                tick={{ 
                  fill: "hsl(var(--muted-foreground))", 
                  fontSize: 11,
                  fontFamily: "system-ui"
                }}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                tickLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              
              <YAxis
                type="category"
                dataKey="user"
                tick={{ 
                  fill: "hsl(var(--muted-foreground))", 
                  fontSize: 10,
                  fontFamily: "system-ui"
                }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              
              {/* Average line reference */}
              <ReferenceLine 
                x={avgEventsPerUser} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="2 2" 
                strokeOpacity={0.6}
                label={{ 
                  value: `Avg: ${avgEventsPerUser}`, 
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))"
                }}
              />
              
              {/* High activity threshold line */}
              <ReferenceLine 
                x={highActivityThreshold} 
                stroke="#F59E0B" 
                strokeDasharray="3 3" 
                strokeOpacity={0.7}
                label={{ 
                  value: "High Activity", 
                  position: "insideTopRight",
                  fontSize: 9,
                  fill: "#F59E0B"
                }}
              />
              
              <RechartsTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const userData = payload[0].payload;
                    const isHighActivity = userData.count > highActivityThreshold;
                    const percentOfTotal = ((userData.count / totalEvents) * 100).toFixed(1);
                    const vsAverage = ((userData.count / avgEventsPerUser - 1) * 100).toFixed(1);
                    
                    return (
                      <div className={`${actualTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} border border-border rounded-lg shadow-lg p-3`}>
                        <div className={`font-medium ${textPrimary} text-sm mb-2 flex items-center gap-2`}>
                          <User className="h-3 w-3 text-purple-500" />
                          {userData.fullUser}
                          {isHighActivity && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className={textSecondary}>Events:</span>
                            <span className={`font-mono font-medium ${textPrimary}`}>{userData.count.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className={textSecondary}>% of Total:</span>
                            <span className={`font-mono font-medium ${textPrimary}`}>{percentOfTotal}%</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className={textSecondary}>vs Average:</span>
                            <span className={`font-mono font-medium ${parseFloat(vsAverage) > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                              {parseFloat(vsAverage) > 0 ? '+' : ''}{vsAverage}%
                            </span>
                          </div>
                          {isHighActivity && (
                            <div className="pt-1 border-t border-border">
                              <span className="text-orange-500 text-xs font-medium">⚠ High Activity User</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              <Bar 
                dataKey="count" 
                fill="url(#userBarGradient)"
                radius={[0, 4, 4, 0]}
                stroke="none"
                shape={({ payload, x, y, width, height }: any) => {
                  const isHighActivity = payload.count > highActivityThreshold;
                  return (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={isHighActivity ? "#F59E0B" : "url(#userBarGradient)"}
                      rx={4}
                    />
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Professional footer with user insights */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className={textSecondary}>
                {highActivityUsers} high-activity users detected
              </span>
            </div>
          </div>
          <div className={`text-xs ${textSecondary} flex items-center gap-1`}>
            <span>Concentration: </span>
            <span className={`font-medium ${
              parseFloat(concentrationPercent) > 50 ? 'text-red-500' : 
              parseFloat(concentrationPercent) > 30 ? 'text-orange-500' : 'text-green-500'
            }`}>
              {concentrationPercent}% (Top 3)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};