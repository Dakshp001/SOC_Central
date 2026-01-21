// src/components/Dashboards/SIEM/AlertModal.tsx

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertTriangle, X, Search, ChevronLeft, ChevronRight, XCircle, 
  Filter, Download, RefreshCw, SortAsc, SortDesc
} from "lucide-react";
import { AlertDetail } from '../types';
import { severityMap } from '../constants';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeverity: number | null;
  alertDetails: AlertDetail[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredAlerts: AlertDetail[];
  modalBg: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  inputBg: string;
  actualTheme: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  selectedSeverity,
  alertDetails,
  searchTerm,
  onSearchChange,
  filteredAlerts,
  modalBg,
  cardBg,
  textPrimary,
  textSecondary,
  inputBg,
  actualTheme,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 15;

  // Debounced search implementation
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store original values
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Apply modal styles
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      
      // Cleanup function
      return () => {
        // Restore original values or remove the styles entirely
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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterSeverity, sortColumn, sortDirection]);

  // Enhanced filtering and sorting logic
  const processedAlerts = useMemo(() => {
    let processed = [...filteredAlerts];

    // Apply severity filter
    if (filterSeverity !== "all") {
      processed = processed.filter((alert) => 
        severityMap[alert.severity].name.toLowerCase() === filterSeverity.toLowerCase()
      );
    }

    // Apply debounced search
    if (debouncedSearchTerm) {
      processed = processed.filter((alert) =>
        Object.values(alert).some((value) =>
          value?.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn) {
      processed.sort((a: any, b: any) => {
        const aVal = a[sortColumn] || "";
        const bVal = b[sortColumn] || "";

        let comparison: number;
        
        // Handle date sorting specially
        if (sortColumn === 'date') {
          comparison = new Date(aVal).getTime() - new Date(bVal).getTime();
        } else {
          comparison = aVal.toString().localeCompare(bVal.toString(), undefined, { 
            numeric: true,
            sensitivity: 'base'
          });
        }
        
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return processed;
  }, [filteredAlerts, filterSeverity, debouncedSearchTerm, sortColumn, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(processedAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAlerts = processedAlerts.slice(startIndex, startIndex + itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }, [sortColumn]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleExport = useCallback(() => {
    const csvContent = [
      ['Title', 'Severity', 'Username', 'Date', 'Description'].join(','),
      ...processedAlerts.map(alert => [
        `"${alert.title}"`,
        `"${alert.severityName}"`,
        `"${alert.username}"`,
        `"${alert.date}"`,
        `"${alert.description || 'No description'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `alerts-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [processedAlerts]);

  const clearFilters = useCallback(() => {
    onSearchChange("");
    setFilterSeverity("all");
    setSortColumn("date");
    setSortDirection("desc");
  }, [onSearchChange]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const severityInfo = selectedSeverity !== null ? severityMap[selectedSeverity] : null;
  const columns = [
    { key: 'title', label: 'Alert Title', sortable: true },
    { key: 'severity', label: 'Severity', sortable: true },
    { key: 'username', label: 'Username', sortable: true },
    { key: 'date', label: 'Date', sortable: true },
    { key: 'description', label: 'Description', sortable: false }
  ];

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999 
      }}
    >
      <div className="bg-card border border-border rounded-2xl w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-muted to-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 id="alert-modal-title" className="text-2xl font-bold text-foreground">
                {severityInfo ? `${severityInfo.name} Severity Alerts` : 'Alert Details'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {processedAlerts.length} of {alertDetails.length} alerts displayed
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-border text-muted-foreground hover:bg-muted/50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-border text-muted-foreground hover:bg-muted/50"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <div className="text-xs text-muted-foreground hidden md:block">
              Press <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">ESC</kbd> to close
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
              aria-label="Close modal"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Enhanced Search and Filter Bar */}
        <div className={`p-6 border-b border-border ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} flex-shrink-0`}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Search Input */}
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search alerts by title, username, or description..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filters and Controls */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 min-w-[140px]"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="info">Info</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground whitespace-nowrap">Sort by:</label>
                <select
                  value={sortColumn}
                  onChange={(e) => setSortColumn(e.target.value)}
                  className="px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 min-w-[120px]"
                >
                  {columns.filter(col => col.sortable).map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
                </select>
              </div>

              <Badge
                variant="outline"
                className="border-primary/50 text-primary bg-primary/10 px-3 py-1 whitespace-nowrap"
              >
                {processedAlerts.length} / {alertDetails.length}
              </Badge>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchTerm || filterSeverity !== "all" || sortColumn !== "date") && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Active filters:</span>
                </div>
                {searchTerm && <span>Search: "{searchTerm}"</span>}
                {filterSeverity !== "all" && <span>• Severity: {filterSeverity}</span>}
                {sortColumn !== "date" && <span>• Sorted by: {sortColumn}</span>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* Enhanced Table Container */}
        <div className="relative overflow-hidden flex-1 min-h-0">
          <div className="h-full overflow-auto">
            <Table className="w-full relative">
              <TableHeader className={`sticky top-0 ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} z-10 backdrop-blur-sm`}>
                <TableRow className="border-border">
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={`${textSecondary} font-semibold hover:bg-muted/50 whitespace-nowrap px-6 py-4 text-left ${column.sortable ? 'cursor-pointer' : ''} transition-colors`}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {column.sortable && sortColumn === column.key && (
                          sortDirection === "asc" ? 
                            <SortAsc className="h-4 w-4 text-primary" /> : 
                            <SortDesc className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAlerts.length > 0 ? (
                  paginatedAlerts.map((alert, index) => (
                    <TableRow
                      key={alert.id}
                      className="border-border hover:bg-muted/50 transition-colors group"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-3 h-3 rounded-full ${severityMap[alert.severity].bgColor}`}
                          />
                          <span 
                            className="text-foreground font-medium truncate max-w-xs group-hover:text-primary cursor-help" 
                            title={alert.title}
                          >
                            {alert.title}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`${severityMap[alert.severity].bgColor} text-white border-0 px-3 py-1`}
                        >
                          {alert.severityName}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="px-6 py-4">
                        <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground">
                          {alert.username}
                        </span>
                      </TableCell>
                      
                      <TableCell className="px-6 py-4">
                        <span className="font-mono text-sm text-muted-foreground group-hover:text-foreground">
                          {alert.date}
                        </span>
                      </TableCell>
                      
                      <TableCell className="px-6 py-4">
                        <div
                          className="truncate max-w-md text-muted-foreground group-hover:text-foreground cursor-help"
                          title={alert.description || 'No description available'}
                        >
                          {alert.description || 'No description available'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-muted/30 rounded-full">
                          <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium text-lg">No alerts found</p>
                          <p className="text-muted-foreground text-sm mt-2">
                            {searchTerm || filterSeverity !== "all"
                              ? "Try adjusting your search or filter criteria"
                              : "No alerts available to display"}
                          </p>
                        </div>
                        {(searchTerm || filterSeverity !== "all") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="border-border text-muted-foreground hover:bg-muted/50"
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className={`flex flex-col sm:flex-row items-center justify-between p-6 border-t border-border ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} gap-4 flex-shrink-0`}>
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="text-foreground font-medium">
                {startIndex + 1}
              </span>{" "}
              -{" "}
              <span className="text-foreground font-medium">
                {Math.min(startIndex + itemsPerPage, processedAlerts.length)}
              </span>{" "}
              of{" "}
              <span className="text-foreground font-medium">
                {processedAlerts.length}
              </span>{" "}
              results
              {processedAlerts.length !== alertDetails.length && (
                <span className="text-muted-foreground">
                  {" "}(filtered from {alertDetails.length} total)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!hasPrevPage}
                className="border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 p-0 ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={!hasNextPage}
                className="border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Use createPortal to render outside the dashboard component tree
  return createPortal(modalContent, document.body);
};