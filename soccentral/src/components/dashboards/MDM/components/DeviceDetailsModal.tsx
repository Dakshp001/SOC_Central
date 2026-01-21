// Enhanced Device Details Modal Component with Portal Rendering
// src/components/dashboards/MDM/components/DeviceDetailsModal.tsx

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Search,
  X,
  Smartphone,
  Filter,
  SortAsc,
  SortDesc,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Eye,
  MoreVertical,
} from "lucide-react";
import { EnhancedSecurityViolation, DeviceDetail, MDMDetails } from "../types";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface DeviceDetailsModalProps {
  selectedViolation: string | null;
  violations: EnhancedSecurityViolation[];
  details: MDMDetails;
  onClose: () => void;
}

type SortField = 'username' | 'email' | 'platform' | 'lastSeen' | 'enrollment' | 'compliance' | 'serialNumber';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  platforms: string[];
  enrollmentStatuses: string[];
  complianceStatuses: string[];
  riskLevels: string[];
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  selectedViolation,
  violations,
  details,
  onClose,
}) => {
  const { actualTheme } = useTheme();
  
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filters, setFilters] = useState<FilterState>({
    platforms: [],
    enrollmentStatuses: [],
    complianceStatuses: [],
    riskLevels: [],
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedViolation) {
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
  }, [selectedViolation]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedViolation) {
        onClose();
      }
    };

    if (selectedViolation) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [selectedViolation, onClose]);

  // Device Details Modal Data
  const deviceDetails = useMemo(() => {
    if (!selectedViolation || !details) return [];

    const violation = violations.find((v) => v.type === selectedViolation);
    if (!violation) return [];

    return violation.devices.map((device: any, index: number) => {
      const username = device.Username || device.username || device.User || `User${index + 1}`;
      const email = device.Email || device.email || `${username.toLowerCase()}@company.com`;
      const platform = device.Platform || device.platform || device.OS || "Unknown";
      const serialNumber = device["Serial Number"] || device.serial_number || device.SerialNumber || `SN${Math.random().toString(36).substr(2, 8)}`;
      const lastSeen = device["Last Seen"] || device.last_seen || device.LastSeen || "Unknown";
      const enrollment = device.Enrollment || device.enrollment || device.EnrollmentStatus || "Unknown";
      const compliance = device["Compliance Status"] || device.compliance_status || device.ComplianceStatus || "Unknown";

      // Calculate risk level based on violation type and compliance
      let riskLevel = "Low";
      if (selectedViolation === "compromised") riskLevel = "Critical";
      else if (selectedViolation === "no_password") riskLevel = "High";
      else if (selectedViolation === "not_encrypted") riskLevel = "Medium";
      else if (compliance !== "Compliant") riskLevel = "Medium";

      return {
        id: `${selectedViolation}-${index}`,
        username,
        email,
        platform,
        serialNumber,
        lastSeen,
        enrollment,
        compliance,
        violationType: selectedViolation,
        riskLevel,
      };
    });
  }, [selectedViolation, details, violations]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const platforms = [...new Set(deviceDetails.map(d => d.platform))].filter(Boolean);
    const enrollmentStatuses = [...new Set(deviceDetails.map(d => d.enrollment))].filter(Boolean);
    const complianceStatuses = [...new Set(deviceDetails.map(d => d.compliance))].filter(Boolean);
    const riskLevels = [...new Set(deviceDetails.map(d => d.riskLevel))].filter(Boolean);
    
    return { platforms, enrollmentStatuses, complianceStatuses, riskLevels };
  }, [deviceDetails]);

  // Apply filters and search
  const filteredDevices = useMemo(() => {
    let filtered = deviceDetails;

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(device =>
        device.username.toLowerCase().includes(term) ||
        device.email.toLowerCase().includes(term) ||
        device.serialNumber.toLowerCase().includes(term) ||
        device.platform.toLowerCase().includes(term)
      );
    }

    // Apply filters
    if (filters.platforms.length > 0) {
      filtered = filtered.filter(device => filters.platforms.includes(device.platform));
    }
    if (filters.enrollmentStatuses.length > 0) {
      filtered = filtered.filter(device => filters.enrollmentStatuses.includes(device.enrollment));
    }
    if (filters.complianceStatuses.length > 0) {
      filtered = filtered.filter(device => filters.complianceStatuses.includes(device.compliance));
    }
    if (filters.riskLevels.length > 0) {
      filtered = filtered.filter(device => filters.riskLevels.includes(device.riskLevel));
    }

    return filtered;
  }, [deviceDetails, searchTerm, filters]);

  // Apply sorting
  const sortedDevices = useMemo(() => {
    return [...filteredDevices].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Handle date sorting
      if (sortField === 'lastSeen') {
        aVal = new Date(aVal as string).getTime() || 0;
        bVal = new Date(bVal as string).getTime() || 0;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [filteredDevices, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedDevices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = sortedDevices.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle filter changes
  const handleFilterChange = (type: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(item => item !== value)
        : [...prev[type], value]
    }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      platforms: [],
      enrollmentStatuses: [],
      complianceStatuses: [],
      riskLevels: [],
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Handle device selection
  const handleDeviceSelect = (deviceId: string) => {
    const newSelected = new Set(selectedDevices);
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId);
    } else {
      newSelected.add(deviceId);
    }
    setSelectedDevices(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDevices.size === paginatedDevices.length) {
      setSelectedDevices(new Set());
    } else {
      setSelectedDevices(new Set(paginatedDevices.map(d => d.id)));
    }
  };

  // Export functionality
  const handleExport = () => {
    const dataToExport = selectedDevices.size > 0 
      ? sortedDevices.filter(d => selectedDevices.has(d.id))
      : sortedDevices;
    
    const csvContent = [
      ['Username', 'Email', 'Platform', 'Serial Number', 'Last Seen', 'Enrollment', 'Compliance', 'Risk Level'],
      ...dataToExport.map(d => [d.username, d.email, d.platform, d.serialNumber, d.lastSeen, d.enrollment, d.compliance, d.riskLevel])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedViolation}_devices.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get risk level color
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getComplianceIcon = (compliance: string) => {
    if (compliance === 'Compliant') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!selectedViolation) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-6"
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
      <Card className="bg-card/95 backdrop-blur-md shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-border/50 rounded-2xl flex flex-col">
        {/* Header with Glass Effect */}
        <CardHeader className="border-b border-border/50 bg-card/80 backdrop-blur-md flex-shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-foreground flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedViolation.replace("_", " ").toUpperCase()} Devices
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedDevices.length)} of {sortedDevices.length} devices
                    {selectedDevices.size > 0 && (
                      <span className="ml-2 text-primary">
                        ({selectedDevices.size} selected)
                      </span>
                    )}
                  </p>
                </div>
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-background/70 border-border/50 hover:bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-foreground"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(filters.platforms.length + filters.enrollmentStatuses.length + filters.complianceStatuses.length + filters.riskLevels.length) > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filters.platforms.length + filters.enrollmentStatuses.length + filters.complianceStatuses.length + filters.riskLevels.length}
                  </Badge>
                )}
              </Button>
              {selectedDevices.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="flex items-center gap-2 bg-background/70 border-border/50 hover:bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-foreground"
                >
                  <Download className="h-4 w-4" />
                  Export Selected
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2 bg-background/70 border-border/50 hover:bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                Export All
              </Button>
              <div className="text-xs text-muted-foreground hidden md:block">
                Press <kbd className="px-2 py-1 bg-muted rounded text-muted-foreground">ESC</kbd> to close
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground bg-background/70 backdrop-blur-sm hover:bg-background/90"
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
                placeholder="Search by username, email, serial number, or platform..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 bg-background/70 border-border/50 placeholder:text-muted-foreground focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
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

        {/* Filters Panel with Glass Effect */}
        {showFilters && (
          <div className="border-b border-border/50 p-6 bg-muted/80 border-border/50 backdrop-blur-md flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Platform Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block text-foreground">Platform</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {filterOptions.platforms.map(platform => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={`platform-${platform}`}
                        checked={filters.platforms.includes(platform)}
                        onCheckedChange={() => handleFilterChange('platforms', platform)}
                      />
                      <Label htmlFor={`platform-${platform}`} className="text-sm text-muted-foreground">
                        {platform}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enrollment Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block text-foreground">Enrollment Status</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {filterOptions.enrollmentStatuses.map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`enrollment-${status}`}
                        checked={filters.enrollmentStatuses.includes(status)}
                        onCheckedChange={() => handleFilterChange('enrollmentStatuses', status)}
                      />
                      <Label htmlFor={`enrollment-${status}`} className="text-sm text-muted-foreground">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block text-foreground">Compliance Status</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {filterOptions.complianceStatuses.map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`compliance-${status}`}
                        checked={filters.complianceStatuses.includes(status)}
                        onCheckedChange={() => handleFilterChange('complianceStatuses', status)}
                      />
                      <Label htmlFor={`compliance-${status}`} className="text-sm text-muted-foreground">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Level Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block text-foreground">Risk Level</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {filterOptions.riskLevels.map(level => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={`risk-${level}`}
                        checked={filters.riskLevels.includes(level)}
                        onCheckedChange={() => handleFilterChange('riskLevels', level)}
                      />
                      <Label htmlFor={`risk-${level}`} className="text-sm text-muted-foreground">
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="bg-background/70 border-border/50 hover:bg-background/90"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        )}

        <CardContent className="overflow-hidden p-0 flex-1 min-h-0 flex flex-col">
          {/* Table Header with Enhanced Glass Effect */}
          <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border/50 p-4 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={paginatedDevices.length > 0 && selectedDevices.size === paginatedDevices.length}
                onCheckedChange={handleSelectAll}
              />
              <div className="grid grid-cols-6 gap-4 flex-1 text-sm font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort('username')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors duration-200 text-left"
                >
                  User
                  {sortField === 'username' && (
                    sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('platform')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors duration-200 text-left"
                >
                  Platform
                  {sortField === 'platform' && (
                    sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('serialNumber')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors duration-200 text-left"
                >
                  Device Info
                  {sortField === 'serialNumber' && (
                    sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('lastSeen')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors duration-200 text-left"
                >
                  Last Seen
                  {sortField === 'lastSeen' && (
                    sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('compliance')}
                  className="flex items-center gap-1 hover:text-foreground transition-colors duration-200 text-left"
                >
                  Status
                  {sortField === 'compliance' && (
                    sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                  )}
                </button>
                <span>Risk Level</span>
              </div>
            </div>
          </div>

          {/* Device List - Scrollable */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 space-y-2 bg-muted/30">
              {paginatedDevices.map((device) => (
                <div
                  key={device.id}
                  className={`p-4 rounded-lg border transition-all duration-200 backdrop-blur-sm ${
                    selectedDevices.has(device.id)
                      ? `${actualTheme === 'dark' ? 'bg-blue-900/30 border-blue-700/60' : 'bg-blue-50/80 border-blue-200/60'} shadow-md`
                      : `${actualTheme === 'dark' ? 'bg-card/40 border-border/40 hover:bg-card/60' : 'bg-card/40 border-border/40 hover:bg-card/60'} hover:shadow-sm`
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedDevices.has(device.id)}
                      onCheckedChange={() => handleDeviceSelect(device.id)}
                    />
                    <div className="grid grid-cols-6 gap-4 flex-1">
                      <div>
                        <p className="font-medium text-foreground">
                          {device.username}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {device.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-foreground">
                          {device.platform}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-foreground">
                          S/N: {device.serialNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-foreground">
                          {device.lastSeen}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {device.enrollment}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getComplianceIcon(device.compliance)}
                        <Badge
                          variant={device.compliance === "Compliant" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {device.compliance}
                        </Badge>
                      </div>
                      <div>
                        <Badge className={`text-xs ${getRiskLevelColor(device.riskLevel)}`}>
                          {device.riskLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {sortedDevices.length === 0 && (
              <div className="text-center py-16 text-muted-foreground bg-muted/30">
                <Smartphone className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No devices found</p>
                <p>No devices match your search criteria or filters.</p>
                {(searchTerm || Object.values(filters).some(f => f.length > 0)) && (
                  <Button 
                    variant="outline" 
                    className="mt-4 bg-background/70 backdrop-blur-sm"
                    onClick={clearFilters}
                  >
                    Clear Search & Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>

        {/* Pagination Footer with Glass Effect */}
        {sortedDevices.length > 0 && (
          <div className="border-t border-border/50 p-4 flex items-center justify-between bg-card/80 backdrop-blur-md flex-shrink-0">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedDevices.length)} of {sortedDevices.length}
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
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
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

  // Use createPortal to render outside the MDM dashboard component tree
  return createPortal(modalContent, document.body);
};