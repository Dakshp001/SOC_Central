// src/components/dashboards/Meraki/MerakiHeader.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Home } from "lucide-react";
import { EnhancedMerakiData } from "@/lib/api";
import { MinimalDateFilter, DateRange } from '../../shared/MinimalDateFilter';

interface MerakiHeaderProps {
  data: EnhancedMerakiData;
  textPrimary: string;
  textSecondary: string;
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange) => void;
  onDateReset?: () => void;
  filteredCount?: number;
  totalCount?: number;
}

export const MerakiHeader: React.FC<MerakiHeaderProps> = ({
  data,
  textPrimary,
  textSecondary,
  dateRange,
  onDateRangeChange,
  onDateReset,
  filteredCount,
  totalCount
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className={`text-2xl font-bold ${textPrimary} mb-2`}>
          Meraki Network Dashboard
        </h2>
        <p className={textSecondary}>
          Comprehensive network analytics and monitoring
        </p>
      </div>
      <div className="flex items-center gap-4">
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
            itemType="network records"
          />
        )}
        
        {data.metadata?.processedAt && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className={`h-4 w-4 ${textSecondary}`} />
            <span className={textSecondary}>
              {new Date(data.metadata.processedAt).toLocaleDateString()}
            </span>
          </div>
        )}
        <Badge
          variant="secondary"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          🌐 Network Analytics
        </Badge>
      </div>
    </div>
  );
};