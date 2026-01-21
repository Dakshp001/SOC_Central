import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { FilterOptions } from '@/types/dataAnalysis';

interface TimeRangeFilterProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableColumns: string[];
}

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  filters,
  onFiltersChange,
  availableColumns
}) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const timeRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'weekly', label: 'Last 7 Days' },
    { value: 'monthly', label: 'Last 30 Days' },
    { value: 'quarterly', label: 'Last 3 Months' },
    { value: 'half-yearly', label: 'Last 6 Months' },
    { value: 'yearly', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleTimeRangeChange = (value: string) => {
    const newFilters = { ...filters, timeRange: value as any };
    
    if (value !== 'custom') {
      // Calculate date range based on selection
      const now = new Date();
      let start = new Date();
      
      switch (value) {
        case 'today':
          start.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          start.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          start.setDate(now.getDate() - 30);
          break;
        case 'quarterly':
          start.setMonth(now.getMonth() - 3);
          break;
        case 'half-yearly':
          start.setMonth(now.getMonth() - 6);
          break;
        case 'yearly':
          start.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      newFilters.startDate = start;
      newFilters.endDate = now;
    }
    
    onFiltersChange(newFilters);
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      onFiltersChange({
        ...filters,
        timeRange: 'custom',
        startDate,
        endDate
      });
    }
  };

  const handleColumnToggle = (column: string) => {
    const newColumns = filters.columns.includes(column)
      ? filters.columns.filter(c => c !== column)
      : [...filters.columns, column];
    
    onFiltersChange({ ...filters, columns: newColumns });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Range Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Period</label>
            <Select value={filters.timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filters.timeRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'MMM dd, yyyy') : 'Pick start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'MMM dd, yyyy') : 'Pick end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="col-span-2">
                <Button 
                  onClick={handleCustomDateChange}
                  disabled={!startDate || !endDate}
                  className="w-full"
                >
                  Apply Custom Range
                </Button>
              </div>
            </div>
          )}

          {filters.startDate && filters.endDate && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              Filtering data from {format(filters.startDate, 'MMM dd, yyyy')} to {format(filters.endDate, 'MMM dd, yyyy')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Column Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {availableColumns.map(column => (
              <label key={column} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.columns.includes(column)}
                  onChange={() => handleColumnToggle(column)}
                  className="rounded"
                />
                <span>{column}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};