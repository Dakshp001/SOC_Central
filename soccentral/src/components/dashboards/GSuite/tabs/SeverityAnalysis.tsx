// src/components/dashboards/GSuite/tabs/SeverityAnalysis.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  Pie,
  Cell,
  PieChart,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ChartData } from '../types';
import { CustomTooltip } from '../components/CustomTooltip';
import { SeverityDataModal } from '../components/SeverityDataModal';
import { Zap } from 'lucide-react';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface SeverityAnalysisProps {
  chartData: ChartData;
  gsuiteDashboardData?: any; // Add dashboard data for modal
}

export const SeverityAnalysis: React.FC<SeverityAnalysisProps> = ({ chartData, gsuiteDashboardData }) => {
  const { actualTheme } = useTheme();
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  const legendColor = actualTheme === 'dark' ? "#D1D5DB" : "#6B7280";
  
  // Handle pie slice click
  const handlePieClick = (data: any, index: number) => {
    if (data && data.name) {
      setSelectedSeverity(data.name);
      setModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSeverity("");
  };

  if (chartData.severityData.length === 0) {
    return null;
  }

  return (
    <Card className={`${cardBg} ${actualTheme === 'dark' ? 'bg-gradient-to-br from-card to-card/80' : 'bg-gradient-to-br from-card to-card/95'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
          <Zap className="h-5 w-5 text-yellow-400" />
          Severity Level Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData?.severityData || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value, percent }) => {
                  // Only show label if the segment is large enough
                  if (percent! > 0.05) {
                    return `${(percent! * 100).toFixed(1)}%`;
                  }
                  return '';
                }}
                labelLine={false}
              >
                {(chartData?.severityData || []).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill || `hsl(${index * 45}, 70%, 60%)`} 
                  />
                ))}
              </Pie>
              <Legend 
                verticalAlign="bottom" 
                height={50}
                wrapperStyle={{ color: legendColor, fontSize: '12px' }}
                formatter={(value, entry) => {
                  const dataEntry = chartData.severityData.find(d => d.name === value);
                  return `${value}: ${dataEntry?.value || 0} incidents`;
                }}
                iconType="circle"
              />
              <Tooltip 
                content={<CustomTooltip formatter={(value: number) => `${value} incidents`} />}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};