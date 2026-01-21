// src/components/dashboards/Meraki/charts/ClientLoadDistributionChart.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, Info, Activity } from "lucide-react";
import { PieChart as RechartsPieChart, Cell, Pie, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { getTooltipStyle } from "../utils";
import { ChartData } from "../types";

interface ClientLoadDistributionChartProps {
  chartData: ChartData;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  actualTheme: 'light' | 'dark';
}

export const ClientLoadDistributionChart: React.FC<ClientLoadDistributionChartProps> = ({
  chartData,
  cardBg,
  textPrimary,
  textSecondary,
  actualTheme,
}) => {
  return (
    <Card className={cardBg}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
          <BarChart3 className="h-5 w-5 text-green-400" />
          Client Load Distribution
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-auto p-1 rounded-full hover:bg-muted/50 transition-colors">
                  <Info className={`h-4 w-4 ${textSecondary} hover:${textPrimary}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className={`max-w-md p-4 ${cardBg}`}>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-400 mb-1">Client Load Analysis</h4>
                    <p className={`text-xs ${textSecondary}`}>
                      Distribution of connected clients across network devices and access points.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-green-400">Load Categories:</span>
                      <p className={`${textSecondary} ml-2`}>
                        • <span className="text-red-300">High Load:</span> &gt;25 clients per device
                        <br />• <span className="text-green-300">Optimal Load:</span> 10-25 clients per device
                        <br />• <span className="text-yellow-300">Low Load:</span> &lt;10 clients per device
                      </p>
                    </div>

                    <div>
                      <span className="font-medium text-green-400">Performance Indicators:</span>
                      <p className={`${textSecondary} ml-2`}>
                        • Identifies overloaded access points
                        <br />• Reveals underutilized network resources
                        <br />• Calculates optimal device deployment
                        <br />• Predicts capacity bottlenecks
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <div className="space-y-1 text-xs">
                      <p className={textSecondary}>
                        <span className="font-medium">Optimal Range:</span> 10-15 clients per device for best performance
                      </p>
                      <p className={textSecondary}>
                        <span className="font-medium">Alert Threshold:</span> &gt;25 clients triggers capacity warning
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData.clientDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                }
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.clientDistribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    stroke={actualTheme === 'dark' ? '#374151' : '#E5E7EB'}
                    strokeWidth={1}
                  />
                ))}
              </Pie>
              <RechartsTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={getTooltipStyle(actualTheme)} className="p-3">
                        <p className={`${textPrimary} text-sm font-medium mb-1`}>
                          {data.name}
                        </p>
                        <div className="space-y-1">
                          <p className={`${textSecondary} text-sm`}>
                            <span className="font-medium" style={{ color: data.fill }}>
                              Devices:
                            </span>
                            <span className="ml-1">{data.value}</span>
                          </p>
                          <p className={`${textSecondary} text-sm`}>
                            <span className="font-medium">Percentage:</span>
                            <span className="ml-1">
                              {((data.value / chartData.clientDistribution.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
                            </span>
                          </p>
                          <div className="mt-2 pt-2 border-t border-border">
                            <p className={`text-xs ${textSecondary}`}>
                              {data.name === "High Load (>25)" && "⚠️ Consider load balancing"}
                              {data.name === "Optimal (10-25)" && "✅ Well balanced load"}
                              {data.name === "Low Load (<10)" && "📊 Room for more clients"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  paddingTop: "20px",
                  color: "hsl(var(--muted-foreground))",
                  fontSize: "12px"
                }}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value}
                  </span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
          
          {/* Center Statistics */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center mb-6">
              <div className={`text-2xl font-bold ${textPrimary}`}>
                {chartData.clientDistribution.reduce((sum, item) => sum + item.value, 0)}
              </div>
              <div className={`text-sm ${textSecondary}`}>
                Total Devices
              </div>
            </div>
          </div>
        </div>
        
        {/* Load Distribution Summary */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            {chartData.clientDistribution.map((item, index) => {
              const percentage = ((item.value / chartData.clientDistribution.reduce((sum, entry) => sum + entry.value, 0)) * 100).toFixed(1);
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className={`text-xs font-medium ${textPrimary}`}>
                      {item.name.split(' ')[0]}
                    </span>
                  </div>
                  <div className={`text-lg font-bold ${textPrimary}`}>
                    {item.value}
                  </div>
                  <div className={`text-xs ${textSecondary}`}>
                    {percentage}% of devices
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className={`text-sm font-medium ${textPrimary} mb-3 flex items-center gap-2`}>
            <Activity className="h-4 w-4 text-green-400" />
            Load Distribution Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} border border-border`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Network Efficiency</span>
                <span className={`text-sm font-medium ${
                  (chartData.clientDistribution.find(item => item.name.includes('Optimal'))?.value || 0) > 
                  (chartData.clientDistribution.find(item => item.name.includes('High'))?.value || 0)
                    ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {(chartData.clientDistribution.find(item => item.name.includes('Optimal'))?.value || 0) > 
                   (chartData.clientDistribution.find(item => item.name.includes('High'))?.value || 0)
                    ? 'Good' : 'Needs Attention'}
                </span>
              </div>
            </div>
            
            <div className={`p-3 rounded-lg ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} border border-border`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm ${textSecondary}`}>Load Balance</span>
                <span className={`text-sm font-medium ${
                  (chartData.clientDistribution.find(item => item.name.includes('High'))?.value || 0) === 0
                    ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(chartData.clientDistribution.find(item => item.name.includes('High'))?.value || 0) === 0
                    ? 'Balanced' : 'Overloaded'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};