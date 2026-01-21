import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPercentage, getSecurityScoreColor, getSecurityScoreLabel } from '../utils';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';
import { MinimalDateFilter, DateRange } from '../../shared/MinimalDateFilter';

interface DashboardHeaderProps {
  securityScore: number;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  onDateReset?: () => void;
  filteredCount?: number;
  totalCount?: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  securityScore,
  dateRange,
  onDateRangeChange,
  onDateReset,
  filteredCount,
  totalCount
}) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Shield className={`h-6 w-6 ${isDark ? 'text-primary' : 'text-primary'}`} />
        <h1 className={`text-2xl font-bold ${isDark ? 'text-foreground' : 'text-foreground'}`}>
          EDR Security Dashboard
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {/* Dashboard button */}
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          size="sm"
          className="
            bg-white hover:bg-gray-100
            dark:bg-black dark:hover:bg-gray-900
            border border-black hover:border-black/70
            dark:border-gray-400 dark:hover:border-gray-300
            text-foreground hover:text-foreground/80
            rounded-lg px-3 py-2 h-9
            transition-all duration-200
            flex items-center gap-2
            hover:scale-105 hover:shadow-lg
          "
        >
          <Home className="h-4 w-4" />
          <span className="text-sm font-medium">Dashboard</span>
        </Button>
        {/* Date Filter */}
        {dateRange && onDateRangeChange && onDateReset && filteredCount !== undefined && totalCount !== undefined && (
          <MinimalDateFilter
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
            onReset={onDateReset}
            filteredCount={filteredCount}
            totalCount={totalCount}
            itemType="endpoints"
          />
        )}
        
        {/* Security Score Badges */}
        <Badge variant="default" className="bg-primary text-primary-foreground">
          Security Score: {formatPercentage(securityScore)}
        </Badge>
        <Badge
          variant="outline"
          className={`border-border ${getSecurityScoreColor(securityScore)}`}
        >
          {getSecurityScoreLabel(securityScore)}
        </Badge>
      </div>
    </div>
  );
};