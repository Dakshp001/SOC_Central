import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, LogOut, Upload, Brain, BarChart, Filter } from 'lucide-react';
import { FileUpload } from '@/components/data-analysis/FileUpload';
import { ColumnMapper } from '@/components/data-analysis/ColumnMapper';
import { TimeRangeFilter } from '@/components/data-analysis/TimeRangeFilter';
import { ToolSpecificDashboard } from '@/components/data-analysis/ToolSpecificDashboard';
import { DataFile, FilterOptions, AnalysisResult } from '@/types/dataAnalysis';
import { useToast } from '@/hooks/use-toast';

export const DataAnalysisPage: React.FC = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [uploadedFiles, setUploadedFiles] = useState<DataFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<DataFile | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: 'monthly',
    columns: [],
    tool: 'SIEM'
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleFileProcessed = (file: DataFile) => {
    console.log('File processed:', file.name);
    setUploadedFiles(prev => [...prev, file]);
    setSelectedFile(file);
    setFilters(prev => ({ ...prev, tool: file.tool, columns: [] }));
    setActiveTab('mapping');
    
    toast({
      title: "File uploaded successfully",
      description: `${file.name} is ready for analysis`,
    });
  };

  const handleColumnsSelected = (columns: string[]) => {
    console.log('Columns selected:', columns);
    setSelectedColumns(columns);
    setFilters(prev => ({ ...prev, columns }));
    setActiveTab('filtering');
  };

  const handleAnalysisStart = () => {
    if (!selectedFile || selectedColumns.length === 0) {
      toast({
        title: "Cannot start analysis",
        description: "Please select a file and at least one column",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting analysis with:', {
      file: selectedFile.name,
      columns: selectedColumns,
      filters
    });

    // Enhanced mock analysis result based on selected tool and data
    const mockAnalysis: AnalysisResult = {
      summary: {
        totalRecords: selectedFile.rowCount,
        dateRange: {
          start: filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: filters.endDate || new Date()
        },
        keyMetrics: getToolSpecificMetrics(selectedFile.tool, selectedFile.rowCount)
      },
      visualizations: generateMockVisualizations(selectedFile.tool),
      insights: generateToolSpecificInsights(selectedFile.tool, selectedFile.rowCount, selectedColumns.length)
    };

    setAnalysisResult(mockAnalysis);
    setActiveTab('analysis');

    toast({
      title: "Analysis completed",
      description: `Processed ${selectedFile.rowCount.toLocaleString()} records for ${selectedFile.tool} analysis`,
    });
  };

  // Generate tool-specific metrics
  const getToolSpecificMetrics = (tool: string, recordCount: number) => {
    switch (tool) {
      case 'SIEM':
        return {
          'Total Events': recordCount.toLocaleString(),
          'Critical Alerts': Math.floor(recordCount * 0.05).toLocaleString(),
          'Response Rate': '94.2%',
          'Average Response Time': '12m'
        };
      case 'EDR':
        return {
          'Total Endpoints': recordCount.toLocaleString(),
          'Active Threats': Math.floor(recordCount * 0.02).toLocaleString(),
          'Quarantined Files': Math.floor(recordCount * 0.01).toLocaleString(),
          'Protection Rate': '98.7%'
        };
      case 'MDM':
        return {
          'Total Devices': recordCount.toLocaleString(),
          'Managed Devices': Math.floor(recordCount * 0.85).toLocaleString(),
          'Policy Violations': Math.floor(recordCount * 0.15).toLocaleString(),
          'Compliance Rate': '89.3%'
        };
      default:
        return {
          'Total Records': recordCount.toLocaleString(),
          'Processed Successfully': Math.floor(recordCount * 0.95).toLocaleString(),
          'Success Rate': '95.2%',
          'Processing Time': '8m'
        };
    }
  };

  // Generate mock visualizations
  const generateMockVisualizations = (tool: string) => {
    return [
      {
        type: "chart" as const,
        data: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          count: Math.floor(Math.random() * 100) + 50
        })),
        config: { title: `${tool} Activity Over Time` }
      }
    ];
  };

  // Generate tool-specific insights
  const generateToolSpecificInsights = (tool: string, recordCount: number, columnCount: number) => {
    const baseInsights = [
      `Analyzed ${recordCount.toLocaleString()} records across ${columnCount} columns`,
      `Data quality assessment shows 95% completeness across all fields`,
      `Peak activity patterns identified during business hours (9 AM - 5 PM)`
    ];

    const toolInsights = {
      'SIEM': [
        'Security incident patterns show 15% increase in threat detection',
        'Most common attack vectors: phishing (35%), malware (28%), unauthorized access (22%)',
        'Average incident resolution time improved by 18% compared to last period'
      ],
      'EDR': [
        'Endpoint protection coverage at 98.7% across all monitored devices',
        'Threat hunting activities resulted in 12 proactive threat discoveries',
        'Machine learning models detected 89% of threats before execution'
      ],
      'MDM': [
        'Device compliance has improved by 12% with new policy implementations',
        'iOS devices show highest compliance rates (94%) followed by Android (87%)',
        'Policy violations mostly related to outdated OS versions (45%) and missing encryption (32%)'
      ]
    };

    return [...baseInsights, ...(toolInsights[tool as keyof typeof toolInsights] || [
      'Analysis completed successfully with comprehensive data processing',
      'Trends indicate stable performance with room for optimization',
      'Recommend implementing automated monitoring for improved insights'
    ])];
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            You need to be signed in to access this page.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Header - Full Width */}
      <header className="w-full border-b bg-card">
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Advanced Data Analysis Platform</h1>
                <p className="text-sm text-muted-foreground">
                  Intelligent data processing with AI-powered insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Welcome, {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="w-full px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="mapping" className="flex items-center gap-2" disabled={!selectedFile}>
              <Brain className="h-4 w-4" />
              Smart Mapping
            </TabsTrigger>
            <TabsTrigger value="filtering" className="flex items-center gap-2" disabled={selectedColumns.length === 0}>
              <Filter className="h-4 w-4" />
              Filtering
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2" disabled={!analysisResult}>
              <BarChart className="h-4 w-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="w-full space-y-6">
            <FileUpload onFileProcessed={handleFileProcessed} />
            
            {uploadedFiles.length > 0 && (
              <div className="w-full space-y-4">
                <h3 className="text-lg font-semibold">Recent Uploads</h3>
                <div className="grid gap-4">
                  {uploadedFiles.map(file => (
                    <div 
                      key={file.id}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedFile(file);
                        setSelectedColumns([]);
                        setAnalysisResult(null);
                        setActiveTab('mapping');
                      }}
                    >
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.tool} • {file.rowCount.toLocaleString()} rows • {file.columnInfo.length} columns
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded: {file.uploadedAt.toLocaleDateString()} at {file.uploadedAt.toLocaleTimeString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Analyze Again
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mapping" className="w-full space-y-6">
            {selectedFile && (
              <ColumnMapper
                file={selectedFile}
                onColumnsSelected={handleColumnsSelected}
              />
            )}
          </TabsContent>

          <TabsContent value="filtering" className="w-full space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <TimeRangeFilter
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableColumns={selectedColumns}
                />
              </div>
              <div className="lg:col-span-2 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <BarChart className="h-16 w-16 mx-auto text-primary" />
                  <h3 className="text-lg font-semibold">Ready for Analysis</h3>
                  <p className="text-muted-foreground max-w-md">
                    Your data is prepared and filters are configured. 
                    Click "Start Analysis" to generate insights and visualizations.
                  </p>
                  
                  {selectedFile && (
                    <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
                      <p><strong>File:</strong> {selectedFile.name}</p>
                      <p><strong>Tool:</strong> {selectedFile.tool}</p>
                      <p><strong>Records:</strong> {selectedFile.rowCount.toLocaleString()}</p>
                      <p><strong>Selected Columns:</strong> {selectedColumns.length}</p>
                      <p><strong>Time Range:</strong> {filters.timeRange}</p>
                    </div>
                  )}
                  
                  <Button onClick={handleAnalysisStart} size="lg" className="px-8">
                    <BarChart className="h-4 w-4 mr-2" />
                    Start Analysis
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="w-full space-y-6">
            {analysisResult && selectedFile && (
              <ToolSpecificDashboard
                tool={selectedFile.tool}
                analysis={analysisResult}
                data={[]} // In real implementation, this would be the actual processed data
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};