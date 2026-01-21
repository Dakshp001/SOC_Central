// src/components/Dashboards/SIEM/DailyDistributionChart.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailyDistributionChartProps {
  data: { [day: string]: number };
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  getGridStyle: () => any;
  getTooltipStyle: (actualTheme: string) => any;
  actualTheme: string;
}

export const DailyDistributionChart: React.FC<DailyDistributionChartProps> = ({
  data,
  cardBg,
  textPrimary,
  textSecondary,
  getGridStyle,
  getTooltipStyle,
  actualTheme,
}) => {
  const chartData = Object.entries(data).map(([day, count]) => ({
    day: day.substring(0, 3), // Mon, Tue, Wed
    fullDay: day,
    count: count
  }));

  return (
    <Card className={cardBg}>
      <CardHeader className="pb-4">
        <CardTitle className={`${textPrimary} text-lg`}>Events by Day of Week</CardTitle>
        <p className={`${textSecondary} text-sm`}>Which days are busiest for security events?</p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid {...getGridStyle()} />
              <XAxis 
                dataKey="day"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={getTooltipStyle(actualTheme)} className="p-3">
                        <p className={`${textPrimary} text-sm font-medium`}>{data.fullDay}</p>
                        <p className={`${textSecondary} text-sm`}>Events: {data.count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};