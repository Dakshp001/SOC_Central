// src/pages/CreateReportPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Header } from '@/pages/Main_dashboard/Header';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  FileText,
  Database,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface DataSource {
  tool_type: string;
  active_dataset: {
    id: number;
    file_name: string;
    record_count: number;
    uploaded_at: string;
    activated_at: string | null;
  } | null;
  total_records: number;
  date_range: {
    start: string;
    end: string;
  };
  uploads_count: number;
}

const steps = [
  { id: 1, name: 'Report Details', description: 'Basic report information' },
  { id: 2, name: 'Data Sources', description: 'Select security tools and data' },
  { id: 3, name: 'Review & Create', description: 'Review and generate report' }
];

const CreateReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    report_type: 'combined' as 'individual' | 'combined',
    selectedToolTypes: [] as string[],
    report_period_start: null as Date | null,
    report_period_end: null as Date | null
  });

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Admin privileges required to create SOC Reports');
      return;
    }
    if (!token) {
      return;
    }
    loadDataSources();
  }, [isAdmin, token]);

  const loadDataSources = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      
      const response = await fetch(`${API_BASE_URL}/tool/reports/data-sources/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDataSources(data.data_sources || []);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load data sources');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error loading data sources:', err);
    }
  };

  const handleToolTypeToggle = (toolType: string) => {
    setFormData(prev => ({
      ...prev,
      selectedToolTypes: prev.selectedToolTypes.includes(toolType)
        ? prev.selectedToolTypes.filter(t => t !== toolType)
        : [...prev.selectedToolTypes, toolType]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setError('Report title is required');
      return;
    }

    if (formData.selectedToolTypes.length === 0) {
      setError('At least one data source must be selected');
      return;
    }

    if (!formData.report_period_start || !formData.report_period_end) {
      setError('Report period dates are required');
      return;
    }

    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

      const response = await fetch(`${API_BASE_URL}/tool/reports/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          report_type: formData.report_type,
          tool_types: formData.selectedToolTypes,
          report_period_start: formData.report_period_start.toISOString().split('T')[0],
          report_period_end: formData.report_period_end.toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/reports/${data.report.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create report');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error creating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() && formData.report_period_start && formData.report_period_end;
      case 2:
        return formData.selectedToolTypes.length > 0;
      default:
        return true;
    }
  };

  const getSelectedDataSummary = () => {
    const selectedSources = dataSources.filter(source => 
      formData.selectedToolTypes.includes(source.tool_type)
    );
    
    return {
      totalRecords: selectedSources.reduce((sum, source) => sum + source.total_records, 0),
      uploadsCount: selectedSources.reduce((sum, source) => sum + source.uploads_count, 0),
      toolsCount: selectedSources.length
    };
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 create-report-page">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Admin privileges required to create SOC Reports. Please contact your administrator.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 create-report-page">
        {/* Clean Header with Progress */}
        <div className="flex items-center justify-between mb-8 mt-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/reports')}
              className="h-9 w-9 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Create SOC Report</h1>
              <p className="text-sm text-muted-foreground">
                Generate comprehensive security analysis reports
              </p>
            </div>
          </div>
          
          {/* Progress Steps in Header */}
          <div className="flex items-center gap-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    step.id
                  )}
                </div>
                <span className={cn(
                  "text-sm hidden sm:inline",
                  currentStep >= step.id ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-6 h-px bg-border mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Simple Content Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <FileText className="h-5 w-5" />}
              {currentStep === 2 && <Database className="h-5 w-5" />}
              {currentStep === 3 && <Sparkles className="h-5 w-5" />}
              {steps[currentStep - 1].name}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step 1: Report Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Report Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter report title (e.g., Monthly Security Assessment)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={formData.report_type} onValueChange={(value: 'individual' | 'combined') => 
                      setFormData(prev => ({ 
                        ...prev, 
                        report_type: value,
                        selectedToolTypes: []
                      }))
                    }>
                      <SelectTrigger className="bg-background border-border" style={{ backgroundColor: 'hsl(var(--background))' }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual Tool Report</SelectItem>
                        <SelectItem value="combined">Combined Analysis Report</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.report_type === 'individual' 
                        ? 'Generate focused analysis for a single security tool'
                        : 'Generate comprehensive analysis across multiple security tools'
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the report purpose and scope"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Report Period Start *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-background border-border",
                            !formData.report_period_start && "text-muted-foreground"
                          )}
                          style={{ backgroundColor: 'hsl(var(--background))' }}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.report_period_start ? (
                            format(formData.report_period_start, "PPP")
                          ) : (
                            <span>Pick start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.report_period_start}
                          onSelect={(date) => {
                            if (date) {
                              setFormData(prev => ({ 
                                ...prev, 
                                report_period_start: date,
                                report_period_end: !prev.report_period_end || prev.report_period_end <= date 
                                  ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000) 
                                  : prev.report_period_end
                              }));
                              // Auto-focus end date after selection
                              setTimeout(() => {
                                const endDateTrigger = document.querySelector('[data-end-date-trigger]') as HTMLElement;
                                if (endDateTrigger) {
                                  endDateTrigger.click();
                                }
                              }, 100);
                            }
                          }}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Report Period End *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-background border-border",
                            !formData.report_period_end && "text-muted-foreground"
                          )}
                          style={{ backgroundColor: 'hsl(var(--background))' }}
                          data-end-date-trigger
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.report_period_end ? (
                            format(formData.report_period_end, "PPP")
                          ) : (
                            <span>Pick end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.report_period_end}
                          onSelect={(date) => {
                            if (date && formData.report_period_start && date >= formData.report_period_start) {
                              setFormData(prev => ({ ...prev, report_period_end: date }));
                            } else if (date && !formData.report_period_start) {
                              setFormData(prev => ({ ...prev, report_period_end: date }));
                            }
                          }}
                          disabled={(date) => {
                            const today = new Date();
                            const isAfterToday = date > today;
                            const isBeforeStart = formData.report_period_start && date < formData.report_period_start;
                            return isAfterToday || isBeforeStart;
                          }}
                          defaultMonth={formData.report_period_start || new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formData.report_period_start && formData.report_period_end && (
                      <p className="text-xs text-muted-foreground">
                        Period: {Math.ceil((formData.report_period_end.getTime() - formData.report_period_start.getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Data Sources */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {formData.report_type === 'individual' ? 'Select Security Tool' : 'Select Data Sources'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {formData.report_type === 'individual' 
                      ? 'Choose one security tool for individual analysis'
                      : 'Choose the security tools and data sources to include in your combined report'
                    }
                  </p>
                </div>

                {dataSources.length === 0 ? (
                  <div className="text-center py-6">
                    <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No data sources available. Please upload security tool data first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {dataSources.map((source) => (
                    <Card key={source.tool_type} className={cn(
                      "cursor-pointer transition-colors",
                      formData.selectedToolTypes.includes(source.tool_type)
                        ? "ring-2 ring-purple-600 bg-purple-50 dark:bg-purple-950/20"
                        : "hover:bg-muted/50"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {formData.report_type === 'individual' ? (
                              <input
                                type="radio"
                                name="toolType"
                                checked={formData.selectedToolTypes.includes(source.tool_type)}
                                onChange={() => {
                                  // For individual reports, only allow one selection
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedToolTypes: [source.tool_type]
                                  }));
                                }}
                                className="h-4 w-4 text-purple-600"
                              />
                            ) : (
                              <Checkbox
                                checked={formData.selectedToolTypes.includes(source.tool_type)}
                                onCheckedChange={() => handleToolTypeToggle(source.tool_type)}
                              />
                            )}
                            <div>
                              <h4 className="font-medium">{source.tool_type.toUpperCase()}</h4>
                              <p className="text-sm text-muted-foreground">
                                {source.total_records.toLocaleString()} records available
                              </p>
                            </div>
                          </div>
                          <Badge variant={source.active_dataset ? "default" : "secondary"}>
                            {source.active_dataset ? "Active" : "No Active Data"}
                          </Badge>
                        </div>
                        
                        {source.active_dataset && (
                          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                            <div>Latest: {source.active_dataset.file_name}</div>
                            <div>Uploaded: {new Date(source.active_dataset.uploaded_at).toLocaleDateString()}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                )}

                {formData.selectedToolTypes.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Selection Summary</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Selected Tools: {getSelectedDataSummary().toolsCount}</div>
                      <div>Total Records: {getSelectedDataSummary().totalRecords.toLocaleString()}</div>
                      <div>Data Sources: {getSelectedDataSummary().uploadsCount}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review & Create */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Review Report Details</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Review your selections and create the report. AI will generate comprehensive analysis.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column - Report Details */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Report Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                          <p className="text-sm mt-1">{formData.title}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                          <p className="text-sm mt-1 capitalize">{formData.report_type.replace('_', ' ')}</p>
                        </div>
                        {formData.description && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                            <p className="text-sm mt-1">{formData.description}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Report Period</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                            <p className="text-sm mt-1 text-foreground">{formData.report_period_start?.toLocaleDateString()}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                            <p className="text-sm mt-1 text-foreground">{formData.report_period_end?.toLocaleDateString()}</p>
                          </div>
                        </div>
                        {formData.report_period_start && formData.report_period_end && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
                            <p className="text-sm mt-1 text-foreground">
                              {Math.ceil((formData.report_period_end.getTime() - formData.report_period_start.getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Data Sources */}
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Selected Data Sources</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedToolTypes.map((tool) => (
                            <Badge key={tool} variant="secondary" className="text-xs">
                              {tool.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Data Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold">{getSelectedDataSummary().toolsCount}</div>
                              <div className="text-xs text-muted-foreground">Security Tools</div>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold">{getSelectedDataSummary().totalRecords.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">Total Records</div>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                              <div className="text-lg font-semibold">{getSelectedDataSummary().uploadsCount}</div>
                              <div className="text-xs text-muted-foreground">Data Sources</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simple Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceedToNext()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !canProceedToNext()}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Creating Report...' : 'Create Report'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateReportPage;