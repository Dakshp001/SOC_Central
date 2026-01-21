import React, { memo, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  Line,
  Bar,
  Pie,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';

interface OptimizedChartProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  dataKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  colors?: string[];
  width?: string | number;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  [key: string]: any;
}

/**
 * OptimizedChart - A memoized wrapper around Recharts components
 * Prevents unnecessary re-renders when data hasn't changed
 * Implements lazy rendering for better performance
 */
export const OptimizedChart = memo<OptimizedChartProps>(({
  type,
  data,
  dataKey = 'value',
  xAxisKey = 'name',
  yAxisKey,
  colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  width = '100%',
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  animate = true,
  ...props
}) => {
  // Memoize the processed data to prevent recalculations
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  // Memoize the color mapping
  const colorMap = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];
    return processedData.map((_, index) => colors[index % colors.length]);
  }, [processedData, colors]);

  // Return null for empty data
  if (!processedData || processedData.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  // Common props for all charts
  const commonProps = {
    data: processedData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
    ...props,
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis dataKey={yAxisKey} />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={animate}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis dataKey={yAxisKey} />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} isAnimationActive={animate}>
              {processedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colorMap[index]} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Pie
              data={processedData}
              dataKey={dataKey}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
              isAnimationActive={animate}
            >
              {processedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colorMap[index]} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.1} />}
            <XAxis dataKey={xAxisKey} />
            <YAxis dataKey={yAxisKey} />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.3}
              isAnimationActive={animate}
            />
          </AreaChart>
        );

      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width={width} height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  // Only re-render if these props change
  return (
    prevProps.type === nextProps.type &&
    prevProps.dataKey === nextProps.dataKey &&
    prevProps.xAxisKey === nextProps.xAxisKey &&
    prevProps.height === nextProps.height &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.colors) === JSON.stringify(nextProps.colors)
  );
});

OptimizedChart.displayName = 'OptimizedChart';
