// src/pages/ReportViewPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/pages/Main_dashboard/Header';
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  Database,
  AlertCircle,
  Loader2,
  Eye,
  BarChart3,
  TrendingUp,
  Shield,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';

interface ReportSection {
  id: number;
  section_type: string;
  title: string;
  content: string;
  order: number;
  chart_data: any;
  chart_type: string;
  is_ai_generated: boolean;
  updated_at: string;
}

interface SOCReportDetail {
  ai_model_used: any;
  id: number;
  title: string;
  report_type: string;
  description: string;
  status: string;
  tool_types: string[];
  report_period_start: string;
  report_period_end: string;
  kpi_metrics: any;
  charts_config: any[];
  created_by: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
  generated_at: string | null;
  sections: ReportSection[];
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

// Utility function to convert markdown to HTML
const formatMarkdownToHtml = (markdown: string): string => {
  return markdown
    // Remove the first heading if it matches the section title to avoid duplicates
    .replace(/^# [^\n]*\n\n/, '')
    
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-3 text-foreground">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-8 mb-4 text-foreground border-b border-border pb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-6 text-foreground">$1</h1>')
    
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    
    // Lists
    .replace(/^- (.*$)/gm, '<li class="mb-1 ml-4 list-disc text-muted-foreground">$1</li>')
    
    // Line breaks and paragraphs
    .split('\n\n')
    .map(paragraph => {
      if (paragraph.includes('<li')) {
        return `<ul class="mb-4 ml-4">${paragraph}</ul>`;
      } else if (paragraph.includes('<h')) {
        return paragraph;
      } else if (paragraph.trim()) {
        return `<p class="mb-4 text-muted-foreground leading-relaxed text-sm">${paragraph}</p>`;
      }
      return '';
    })
    .join('')
    
    // Clean up extra spaces and newlines
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const ReportViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const { user, token } = useAuth();
  const [report, setReport] = useState<SOCReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (reportId && token) {
      loadReport();
    }
  }, [reportId, token]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      
      const response = await fetch(`${API_BASE_URL}/tool/reports/${reportId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load report');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!report) return;

    try {
      setGenerating(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      
      const response = await fetch(`${API_BASE_URL}/tool/reports/${report.id}/generate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await loadReport(); // Reload to get updated content
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate report content');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error generating report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'docx') => {
    if (!report) return;

    try {
      setError(''); // Clear any previous errors
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      
      // Show loading state
      const button = document.querySelector(`[data-export="${format}"]`) as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = `Exporting ${format.toUpperCase()}...`;
      }
      
      const response = await fetch(`${API_BASE_URL}/tool/reports/${report.id}/export/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.download_url) {
          // Create a download link and trigger download
          const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
          // Remove /api from base URL if present for media files
          const mediaBaseUrl = baseUrl.replace('/api', '');
          const downloadUrl = `${mediaBaseUrl}${data.download_url}`;
          
          // Create temporary download link
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${report.title.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')}.${format}`;
          link.style.display = 'none';
          
          // Add to DOM, click, and remove
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Show success message
          alert(`Report exported to ${format.toUpperCase()} and downloaded successfully!`);
        } else {
          setError(data.message || 'Export completed but download URL not available');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to export report');
      }
    } catch (err) {
      setError('Network error occurred during export');
      console.error('Error exporting report:', err);
    } finally {
      // Reset button state
      const button = document.querySelector(`[data-export="${format}"]`) as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.innerHTML = `<svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Export ${format.toUpperCase()}`;
      }
    }
  };

  const getStatusVariant = (status: string) => {
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

  const renderKPIMetrics = () => {
    if (!report?.kpi_metrics?.key_metrics_summary) return null;

    const metrics = report.kpi_metrics.key_metrics_summary;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{metrics.total_threats || 0}</div>
            <div className="text-sm text-muted-foreground">Total Threats</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{metrics.critical_threats || 0}</div>
            <div className="text-sm text-muted-foreground">Critical Threats</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.resolution_rate || 0}%</div>
            <div className="text-sm text-muted-foreground">Resolution Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.security_score || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Security Score</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background report-view-page">
        <Header />
        <div className="pt-6 pb-8">
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-muted-foreground">Loading report...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen bg-background report-view-page">
        <Header />
        <div className="pt-6 pb-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background report-view-page">
        <Header />
        <div className="pt-6 pb-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Report not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background report-view-page">
      <Header />
      <div className="pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/reports')}
            className="h-9 w-9 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-foreground">{report.title}</h1>
              <Badge variant={getStatusVariant(report.status)}>
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(report.report_period_start)} - {formatDate(report.report_period_end)}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {report.created_by.username}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(report.created_at)}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {report.status === 'draft' && (
              <Button
                onClick={handleGenerateContent}
                disabled={generating}
                size="sm"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 mr-2" />
                    Generate
                  </>
                )}
              </Button>
            )}
            {report.status === 'completed' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport('pdf')}
                  data-export="pdf"
                >
                  <Download className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport('docx')}
                  data-export="docx"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Word
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Report Metadata */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground">Report Type</div>
                <div className="text-sm font-medium">{report.report_type.replace('_', ' ').toUpperCase()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Data Sources</div>
                <div className="text-sm font-medium">{report.data_summary.total_uploads} uploads</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Records</div>
                <div className="text-sm font-medium">{report.data_summary.total_records.toLocaleString()}</div>
              </div>
            </div>
            
            {report.description && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">Description</div>
                <div className="text-sm text-foreground">{report.description}</div>
              </div>
            )}

            <div className="flex flex-wrap gap-1">
              {report.tool_types.map((tool) => (
                <Badge key={tool} variant="secondary" className="text-xs">
                  {tool.toUpperCase()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* KPI Metrics */}
        {report.kpi_metrics?.key_metrics_summary && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {renderKPIMetrics()}
            </CardContent>
          </Card>
        )}

        {/* Report Sections */}
        {report.sections && report.sections.length > 0 ? (
          <div className="space-y-4">
            {report.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <Card key={section.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ 
                        __html: formatMarkdownToHtml(section.content) 
                      }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2 text-foreground">No Content Generated</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This report doesn't have any generated content yet.
              </p>
              {report.status === 'draft' && (
                <Button
                  onClick={handleGenerateContent}
                  disabled={generating}
                  size="sm"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 mr-2" />
                      Generate Content
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generation Info */}
        {report.generated_at && (
          <Card className="mt-4">
            <CardContent className="py-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  Generated on {formatDate(report.generated_at)}
                </div>
                {report.ai_model_used && (
                  <div>Engine: {report.ai_model_used}</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportViewPage;