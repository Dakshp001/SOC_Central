// src/components/dashboards/Meraki/charts/NetworkOverviewChart.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Network, Info } from "lucide-react";
import { 
  PieChart as RechartsPieChart, 
  Cell, 
  Pie, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip 
} from "recharts";
import { NetworkTooltip } from "./NetworkTooltip";
import { ChartData } from "../types";

interface NetworkOverviewChartProps {
  chartData: ChartData;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  actualTheme?: 'light' | 'dark';
}

// Professional color palette
const COLORS = {
  devices: '#3B82F6',      // Blue
  ssids: '#10B981',        // Emerald
  clients: '#8B5CF6',      // Purple
  manufacturers: '#F59E0B' // Amber
};

// Custom label component for better positioning - THEME AWARE
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent, actualTheme = 'dark' }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is significant enough
  if (percent < 0.05) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill={actualTheme === 'dark' ? "#94A3B8" : "#6B7280"} 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12"
      fontWeight="500"
    >
      {`${name}: ${value}`}
    </text>
  );
};

// Custom legend component - THEME AWARE
const CustomLegend = ({ payload, actualTheme = 'dark' }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-6">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className={`text-sm font-medium ${
            actualTheme === 'dark' ? 'text-slate-400' : 'text-gray-600'
          }`}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Custom tooltip - THEME AWARE
const CustomTooltip = ({ active, payload, actualTheme = 'dark' }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className={`
        border rounded-lg p-3 shadow-lg
        ${actualTheme === 'dark' 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
        }
      `}>
        <p className={`font-medium ${
          actualTheme === 'dark' ? 'text-slate-200' : 'text-gray-800'
        }`}>
          {data.name}
        </p>
        <p className={`text-sm ${
          actualTheme === 'dark' ? 'text-slate-400' : 'text-gray-600'
        }`}>
          Value: <span className={`font-semibold ${
            actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {data.value}
          </span>
        </p>
        <p className={`text-sm ${
          actualTheme === 'dark' ? 'text-slate-400' : 'text-gray-600'
        }`}>
          Percentage: <span className={`font-semibold ${
            actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {((data.value / payload.reduce((sum: number, item: any) => sum + item.value, 0)) * 100).toFixed(1)}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export const NetworkOverviewChart: React.FC<NetworkOverviewChartProps> = ({
  chartData,
  cardBg,
  textPrimary,
  textSecondary,
  actualTheme = 'dark',
}) => {
  // Process data to ensure proper colors
  const processedData = chartData.networkOverview.map((item, index) => ({
    ...item,
    fill: item.fill || Object.values(COLORS)[index % Object.values(COLORS).length]
  }));

  // Calculate total for statistics
  const total = processedData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={`${cardBg} ${
      actualTheme === 'dark' ? 'border-slate-700/50' : 'border-gray-200'
    }`}>
      <CardHeader className="pb-4">
        <CardTitle className={`flex items-center gap-3 ${textPrimary}`}>
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Network className="h-5 w-5 text-orange-400" />
          </div>
          <span className="text-lg font-semibold">Network Infrastructure Overview</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className={`ml-auto p-2 rounded-lg transition-all duration-200 ${
                  actualTheme === 'dark' 
                    ? 'hover:bg-slate-700/50' 
                    : 'hover:bg-gray-100'
                }`}>
                  <Info className={`h-4 w-4 ${textSecondary} hover:${textPrimary}`} />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="bottom" 
                align="end" 
                className={`max-w-md p-4 ${cardBg} ${
                  actualTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'
                }`}
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-orange-400 mb-2">Infrastructure Analysis</h4>
                    <p className={`text-sm ${textSecondary} leading-relaxed`}>
                      Comprehensive overview of network hardware, SSIDs, and architectural components.
                    </p>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-orange-400">Multi-Source Data Aggregation:</span>
                      <div className={`${textSecondary} mt-2 space-y-1`}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-blue-300">Device Inventory:</span>
                          <span className="text-xs">Top devices + models</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          <span className="text-emerald-300">SSID Configuration:</span>
                          <span className="text-xs">Top SSIDs by usage</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span className="text-purple-300">Client Distribution:</span>
                          <span className="text-xs">Top clients by usage</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                          <span className="text-amber-300">Manufacturer Analysis:</span>
                          <span className="text-xs">Top manufacturers</span>
                        </div>
                      </div>
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          {processedData.slice(0, 3).map((item, index) => (
            <div key={index} className={`text-center p-3 rounded-lg border ${
              actualTheme === 'dark' 
                ? 'bg-slate-800/30 border-slate-700/30' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className={`text-2xl font-bold mb-1 ${
                actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {item.value}
              </div>
              <div className={`text-xs font-medium uppercase tracking-wide ${
                actualTheme === 'dark' ? 'text-slate-400' : 'text-gray-600'
              }`}>
                {item.name}
              </div>
            </div>
          ))}
        </div>

        {/* Pie Chart */}
        <div className="h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
              <Pie
                data={processedData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={(props: any) => <CustomLabel {...props} actualTheme={actualTheme} />}
                outerRadius={85}
                innerRadius={25}
                paddingAngle={2}
                dataKey="value"
                stroke={actualTheme === 'dark' ? "rgba(51, 65, 85, 0.8)" : "rgba(229, 231, 235, 0.8)"}
                strokeWidth={1}
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip actualTheme={actualTheme} />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend */}
        <CustomLegend 
          actualTheme={actualTheme}
          payload={processedData.map(item => ({ value: item.name, color: item.fill }))} 
        />
        
        {/* Total Summary */}
        <div className={`mt-6 pt-4 border-t ${
          actualTheme === 'dark' ? 'border-slate-700/50' : 'border-gray-200'
        }`}>
          <div className="text-center">
            <span className={`text-sm ${textSecondary}`}>Total Infrastructure Components: </span>
            <span className={`text-lg font-semibold ${
              actualTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};