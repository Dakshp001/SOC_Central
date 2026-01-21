// src/pages/ReportsPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/pages/Main_dashboard/Header';
import {
  Plus,
  FileText,
  Download,
  Trash2,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Calendar,
  Database,
  Search,
  Filter,
  X,
} from 'lucide-react';

interface SOCReport {
  id: number;
  title: string;
  report_type: string;
  description: string;
  status: 'draft' | 'generating' | 'completed' | 'failed' | 'published';
  tool_types: string[];
  report_period_start: string;
  report_period_end: string;
  created_by: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
  generated_at: string | null;
  sections_count: number;
  data_sources_count: number;
  exported_formats: string[];
  data_summary: {
    total_uploads: number;
    tool_types: string[];
    date_range: {
      start: string;
      end: string;
    };
    total_records: number;
  };
}

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [reports, setReports] = useState<SOCReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 12,
    total: 0,
    pages: 0
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    report_type: '',
    tool_type: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filteredReports, setFilteredReports] = useState<SOCReport[]>([]);

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Admin privileges required to access SOC Reports');
      setLoading(false);
      return;
    }
    if (!token) {
      setLoading(false);
      return;
    }
    loadReports();
  }, [pagination.page, isAdmin, token]);

  // Filter reports when filters change
  useEffect(() => {
    let filtered = reports;
    
    if (filters.search) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.created_by.username.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    if (filters.status) {
      filtered = filtered.filter(report => report.status === filters.status);
    }
    
    if (filters.report_type) {
      filtered = filtered.filter(report => report.report_type === filters.report_type);
    }
    
    if (filters.tool_type) {
      filtered = filtered.filter(report => 
        report.tool_types.some(tool => tool.toLowerCase().includes(filters.tool_type.toLowerCase()))
      );
    }
    
    setFilteredReports(filtered);
  }, [reports, filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      
      const response = await fetch(
        `${API_BASE_URL}/tool/reports/?page=${pagination.page}&per_page=${pagination.per_page}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setFilteredReports(data.reports || []);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: data.pagination.total,
            pages: data.pagination.pages
          }));
        }
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load reports');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = () => {
    navigate('/reports/create');
  };

  const handleViewReport = (reportId: number) => {
    navigate(`/reports/${reportId}`);
  };


  const handleDeleteReport = async (reportId: number, reportTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${reportTitle}"?`)) return;

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      
      const response = await fetch(`${API_BASE_URL}/tool/reports/${reportId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadReports(); // Refresh list
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete report');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error deleting report:', err);
    }
  };

  const handleExportReport = async (reportId: number, format: 'pdf' | 'docx') => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      
      const response = await fetch(`${API_BASE_URL}/tool/reports/${reportId}/export/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        const data = await response.json();
        // In production, this would download the file
        alert(`Report exported to ${format.toUpperCase()} successfully!`);
        loadReports(); // Refresh to update exported_formats
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to export report');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error exporting report:', err);
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "generating":
        return "secondary";
      case "draft":
        return "outline";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      report_type: '',
      tool_type: ''
    });
  };

  const hasActiveFilters = filters.search || filters.status || filters.report_type || filters.tool_type;
  
  // Get unique tool types and statuses for filter options
  const uniqueToolTypes = [...new Set(reports.flatMap(report => report.tool_types))];
  const uniqueStatuses = [...new Set(reports.map(report => report.status))];

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background reports-page">
        <Header />
        <div className="pt-6 pb-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Admin privileges required to access SOC Reports. Please contact your administrator.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background reports-page">
      <Header />
      <div className="pt-6 pb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground">SOC Reports</h1>
            <p className="text-muted-foreground mt-2">
              Generate comprehensive Security Operations Center reports with AI-powered insights
            </p>
          </div>
          <Button
            onClick={handleCreateReport}
            variant="outline"
            size="lg"
            className="border-2 hover:bg-muted/50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 bg-background border-border"
              />
            </div>
            
            {/* Filter Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-2 ${showFilters || hasActiveFilters ? 'bg-muted/50' : ''}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters {hasActiveFilters && `(${Object.values(filters).filter(Boolean).length})`}
            </Button>
            
            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          {/* Filter Controls */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {uniqueStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={filters.report_type} onValueChange={(value) => setFilters(prev => ({ ...prev, report_type: value === 'all' ? '' : value }))}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="combined">Combined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tool Type</label>
                  <Select value={filters.tool_type} onValueChange={(value) => setFilters(prev => ({ ...prev, tool_type: value === 'all' ? '' : value }))}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="All tools" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tools</SelectItem>
                      {uniqueToolTypes.map(tool => (
                        <SelectItem key={tool} value={tool}>
                          {tool.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Results Summary */}
        {!loading && filteredReports.length !== reports.length && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredReports.length} of {reports.length} reports
            {hasActiveFilters && (
              <span className="ml-2 text-primary">
                (filtered)
              </span>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-muted-foreground">Loading reports...</span>
          </div>
        )}

        {/* Reports Grid */}
        {!loading && filteredReports.length === 0 && reports.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent className="space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold">No SOC Reports Yet</h3>
                <p className="text-muted-foreground mt-2">
                  Create your first SOC report to get started with AI-powered security analysis
                </p>
              </div>
              <Button
                onClick={handleCreateReport}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Report
              </Button>
            </CardContent>
          </Card>
        ) : filteredReports.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent className="space-y-4">
              <Search className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-xl font-semibold">No Reports Found</h3>
                <p className="text-muted-foreground mt-2">
                  No reports match your current filters. Try adjusting your search criteria.
                </p>
              </div>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-2"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="group hover:shadow-md transition-all duration-200 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-5">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(report.status)} className="text-xs font-medium">
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-border/50">
                        {report.report_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-1" title={report.title}>
                    {report.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {report.description || 'No description provided'}
                  </p>

                  {/* Tool Types */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {report.tool_types.slice(0, 3).map((tool) => (
                      <Badge key={tool} variant="secondary" className="text-xs px-2 py-0.5">
                        {tool.toUpperCase()}
                      </Badge>
                    ))}
                    {report.tool_types.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">
                        +{report.tool_types.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Report Period */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(report.report_period_start)} - {formatDate(report.report_period_end)}</span>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    <div className="bg-muted/30 rounded-md py-1.5">
                      <div className="text-xs font-medium text-foreground">{report.sections_count}</div>
                      <div className="text-xs text-muted-foreground">Sections</div>
                    </div>
                    <div className="bg-muted/30 rounded-md py-1.5">
                      <div className="text-xs font-medium text-foreground">{report.data_sources_count}</div>
                      <div className="text-xs text-muted-foreground">Sources</div>
                    </div>
                    <div className="bg-muted/30 rounded-md py-1.5">
                      <div className="text-xs font-medium text-foreground">{report.data_summary.total_records.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Records</div>
                    </div>
                  </div>

                  {/* Export Status */}
                  {report.exported_formats.length > 0 && (
                    <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      <span>Exported: {report.exported_formats.join(', ').toUpperCase()}</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="pt-3 border-t border-border/50">
                    {/* Row 1: Author Info */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Clock className="h-3 w-3" />
                      <span>by {report.created_by.username}</span>
                    </div>
                    
                    {/* Row 2: Action Buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewReport(report.id)}
                        className="h-8 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary border-0"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      {report.status === 'completed' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportReport(report.id, 'pdf')}
                            className="h-8 px-2 text-xs bg-green-500/10 hover:bg-green-500/20 text-green-600 border-0"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            PDF
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportReport(report.id, 'docx')}
                            className="h-8 px-2 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 border-0"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Word
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id, report.title)}
                        className="h-8 px-2 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-600 border-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Pagination could be added here in the future */}

      </div>
    </div>
  );
};

export default ReportsPage;