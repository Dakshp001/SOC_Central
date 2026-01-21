// src/components/dashboards/Meraki/charts/BandwidthTrendsChart.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TrendingUp, Info } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  Area,
  ComposedChart,
} from "recharts";
import { ThemedTooltip } from "./ThemedTooltip";
import { getGridStyle } from "../utils";
import { ChartData } from "../types";

interface BandwidthTrendsChartProps {
  chartData: ChartData;
  cardBg: string;
  textPrimary: string;
  textSecondary?: string;
  CHART_COLORS: any;
  actualTheme?: 'light' | 'dark';
}

// Professional color palette for bandwidth metrics
const BANDWIDTH_COLORS = {
  total: "#3B82F6", // Blue - Primary bandwidth
  download: "#10B981", // Emerald - Download traffic
  upload: "#F59E0B", // Amber - Upload traffic (if available)
  gradient: {
    total: "url(#totalGradient)",
    download: "url(#downloadGradient)",
  },
};

// Custom tooltip for bandwidth data - THEME AWARE
const CustomBandwidthTooltip = ({ active, payload, label, actualTheme = 'dark' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`
        ${actualTheme === 'dark' 
          ? 'bg-slate-800 border-slate-700 text-slate-200' 
          : 'bg-white border-gray-200 text-gray-800'
        } 
        border rounded-lg p-4 shadow-lg
      `}>
        <p className={`
          ${actualTheme === 'dark' ? 'text-slate-200' : 'text-gray-800'} 
          font-medium mb-2
        `}>
          {`Time: ${label}`}
        </p>
        {payload.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 mb-1"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className={`
                ${actualTheme === 'dark' ? 'text-slate-300' : 'text-gray-600'} 
                text-sm
              `}>
                {entry.name}:
              </span>
            </div>
            <span className={`
              ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'} 
              font-semibold
            `}>
              {formatBandwidth(entry.value)}
            </span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className={`
            pt-2 mt-2 border-t 
            ${actualTheme === 'dark' ? 'border-slate-600' : 'border-gray-200'}
          `}>
            <div className="flex items-center justify-between">
              <span className={`
                ${actualTheme === 'dark' ? 'text-slate-400' : 'text-gray-500'} 
                text-xs
              `}>
                Upload Ratio:
              </span>
              <span className={`
                ${actualTheme === 'dark' ? 'text-slate-300' : 'text-gray-700'} 
                text-xs
              `}>
                {calculateUploadRatio(payload)}%
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Format bandwidth values for display
const formatBandwidth = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)} Gbps`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} Mbps`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} Kbps`;
  }
  return `${value.toFixed(0)} bps`;
};

// Calculate upload ratio if both total and download are available
const calculateUploadRatio = (payload: any[]) => {
  const total = payload.find((p) => p.dataKey === "total")?.value || 0;
  const download = payload.find((p) => p.dataKey === "download")?.value || 0;
  const upload = total - download;
  return total > 0 ? ((upload / total) * 100).toFixed(1) : "0.0";
};

// Custom legend component - THEME AWARE
const CustomLegend = ({ payload, actualTheme = 'dark' }: any) => {
  return (
    <div className="flex justify-center gap-6 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className={`
            text-sm font-medium 
            ${actualTheme === 'dark' ? 'text-slate-300' : 'text-gray-600'}
          `}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Calculate trend statistics
const calculateTrendStats = (data: any[]) => {
  if (!data.length) return null;

  const totalValues = data.map((d) => d.total || 0);
  const downloadValues = data.map((d) => d.download || 0);

  const avgTotal = totalValues.reduce((a, b) => a + b, 0) / totalValues.length;
  const avgDownload =
    downloadValues.reduce((a, b) => a + b, 0) / downloadValues.length;
  const peakTotal = Math.max(...totalValues);
  const peakDownload = Math.max(...downloadValues);

  return {
    avgTotal: formatBandwidth(avgTotal),
    avgDownload: formatBandwidth(avgDownload),
    peakTotal: formatBandwidth(peakTotal),
    peakDownload: formatBandwidth(peakDownload),
    efficiency:
      totalValues.length > 0
        ? ((avgDownload / avgTotal) * 100).toFixed(1)
        : "0",
  };
};

export const BandwidthTrendsChart: React.FC<BandwidthTrendsChartProps> = ({
  chartData,
  cardBg,
  textPrimary,
  textSecondary = "text-slate-400",
  CHART_COLORS,
  actualTheme = 'dark',
}) => {
  const trendStats = calculateTrendStats(chartData.bandwidthTrends || []);

  return (
    <Card className={`${cardBg} ${actualTheme === 'dark' ? 'border-slate-700/50' : 'border-gray-200'}`}>
      {/* Gradient definitions for area fills */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
          </linearGradient>
        </defs>
      </svg>

      <CardHeader className="pb-4">
        <CardTitle className={`flex items-center gap-3 ${textPrimary}`}>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <span className="text-lg font-semibold">Bandwidth Usage Trends</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className={`ml-auto p-2 rounded-lg transition-all duration-200 ${
                  actualTheme === 'dark' 
                    ? 'hover:bg-slate-700/50' 
                    : 'hover:bg-gray-100'
                }`}>
                  <Info
                    className={`h-4 w-4 ${textSecondary} hover:${textPrimary}`}
                  />
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
                    <h4 className="font-semibold text-blue-400 mb-2">
                      Bandwidth Analysis
                    </h4>
                    <p className={`text-sm ${textSecondary} leading-relaxed`}>
                      Real-time bandwidth utilization trends showing total and
                      download traffic patterns over time.
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Summary Statistics - THEME AWARE */}
        {trendStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className={`
              text-center p-4 rounded-lg border shadow-sm
              ${actualTheme === 'dark' 
                ? 'bg-slate-700/40 border-slate-600/50' 
                : 'bg-gray-50 border-gray-200'
              }
            `}>
              <div className="text-lg font-bold text-blue-400 mb-2">
                {trendStats.peakTotal}
              </div>
              <div className={`
                text-sm font-semibold uppercase tracking-wide
                ${actualTheme === 'dark' ? 'text-slate-200' : 'text-gray-600'}
              `}>
                Peak Total
              </div>
            </div>
            <div className={`
              text-center p-4 rounded-lg border shadow-sm
              ${actualTheme === 'dark' 
                ? 'bg-slate-700/40 border-slate-600/50' 
                : 'bg-gray-50 border-gray-200'
              }
            `}>
              <div className="text-lg font-bold text-emerald-400 mb-2">
                {trendStats.peakDownload}
              </div>
              <div className={`
                text-sm font-semibold uppercase tracking-wide
                ${actualTheme === 'dark' ? 'text-slate-200' : 'text-gray-600'}
              `}>
                Peak Download
              </div>
            </div>
            <div className={`
              text-center p-4 rounded-lg border shadow-sm
              ${actualTheme === 'dark' 
                ? 'bg-slate-700/40 border-slate-600/50' 
                : 'bg-gray-50 border-gray-200'
              }
            `}>
              <div className={`
                text-lg font-bold mb-2
                ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}
              `}>
                {trendStats.avgTotal}
              </div>
              <div className={`
                text-sm font-semibold uppercase tracking-wide
                ${actualTheme === 'dark' ? 'text-slate-200' : 'text-gray-600'}
              `}>
                Avg Total
              </div>
            </div>
            <div className={`
              text-center p-4 rounded-lg border shadow-sm
              ${actualTheme === 'dark' 
                ? 'bg-slate-700/40 border-slate-600/50' 
                : 'bg-gray-50 border-gray-200'
              }
            `}>
              <div className={`
                text-lg font-bold mb-2
                ${actualTheme === 'dark' ? 'text-slate-200' : 'text-gray-700'}
              `}>
                {trendStats.efficiency}%
              </div>
              <div className={`
                text-sm font-semibold uppercase tracking-wide
                ${actualTheme === 'dark' ? 'text-slate-200' : 'text-gray-600'}
              `}>
                Efficiency
              </div>
            </div>
          </div>
        )}

        {/* Line Chart */}
        <div className="h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData.bandwidthTrends}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              {/* Grid */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={actualTheme === 'dark' ? "rgba(148, 163, 184, 0.1)" : "rgba(156, 163, 175, 0.2)"}
                horizontal={true}
                vertical={false}
              />

              {/* Axes */}
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: actualTheme === 'dark' ? "rgb(148, 163, 184)" : "rgb(107, 114, 128)",
                  fontSize: 11,
                  fontWeight: 500,
                }}
                interval="preserveStartEnd"
                tickFormatter={(value) => {
                  // Enhanced time formatting for better readability
                  if (typeof value === "string") {
                    // If it's a full datetime string
                    if (value.includes(" ")) {
                      const parts = value.split(" ");
                      if (parts.length >= 2) {
                        // Format as "MM/DD HH:mm" 
                        const datePart = parts[0];
                        const timePart = parts[1];
                        if (datePart.includes("/") && timePart.includes(":")) {
                          const [month, day] = datePart.split("/");
                          const [hour, minute] = timePart.split(":");
                          return `${month}/${day} ${hour}:${minute}`;
                        }
                      }
                      // Fallback to just time
                      return parts[parts.length - 1];
                    }
                    // If it's just time format
                    if (value.includes(":")) {
                      const [hour, minute] = value.split(":");
                      return `${hour}:${minute}`;
                    }
                  }
                  return value;
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: actualTheme === 'dark' ? "rgb(148, 163, 184)" : "rgb(107, 114, 128)",
                  fontSize: 12,
                  fontWeight: 500,
                }}
                tickFormatter={(value) => formatBandwidth(value)}
                domain={["dataMin", "dataMax"]}
              />

              {/* Tooltip */}
              <RechartsTooltip content={<CustomBandwidthTooltip actualTheme={actualTheme} />} />

              {/* Area fills for better visual appeal */}
              <Area
                type="monotone"
                dataKey="total"
                stroke="none"
                fill="url(#totalGradient)"
                fillOpacity={0.4}
              />

              {/* Lines */}
              <Line
                type="monotone"
                dataKey="total"
                stroke={BANDWIDTH_COLORS.total}
                strokeWidth={3}
                name="Total Bandwidth"
                dot={{
                  fill: BANDWIDTH_COLORS.total,
                  strokeWidth: 0,
                  r: 0,
                }}
                activeDot={{
                  r: 6,
                  fill: BANDWIDTH_COLORS.total,
                  stroke: "rgba(59, 130, 246, 0.3)",
                  strokeWidth: 8,
                }}
                connectNulls={false}
              />

              <Line
                type="monotone"
                dataKey="download"
                stroke={BANDWIDTH_COLORS.download}
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Download Traffic"
                dot={{
                  fill: BANDWIDTH_COLORS.download,
                  strokeWidth: 0,
                  r: 0,
                }}
                activeDot={{
                  r: 5,
                  fill: BANDWIDTH_COLORS.download,
                  stroke: "rgba(16, 185, 129, 0.3)",
                  strokeWidth: 6,
                }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend */}
        <CustomLegend
          actualTheme={actualTheme}
          payload={[
            { value: "Total Bandwidth", color: BANDWIDTH_COLORS.total },
            { value: "Download Traffic", color: BANDWIDTH_COLORS.download },
          ]}
        />

        {/* Trend Summary */}
        <div className={`mt-6 pt-4 border-t ${
          actualTheme === 'dark' ? 'border-slate-700/50' : 'border-gray-200'
        }`}>
          <div className="flex justify-between items-center text-sm">
            <div className={`${textSecondary}`}>
              <span>Data Points: </span>
              <span className={`
                font-medium
                ${actualTheme === 'dark' ? 'text-white' : 'text-gray-900'}
              `}>
                {chartData.bandwidthTrends?.length || 0}
              </span>
            </div>
            {trendStats && (
              <div className={`${textSecondary}`}>
                <span>Network Efficiency: </span>
                <span
                  className={`font-semibold ${
                    parseFloat(trendStats.efficiency) > 70
                      ? "text-emerald-400"
                      : parseFloat(trendStats.efficiency) > 50
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {trendStats.efficiency}%
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};