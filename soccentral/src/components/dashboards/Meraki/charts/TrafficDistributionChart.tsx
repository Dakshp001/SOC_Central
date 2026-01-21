// src/components/dashboards/Meraki/charts/TrafficDistributionChart.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, Info } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Cell,
  LabelList
} from "recharts";
import { ThemedTooltip } from "./ThemedTooltip";
import { getGridStyle } from "../utils";
import { ChartData } from "../types";

interface TrafficDistributionChartProps {
  chartData: ChartData;
  cardBg: string;
  textPrimary: string;
  textSecondary?: string;
  actualTheme?: 'light' | 'dark';
}

// Professional color palette for traffic categories
const TRAFFIC_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1', // Indigo
];

// Custom tooltip for traffic data
const CustomTrafficTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = calculateTotalTraffic(payload[0].payload.__totalData || []);
    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
    
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-lg">
        <p className="text-slate-200 font-medium mb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: data.color }}
              />
              <span className="text-slate-300 text-sm">Traffic Volume:</span>
            </div>
            <span className="text-white font-semibold">
              {formatTrafficValue(data.value)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400 text-sm">Percentage:</span>
            <span className="text-slate-300 font-medium">{percentage}%</span>
          </div>
          <div className="pt-2 border-t border-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 text-xs">Category Rank:</span>
              <span className="text-slate-300 text-xs">
                #{(payload[0].payload.__rank || 0) + 1}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Format traffic values for display
const formatTrafficValue = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)} GB`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} MB`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} KB`;
  }
  return `${value.toFixed(0)} B`;
};

// Calculate total traffic for percentage calculations
const calculateTotalTraffic = (data: any[]) => {
  return data.reduce((sum, item) => sum + (item.value || 0), 0);
};

// Custom label component for bars
const CustomLabel = ({ x, y, width, height, value }: any) => {
  // Only show labels for significant values to avoid clutter
  const formattedValue = formatTrafficValue(value);
  if (height < 30) return null; // Don't show label if bar is too small
  
  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="white"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="11"
      fontWeight="500"
    >
      {formattedValue}
    </text>
  );
};

// Calculate traffic statistics
const calculateTrafficStats = (data: any[]) => {
  if (!data.length) return null;

  const values = data.map(d => d.value || 0);
  const total = values.reduce((a, b) => a + b, 0);
  const average = total / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  // Find dominant category (>50% of traffic)
  const dominant = data.find(d => (d.value / total) > 0.5);
  
  // Calculate distribution concentration
  const topThreePercent = data
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .reduce((sum, item) => sum + item.value, 0) / total * 100;

  return {
    total: formatTrafficValue(total),
    average: formatTrafficValue(average),
    max: formatTrafficValue(max),
    min: formatTrafficValue(min),
    categories: data.length,
    dominant: dominant ? dominant.name : 'Distributed',
    topThreePercent: topThreePercent.toFixed(1)
  };
};

export const TrafficDistributionChart: React.FC<TrafficDistributionChartProps> = ({
  chartData,
  cardBg,
  textPrimary,
  textSecondary = "text-slate-400",
}) => {
  // Process data with colors and rankings
  const processedData = (chartData.trafficDistribution || [])
    .map((item, index) => ({
      ...item,
      fill: item.fill || TRAFFIC_COLORS[index % TRAFFIC_COLORS.length],
      __rank: index,
      __totalData: chartData.trafficDistribution
    }))
    .sort((a, b) => (b.value || 0) - (a.value || 0)); // Sort by value descending

  const trafficStats = calculateTrafficStats(processedData);

  return (
    <Card className={`${cardBg} border-slate-700/50`}>
      <CardHeader className="pb-4">
        <CardTitle className={`flex items-center gap-3 ${textPrimary}`}>
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <BarChart3 className="h-5 w-5 text-purple-400" />
          </div>
          <span className="text-lg font-semibold">Traffic Distribution</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-auto p-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200">
                  <Info className={`h-4 w-4 ${textSecondary} hover:${textPrimary}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                align="end" 
                className={`max-w-md p-4 ${cardBg} border-slate-700`}
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-purple-400 mb-2">Traffic Distribution Analysis</h4>
                    <p className={`text-sm ${textSecondary} leading-relaxed`}>
                      Comprehensive breakdown of network traffic by category, showing bandwidth consumption patterns across different traffic types.
                    </p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-purple-400">Data Sources & Processing:</span>
                      <div className={`${textSecondary} mt-2 space-y-2`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-blue-300 font-medium">Client Traffic:</span>
                          </div>
                          <p className="text-xs ml-4">
                            From "Top clients by usage" sheet
                            <br />
                            <span className="text-slate-400">Data Received (kB) + Data Sent (kB) per client</span>
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                            <span className="text-emerald-300 font-medium">Application Traffic:</span>
                          </div>
                          <p className="text-xs ml-4">
                            From "Top applications by usage" sheet
                            <br />
                            <span className="text-slate-400">Usage (kB) aggregated by application category</span>
                          </p>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                            <span className="text-amber-300 font-medium">Device Traffic:</span>
                          </div>
                          <p className="text-xs ml-4">
                            From "Top devices" sheet
                            <br />
                            <span className="text-slate-400">Usage (kB) per network device/access point</span>
                          </p>
                        </div>
                        
                        <div className="pt-2 border-t border-slate-600/50">
                          <span className="text-purple-300 font-medium text-xs">Analytics Features:</span>
                          <ul className="text-xs text-slate-400 mt-1 space-y-1">
                            <li>• Traffic volume ranking and percentage distribution</li>
                            <li>Category dominance analysis (&gt;50% threshold)</li>
                            <li>• Top-3 concentration metrics for load balancing</li>
                            <li>• Traffic pattern insights for QoS optimization</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-600/50">
                      <span className="font-medium text-amber-400">Backend Processing:</span>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Traffic data aggregated through client_behavior_analysis(), 
                        application_usage_analysis(), and device_distribution_analysis() 
                        functions for comprehensive network utilization insights.
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-2">
        {/* Summary Statistics */}
        {trafficStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="text-lg font-bold text-purple-400 mb-1">{trafficStats.total}</div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Total Traffic
              </div>
            </div>
            <div className="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="text-lg font-bold text-white mb-1">{trafficStats.categories}</div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Categories
              </div>
            </div>
            <div className="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="text-lg font-bold text-slate-300 mb-1">{trafficStats.topThreePercent}%</div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Top 3 Share
              </div>
            </div>
            <div className="text-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="text-sm font-bold text-slate-300 mb-1">{trafficStats.dominant}</div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Dominant
              </div>
            </div>
          </div>
        )}

        {/* Bar Chart */}
        <div className="h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              barCategoryGap="20%"
            >
              {/* Grid */}
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(148, 163, 184, 0.1)"
                horizontal={true}
                vertical={false}
              />
              
              {/* Axes */}
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fill: "rgb(148, 163, 184)", 
                  fontSize: 11,
                  fontWeight: 500
                }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fill: "rgb(148, 163, 184)", 
                  fontSize: 12,
                  fontWeight: 500
                }}
                tickFormatter={formatTrafficValue}
                domain={[0, 'dataMax']}
              />
              
              {/* Tooltip */}
              <RechartsTooltip content={<CustomTrafficTooltip />} />
              
              {/* Bars */}
              <Bar 
                dataKey="value" 
                radius={[6, 6, 0, 0]}
                stroke="rgba(51, 65, 85, 0.8)"
                strokeWidth={1}
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
                <LabelList content={<CustomLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Traffic Analysis Summary */}
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className={`${textSecondary} mb-1`}>Peak Category</div>
              <div className="text-white font-semibold">
                {processedData[0]?.name || 'N/A'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {processedData[0] ? formatTrafficValue(processedData[0].value) : 'No data'}
              </div>
            </div>
            <div className="text-center">
              <div className={`${textSecondary} mb-1`}>Distribution Balance</div>
              <div className={`font-semibold ${
                trafficStats && parseFloat(trafficStats.topThreePercent) > 80 ? 'text-amber-400' :
                trafficStats && parseFloat(trafficStats.topThreePercent) > 60 ? 'text-emerald-400' : 'text-blue-400'
              }`}>
                {trafficStats && parseFloat(trafficStats.topThreePercent) > 80 ? 'Concentrated' :
                 trafficStats && parseFloat(trafficStats.topThreePercent) > 60 ? 'Balanced' : 'Distributed'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Top 3: {trafficStats?.topThreePercent || '0'}%
              </div>
            </div>
            <div className="text-center">
              <div className={`${textSecondary} mb-1`}>Categories Active</div>
              <div className="text-white font-semibold">
                {trafficStats?.categories || 0}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Traffic sources
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};