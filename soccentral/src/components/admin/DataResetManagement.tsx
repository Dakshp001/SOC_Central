// frontend/src/components/admin/DataResetManagement.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToolData } from '@/contexts/ToolDataContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Trash2, 
  Database, 
  Calendar, 
  User, 
  AlertTriangle, 
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';

interface DatasetInfo {
  upload_id: string;
  tool_type: string;
  file_name: string;
  file_size?: number;
  uploaded_at: string;
  uploaded_by: {
    name: string;
    email: string;
  };
  activated_at?: string;
  activated_by?: {
    name: string;
    email: string;
  };
  is_active: boolean;
  status: string;
  company_name?: string;
}

interface DataResetStats {
  total_datasets: number;
  active_datasets: number;
  total_storage_mb: number;
  tools_with_data: string[];
  oldest_dataset: string;
  newest_dataset: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const DataResetManagement: React.FC = () => {
  const { user, token, canManageUsers } = useAuth();
  const { loadActiveData, toolData } = useToolData();
  
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [stats, setStats] = useState<DataResetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [resetScope, setResetScope] = useState<'company' | 'all'>('company'); // New state for reset scope

  // Check if user is super admin for additional features
  const isSuperAdmin = user?.role === 'super_admin';

  // Permission check
  if (!canManageUsers()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Super Admin privileges required to manage data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  useEffect(() => {
    fetchDatasets();
  }, []);

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    console.log('🔗 API Call:', endpoint, {
      method: options.method || 'GET',
      hasBody: !!options.body,
      bodyContent: options.body
    });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log('📊 API Response:', response.status, response.statusText);
    
    // Log response body for debugging
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    if (!response.ok) {
      // Try to parse error message from response
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`API call failed: ${response.status} - ${errorData.message || errorData.error || response.statusText}`);
      } catch (parseError) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
    }
    
    // Parse JSON response
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', responseText);
      throw new Error('Invalid JSON response from server');
    }
  };

  const fetchDatasets = async () => {
    setIsLoading(true);
    try {
      // Fetch all datasets and stats
      const [datasetsResponse, statsResponse] = await Promise.all([
        apiCall('/tool/admin/datasets/'),
        apiCall('/tool/admin/stats/')
      ]);
      
      if (datasetsResponse.success) {
        setDatasets(datasetsResponse.datasets || []);
      }
      
      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
      
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      toast({
        title: "Error",
        description: "Failed to load dataset information.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDataset = async (uploadId: string, toolType: string) => {
    setActionLoading(`delete-${uploadId}`);
    try {
      const response = await apiCall('/tool/manage-data/', {
        method: 'POST',
        body: JSON.stringify({ 
          upload_id: uploadId, 
          action: 'delete' 
        })
      });
      
      if (response.success) {
        await fetchDatasets(); // Refresh the list
        await loadActiveData(); // Refresh active data in context
        
        toast({
          title: "Dataset Deleted Successfully 🗑️",
          description: `${toolType.toUpperCase()} data has been permanently removed.`,
        });
      } else {
        toast({
          title: "Deletion Failed",
          description: response.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Delete dataset error:', error);
      toast({
        title: "Error",
        description: "Failed to delete dataset.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
      setShowConfirmDialog(null);
    }
  };

  const handleResetAllData = async () => {
    setActionLoading('reset-all');
    try {
      console.log('🔄 Starting reset all data with scope:', resetScope);
      
      const response = await apiCall('/tool/admin/reset-all/', {
        method: 'POST',
        body: JSON.stringify({ 
          confirm: true,
          scope: resetScope // Use the selected scope
        })
      });
      
      if (response.success) {
        await fetchDatasets();
        await loadActiveData();
        
        const scopeText = resetScope === 'all' ? 'all companies' : 'your company';
        toast({
          title: "All Data Reset Successfully 🔄",
          description: `Deleted ${response.deleted_count} datasets from ${scopeText}.`,
        });
      } else {
        toast({
          title: "Reset Failed",
          description: response.message || 'Unknown error occurred',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Reset all data error:', error);
      
      // Better error message based on error type
      let errorMessage = "Failed to reset all data.";
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          errorMessage = "Permission denied. Super Admin access required.";
        } else if (error.message.includes('400')) {
          errorMessage = "Invalid request. Please check your permissions.";
        } else if (error.message.includes('Authentication')) {
          errorMessage = "Authentication failed. Please log in again.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
      setShowConfirmDialog(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getToolBadgeColor = (toolType: string) => {
    const colors: { [key: string]: string } = {
      'gsuite': 'bg-blue-100 text-blue-800',
      'mdm': 'bg-green-100 text-green-800',
      'siem': 'bg-purple-100 text-purple-800',
      'edr': 'bg-orange-100 text-orange-800',
      'meraki': 'bg-cyan-100 text-cyan-800',
      'sonicwall': 'bg-red-100 text-red-800'
    };
    return colors[toolType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="dashboard-container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Data Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and reset uploaded security tool data
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={fetchDatasets}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => setShowConfirmDialog('reset-all')}
            disabled={isLoading || datasets.length === 0}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset All Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Datasets</p>
                  <p className="text-2xl font-bold">{stats.total_datasets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Active Datasets</p>
                  <p className="text-2xl font-bold">{stats.active_datasets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Download className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Storage Used</p>
                  <p className="text-2xl font-bold">{stats.total_storage_mb.toFixed(1)}MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Tools with Data</p>
                  <p className="text-2xl font-bold">{stats.tools_with_data.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Datasets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Datasets</CardTitle>
          <CardDescription>
            Manage individual datasets or reset all data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading datasets...
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No datasets found. Upload some data to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {datasets.map((dataset) => (
                <div 
                  key={dataset.upload_id}
                  className="border rounded-lg p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getToolBadgeColor(dataset.tool_type)}>
                        {dataset.tool_type.toUpperCase()}
                      </Badge>
                      {dataset.is_active && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      )}
                      {dataset.company_name && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {dataset.company_name}
                        </Badge>
                      )}
                      <span className="font-medium">{dataset.file_name}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Uploaded by {dataset.uploaded_by.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(dataset.uploaded_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        <span>{formatFileSize(dataset.file_size)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => setShowConfirmDialog(dataset.upload_id)}
                    disabled={actionLoading !== null}
                    variant="destructive"
                    size="sm"
                  >
                    {actionLoading === `delete-${dataset.upload_id}` ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                {showConfirmDialog === 'reset-all' ? (
                  <>
                    <p className="font-medium mb-2">This will permanently delete:</p>
                    
                    {/* Scope Selector for Super Admin */}
                    {isSuperAdmin && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <label className="text-sm font-medium mb-2 block">Reset Scope:</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="resetScope"
                              value="company"
                              checked={resetScope === 'company'}
                              onChange={(e) => setResetScope('company')}
                              className="radio"
                            />
                            <span>My Company Only ({user?.company_name})</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="resetScope"
                              value="all"
                              checked={resetScope === 'all'}
                              onChange={(e) => setResetScope('all')}
                              className="radio"
                            />
                            <span className="text-destructive font-medium">
                              ALL COMPANIES (Entire System) ⚠️
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                    
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• All {stats?.total_datasets} datasets</li>
                      <li>• All uploaded files and processed data</li>
                      <li>• All access logs and history</li>
                      {resetScope === 'all' && isSuperAdmin && (
                        <li className="text-destructive font-medium">
                          • Data from ALL companies in the system
                        </li>
                      )}
                    </ul>
                    <p className="text-destructive font-medium mt-3">
                      This action cannot be undone!
                    </p>
                  </>
                ) : (
                  <>
                    <p>Are you sure you want to delete this dataset?</p>
                    <p className="text-muted-foreground">
                      This will permanently remove the data and cannot be undone.
                    </p>
                  </>
                )}
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowConfirmDialog(null)}
                  variant="outline"
                  disabled={actionLoading !== null}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (showConfirmDialog === 'reset-all') {
                      handleResetAllData();
                    } else {
                      const dataset = datasets.find(d => d.upload_id === showConfirmDialog);
                      if (dataset) {
                        handleDeleteDataset(dataset.upload_id, dataset.tool_type);
                      }
                    }
                  }}
                  variant="destructive"
                  disabled={actionLoading !== null}
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {showConfirmDialog === 'reset-all' 
                    ? `Reset ${resetScope === 'all' ? 'ALL' : 'Company'} Data` 
                    : 'Delete Dataset'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};