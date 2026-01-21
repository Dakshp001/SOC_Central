import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface MinimalDateFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onReset: () => void;
  filteredCount: number;
  totalCount: number;
  itemType?: string; // e.g., "records", "devices", "events"
}

export const MinimalDateFilter: React.FC<MinimalDateFilterProps> = ({
  dateRange,
  onDateRangeChange,
  onReset,
  filteredCount,
  totalCount,
  itemType = "records",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');

  const isFiltered = dateRange.startDate || dateRange.endDate;
  const hasCompleteRange = dateRange.startDate && dateRange.endDate;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!dateRange.startDate) {
      // First click - set start date
      onDateRangeChange({ startDate: date, endDate: null });
      setSelectionStep('end');
    } else if (!dateRange.endDate) {
      // Second click - set end date
      if (date >= dateRange.startDate) {
        onDateRangeChange({ ...dateRange, endDate: date });
        setIsOpen(false);
        setSelectionStep('start');
      } else {
        // If end date is before start date, swap them
        onDateRangeChange({ startDate: date, endDate: dateRange.startDate });
        setIsOpen(false);
        setSelectionStep('start');
      }
    } else {
      // Both dates set, start new selection
      onDateRangeChange({ startDate: date, endDate: null });
      setSelectionStep('end');
    }
  };

  const handleReset = () => {
    onDateRangeChange({ startDate: null, endDate: null });
    setSelectionStep('start');
    setIsOpen(false);
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
    
    return "Filter by Date";
  };

  const getFilteredPercentage = () => {
    if (totalCount === 0) return 0;
    return Math.round((filteredCount / totalCount) * 100);
  };

  const getInstructions = () => {
    if (!dateRange.startDate) {
      return "Click a date to set start date";
    } else if (!dateRange.endDate) {
      return "Click a date to set end date";
    } else {
      return "Click any date to start new selection";
    }
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
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Select Date Range</span>
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

          {/* Instructions */}
          <div className="text-xs text-muted-foreground text-center py-1">
            {getInstructions()}
          </div>

          {/* Current Selection Display */}
          {(dateRange.startDate || dateRange.endDate) && (
            <div className="flex items-center justify-center gap-2 text-xs">
              <div className={cn(
                "px-2 py-1 rounded",
                dateRange.startDate ? "bg-primary/20 text-primary font-medium" : "bg-muted text-muted-foreground"
              )}>
                {dateRange.startDate ? format(dateRange.startDate, "MMM dd, yyyy") : "Start Date"}
              </div>
              <span className="text-muted-foreground">to</span>
              <div className={cn(
                "px-2 py-1 rounded",
                dateRange.endDate ? "bg-primary/20 text-primary font-medium" : "bg-muted text-muted-foreground"
              )}>
                {dateRange.endDate ? format(dateRange.endDate, "MMM dd, yyyy") : "End Date"}
              </div>
            </div>
          )}

          <Separator />

          {/* Calendar */}
          <Calendar
            mode="single"
            selected={selectionStep === 'start' ? dateRange.startDate || undefined : dateRange.endDate || undefined}
            onSelect={handleDateSelect}
            disabled={(date) => date > new Date()} // Disable future dates
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
                    {filteredCount} of {totalCount} {itemType}
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