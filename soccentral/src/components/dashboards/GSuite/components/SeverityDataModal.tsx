// Severity Data Modal Component for GSuite
// src/components/dashboards/GSuite/components/SeverityDataModal.tsx

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
  Mail,
  Download,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertTriangle,
  Clock,
  User,
} from "lucide-react";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';
import { parseGSuiteDate } from "../utils";

interface SeverityDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  severityLevel: string;
  severityData: any[];
  gsuiteDashboardData: any;
}

type SortField = 'sender' | 'subject' | 'date' | 'status' | 'severity';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const SeverityDataModal: React.FC<SeverityDataModalProps> = ({
  isOpen,
  onClose,
  severityLevel,
  severityData,
  gsuiteDashboardData,
}) => {
  const { actualTheme } = useTheme();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('date');
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

  // Process email data for display based on severity level
  const processedEmailData = useMemo(() => {
    // Try to get data from different sources based on severity level
    let emailList: any[] = [];
    
    switch (severityLevel.toLowerCase()) {
      case 'critical':
        emailList = gsuiteDashboardData?.details?.phishingAttempted || [];
        break;
      case 'high':
        emailList = gsuiteDashboardData?.details?.suspiciousEmails || [];
        break;
      case 'medium':
        emailList = gsuiteDashboardData?.details?.clientInvestigations || [];
        break;
      case 'low':
        emailList = gsuiteDashboardData?.details?.whitelistedDomains || [];
        break;
      default:
        emailList = gsuiteDashboardData?.details?.totalEmailsScanned || [];
    }

    return emailList.map((item: any, index: number) => ({
      id: `email-${index}`,
      sender: item.Sender || item.sender || item.From || item.Email || 'Unknown',
      recipient: item.Recipient || item.recipient || item.To || 'Unknown',
      subject: item.Subject || item.subject || item.Title || 'No Subject',
      date: item.Date || item.date || item.Timestamp || item.Created || 'Unknown',
      status: item.Status || item.status || item.Action || 'Processed',
      severity: severityLevel,
      details: item.Details || item.details || item.Description || 'No details available',
      domain: item.Domain || item.domain || 'Unknown',
      action: item.Action || item.action || 'No action',
    }));
  }, [severityLevel, gsuiteDashboardData]);

  // Apply search filter
  const searchFiltered = useMemo(() => {
    if (!searchTerm) return processedEmailData;
    
    const term = searchTerm.toLowerCase();
    return processedEmailData.filter(item =>
      item.sender.toLowerCase().includes(term) ||
      item.subject.toLowerCase().includes(term) ||
      item.recipient.toLowerCase().includes(term) ||
      item.domain.toLowerCase().includes(term) ||
      item.details.toLowerCase().includes(term)
    );
  }, [processedEmailData, searchTerm]);

  // Apply sorting
  const sortedData = useMemo(() => {
    return [...searchFiltered].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Handle date sorting
      if (sortField === 'date') {
        const parsedA = parseGSuiteDate(aVal as string);
        const parsedB = parseGSuiteDate(bVal as string);
        aVal = parsedA ? parsedA.getTime() : 0;
        bVal = parsedB ? parsedB.getTime() : 0;
      }else if (typeof aVal === 'string' && typeof bVal === 'string') {
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
      ['Sender', 'Recipient', 'Subject', 'Date', 'Status', 'Severity', 'Domain', 'Details'],
      ...sortedData.map(d => [d.sender, d.recipient, d.subject, d.date, d.status, d.severity, d.domain, d.details])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${severityLevel}_emails_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get severity color
  const getSeverityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'blocked': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'quarantined': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'processed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
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
      <Card className="bg-card/95 backdrop-blur-md shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-border/50 rounded-2xl flex flex-col">
        {/* Header */}
        <CardHeader className="border-b border-border/50 bg-card/80 backdrop-blur-md flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-foreground flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {severityLevel} Severity Emails
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} email records
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
                placeholder="Search by sender, subject, recipient, domain, or details..."
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
                        <span className="font-medium text-foreground text-sm">{item.sender}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">To: {item.recipient}</p>
                      <p className="text-xs text-muted-foreground">Domain: {item.domain}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground font-medium line-clamp-1">{item.subject}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.details}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{item.date}</span>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <Badge className={`text-xs ${getSeverityColor(item.severity)}`}>
                          {item.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Action: {item.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {sortedData.length === 0 && (
              <div className="text-center py-16 text-muted-foreground bg-muted/30">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No email data found</p>
                <p>No email records found for {severityLevel} severity level.</p>
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