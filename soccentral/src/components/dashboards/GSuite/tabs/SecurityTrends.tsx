// src/components/dashboards/GSuite/tabs/SecurityTrends.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
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

interface SecurityTrendsProps {
  chartData: ChartData;
}

export const SecurityTrends: React.FC<SecurityTrendsProps> = ({ chartData }) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  const gridColor = actualTheme === 'dark' ? "#374151" : "#E5E7EB";
  const tickColor = actualTheme === 'dark' ? "#D1D5DB" : "#6B7280";
  const tooltipBg = actualTheme === 'dark' ? "#1F2937" : "#FFFFFF";
  const tooltipBorder = actualTheme === 'dark' ? "#374151" : "#E5E7EB";
  
  return (
    <Card className={`${cardBg} ${actualTheme === 'dark' ? 'bg-gradient-to-br from-card to-card/80' : 'bg-gradient-to-br from-card to-card/95'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Email Security Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.securityTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="period" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: tickColor, fontSize: 12 }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                content={<CustomTooltip formatter={(value: number) => value.toLocaleString()} />}
                labelStyle={{ color: tickColor }}
                contentStyle={{ 
                  backgroundColor: tooltipBg, 
                  border: `1px solid ${tooltipBorder}`,
                  borderRadius: '8px'
                }}
              />
              <Legend wrapperStyle={{ color: tickColor }} />
              
              {/* Safe Emails Line */}
              <Line
                type="monotone"
                dataKey="safeEmails"
                stroke={CHART_COLORS.secondary}
                strokeWidth={3}
                name="Safe Emails"
                dot={{ fill: CHART_COLORS.secondary, strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: CHART_COLORS.secondary, strokeWidth: 2 }}
              />
              
              {/* Phishing Attempts Line */}
              <Line
                type="monotone"
                dataKey="phishing"
                stroke={CHART_COLORS.danger}
                strokeWidth={3}
                name="Phishing Attempts"
                dot={{ fill: CHART_COLORS.danger, strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: CHART_COLORS.danger, strokeWidth: 2 }}
                strokeDasharray="5 5"
              />
              
              {/* Suspicious Emails Line */}
              <Line
                type="monotone"
                dataKey="suspicious"
                stroke={CHART_COLORS.warning}
                strokeWidth={3}
                name="Suspicious Emails"
                dot={{ fill: CHART_COLORS.warning, strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: CHART_COLORS.warning, strokeWidth: 2 }}
                strokeDasharray="10 5"
              />
              
              {/* Whitelist Requests Line */}
              <Line
                type="monotone"
                dataKey="whitelist"
                stroke={CHART_COLORS.info}
                strokeWidth={2}
                name="Whitelist Requests"
                dot={{ fill: CHART_COLORS.info, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: CHART_COLORS.info, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};