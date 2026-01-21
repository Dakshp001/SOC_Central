// src/components/dashboards/GSuite/components/DetailTable.tsx

import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Mail, FileText } from 'lucide-react';
import { DetailTableProps } from '../types';
import { usePaginatedData } from '../hooks/usePaginatedData';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

export const DetailTable: React.FC<DetailTableProps> = ({ 
  detailKey, 
  title, 
  data, 
  filterSeverity, 
  setFilterSeverity 
}) => {
  const { actualTheme } = useTheme();
  const [searchFilter, setSearchFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  const inputBg = "bg-background border-border";
  const tableBg = "bg-card/50";
  const tableHeaderBg = "bg-muted/50";
  const hoverBg = "hover:bg-muted/30";
  
  const detailData = data.details[detailKey as keyof typeof data.details] as any[];
  
  if (!Array.isArray(detailData) || detailData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className={`h-12 w-12 ${textSecondary} mb-4`} />
        <p className={`${textSecondary} text-lg`}>No data available</p>
        <p className={`${textSecondary} text-sm`}>This section will show data when records are available</p>
      </div>
    );
  }

  const columns = Object.keys(detailData[0] || {});
  const hasSeverityColumn = columns.includes('Severity');
  const hasEmailColumn = columns.some(col => col.toLowerCase().includes('email') || col.toLowerCase().includes('sender') || col.toLowerCase().includes('owner'));
  const hasDateColumn = columns.some(col => col.toLowerCase().includes('date') || col.toLowerCase().includes('time'));
  
  const emailColumn = columns.find(col => 
    col.toLowerCase().includes('email') || 
    col.toLowerCase().includes('sender') || 
    col.toLowerCase().includes('owner')
  );

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = detailData;
    
    if (filterSeverity !== 'all' && hasSeverityColumn) {
      filtered = filtered.filter((row: any) => 
        row.Severity?.toLowerCase() === filterSeverity.toLowerCase()
      );
    }
    
    if (searchFilter) {
      filtered = filtered.filter((row: any) =>
        Object.values(row).some(value => 
          value?.toString().toLowerCase().includes(searchFilter.toLowerCase())
        )
      );
    }
    
    if (dateFilter !== 'all' && hasDateColumn) {
      const dateCol = columns.find(col => col.toLowerCase().includes('date') || col.toLowerCase().includes('time'));
      if (dateCol) {
        const now = new Date();
        filtered = filtered.filter((row: any) => {
          const rowDate = new Date(row[dateCol]);
          if (isNaN(rowDate.getTime())) return true;
          
          switch (dateFilter) {
            case 'today':
              return rowDate.toDateString() === now.toDateString();
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return rowDate >= weekAgo;
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              return rowDate >= monthAgo;
            default:
              return true;
          }
        });
      }
    }
    
    if (sortColumn) {
      filtered = [...filtered].sort((a: any, b: any) => {
        const aVal = a[sortColumn] || '';
        const bVal = b[sortColumn] || '';
        
        const comparison = aVal.toString().localeCompare(bVal.toString(), undefined, { numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [detailData, filterSeverity, searchFilter, dateFilter, sortColumn, sortDirection, hasSeverityColumn, hasDateColumn, columns]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const { 
    paginatedData, 
    currentPage, 
    setCurrentPage, 
    totalPages,
    hasNextPage,
    hasPrevPage
  } = usePaginatedData(filteredData, 10);

  const severityOptions = useMemo(() => {
    if (!hasSeverityColumn) return [];
    const severities = [...new Set(detailData.map((row: any) => row.Severity).filter(Boolean))];
    return severities;
  }, [detailData, hasSeverityColumn]);

  return (
    <div className="space-y-4 w-full">
      {/* Custom title with filters */}
      <div className={`flex items-center justify-between p-3 ${cardBg} rounded-lg`}>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-400" />
          <h3 className={`text-lg font-semibold ${textPrimary}`}>{title}</h3>
          <Badge variant="outline" className={`${textSecondary} border-border`}>
            {filteredData.length} records
          </Badge>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {hasDateColumn && (
            <div className="flex items-center gap-2">
              <label className={`text-xs ${textSecondary} whitespace-nowrap`}>Date:</label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${inputBg} rounded px-3 py-1.5 text-sm ${textPrimary} focus:border-blue-500 focus:outline-none`}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">7 Days</option>
                <option value="month">30 Days</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className={`text-xs ${textSecondary} whitespace-nowrap`}>Sort:</label>
            <select
              value={sortColumn}
              onChange={(e) => setSortColumn(e.target.value)}
              className={`${inputBg} rounded px-3 py-1.5 text-sm ${textPrimary} focus:border-blue-500 focus:outline-none`}
            >
              <option value="">Default</option>
              {columns.map(column => (
                <option key={column} value={column}>{column.length > 12 ? `${column.substring(0, 12)}...` : column}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className={`text-xs ${textSecondary} whitespace-nowrap`}>Search:</label>
            <input
              type="text"
              placeholder="Search..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className={`w-40 ${inputBg} rounded px-3 py-1.5 text-sm ${textPrimary} placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none`}
            />
          </div>

          {severityOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <label className={`text-xs ${textSecondary} whitespace-nowrap`}>Severity:</label>
              <select
                value={filterSeverity}
                onChange={(e) => {
                  setFilterSeverity(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${inputBg} rounded px-3 py-1.5 text-sm ${textPrimary} focus:border-blue-500 focus:outline-none`}
              >
                <option value="all">All</option>
                {severityOptions.map(severity => (
                  <option key={severity} value={severity}>{severity}</option>
                ))}
              </select>
            </div>
          )}

          {(searchFilter || filterSeverity !== 'all' || dateFilter !== 'all' || sortColumn) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchFilter('');
                setFilterSeverity('all');
                setDateFilter('all');
                setSortColumn('');
                setCurrentPage(1);
              }}
              className={`${textSecondary} hover:text-foreground px-2 py-1 h-auto text-xs`}
            >
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={`flex items-center justify-between ${cardBg} rounded-lg p-3`}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={!hasPrevPage}
            className={`border-border ${textSecondary} hover:bg-muted`}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              return (
                <Button
                  key={pageNum}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={isActive ? "bg-blue-600 text-white" : `${textSecondary} hover:text-foreground`}
                >
                  {pageNum}
                </Button>
              );
            })}
            {totalPages > 7 && (
              <>
                <span className={textSecondary}>...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className={`${textSecondary} hover:text-foreground`}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={!hasNextPage}
            className={`border-border ${textSecondary} hover:bg-muted`}
          >
            Next
          </Button>
        </div>
      )}

      {/* Enhanced Table */}
      <div className={`w-full border-border rounded-lg ${tableBg} relative`}>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: hsl(var(--muted));
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground));
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--foreground));
          }
          .sticky-header {
            position: sticky;
            top: 0;
            z-index: 40;
            background: hsl(var(--muted));
            backdrop-filter: blur(8px);
          }
        `}</style>
        
        <div className="w-full overflow-x-auto custom-scrollbar">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            <Table className="w-full relative">
              <TableHeader className={`sticky-header border-b border-border shadow-lg`}>
                <TableRow className="border-border">
                  {columns.map((column) => (
                    <TableHead 
                      key={column} 
                      className={`${textSecondary} font-medium ${tableHeaderBg} whitespace-nowrap px-4 py-3 text-left min-w-[150px] border-r border-border last:border-r-0 cursor-pointer hover:bg-muted transition-colors sticky top-0 z-50`}
                      onClick={() => handleSort(column)}
                      style={{ position: 'sticky', top: 0 }}
                    >
                      <div className="flex items-center gap-2">
                        {column}
                        {sortColumn === column && (
                          <span className="text-blue-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow key={index} className={`border-border ${hoverBg} transition-colors`}>
                    {columns.map((column) => {
                      const cellValue = row[column] || '-';
                      let cellClass = `${textPrimary} px-4 py-3 border-r border-border last:border-r-0`;
                      
                      if (column === 'Severity' && cellValue !== '-') {
                        const severity = cellValue.toLowerCase();
                        if (severity === 'critical') cellClass = "text-red-400 font-medium px-4 py-3 border-r border-border last:border-r-0";
                        else if (severity === 'high') cellClass = "text-orange-400 font-medium px-4 py-3 border-r border-border last:border-r-0";
                        else if (severity === 'medium') cellClass = "text-yellow-400 font-medium px-4 py-3 border-r border-border last:border-r-0";
                        else if (severity === 'low') cellClass = "text-blue-400 font-medium px-4 py-3 border-r border-border last:border-r-0";
                        else if (severity === 'info') cellClass = `${textSecondary} font-medium px-4 py-3 border-r border-border last:border-r-0`;
                      }
                      
                      if (emailColumn && column === emailColumn && cellValue !== '-') {
                        cellClass = "text-cyan-400 px-4 py-3 border-r border-border last:border-r-0 font-medium";
                      }
                      
                      return (
                        <TableCell key={column} className={cellClass}>
                          <div 
                            className="min-w-[140px] max-w-[300px] break-words" 
                            title={cellValue.toString()}
                          >
                            {cellValue.toString().length > 50 ? (
                              <span className="block">
                                {cellValue.toString().substring(0, 50)}
                                <span className={textSecondary}>...</span>
                              </span>
                            ) : (
                              cellValue
                            )}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className={`px-4 py-2 ${tableHeaderBg} border-t border-border text-xs ${textSecondary} flex items-center justify-between`}>
          <div className="flex items-center gap-4">
            <span>↔ Scroll horizontally for more columns</span>
            <span>10 rows per page for better data visibility</span>
          </div>
          <div className={textSecondary}>
            {filteredData.length} total records
          </div>
        </div>
      </div>
    </div>
  );
};