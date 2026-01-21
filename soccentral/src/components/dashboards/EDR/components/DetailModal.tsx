// src/components/dashboards/EDR/components/DetailModal.tsx
import React, { useState, useEffect } from "react";
import { useToolData } from "@/contexts/ToolDataContext";
import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Monitor, AlertTriangle, XCircle, Search, ChevronLeft, ChevronRight,
  Filter, Download, RefreshCw, SortAsc, SortDesc, ChevronDown, ChevronUp
} from "lucide-react";
import { ModalData } from '../types';
import { getStatusColor } from '../utils';
import { useTheme } from "@/pages/Main_dashboard/ThemeProvider";

interface DetailModalProps {
  modalData: ModalData | null;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ modalData, onClose }) => {
  const { actualTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const itemsPerPage = 15;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (modalData) {
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
  }, [modalData]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalData) {
        onClose();
      }
    };

    if (modalData) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [modalData, onClose]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortColumn, sortDirection]);

  if (!modalData) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    const csvContent = [
      modalData.columns.join(','),
      ...filteredData.map(item => {
        if (modalData.type === "endpoints") {
          return [
            `"${item.name || item.endpoint || item['Endpoint Name'] || item['Device Name'] || item['Computer Name'] || item.hostname || item['Host Name'] || item['Machine Name'] || item.agent_uuid || item.Agent_UUID || 'Unknown'}"`,
            `"${item.OS || item.os || 'Unknown'}"`,
            `"${item['Network Status'] || item.network_status || 'Unknown'}"`,
            `"${item['Update Status'] || item['Scan Status'] || item.scan_status || item.update_status || 'Unknown'}"`,
            `"${item['Last Logged In User'] || item.last_logged_user || item.last_user || 'Unknown'}"`,
            `"${item['Serial Number'] || item.serial_number || item.serialNumber || 'N/A'}"`
          ].join(',');
        } else {
          return [
            `"${item.threat_details || item.details || 'No details'}"`,
            `"${item.confidence_level || item.confidence || 'Unknown'}"`,
            `"${item.endpoints || item.endpoint || 'Unknown'}"`,
            `"${item.classification || item.type || 'Unknown'}"`
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${modalData.type}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setSortColumn("");
    setSortDirection("asc");
  };

  const filteredData = modalData.data.filter((item: any) => {
    const matchesSearch = searchTerm === "" ||
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesFilter = filterStatus === "all" ||
      (modalData.type === "endpoints" &&
        (item.network_status?.toLowerCase() === filterStatus ||
          item.scan_status?.toLowerCase().includes(filterStatus))) ||
      (modalData.type === "threats" &&
        (item.confidence_level?.toLowerCase() === filterStatus ||
          item.severity?.toLowerCase() === filterStatus));

    return matchesSearch && matchesFilter;
  });

  // Apply sorting
  const sortedData = [...filteredData].sort((a: any, b: any) => {
    if (!sortColumn) return 0;
    
    let aVal = '';
    let bVal = '';
    
    if (modalData.type === "endpoints") {
      switch (sortColumn) {
        case 'Name':
          aVal = a.name || a.endpoint || a['Endpoint Name'] || a['Device Name'] || a['Computer Name'] || a.hostname || a['Host Name'] || a['Machine Name'] || a.agent_uuid || a.Agent_UUID || '';
          bVal = b.name || b.endpoint || b['Endpoint Name'] || b['Device Name'] || b['Computer Name'] || b.hostname || b['Host Name'] || b['Machine Name'] || b.agent_uuid || b.Agent_UUID || '';
          break;
        case 'OS':
          aVal = a.OS || a.os || '';
          bVal = b.OS || b.os || '';
          break;
        case 'Network Status':
          aVal = a['Network Status'] || a.network_status || '';
          bVal = b['Network Status'] || b.network_status || '';
          break;
        default:
          aVal = String(a[sortColumn] || '');
          bVal = String(b[sortColumn] || '');
      }
    } else {
      aVal = String(a[sortColumn] || '');
      bVal = String(b[sortColumn] || '');
    }
    
    const comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const renderTableRow = (item: any, index: number) => {

    if (modalData.type === "endpoints") {
      return (
        <tr
          key={index}
          className="border-b border-border hover:bg-muted/50 transition-all duration-200 group"
        >
          <td className="py-4 px-6 text-muted-foreground font-medium group-hover:text-foreground">
            {item.name || item.endpoint || item['Endpoint Name'] || item['Device Name'] || item['Computer Name'] || item.hostname || item['Host Name'] || item['Machine Name'] || item.agent_uuid || item.Agent_UUID || 'Unknown Endpoint'}
          </td>
          <td className="py-4 px-6 text-muted-foreground group-hover:text-foreground">
            {item.OS || item.os || 'Unknown OS'}
          </td>
          <td className="py-4 px-6">
            <Badge
              variant="outline"
              className={`${getStatusColor(item['Network Status'] || item.network_status || 'unknown')} border-current transition-colors`}
            >
              {item['Network Status'] || item.network_status || 'Unknown'}
            </Badge>
          </td>
          <td className="py-4 px-6">
            <Badge
              variant="outline"
              className={`${getStatusColor(item['Update Status'] || item['Scan Status'] || item.scan_status || item.update_status || 'unknown')} border-current transition-colors`}
            >
              {item['Update Status'] || item['Scan Status'] || item.scan_status || item.update_status || 'Unknown'}
            </Badge>
          </td>
          <td className="py-4 px-6 text-muted-foreground group-hover:text-foreground">
            {item['Last Logged In User'] || item.last_logged_user || item.last_user || 'Unknown User'}
          </td>
          <td className="py-4 px-6 text-muted-foreground text-sm group-hover:text-foreground">
            {item['Serial Number'] || item.serial_number || item.serialNumber || 'N/A'}
          </td>
        </tr>
      );
    } else if (modalData.type === "threats") {
      const isExpanded = expandedRow === index;
      return (
        <React.Fragment key={index}>
          <tr
            className="border-b border-border hover:bg-muted/50 transition-all duration-200 group cursor-pointer"
            onClick={() => setExpandedRow(isExpanded ? null : index)}
          >
            <td className="py-4 px-6 text-muted-foreground max-w-md group-hover:text-foreground">
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex flex-col gap-1 flex-1">
                  <span className="font-medium text-foreground">
                    {item.threat_name || 'Unknown Incident'}
                  </span>
                  {!isExpanded && item.threat_details && item.threat_details !== item.threat_name && (
                    <span className="text-xs text-muted-foreground line-clamp-1" title={item.threat_details}>
                      {item.threat_details}
                    </span>
                  )}
                </div>
                {item.severity && (
                  <Badge
                    variant="outline"
                    className={`${
                      item.severity === 'Critical' ? 'text-red-500 border-red-500' :
                      item.severity === 'High' ? 'text-orange-500 border-orange-500' :
                      item.severity === 'Medium' ? 'text-yellow-500 border-yellow-500' :
                      'text-blue-500 border-blue-500'
                    } border-current font-semibold shrink-0`}
                  >
                    {item.severity}
                  </Badge>
                )}
              </div>
            </td>
            <td className="py-4 px-6">
              <Badge
                variant="outline"
                className={`${getStatusColor(item.confidence_level || item.confidence || 'unknown')} border-current transition-colors`}
              >
                {item.confidence_level || item.confidence || 'Unknown'}
              </Badge>
            </td>
            <td className="py-4 px-6 text-muted-foreground group-hover:text-foreground">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{item.endpoints || item.endpoint || 'Unknown'}</span>
                {item.agent_id && item.agent_id !== 'N/A' && !isExpanded && (
                  <span className="text-xs text-muted-foreground">Agent: {item.agent_id}</span>
                )}
              </div>
            </td>
            <td className="py-4 px-6 text-muted-foreground group-hover:text-foreground">
              <span className="font-medium">{item.classification || item.type || 'Unknown'}</span>
            </td>
          </tr>
          {isExpanded && (
            <tr className="bg-muted/20 border-b border-border">
              <td colSpan={modalData.columns.length} className="px-6 py-4">
                <div className="space-y-4">
                  {/* Full Incident Details */}
                  <div>
                    <div className="font-semibold text-foreground mb-2">Full Details:</div>
                    <div className="text-sm text-muted-foreground bg-card px-4 py-3 rounded border border-border">
                      {item.threat_details || item.details || 'No additional details available'}
                    </div>
                  </div>

                  {/* MITRE ATT&CK Information */}
                  {((item.mitre_id && item.mitre_id !== 'N/A') || (item.mitre_technique && item.mitre_technique !== 'N/A')) && (
                    <div>
                      <div className="font-semibold text-foreground mb-2">MITRE ATT&CK:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {item.mitre_id && item.mitre_id !== 'N/A' && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">ID:</span>
                            <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20 font-mono">
                              {item.mitre_id}
                            </span>
                          </div>
                        )}
                        {item.mitre_technique && item.mitre_technique !== 'N/A' && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Technique:</span>
                            <span className="text-foreground">{item.mitre_technique}</span>
                          </div>
                        )}
                        {item.mitre_tactic && item.mitre_tactic !== 'N/A' && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Tactic:</span>
                            <span className="text-foreground">{item.mitre_tactic}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rule Information */}
                  {item.rule_id && item.rule_id !== 'N/A' && (
                    <div>
                      <div className="font-semibold text-foreground mb-2">Rule Information:</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Rule ID: </span>
                          <span className="font-mono text-foreground">{item.rule_id}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Level: </span>
                          <span className="text-foreground">{item.rule_level || 'N/A'}</span>
                        </div>
                        {item.decoder && item.decoder !== 'N/A' && (
                          <div>
                            <span className="text-muted-foreground">Decoder: </span>
                            <span className="text-foreground">{item.decoder}</span>
                          </div>
                        )}
                      </div>
                      {item.rule_description && item.rule_description !== 'N/A' && item.rule_description !== item.threat_name && (
                        <div className="mt-2">
                          <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded">
                            {item.rule_description}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Endpoint & Agent Information */}
                  <div>
                    <div className="font-semibold text-foreground mb-2">Endpoint Information:</div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Endpoint: </span>
                        <span className="text-foreground font-medium">{item.endpoints || item.endpoint || 'Unknown'}</span>
                      </div>
                      {item.agent_id && item.agent_id !== 'N/A' && (
                        <div>
                          <span className="text-muted-foreground">Agent ID: </span>
                          <span className="font-mono text-foreground">{item.agent_id}</span>
                        </div>
                      )}
                      {item.location && item.location !== 'N/A' && (
                        <div>
                          <span className="text-muted-foreground">Location: </span>
                          <span className="text-foreground">{item.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Classification Details */}
                  <div>
                    <div className="font-semibold text-foreground mb-2">Classification:</div>
                    <div className="flex flex-col gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category: </span>
                        <span className="text-foreground font-medium">{item.classification || 'Unknown'}</span>
                      </div>
                      {item.classification_raw && item.classification_raw !== item.classification && (
                        <div>
                          <span className="text-muted-foreground">Raw Groups: </span>
                          <span className="text-xs text-muted-foreground font-mono">{item.classification_raw}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Full Log (if available) */}
                  {item.full_log && item.full_log !== 'N/A' && (
                    <div>
                      <div className="font-semibold text-foreground mb-2">Full Log:</div>
                      <div className="text-xs text-muted-foreground bg-card px-4 py-3 rounded border border-border font-mono overflow-x-auto max-h-40 overflow-y-auto">
                        {item.full_log}
                      </div>
                    </div>
                  )}

                  {/* Reported Time */}
                  {item.reported_time && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Reported: </span>
                      {new Date(item.reported_time).toLocaleString()}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    }
    return null;
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-muted to-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl">
              {modalData.type === "endpoints" ? (
                <Monitor className="h-6 w-6 text-primary" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{modalData.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {sortedData.length} of {modalData.data.length} record{modalData.data.length !== 1 ? "s" : ""} displayed
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

        {/* Search and Filter */}
        <div className={`p-6 border-b border-border ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} flex-shrink-0`}>
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 bg-input border border-border rounded-lg text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 min-w-[180px] font-medium cursor-pointer hover:bg-muted/50"
                >
                  <option value="all" className="font-medium">
                    🔍 All {modalData.type === 'endpoints' ? 'Endpoints' : 'Incidents'} ({modalData.data.length})
                  </option>

                  {modalData.type === "endpoints" ? (
                    <>
                      <optgroup label="Network Status" className="font-semibold">
                        <option value="connected" className="pl-4">
                          ✅ Connected ({modalData.data.filter((item: any) => item.network_status?.toLowerCase() === 'connected').length})
                        </option>
                        <option value="disconnected" className="pl-4">
                          ❌ Disconnected ({modalData.data.filter((item: any) => item.network_status?.toLowerCase() === 'disconnected').length})
                        </option>
                      </optgroup>
                    </>
                  ) : (
                    <>
                      <optgroup label="Confidence Level" className="font-semibold">
                        <option value="malicious" className="pl-4">
                          🔴 Malicious ({modalData.data.filter((item: any) => item.confidence_level?.toLowerCase() === 'malicious').length})
                        </option>
                        <option value="suspicious" className="pl-4">
                          🟡 Suspicious ({modalData.data.filter((item: any) => item.confidence_level?.toLowerCase() === 'suspicious').length})
                        </option>
                        <option value="low" className="pl-4">
                          🔵 Low ({modalData.data.filter((item: any) => item.confidence_level?.toLowerCase() === 'low').length})
                        </option>
                      </optgroup>
                      <optgroup label="Severity" className="font-semibold">
                        <option value="critical" className="pl-4">
                          ⚠️ Critical ({modalData.data.filter((item: any) => item.severity?.toLowerCase() === 'critical').length})
                        </option>
                        <option value="high" className="pl-4">
                          🔸 High ({modalData.data.filter((item: any) => item.severity?.toLowerCase() === 'high').length})
                        </option>
                        <option value="medium" className="pl-4">
                          🔹 Medium ({modalData.data.filter((item: any) => item.severity?.toLowerCase() === 'medium').length})
                        </option>
                      </optgroup>
                    </>
                  )}
                </select>
              </div>

              <Badge
                variant="outline"
                className="border-primary/50 text-primary bg-primary/10 px-3 py-2 whitespace-nowrap font-semibold"
              >
                {sortedData.length} / {modalData.data.length}
              </Badge>
            </div>
          </div>

          {/* Results summary */}
          {(searchTerm || filterStatus !== "all" || sortColumn) && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="font-medium">Active filters:</span>
                </div>
                {searchTerm && <span className="px-2 py-1 bg-primary/10 rounded">Search: "{searchTerm}"</span>}
                {filterStatus !== "all" && <span className="px-2 py-1 bg-primary/10 rounded">• {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}</span>}
                {sortColumn && <span className="px-2 py-1 bg-primary/10 rounded">• Sorted by: {sortColumn}</span>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        {/* Table Container */}
        <div className="relative overflow-hidden flex-1 min-h-0">
          <div className="h-full overflow-auto">
            <table className="w-full text-sm relative">
              <thead className={`${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} sticky top-0 z-10 shadow-sm backdrop-blur-sm`}>
                <tr>
                  {modalData.columns.map((column: string, index: number) => (
                    <th
                      key={index}
                      className="text-left py-4 px-6 text-muted-foreground font-semibold border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center gap-2">
                        {column}
                        {sortColumn === column && (
                          sortDirection === "asc" ? 
                            <SortAsc className="h-3 w-3 text-primary" /> : 
                            <SortDesc className="h-3 w-3 text-primary" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card/80 divide-y divide-border">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item: any, index: number) =>
                    renderTableRow(item, index)
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={modalData.columns.length}
                      className="py-20 text-center"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-6 bg-muted/30 rounded-full">
                          <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium text-lg">No data found</p>
                          <p className="text-muted-foreground text-sm mt-2">
                            {searchTerm || filterStatus !== "all"
                              ? "Try adjusting your search or filter criteria"
                              : "No records available to display"}
                          </p>
                        </div>
                        {(searchTerm || filterStatus !== "all") && (
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
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex flex-col sm:flex-row items-center justify-between p-6 border-t border-border ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} gap-4 flex-shrink-0`}>
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="text-foreground font-medium">{startIndex + 1}</span>{" "}
              -{" "}
              <span className="text-foreground font-medium">
                {Math.min(startIndex + itemsPerPage, sortedData.length)}
              </span>{" "}
              of{" "}
              <span className="text-foreground font-medium">{sortedData.length}</span>{" "}
              results
              {sortedData.length !== modalData.data.length && (
                <span className="text-muted-foreground">
                  {" "}(filtered from {modalData.data.length} total)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
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
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
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

  // Use createPortal to render outside the EDR dashboard component tree
  return createPortal(modalContent, document.body);
};