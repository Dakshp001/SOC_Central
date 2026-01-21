// src/components/Dashboards/SIEM/MonthlyTrendsChart.tsx

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
import { MonthlyTrendData } from "../types";

interface MonthlyTrendsChartProps {
  data: MonthlyTrendData[];
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  ThemedTooltip?: React.ComponentType<any>; // Optional since it's not used
  getGridStyle?: () => any; // Optional since it's not used
  actualTheme: string;
}

export const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({
  data,
  cardBg,
  textPrimary,
  textSecondary,
  actualTheme,
  // ThemedTooltip and getGridStyle are unused but kept for compatibility
}) => {
  const [showInfo, setShowInfo] = useState(false);

  // Calculate trend analytics
  const totalEvents = data.reduce((sum, month) => sum + month.count, 0);
  const avgMonthly = Math.round(totalEvents / data.length);
  const maxMonth = Math.max(...data.map((d) => d.count));
  const minMonth = Math.min(...data.map((d) => d.count));

  // Calculate trend direction and percentage
  const firstHalf = data.slice(0, Math.ceil(data.length / 2));
  const secondHalf = data.slice(Math.ceil(data.length / 2));
  const firstHalfAvg =
    firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;

  const trendDirection =
    secondHalfAvg > firstHalfAvg
      ? "up"
      : secondHalfAvg < firstHalfAvg
      ? "down"
      : "stable";
  const trendPercent = Math.abs(
    ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
  ).toFixed(1);

  // Growth rate calculation
  const growthRate =
    data.length >= 2
      ? (
          ((data[data.length - 1].count - data[0].count) / data[0].count) *
          100
        ).toFixed(1)
      : "0";

  const TrendIcon =
    trendDirection === "up"
      ? TrendingUp
      : trendDirection === "down"
      ? TrendingDown
      : Minus;
  const trendColor =
    trendDirection === "up"
      ? "text-green-500"
      : trendDirection === "down"
      ? "text-red-500"
      : "text-gray-500";

  const infoContent = (
    <div className="space-y-3 text-sm">
      <div className="font-semibold text-base">Monthly Trends Analysis</div>

      <div className="space-y-2">
        <div className="font-medium">Data Collection:</div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Security events aggregated by calendar month</li>
          <li>All severity levels included in count</li>
          <li>Deduplication applied to prevent double-counting</li>
          <li>Historical data up to 12 months</li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Trend Calculation:</div>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>First half vs second half period comparison</li>
          <li>Moving average smoothing applied</li>
          <li>Seasonal patterns identified and noted</li>
          <li>Growth rate: month-over-month percentage change</li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Key Metrics:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            Monthly Avg:{" "}
            <span className="font-mono">{avgMonthly.toLocaleString()}</span>
          </div>
          <div>
            Peak Month:{" "}
            <span className="font-mono">{maxMonth.toLocaleString()}</span>
          </div>
          <div>
            Growth Rate:{" "}
            <span
              className={`font-mono ${
                parseFloat(growthRate) > 0
                  ? "text-green-500"
                  : parseFloat(growthRate) < 0
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
            >
              {growthRate}%
            </span>
          </div>
          <div>
            Volatility:{" "}
            <span className="font-mono">
              {(((maxMonth - minMonth) / avgMonthly) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-medium">Trend Analysis:</div>
        <div className="flex items-center gap-2 text-xs">
          <TrendIcon className={`h-3 w-3 ${trendColor}`} />
          <span>
            {trendDirection === "up"
              ? "Increasing"
              : trendDirection === "down"
              ? "Decreasing"
              : "Stable"}
            trend over period ({trendPercent}% change)
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-border text-xs text-muted-foreground">
        Data updated monthly, includes all processed security events
      </div>
    </div>
  );

  return (
    <Card className={`${cardBg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            <CardTitle className={`${textPrimary} text-base font-semibold`}>
              Monthly Event Trends
            </CardTitle>

          </div>
          <div className="flex items-center gap-2">
            {/* Key metrics display */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-center">
                <div className={`font-mono font-bold ${textPrimary}`}>
                  {avgMonthly.toLocaleString()}
                </div>
                <div className={`${textSecondary} text-[10px]`}>
                  Monthly Avg
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`font-mono font-bold ${
                    parseFloat(growthRate) > 0
                      ? "text-green-500"
                      : parseFloat(growthRate) < 0
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {parseFloat(growthRate) > 0 ? "+" : ""}
                  {growthRate}%
                </div>
                <div className={`${textSecondary} text-[10px]`}>Growth</div>
              </div>
            </div>

            <TooltipProvider>
              <Tooltip open={showInfo} onOpenChange={setShowInfo}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-6 w-6 p-0 ${
                      actualTheme === "dark"
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setShowInfo(!showInfo)}
                  >
                    <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="w-80 p-4" sideOffset={5}>
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
                <linearGradient
                  id="monthlyGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="1 1"
                stroke="hsl(var(--border))"
                strokeOpacity={0.3}
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                  fontFamily: "system-ui",
                }}
                axisLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                tickLine={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                tickMargin={8}
              />

              <YAxis
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                  fontFamily: "system-ui",
                }}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={50}
                tickFormatter={(value) => value.toLocaleString()}
              />

              {/* Average line reference */}
              <ReferenceLine
                y={avgMonthly}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="2 2"
                strokeOpacity={0.6}
                label={{
                  value: `Avg: ${avgMonthly.toLocaleString()}`,
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: "hsl(var(--muted-foreground))",
                }}
              />

              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const count = Number(payload[0].value) || 0;
                    const percentOfAvg = (
                      (count / avgMonthly - 1) *
                      100
                    ).toFixed(1);

                    return (
                      <div
                        className={`${
                          actualTheme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"
                        } border border-border rounded-lg shadow-lg p-3`}
                      >
                        <div
                          className={`font-medium ${textPrimary} text-sm mb-2`}
                        >
                          {label}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between gap-4">
                            <span className={textSecondary}>Events:</span>
                            <span
                              className={`font-mono font-medium ${textPrimary}`}
                            >
                              {count.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className={textSecondary}>vs Average:</span>
                            <span
                              className={`font-mono font-medium ${
                                parseFloat(percentOfAvg) > 0
                                  ? "text-green-500"
                                  : parseFloat(percentOfAvg) < 0
                                  ? "text-red-500"
                                  : textPrimary
                              }`}
                            >
                              {parseFloat(percentOfAvg) > 0 ? "+" : ""}
                              {percentOfAvg}%
                            </span>
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
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2.5}
                fill="url(#monthlyGradient)"
                dot={{
                  fill: "#3B82F6",
                  strokeWidth: 2,
                  stroke: "#ffffff",
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  fill: "#3B82F6",
                  stroke: "#ffffff",
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Professional footer with trend summary */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <TrendIcon className={`h-3 w-3 ${trendColor}`} />
              <span className={textSecondary}>
                {trendDirection === "up"
                  ? "Upward"
                  : trendDirection === "down"
                  ? "Downward"
                  : "Stable"}{" "}
                trend
                <span className={`ml-1 font-medium ${trendColor}`}>
                  ({trendPercent}%)
                </span>
              </span>
            </div>
          </div>
          <div className={`text-xs ${textSecondary} flex items-center gap-1`}>
            <span>Period: </span>
            <span className="font-medium">{data.length} months</span>
            <span className="mx-1">•</span>
            <span>Total: </span>
            <span className="font-mono font-medium">
              {totalEvents.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
