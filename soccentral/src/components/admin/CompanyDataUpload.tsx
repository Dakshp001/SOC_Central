// soccentral/src/components/admin/CompanyDataUpload.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Building2, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Info,
  Users,
  Shield,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useToolData } from '@/contexts/ToolDataContext';
import { useNavigate } from 'react-router-dom';
import { uploadWithRetry, makeResilientAPICall } from '@/utils/retryUtils';

interface CompanyDataUploadProps {
  onDataUploaded?: (data: any) => void;
}

interface Company {
  name: string;
  userCount?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const makeAuthenticatedAPICall = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('Authentication token not found. Please log in again.');
  }
  
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  defaultHeaders['Authorization'] = `Bearer ${token}`;
  
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors for error responses
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export const CompanyDataUpload: React.FC<CompanyDataUploadProps> = ({
  onDataUploaded
}) => {
  const { user, canWrite, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { loadActiveData } = useToolData();
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('SOC Central');
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [userCompany, setUserCompany] = useState<string>('');

  const supportedTools = [
    { value: 'gsuite', label: 'G Suite', icon: '📧' },
    { value: 'mdm', label: 'MDM', icon: '📱' },
    { value: 'siem', label: 'SIEM', icon: '🛡️' },
    { value: 'edr', label: 'EDR', icon: '🔍' },
    { value: 'meraki', label: 'Meraki', icon: '🌐' },
    { value: 'sonicwall', label: 'SonicWall', icon: '🔥' }
  ];

  // Check permissions
  const hasUploadPermission = isAuthenticated && canWrite() && 
    (user?.role === 'admin' || user?.role === 'super_admin');

  // Load available companies
  const loadCompanies = useCallback(async () => {
    if (!hasUploadPermission) return;
    
    setLoadingCompanies(true);
    try {
      const response = await makeResilientAPICall(
        () => makeAuthenticatedAPICall('/tool/admin/company-upload/'),
        {
          maxAttempts: 2,
          delay: 1000,
          onRetry: (attempt) => {
            console.log(`Retrying company data load (attempt ${attempt})`);
          }
        }
      );
      
      if (response.success) {
        // Ensure "SOC Central" appears in the dropdown and is first
        const apiCompanies: string[] = response.companies || [];
        const uniqueCompanies = Array.from(new Set(['SOC Central', ...apiCompanies]));
        setCompanies(uniqueCompanies);
        setUserCompany(response.user_company || '');
        
        // Default selection on load: SOC Central, else user's company
        if (!selectedCompany) {
          setSelectedCompany('SOC Central');
        }
      } else {
        throw new Error(response.message || 'Failed to load companies');
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Failed to Load Companies",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setLoadingCompanies(false);
    }
  }, [hasUploadPermission, toast, selectedCompany]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  // Upload file for specific company
  const uploadForCompany = useCallback(async (file: File, toolType: string, targetCompany: string) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tool_type', toolType);
      formData.append('target_company', targetCompany);
      formData.append('auto_activate', 'true');

      // Enhanced progress simulation with detailed stages
      let stage = 0;
      const stages = [
        { title: '🔍 Validating File', desc: 'Checking file format and size...' },
        { title: '🔄 Duplicate Check', desc: 'Verifying file uniqueness...' },
        { title: '⚙️ Processing Data', desc: 'Analyzing and parsing content...' },
        { title: '💾 Saving Data', desc: 'Storing in database...' },
        { title: '🎯 Activating', desc: 'Making data available...' }
      ];
      
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          
          // Update stage based on progress
          const newStage = Math.floor(prev / 20);
          if (newStage !== stage && newStage < stages.length) {
            stage = newStage;
            const currentStage = stages[stage];
            toast({
              title: currentStage.title,
              description: currentStage.desc,
              duration: 2000,
            });
          }
          
          return prev + 6;
        });
      }, 400);

      const response = await uploadWithRetry(
        () => makeAuthenticatedAPICall('/tool/admin/company-upload/', {
          method: 'POST',
          body: formData
        }),
        (attempt, maxAttempts) => {
          if (attempt > 1) {
            toast({
              title: `Retrying Upload... (${attempt}/${maxAttempts})`,
              description: "Network issue detected, retrying automatically.",
              duration: 2000,
            });
          }
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        // Enhanced success message with more details
        const recordCount = response.data?.record_count || 0;
        const fileName = response.data?.file_name || file.name;
        
        toast({
          title: "🎉 Upload Successful!",
          description: `${toolType.toUpperCase()} data uploaded successfully! ${recordCount > 0 ? `Processed ${recordCount} records` : 'Data processed'} from "${fileName}" and activated for ${targetCompany}.`,
          duration: 5000,
        });

        // Show dashboard redirect toast with action
        setTimeout(() => {
          toast({
            title: "📊 Dashboard Ready",
            description: `Your ${toolType.toUpperCase()} dashboard has been updated with the latest data.`,
            duration: 6000,
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Navigate to the appropriate dashboard based on tool type
                  const dashboardRoutes: Record<string, string> = {
                    'gsuite': '/analytics?tool=gsuite',
                    'mdm': '/analytics?tool=mdm',
                    'siem': '/analytics?tool=siem',
                    'edr': '/analytics?tool=edr',
                    'meraki': '/analytics?tool=meraki',
                    'sonicwall': '/analytics?tool=sonicwall'
                  };
                  
                  const route = dashboardRoutes[toolType.toLowerCase()] || '/analytics';
                  navigate(route);
                  
                  toast({
                    title: "🚀 Navigating to Dashboard",
                    description: `Opening ${toolType.toUpperCase()} analytics dashboard...`,
                    duration: 2000,
                  });
                }}
              >
                View Dashboard
              </Button>
            ),
          });
        }, 1500);

        // Refresh active data to update dashboards
        try {
          await loadActiveData();
          console.log('✅ Dashboard data refreshed after upload');
        } catch (error) {
          console.warn('⚠️ Failed to refresh dashboard data:', error);
        }

        // Clear form
        setUploadedFile(null);
        setSelectedTool('');
        // Force company re-selection after every upload
        setSelectedCompany('');

        if (onDataUploaded) {
          onDataUploaded(response.data);
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Failed to upload file';
      let errorTitle = 'Upload Failed';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Handle specific error types with enhanced messaging
      if (error.message && typeof error.message === 'string') {
        if (error.message.includes('Duplicate file detected')) {
          errorTitle = '🔄 Duplicate File Detected';
          errorMessage = 'This exact file has already been uploaded to your system. The file content is identical to an existing upload. Please check your existing data or upload a different file.';
        } else if (error.message.includes('File size')) {
          errorTitle = '📏 File Too Large';
          errorMessage = 'File exceeds the 50MB size limit. Please compress your data or split it into smaller files.';
        } else if (error.message.includes('Unsupported file type')) {
          errorTitle = '📄 Invalid File Format';
          errorMessage = 'Please upload an Excel file (.xlsx, .xls) or CSV file. Other formats are not supported.';
        } else if (error.message.includes('corrupted')) {
          errorTitle = '🔧 File Corrupted';
          errorMessage = 'The file appears to be corrupted or damaged. Please check the file integrity and try again.';
        } else if (error.message.includes('Admin privileges')) {
          errorTitle = '🔒 Access Denied';
          errorMessage = 'Admin privileges are required to upload data files. Please contact your administrator.';
        } else if (error.message.includes('openpyxl')) {
          errorTitle = '⚙️ System Configuration Issue';
          errorMessage = 'Excel file processing is temporarily unavailable. Please try again or contact support.';
        }
      }
      
      setUploadError(errorMessage);
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 6000, // Longer duration for error messages
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [toast, onDataUploaded]);

  const handleUpload = useCallback(() => {
    if (!uploadedFile || !selectedTool || !selectedCompany) {
      toast({
        title: "Missing Information",
        description: "Please select a file, tool type, and target company.",
        variant: "destructive"
      });
      return;
    }

    uploadForCompany(uploadedFile, selectedTool, selectedCompany);
  }, [uploadedFile, selectedTool, selectedCompany, uploadForCompany, toast]);

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // File size check (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return {
        valid: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 50MB limit`
      };
    }

    // File type check
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `Unsupported file type. Please upload Excel (.xlsx, .xls) or CSV files only.`
      };
    }

    return { valid: true };
  }, []);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (!hasUploadPermission) {
      toast({
        title: "Access Denied 🔒",
        description: "Admin privileges required to upload files.",
        variant: "destructive"
      });
      return;
    }

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      let errorMessage = 'File was rejected';
      
      if (rejection.errors) {
        const error = rejection.errors[0];
        if (error.code === 'file-too-large') {
          errorMessage = 'File is too large (max 50MB)';
        } else if (error.code === 'file-invalid-type') {
          errorMessage = 'Invalid file type. Please upload Excel or CSV files only.';
        }
      }
      
      toast({
        title: "File Rejected 🚫",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Additional client-side validation
      const validation = validateFile(file);
      if (!validation.valid) {
        toast({
          title: "Invalid File 📄",
          description: validation.error,
          variant: "destructive"
        });
        return;
      }

      setUploadedFile(file);
      setUploadError(null);
      
      toast({
        title: "✅ File Validated",
        description: `${file.name} (${formatFileSize(file.size)}) passed validation and is ready for upload.`,
        duration: 3000,
      });
    }
  }, [hasUploadPermission, toast, validateFile]);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setUploadError(null);
    setUploadProgress(0);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading || !hasUploadPermission
  });

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Data Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access company data upload features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!hasUploadPermission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Data Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Admin privileges required to upload data for companies. 
              Your current role ({user?.role || 'unknown'}) does not have permission.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Data Upload
          <Badge variant="secondary" className="text-xs">
            {user?.role === 'super_admin' ? '👑 Super Admin' : '👨‍💼 Admin'}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload security data files for specific companies
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Company Selection - Always show dropdown for admins and super admins */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <label className="text-sm font-medium">Target Company</label>
            {loadingCompanies && <RefreshCw className="h-3 w-3 animate-spin" />}
          </div>
          
          <Select value={selectedCompany} onValueChange={setSelectedCompany} disabled={loadingCompanies}>
            <SelectTrigger>
              <SelectValue placeholder="Select company to upload data for..." />
            </SelectTrigger>
            <SelectContent>
              {companies.map(company => (
                <SelectItem key={company} value={company}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    {company}
                    {company === userCompany && (
                      <Badge variant="outline" className="text-xs">Your Company</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tool Type Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Tool Type</label>
          <Select value={selectedTool} onValueChange={setSelectedTool}>
            <SelectTrigger>
              <SelectValue placeholder="Select tool type..." />
            </SelectTrigger>
            <SelectContent>
              {supportedTools.map(tool => (
                <SelectItem key={tool.value} value={tool.value}>
                  <div className="flex items-center gap-2">
                    <span>{tool.icon}</span>
                    {tool.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Upload Area */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Data File</label>
          
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
              ${uploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {uploadedFile ? (
              <div className="space-y-3">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm font-medium">{uploadedFile.name}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    disabled={uploading}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            ) : (
              <>
                <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-sm text-primary">Drop the file here...</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Drag & drop an Excel file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports .xlsx, .xls files up to 50MB
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Error Display */}
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!uploadedFile || !selectedTool || !selectedCompany || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload Data for {selectedCompany || 'Selected Company'}
            </>
          )}
        </Button>

        {/* Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> Upload data files for specific companies. 
            Users logged in with that company name will be able to see and analyze the uploaded data.
            {/* Removed conditional company-select hint since dropdown is always shown */}
            {false && (
              <span> As a Super Admin, you can upload data for any company.</span>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};