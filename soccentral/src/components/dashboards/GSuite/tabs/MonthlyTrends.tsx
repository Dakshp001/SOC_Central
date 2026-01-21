// src/components/dashboards/GSuite/tabs/MonthlyTrends.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartData } from '../types';
import { CustomTooltip } from '../components/CustomTooltip';
import { CHART_COLORS } from '../utils';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface MonthlyTrendsProps {
  chartData: ChartData;
}

export const MonthlyTrends: React.FC<MonthlyTrendsProps> = ({ chartData }) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const gridColor = actualTheme === 'dark' ? "#374151" : "#E5E7EB";
  const tickColor = actualTheme === 'dark' ? "#D1D5DB" : "#6B7280";
  const tooltipBg = actualTheme === 'dark' ? "#1F2937" : "#FFFFFF";
  const tooltipBorder = actualTheme === 'dark' ? "#374151" : "#E5E7EB";
  
  // If no data available, use sample data to demonstrate the chart
  const displayData = chartData.monthlyData.length > 0 ? chartData.monthlyData : [
    { month: 'Jan', count: 4250, phishing: 28, suspicious: 45 },
    { month: 'Feb', count: 3890, phishing: 22, suspicious: 38 },
    { month: 'Mar', count: 4120, phishing: 31, suspicious: 42 },
    { month: 'Apr', count: 3750, phishing: 19, suspicious: 35 },
    { month: 'May', count: 4480, phishing: 35, suspicious: 48 },
    { month: 'Jun', count: 4120, phishing: 26, suspicious: 41 }
  ];

  return (
    <Card className={`${cardBg} ${actualTheme === 'dark' ? 'bg-gradient-to-br from-card to-card/80' : 'bg-gradient-to-br from-card to-card/95'} lg:col-span-2`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
          <TrendingUp className="h-5 w-5 text-green-400" />
          Monthly Security Trends
          {chartData.monthlyData.length === 0 && (
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
              Sample Data
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={displayData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 12 }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                labelStyle={{ color: tickColor }}
                contentStyle={{ 
                  backgroundColor: tooltipBg, 
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '8px'
                }}
              />
              <Legend wrapperStyle={{ color: tickColor }} />
              
              <Bar
                dataKey="count"
                fill={CHART_COLORS.primary}
                name="Total Emails"
                radius={[4, 4, 0, 0]}
              />
              
              <Bar
                dataKey="phishing"
                fill={CHART_COLORS.danger}
                name="Phishing Attempts"
                radius={[4, 4, 0, 0]}
              />
              
              <Bar
                dataKey="suspicious"
                fill={CHART_COLORS.warning}
                name="Suspicious Emails"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};