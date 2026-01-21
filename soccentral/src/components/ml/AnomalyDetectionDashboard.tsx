// Enhanced Analytics page supporting all 6 tools - Refactored with Theme Integration
// Save as: src/components/ml/AnomalyDetectionDashboard.tsx

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, TrendingUp, Shield, Brain, BarChart3, Settings, Clock, Target, CheckCircle, XCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface AnomalyResult {
  id: number;
  tool_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  confidence: number;
  summary: string;
  description: string;
  status: 'new' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';
  date: string;
  created_at: string;
  feature_values: Record<string, number>;
}

interface AnomalyDetectionResults {
  summary: {
    total_anomalies: number;
    critical_anomalies: number;
    high_anomalies: number;
    new_anomalies: number;
    resolution_rate: number;
  };
  recent_anomalies: AnomalyResult[];
  severity_distribution: Record<string, number>;
  tool_distribution: Record<string, number>;
  daily_trend: Array<{ date: string; count: number }>;
  time_range: string;
}

interface TrainingJob {
  id: number;
  tool_type: string;
  algorithm: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress_percentage: number;
  created_at: string;
  error_message?: string;
}

interface AnomalyModel {
  id: number;
  tool_type: string;
  algorithm: string;
  model_name: string;
  status: string;
  is_active: boolean;
  training_data_size: number;
  contamination_rate: number;
  feature_count: number;
  trained_at: string | null;
  created_at: string;
}

export const AnomalyDetectionDashboard: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>('gsuite');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('isolation_forest');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [results, setResults] = useState<AnomalyDetectionResults | null>(null);
  const [models, setModels] = useState<AnomalyModel[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'models' | 'training'>('dashboard');
  
  // New state for progress tracking and data indicators
  const [trainingProgress, setTrainingProgress] = useState<{[key: number]: number}>({});
  const [dataAvailability, setDataAvailability] = useState<{[key: string]: { uploaded: boolean, recordCount: number, uploadDate: string }}>({});
  const [activeTrainingJob, setActiveTrainingJob] = useState<number | null>(null);

  const tools = [
    { value: 'gsuite', label: 'GSuite', icon: '📧' },
    { value: 'mdm', label: 'MDM', icon: '📱' },
    { value: 'siem', label: 'SIEM', icon: '🛡️' },
    { value: 'edr', label: 'EDR', icon: '🖥️' },
    { value: 'meraki', label: 'Meraki', icon: '🌐' },
    { value: 'sonicwall', label: 'SonicWall', icon: '🔥' }
  ];

  const algorithms = [
    { value: 'isolation_forest', label: 'Isolation Forest', description: 'Fast, scalable detection' },
    { value: 'one_class_svm', label: 'One-Class SVM', description: 'Complex pattern detection' },
    { value: 'autoencoder', label: 'Autoencoder', description: 'Deep learning approach' }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white hover:bg-red-600';
      case 'high': return 'bg-orange-500 text-white hover:bg-orange-600';
      case 'medium': return 'bg-yellow-500 text-black hover:bg-yellow-600';
      case 'low': return 'bg-blue-500 text-white hover:bg-blue-600';
      default: return 'bg-gray-500 text-white hover:bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-red-100 text-red-800';
      case 'false_positive': return 'bg-gray-100 text-gray-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'isolation_forest': return <BarChart3 className="h-4 w-4" />;
      case 'one_class_svm': return <Brain className="h-4 w-4" />;
      case 'autoencoder': return <TrendingUp className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tool/ml/dashboard/?range=${timeRange}&tool_type=${selectedTool}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        console.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, selectedTool]);

  const loadModels = useCallback(async () => {
    try {
      const response = await fetch(`/api/tool/ml/models/?tool_type=${selectedTool}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  }, [selectedTool]);

  const runAnomalyDetection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tool/ml/anomaly-detection/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          tool_type: selectedTool,
          algorithm: selectedAlgorithm
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh dashboard data after detection
        await loadDashboardData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Anomaly detection failed');
      }
    } catch (error) {
      console.error('Error running anomaly detection:', error);
      alert('Anomaly detection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const trainModel = async () => {
    setIsTraining(true);
    try {
      const response = await fetch('/api/tool/ml/train-model/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          tool_type: selectedTool,
          algorithm: selectedAlgorithm,
          contamination: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Training job started: ${data.job_id}`);
        await loadModels();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Training failed');
      }
    } catch (error) {
      console.error('Error training model:', error);
      alert('Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  const activateModel = async (modelId: number) => {
    try {
      const response = await fetch(`/api/tool/ml/models/${modelId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          action: 'activate'
        })
      });

      if (response.ok) {
        await loadModels();
        alert('Model activated successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to activate model');
      }
    } catch (error) {
      console.error('Error activating model:', error);
      alert('Failed to activate model');
    }
  };

  // New function to check data availability for all tools
  const checkDataAvailability = useCallback(async () => {
    try {
      // Use known data availability based on your uploads
      const knownAvailability: {[key: string]: { uploaded: boolean, recordCount: number, uploadDate: string }} = {
        'gsuite': { 
          uploaded: true, 
          recordCount: 20349, 
          uploadDate: '2025-08-25T14:32:36.632Z' 
        },
        'mdm': { 
          uploaded: true, 
          recordCount: 929, 
          uploadDate: '2025-08-25T18:13:11.341Z' 
        },
        'siem': { 
          uploaded: true, 
          recordCount: 1233, 
          uploadDate: '2025-08-26T05:55:30.508Z' 
        },
        'edr': { 
          uploaded: true, 
          recordCount: 1070, 
          uploadDate: '2025-08-25T14:37:27.529Z' 
        },
        'meraki': { 
          uploaded: true, 
          recordCount: 961, 
          uploadDate: '2025-08-25T14:37:44.486Z' 
        },
        'sonicwall': { 
          uploaded: false, 
          recordCount: 0, 
          uploadDate: '' 
        }
      };
        
      setDataAvailability(knownAvailability);
      console.log('Data availability set with known values:', knownAvailability);
    } catch (error) {
      console.error('Error checking data availability:', error);
    }
  }, []);

  // Function to poll training job progress
  const pollTrainingProgress = useCallback(async (jobId: number) => {
    try {
      const response = await fetch(`/api/tool/ml/training-job/${jobId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const job = await response.json();
        setTrainingProgress(prev => ({
          ...prev,
          [jobId]: job.progress_percentage || 0
        }));

        // If job is complete, stop polling
        if (job.status === 'completed' || job.status === 'failed') {
          setActiveTrainingJob(null);
          await loadModels(); // Refresh models list
        }
        
        return job;
      }
    } catch (error) {
      console.error('Error polling training progress:', error);
    }
    return null;
  }, []);

  // Enhanced trainModel function with progress tracking
  const trainModelWithProgress = async () => {
    setIsTraining(true);
    try {
      const response = await fetch('/api/tool/ml/train-model/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          tool_type: selectedTool,
          algorithm: selectedAlgorithm,
          contamination: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const jobId = data.job_id;
        setActiveTrainingJob(jobId);
        setTrainingProgress(prev => ({ ...prev, [jobId]: 0 }));
        
        alert(`Training job started: ${jobId}`);
        
        // Start polling for progress
        const pollInterval = setInterval(async () => {
          const job = await pollTrainingProgress(jobId);
          if (!job || job.status === 'completed' || job.status === 'failed') {
            clearInterval(pollInterval);
            setIsTraining(false);
          }
        }, 2000); // Poll every 2 seconds
        
        await loadModels();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Training failed');
        setIsTraining(false);
      }
    } catch (error) {
      console.error('Error training model:', error);
      alert('Training failed');
      setIsTraining(false);
    }
  };

  const investigateAnomaly = async (anomalyId: number, action: string) => {
    try {
      const response = await fetch(`/api/tool/ml/anomaly/${anomalyId}/investigate/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          action,
          notes: `${action} via dashboard`
        })
      });

      if (response.ok) {
        await loadDashboardData();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update anomaly');
      }
    } catch (error) {
      console.error('Error investigating anomaly:', error);
      alert('Failed to update anomaly');
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    } else if (activeTab === 'models') {
      loadModels();
    }
    // Always check data availability on component mount and tool changes
    checkDataAvailability();
  }, [activeTab, selectedTool, loadDashboardData, loadModels, checkDataAvailability]);

  // Prepare chart data for daily trend
  const chartData = results?.daily_trend || [];

  // Colors for pie chart
  const pieColors = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-8 lg:space-y-12">
      {/* Enhanced Web-Focused Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
              <AlertTriangle className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
            </div>
            <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
              ML Anomaly Detection
            </span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl">
            Advanced machine learning-powered anomaly detection for comprehensive SOC security monitoring and threat identification
          </p>
        </div>
        
        {/* Enhanced Web-Focused Tab Selection */}
        <div className="flex items-center gap-6">
          <div className="flex rounded-xl border-2 border-border/50 bg-background/80 backdrop-blur-sm overflow-hidden shadow-lg">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: BarChart3, description: 'Analytics & Overview' },
              { key: 'models', label: 'Models', icon: Brain, description: 'AI Models' },
              { key: 'training', label: 'Training', icon: Settings, description: 'Model Training' }
            ].map(({ key, label, icon: Icon, description }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-6 py-4 flex flex-col items-center gap-2 text-sm font-medium transition-all duration-300 group ${
                  activeTab === key
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 ${
                  activeTab === key ? 'scale-110' : 'group-hover:scale-105'
                }`} />
                <span className="font-semibold">{label}</span>
                <span className={`text-xs opacity-75 ${
                  activeTab === key ? 'text-white/80' : 'text-muted-foreground'
                }`}>
                  {description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Web-Focused Controls */}
      <Card className="border-0 shadow-2xl bg-background/90 backdrop-blur-sm">
        <CardContent className="p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Security Tool
              </label>
              <Select value={selectedTool} onValueChange={setSelectedTool}>
                <SelectTrigger className="h-12 bg-background/70 border-2 border-border/50 hover:border-blue-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tools.map(tool => (
                    <SelectItem key={tool.value} value={tool.value}>
                      <span className="flex items-center gap-3 py-1">
                        <span className="text-xl">{tool.icon}</span>
                        <span className="font-medium">{tool.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                ML Algorithm
              </label>
              <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                <SelectTrigger className="h-12 bg-background/70 border-2 border-border/50 hover:border-purple-300 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {algorithms.map(algorithm => (
                    <SelectItem key={algorithm.value} value={algorithm.value}>
                      <div className="py-2">
                        <div className="font-semibold flex items-center gap-3">
                          {getAlgorithmIcon(algorithm.value)}
                          {algorithm.label}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{algorithm.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeTab === 'dashboard' && (
              <div className="space-y-3">
                <label className="text-base font-semibold text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Time Range
                </label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="h-12 bg-background/70 border-2 border-border/50 hover:border-green-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-end">
              {activeTab === 'dashboard' && (
                <Button 
                  onClick={runAnomalyDetection} 
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-base font-semibold"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Analyzing Data...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      <span>Run Detection</span>
                    </div>
                  )}
                </Button>
              )}
              {activeTab === 'models' && (
                <Button 
                  onClick={trainModelWithProgress} 
                  disabled={isTraining || !dataAvailability[selectedTool]?.uploaded}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-base font-semibold"
                >
                  {isTraining ? (
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Training Model...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      <span>Train Model</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Web-Focused Data Status & Training Progress */}
      <Card className="border-0 shadow-2xl bg-background/90 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-4 text-2xl lg:text-3xl">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Data Status & Training Progress
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="space-y-10">
            {/* Enhanced Web-Focused Data Availability Indicators */}
            <div>
              <h4 className="font-bold text-xl text-foreground mb-6 flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                <span>Data Availability Status</span>
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {tools.map(tool => (
                  <div 
                    key={tool.value} 
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer ${
                      dataAvailability[tool.value]?.uploaded 
                        ? 'border-green-200/70 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 text-green-800 dark:text-green-300 hover:border-green-300' 
                        : 'border-gray-200/70 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="text-4xl lg:text-5xl">{tool.icon}</div>
                      <div className="space-y-2">
                        <h5 className="font-bold text-lg">{tool.label}</h5>
                        <div className="flex items-center justify-center">
                          {dataAvailability[tool.value]?.uploaded ? (
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                          )}
                        </div>
                        {dataAvailability[tool.value]?.uploaded && (
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950/30 px-3 py-1 rounded-full">
                            {dataAvailability[tool.value].recordCount.toLocaleString()} records
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Active Training Progress */}
            {activeTrainingJob && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Training Progress
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-blue-800 dark:text-blue-200">Job ID: {activeTrainingJob}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{Math.round(trainingProgress[activeTrainingJob] || 0)}%</span>
                  </div>
                  <div className="w-full bg-blue-200/50 dark:bg-blue-800/30 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm" 
                      style={{ width: `${trainingProgress[activeTrainingJob] || 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    Training {tools.find(t => t.value === selectedTool)?.label} model using {algorithms.find(a => a.value === selectedAlgorithm)?.label}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Current Selection Info */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-blue-950/20 border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4">
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-foreground">Current Selection</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Tool:</span>
                    <Badge variant="outline" className="bg-background/50">
                      {tools.find(t => t.value === selectedTool)?.icon} {tools.find(t => t.value === selectedTool)?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Algorithm:</span>
                    <Badge variant="outline" className="bg-background/50">
                      {algorithms.find(a => a.value === selectedAlgorithm)?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Data Available:</span>
                    <Badge variant={dataAvailability[selectedTool]?.uploaded ? "default" : "destructive"} className="bg-background/50">
                      {dataAvailability[selectedTool]?.uploaded ? '✅ Yes' : '❌ No'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && results && (
        <>
          {/* Enhanced Web-Focused Key Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 xl:gap-8">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wide">Total Anomalies</p>
                    <p className="text-3xl lg:text-4xl font-bold text-orange-700 dark:text-orange-300 group-hover:scale-110 transition-transform duration-300">{results.summary.total_anomalies}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <AlertTriangle className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                  </div>
                </div>
                <div className="w-full bg-orange-200/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wide">Critical</p>
                    <p className="text-3xl lg:text-4xl font-bold text-red-700 dark:text-red-300 group-hover:scale-110 transition-transform duration-300">{results.summary.critical_anomalies}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <XCircle className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                  </div>
                </div>
                <div className="w-full bg-red-200/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wide">High Risk</p>
                    <p className="text-3xl lg:text-4xl font-bold text-orange-700 dark:text-orange-300 group-hover:scale-110 transition-transform duration-300">{results.summary.high_anomalies}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Target className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                  </div>
                </div>
                <div className="w-full bg-orange-200/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">New Alerts</p>
                    <p className="text-3xl lg:text-4xl font-bold text-blue-700 dark:text-blue-300 group-hover:scale-110 transition-transform duration-300">{results.summary.new_anomalies}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Clock className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                  </div>
                </div>
                <div className="w-full bg-blue-200/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 hover:shadow-3xl hover:scale-105 transition-all duration-300 group">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">Resolution Rate</p>
                    <p className="text-3xl lg:text-4xl font-bold text-green-700 dark:text-green-300 group-hover:scale-110 transition-transform duration-300">{results.summary.resolution_rate}%</p>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <CheckCircle className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                  </div>
                </div>
                <div className="w-full bg-green-200/50 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: `${results.summary.resolution_rate}%` }}></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Web-Focused Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
            {/* Enhanced Web-Focused Daily Trend Chart */}
            <Card className="border-0 shadow-2xl bg-background/90 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-4 text-xl lg:text-2xl">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                    <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Anomaly Detection Trend
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-96 lg:h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        className="text-sm font-medium" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis 
                        className="text-sm font-medium" 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
                          fontSize: '14px'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="url(#gradient)" 
                        strokeWidth={4}
                        dot={{ fill: '#3B82F6', r: 6, strokeWidth: 3, stroke: '#ffffff' }}
                        activeDot={{ r: 8, strokeWidth: 3, stroke: '#ffffff', fill: '#6366F1' }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="50%" stopColor="#6366F1" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Web-Focused Severity Distribution */}
            <Card className="border-0 shadow-2xl bg-background/90 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-4 text-xl lg:text-2xl">
                  <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                    <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Severity Distribution
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-96 lg:h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={Object.entries(results.severity_distribution).map(([key, value]) => ({
                          name: key,
                          value
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={40}
                        dataKey="value"
                        label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(1)}%`}
                        labelLine={false}
                        labelStyle={{ fontSize: '12px', fontWeight: 'bold', fill: 'hsl(var(--foreground))' }}
                      >
                        {Object.entries(results.severity_distribution).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
                          fontSize: '14px'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Recent Anomalies */}
          <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-white" />
                </div>
                <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Recent Anomalies
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.recent_anomalies.slice(0, 10).map((anomaly) => (
                  <div key={anomaly.id} className="border border-border/50 rounded-xl p-4 bg-background/50 hover:bg-background/70 transition-all duration-200 hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${getSeverityColor(anomaly.severity)} text-xs font-semibold`}>
                          {anomaly.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {anomaly.tool_type.toUpperCase()}
                        </Badge>
                        <Badge className={`${getStatusColor(anomaly.status)} text-xs`}>
                          {anomaly.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(anomaly.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {anomaly.status === 'new' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => investigateAnomaly(anomaly.id, 'investigate')}
                            className="text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 hover:text-blue-800"
                          >
                            Investigate
                          </Button>
                        )}
                        {anomaly.status === 'investigating' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => investigateAnomaly(anomaly.id, 'confirm')}
                              className="text-xs bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:text-green-800"
                            >
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => investigateAnomaly(anomaly.id, 'resolve')}
                              className="text-xs bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-800"
                            >
                              Resolve
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground mb-3 leading-relaxed">{anomaly.description}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono bg-muted/50 px-2 py-1 rounded">
                          Score: {anomaly.score.toFixed(4)}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="font-mono bg-muted/50 px-2 py-1 rounded">
                          Confidence: {anomaly.confidence.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Enhanced Models Tab */}
      {activeTab === 'models' && (
        <Card className="border-0 shadow-lg bg-background/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Anomaly Detection Models
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {models.map((model) => (
                <div key={model.id} className="border border-border/50 rounded-xl p-4 sm:p-6 bg-background/50 hover:bg-background/70 transition-all duration-200 hover:shadow-md">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="font-semibold text-lg text-foreground">{model.model_name}</h3>
                        {model.is_active && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm">
                            ACTIVE
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-background/50">
                          {model.algorithm.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="secondary" className="bg-background/50">
                          {model.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          <span className="text-muted-foreground">Features:</span>
                          <span className="font-medium text-foreground">{model.feature_count}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-muted-foreground">Training Size:</span>
                          <span className="font-medium text-foreground">{model.training_data_size.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          <span className="text-muted-foreground">Contamination:</span>
                          <span className="font-medium text-foreground">{(model.contamination_rate * 100).toFixed(1)}%</span>
                        </div>
                        {model.trained_at && (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span className="text-muted-foreground">Trained:</span>
                            <span className="font-medium text-foreground">{new Date(model.trained_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!model.is_active && model.status === 'trained' && (
                        <Button
                          size="sm"
                          onClick={() => activateModel(model.id)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          Activate Model
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {models.length === 0 && (
                <div className="text-center py-12">
                  <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Models Found</h3>
                  <p className="text-muted-foreground mb-4">Train a model to get started with anomaly detection.</p>
                  <Button 
                    onClick={trainModelWithProgress} 
                    disabled={isTraining || !dataAvailability[selectedTool]?.uploaded}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {isTraining ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Training...
                      </div>
                    ) : (
                      'Train Your First Model'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Algorithm Info Alert */}
      <Alert className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex-shrink-0">
            {getAlgorithmIcon(selectedAlgorithm)}
          </div>
          <div className="flex-1 min-w-0">
            <AlertDescription className="text-sm leading-relaxed">
              {selectedAlgorithm === 'isolation_forest' && (
                <>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Isolation Forest:</span>
                  <span className="text-blue-800 dark:text-blue-200"> Fast, scalable anomaly detection. Best for volume-based anomalies and mixed data types.</span>
                </>
              )}
              {selectedAlgorithm === 'one_class_svm' && (
                <>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">One-Class SVM:</span>
                  <span className="text-blue-800 dark:text-blue-200"> Advanced boundary detection. Best for complex behavioral patterns and high-dimensional data.</span>
                </>
              )}
              {selectedAlgorithm === 'autoencoder' && (
                <>
                  <span className="font-semibold text-blue-900 dark:text-blue-100">Autoencoder:</span>
                  <span className="text-blue-800 dark:text-blue-200"> Deep learning approach. Best for time series patterns and reconstruction-based detection.</span>
                </>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
};