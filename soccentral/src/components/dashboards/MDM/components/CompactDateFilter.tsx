import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Filter, RotateCcw, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface CompactDateFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onReset: () => void;
  filteredCount: number;
  totalCount: number;
}

export const CompactDateFilter: React.FC<CompactDateFilterProps> = ({
  dateRange,
  onDateRangeChange,
  onReset,
  filteredCount,
  totalCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

  const isFiltered = dateRange.startDate || dateRange.endDate;
  const hasCompleteRange = dateRange.startDate && dateRange.endDate;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (datePickerMode === 'start') {
      onDateRangeChange({ ...dateRange, startDate: date });
      setDatePickerMode('end');
    } else {
      onDateRangeChange({ ...dateRange, endDate: date });
      setIsOpen(false);
      setDatePickerMode('start');
    }
  };

  const handleReset = () => {
    onReset();
    setIsOpen(false);
    setDatePickerMode('start');
  };

  const formatDateRange = () => {
    if (!dateRange.startDate && !dateRange.endDate) {
      return "Filter by Date";
    }
    
    if (dateRange.startDate && dateRange.endDate) {
      return `${format(dateRange.startDate, "MMM dd")} - ${format(dateRange.endDate, "MMM dd, yyyy")}`;
    }
    
    if (dateRange.startDate) {
      return `From ${format(dateRange.startDate, "MMM dd, yyyy")}`;
    }
    
    if (dateRange.endDate) {
      return `Until ${format(dateRange.endDate, "MMM dd, yyyy")}`;
    }
    
    return "Filter by Date";
  };

  const getFilteredPercentage = () => {
    if (totalCount === 0) return 0;
    return Math.round((filteredCount / totalCount) * 100);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isFiltered ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-9 gap-2 text-sm font-medium transition-all duration-200",
            isFiltered && "bg-primary text-primary-foreground shadow-sm"
          )}
        >
          <CalendarDays className="h-4 w-4" />
          {formatDateRange()}
          {isFiltered && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {filteredCount}/{totalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Date Range</span>
            </div>
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* Date Selection Mode Indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn(
              "px-2 py-1 rounded",
              datePickerMode === 'start' ? "bg-primary/20 text-primary font-medium" : "opacity-60"
            )}>
              1. Select Start Date
            </span>
            <span className={cn(
              "px-2 py-1 rounded",
              datePickerMode === 'end' ? "bg-primary/20 text-primary font-medium" : "opacity-60"
            )}>
              2. Select End Date
            </span>
          </div>

          {/* Current Selection Display */}
          {(dateRange.startDate || dateRange.endDate) && (
            <div className="space-y-2 p-2 bg-muted/50 rounded-md">
              {dateRange.startDate && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Start:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{format(dateRange.startDate, "MMM dd, yyyy")}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => onDateRangeChange({ ...dateRange, startDate: null })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              {dateRange.endDate && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">End:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{format(dateRange.endDate, "MMM dd, yyyy")}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => onDateRangeChange({ ...dateRange, endDate: null })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Calendar */}
          <Calendar
            mode="single"
            selected={datePickerMode === 'start' ? dateRange.startDate || undefined : dateRange.endDate || undefined}
            onSelect={handleDateSelect}
            disabled={(date) => {
              // Disable future dates
              if (date > new Date()) return true;
              
              // If selecting end date and start date is set, disable dates before start date
              if (datePickerMode === 'end' && dateRange.startDate) {
                return date < dateRange.startDate;
              }
              
              return false;
            }}
            initialFocus
            className="w-full"
          />

          {/* Footer with Filter Stats */}
          {isFiltered && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Showing:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {filteredCount} of {totalCount} devices
                  </Badge>
                  <span className="text-muted-foreground">
                    ({getFilteredPercentage()}%)
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};