// Wipe Data Modal Component for Week/Month Details
// src/components/dashboards/MDM/components/WipeDataModal.tsx

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  X,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Clock,
  User,
  Shield,
} from "lucide-react";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface WipeDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string; // "Week1", "Week2", "Jan", "Feb", etc.
  periodType: 'week' | 'month';
  wipeData: any[]; // Array of wipe records for this period
  rawMdmData: any;
}

type SortField = 'username' | 'deviceName' | 'platform' | 'wipeDate' | 'reason';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const WipeDataModal: React.FC<WipeDataModalProps> = ({
  isOpen,
  onClose,
  period,
  periodType,
  wipeData,
  rawMdmData,
}) => {
  const { actualTheme } = useTheme();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('wipeDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      setCurrentPage(1);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      
      return () => {
        if (originalOverflow) {
          document.body.style.overflow = originalOverflow;
        } else {
          document.body.style.removeProperty('overflow');
        }
        
        if (originalPaddingRight) {
          document.body.style.paddingRight = originalPaddingRight;
        } else {
          document.body.style.removeProperty('padding-right');
        }
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Process wipe data for display
  const processedWipeData = useMemo(() => {
    return wipeData.map((item, index) => ({
      id: `wipe-${index}`,
      username: item.Username || item.username || item.User || `User${index + 1}`,
      deviceName: item['Device Name'] || item.deviceName || item.Device || 'Unknown Device',
      platform: item.Platform || item.platform || item.OS || 'Unknown',
      wipeDate: item['Wipe Date'] || item.wipeDate || item.Date || 'Unknown',
      reason: item.Reason || item.reason || item['Wipe Reason'] || 'Policy Enforcement',
      status: item.Status || item.status || 'Completed',
      requestedBy: item['Requested By'] || item.requestedBy || 'System Admin',
      week: item.Week || item.week,
      month: item.Month || item.month,
    }));
  }, [wipeData]);

  // Filter data that matches the selected period
  const filteredByPeriod = useMemo(() => {
    return processedWipeData.filter(item => {
      if (periodType === 'week') {
        return item.week === period;
      } else {
        return item.month === period;
      }
    });
  }, [processedWipeData, period, periodType]);

  // Apply search filter
  const searchFiltered = useMemo(() => {
    if (!searchTerm) return filteredByPeriod;
    
    const term = searchTerm.toLowerCase();
    return filteredByPeriod.filter(item =>
      item.username.toLowerCase().includes(term) ||
      item.deviceName.toLowerCase().includes(term) ||
      item.platform.toLowerCase().includes(term) ||
      item.reason.toLowerCase().includes(term)
    );
  }, [filteredByPeriod, searchTerm]);

  // Apply sorting
  const sortedData = useMemo(() => {
    return [...searchFiltered].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Handle date sorting
      if (sortField === 'wipeDate') {
        aVal = new Date(aVal as string).getTime() || 0;
        bVal = new Date(bVal as string).getTime() || 0;
      } else if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [searchFiltered, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export functionality
  const handleExport = () => {
    const csvContent = [
      ['Username', 'Device Name', 'Platform', 'Wipe Date', 'Reason', 'Status', 'Requested By'],
      ...sortedData.map(d => [d.username, d.deviceName, d.platform, d.wipeDate, d.reason, d.status, d.requestedBy])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${periodType}_${period}_wipe_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <Card className="bg-card/95 backdrop-blur-md shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden border border-border/50 rounded-2xl flex flex-col">
        {/* Header */}
        <CardHeader className="border-b border-border/50 bg-card/80 backdrop-blur-md flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-foreground flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {period} Wipe Data
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} wipe records
                  </p>
                </div>
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2 bg-background/70 border-border/50 hover:bg-background/90"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <div className="text-xs text-muted-foreground hidden md:block">
                Press <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">ESC</kbd> to close
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col lg:flex-row gap-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, device name, platform, or reason..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-background/70 border-border/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-20 bg-background/70 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map(size => (
                    <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-hidden p-0 flex-1 min-h-0 flex flex-col">
          {/* Data List */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 space-y-2 bg-muted/30">
              {paginatedData.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border bg-card/60 border-border/40 hover:bg-card/80 transition-all duration-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{item.username}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.deviceName}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{item.platform}</span>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{item.wipeDate}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Requested by: {item.requestedBy}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{item.reason}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {sortedData.length === 0 && (
              <div className="text-center py-16 text-muted-foreground bg-muted/30">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No wipe data found</p>
                <p>No wipe records found for {period}.</p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Pagination Footer */}
        {sortedData.length > 0 && (
          <div className="border-t border-border/50 p-4 flex items-center justify-between bg-card/80 backdrop-blur-md flex-shrink-0">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-background/70 border-border/50 hover:bg-background/90"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-10 h-10 p-0 ${
                        currentPage === pageNumber 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-background/70 border-border/50 hover:bg-background/90'
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="bg-background/70 border-border/50 hover:bg-background/90"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  return createPortal(modalContent, document.body);
};