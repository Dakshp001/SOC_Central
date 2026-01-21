// src/components/Dashboards/SIEM/PeakActivityChart.tsx

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

interface PeakActivityChartProps {
  data: { [hour: string]: number };
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  getGridStyle: () => any;
  getTooltipStyle: (actualTheme: string) => any;
  actualTheme: string;
}

export const PeakActivityChart: React.FC<PeakActivityChartProps> = ({
  data,
  cardBg,
  textPrimary,
  textSecondary,
  getGridStyle,
  getTooltipStyle,
  actualTheme,
}) => {
  const chartData = Object.entries(data).map(([hour, count]) => ({
    hour,
    count: count,
    fullHour: `${hour}:00`
  }));

  return (
    <Card className={cardBg}>
      <CardHeader className="pb-4">
        <CardTitle className={`${textPrimary} text-lg`}>Peak Activity Hours</CardTitle>
        <p className={`${textSecondary} text-sm`}>When do most security events occur?</p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ bottom: 60 }}
            >
              <CartesianGrid {...getGridStyle()} />
              <XAxis 
                dataKey="hour"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                angle={-45}
                textAnchor="end"
                height={60}
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
                        <p className={`${textPrimary} text-sm font-medium`}>{data.fullHour}</p>
                        <p className={`${textSecondary} text-sm`}>Events: {data.count}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};