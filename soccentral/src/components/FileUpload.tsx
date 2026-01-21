// Fixed FileUpload component - Remove debug endpoint and fix data handling
// Save as: src/components/FileUpload.tsx

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle, AlertCircle, X, Info, RefreshCw, Shield, Lock, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useToolData } from '@/contexts/ToolDataContext';

interface FileUploadProps {
  onDataProcessed: (data: any, fileType: string, fileName: string) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number;
  allowedTools?: string[];
  showCompanySelection?: boolean; // New prop to enable company selection
}

// ✅ FIXED: API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const makeAuthenticatedAPICall = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`🔄 Authenticated API call: ${options.method || 'GET'} ${url}`);
  
  // ✅ CRITICAL: Get token from localStorage for each request
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.error('❌ No authentication token found');
    throw new Error('Authentication token not found. Please log in again.');
  }
  
  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
  };
  
  // ✅ FIXED: Always include auth header
  defaultHeaders['Authorization'] = `Bearer ${token}`;
  
  // ✅ IMPORTANT: Don't set Content-Type for FormData uploads
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

  console.log('📤 Request headers:', {
    ...config.headers,
    Authorization: `Bearer ${token.substring(0, 20)}...`
  });
  
  try {
    const response = await fetch(url, config);
    
    console.log(`📊 API response status: ${response.status}`);
    
    if (response.status === 401) {
      console.error('🔓 Authentication failed - token may be expired');
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
        console.warn('Could not parse error response as JSON');
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('📋 Upload response:', data);
    
    return data;
  } catch (error) {
    console.error('💥 API call failed:', error);
    throw error;
  }
};

// ✅ FIXED: Upload functions with proper data handling
const uploadFile = async (file: File, targetCompany?: string) => {
  console.log('📤 Uploading file for auto-detection:', file.name);
  
  const formData = new FormData();
  formData.append('file', file);
  
  // Add company selection if provided
  if (targetCompany) {
    formData.append('target_company', targetCompany);
  }
  
  // ✅ CRITICAL: Use the enhanced endpoint that saves to database
  const enhancedEndpoints = targetCompany ? [
    '/tool/admin/company-upload/', // Company-specific endpoint
    '/tool/universal/upload/',     // Enhanced endpoint with database persistence
    '/tool/upload/',               // Legacy endpoint (fallback)
  ] : [
    '/tool/universal/upload/',     // Enhanced endpoint with database persistence
    '/tool/upload/',               // Legacy endpoint (fallback)
  ];
  
  let lastError;
  
  for (const endpoint of enhancedEndpoints) {
    try {
      console.log(`🔍 Trying enhanced endpoint: ${endpoint}`);
      
      const response = await makeAuthenticatedAPICall(endpoint, {
        method: 'POST',
        body: formData
      });
      
      console.log(`✅ Success with endpoint: ${endpoint}`, response);
      
      // ✅ ENHANCED: Check for database persistence indicators
      if (response.data && response.data.upload_id) {
        console.log('🎉 Upload saved to database with ID:', response.data.upload_id);
      }
      
      if (response.data && response.data.is_active) {
        console.log('🟢 Dataset automatically activated for company');
      }
      
      return response;
      
    } catch (error) {
      console.log(`❌ Failed with endpoint ${endpoint}:`, error.message);
      lastError = error;
      
      // Continue to next endpoint if this one fails
      continue;
    }
  }
  
  // If all endpoints failed, throw the last error
  throw new Error(`No working upload endpoint found. Last error: ${lastError?.message}`);
};

// ✅ REMOVED: Problematic debug endpoint verification
// This was causing the 404 error and "UNKNOWN" data issue

const uploadToolSpecificFile = async (file: File, toolType: string, targetCompany?: string) => {
  console.log(`📤 Uploading ${toolType} file:`, file.name);
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tool_type', toolType); // ✅ ADDED: Explicitly set tool type
  
  // Add company selection if provided
  if (targetCompany) {
    formData.append('target_company', targetCompany);
  }
  
  // Try universal upload endpoint first with explicit tool type
  const possibleEndpoints = targetCompany ? [
    '/tool/admin/company-upload/',    // Company-specific endpoint
    '/tool/universal/upload/',        // Universal endpoint (recommended)
    `/tool/${toolType}/upload/`,      // Tool-specific endpoint
    '/tool/upload/',                  // Legacy endpoint
  ] : [
    '/tool/universal/upload/',        // Universal endpoint (recommended)
    `/tool/${toolType}/upload/`,      // Tool-specific endpoint
    '/tool/upload/',                  // Legacy endpoint
  ];
  
  let lastError;
  
  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`🔍 Trying tool-specific endpoint: ${endpoint}`);
      const response = await makeAuthenticatedAPICall(endpoint, {
        method: 'POST',
        body: formData
      });
      
      console.log(`✅ Success with tool-specific endpoint: ${endpoint}`);
      return response;
      
    } catch (error) {
      console.log(`❌ Failed with endpoint ${endpoint}:`, error.message);
      lastError = error;
      
      // If we get 404, try next endpoint
      if (error.message.includes('404')) {
        continue;
      }
      
      // If we get 401 or 403, it means endpoint exists but auth failed
      if (error.message.includes('401') || error.message.includes('403')) {
        throw error;
      }
    }
  }
  
  // If all endpoints failed, throw a concise, user-friendly error
  throw new Error('Upload failed. Please upload a file with proper tool name.');
};

export const FileUpload: React.FC<FileUploadProps> = ({
  onDataProcessed,
  acceptedFileTypes = ['.xlsx', '.xls', 'csv'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
  allowedTools = ['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall'],
  showCompanySelection = false
}) => {
  // ✅ Get user authentication and permission data
  const { user, canWrite, isAuthenticated, token } = useAuth();
  
  // Add connectivity test on component mount
  React.useEffect(() => {
    const testConnectivity = async () => {
      try {
        console.log('🔍 Testing API connectivity...');
        const response = await fetch(`${API_BASE_URL}/tool/health/`);
        console.log(`✅ API Health Check: ${response.status}`);
      } catch (error) {
        console.error('❌ API Connectivity Test Failed:', error);
        console.error('🔧 Possible issues: Backend down, network problems, or CORS issues');
      }
    };
    
    testConnectivity();
  }, []);
  const { loadActiveData } = useToolData(); // ✅ ADDED: Access to tool data context
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [detectedFileType, setDetectedFileType] = useState<string | null>(null);
  const [manualFileType, setManualFileType] = useState<string>('');
  const [showManualSelection, setShowManualSelection] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [canSelectCompany, setCanSelectCompany] = useState(false);
  const { toast } = useToast();

  // ✅ ENHANCED: More comprehensive permission checking
  const hasUploadPermission = isAuthenticated && canWrite() && !!token;

  // Load available companies for admin users
  const loadCompanies = useCallback(async () => {
    if (!showCompanySelection || !hasUploadPermission) return;
    
    setLoadingCompanies(true);
    try {
      const response = await makeAuthenticatedAPICall('/tool/admin/company-upload/');
      
      if (response.success) {
        setCompanies(response.companies || []);
        setCanSelectCompany(response.can_select_company || false);
        
        // Auto-select user's company if they can't select others
        if (!response.can_select_company) {
          const userCompany = response.user_company || user?.company_name;
          if (userCompany) {
            setSelectedCompany(userCompany);
            console.log(`Auto-selected user company: ${userCompany}`);
          }
        }
      } else {
        console.warn('Failed to load companies:', response.message);
        // If API fails, still try to auto-select user's company
        if (user?.company_name) {
          setSelectedCompany(user.company_name);
          setCanSelectCompany(false);
          console.log(`Fallback to user company: ${user.company_name}`);
        }
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      // If API fails, still try to auto-select user's company
      if (user?.company_name) {
        setSelectedCompany(user.company_name);
        setCanSelectCompany(false);
        console.log(`Error fallback to user company: ${user.company_name}`);
      }
    } finally {
      setLoadingCompanies(false);
    }
  }, [showCompanySelection, hasUploadPermission, user?.company_name]);

  // Load companies when component mounts and company selection is enabled
  React.useEffect(() => {
    if (showCompanySelection) {
      loadCompanies();
    }
  }, [showCompanySelection]); // Removed loadCompanies dependency to avoid infinite loop

  // Auto-set company selection if user can't select others
  React.useEffect(() => {
    if (showCompanySelection && !canSelectCompany && user?.company_name && !selectedCompany) {
      setSelectedCompany(user.company_name);
    }
  }, [showCompanySelection, canSelectCompany, user?.company_name, selectedCompany]);


  const processFile = useCallback(async (file: File, forceFileType?: string) => {
    // ✅ CRITICAL: Double-check authentication before processing
    if (!hasUploadPermission) {
      toast({
        title: "Access Denied 🚫",
        description: "Admin privileges and valid authentication required to upload files.",
        variant: "destructive"
      });
      return;
    }

    // Check company selection if required (only when user can actually select)
    if (showCompanySelection && canSelectCompany && !selectedCompany) {
      toast({
        title: "Company Selection Required",
        description: "Please select a target company for the upload.",
        variant: "destructive"
      });
      return;
    }
    
    // For users who can't select company, use their own company automatically
    if (showCompanySelection && !canSelectCompany && !selectedCompany && user?.company_name) {
      setSelectedCompany(user.company_name);
    }

    // ✅ ADDITIONAL: Check if token exists
    const currentToken = localStorage.getItem('accessToken');
    if (!currentToken) {
      toast({
        title: "Authentication Error 🔐",
        description: "Please log in again to upload files.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadedFile(file);
    setDetectedFileType(null);

    try {
      console.log('🚀 Starting enhanced file processing...', {
        fileName: file.name,
        fileSize: file.size,
        toolType: forceFileType || 'auto-detect',
        userRole: user?.role,
        userCompany: user?.company_name,
        hasToken: !!currentToken
      });

      // ✅ IMPROVED: Better progress simulation with stages
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {  // Stop at 85% to show processing stage
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 8;  // Slower, more realistic progress
        });
      }, 300);

      let response: any;

      // Get selected company for upload
      const targetCompany = showCompanySelection ? selectedCompany : undefined;
      
      // ✅ FIXED: Use allowedTools to determine tool type when only one tool is allowed
      let toolType = forceFileType;
      if (!toolType && allowedTools && allowedTools.length === 1) {
        toolType = allowedTools[0];
        console.log(`🎯 Auto-detected tool type from allowedTools: ${toolType}`);
      }
      
      // ✅ IMPROVED: Add timeout and better error handling for large files
      const uploadTimeout = 5 * 60 * 1000; // 5 minutes timeout for large files
      let uploadPromise;
      
      if (toolType) {
        uploadPromise = uploadToolSpecificFile(file, toolType, targetCompany);
      } else {
        uploadPromise = uploadFile(file, targetCompany);
      }
      
      // Show processing stage at 85%
      setTimeout(() => {
        setUploadProgress(92); // Show we're processing
      }, 500);
      
      // Race between upload and timeout
      response = await Promise.race([
        uploadPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout - please try again or contact support')), uploadTimeout)
        )
      ]);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response && (response.success !== false)) {
        // ✅ FIXED: Better file type detection from response
        const fileType = toolType || 
                         forceFileType || 
                         response.data?.tool_type || 
                         response.tool_type || 
                         response.fileType || 
                         'unknown';
        
        setDetectedFileType(fileType);

        // ✅ ENHANCED: Show database persistence status
        if (response.data && response.data.upload_id) {
          toast({
            title: "File uploaded and saved! 💾",
            description: `${fileType.toUpperCase()} data from ${file.name} saved to database and activated for your team.`,
          });
        } else {
          toast({
            title: "File processed! 📊",
            description: `${fileType.toUpperCase()} data loaded from ${file.name}`,
          });
        }

        // ✅ FIXED: Reload active data instead of calling debug endpoint
        try {
          console.log('🔄 Reloading active data to sync with backend...');
          await loadActiveData();
          console.log('✅ Active data reloaded successfully');
          
          // Show additional success message after data sync (only once per session)
          setTimeout(() => {
            const uploadSyncToastShown = sessionStorage.getItem('uploadSyncToastShown');
            if (!uploadSyncToastShown) {
              toast({
                title: "Data synchronized! 🔄",
                description: "Your team can now access this data in real-time.",
              });
              sessionStorage.setItem('uploadSyncToastShown', 'true');
            }
          }, 1500);
        } catch (syncError) {
          console.warn('⚠️ Could not reload active data:', syncError);
          // Don't fail the upload for sync issues
        }
        
        // ✅ FIXED: Extract processed data correctly
        const processedData = response.data?.processed_data || response.data || response;
        onDataProcessed(processedData, fileType, file.name);
        setShowManualSelection(false);
      } else {
        throw new Error(response?.error || response?.message || 'Failed to process file');
      }
    } catch (error) {
      console.error('💥 Upload error:', error);
      
      let errorMessage = 'Failed to process file';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // ✅ ENHANCED: Better error handling for different scenarios
        if (errorMessage.includes('401') || errorMessage.includes('Authentication')) {
          errorMessage = 'Authentication failed. Please log in again and try uploading.';
          // Clear potentially invalid auth data
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        } else if (errorMessage.includes('403')) {
          errorMessage = 'Permission denied. Admin access required for file uploads.';
        } else if (errorMessage.includes('413')) {
          errorMessage = 'File too large. Please choose a smaller file.';
        } else if (errorMessage.includes('415')) {
          errorMessage = 'Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV file.';
        }
      }
      
      setUploadError(errorMessage);
      
      // If auto-detection failed, show manual selection
      if (errorMessage.includes('unknown') || errorMessage.includes('detect')) {
        setShowManualSelection(true);
      }
      
      toast({
        title: "Upload failed ❌",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [onDataProcessed, toast, allowedTools, hasUploadPermission, user?.role, user?.company_name, loadActiveData]);

  const handleManualUpload = useCallback(() => {
    if (!hasUploadPermission) {
      toast({
        title: "Access Denied 🚫",
        description: "Admin privileges required to upload files.",
        variant: "destructive"
      });
      return;
    }

    if (!manualFileType || !uploadedFile) {
      toast({
        title: "Please select a tool type ⚠️",
        description: "Choose the correct tool type for your file",
        variant: "destructive"
      });
      return;
    }

    processFile(uploadedFile, manualFileType);
  }, [manualFileType, uploadedFile, processFile, toast, hasUploadPermission]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!hasUploadPermission) {
      toast({
        title: "Access Denied 🚫",
        description: "Admin privileges required to upload files.",
        variant: "destructive"
      });
      return;
    }

    if (acceptedFiles.length > 0) {
      setShowManualSelection(false);
      setManualFileType('');
      processFile(acceptedFiles[0]);
    }
  }, [processFile, hasUploadPermission, toast]);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setUploadError(null);
    setDetectedFileType(null);
    setUploadProgress(0);
    setShowManualSelection(false);
    setManualFileType('');
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
    maxSize: maxFileSize,
    disabled: uploading || !hasUploadPermission
  });

  // ✅ Show auth status for debugging
  console.log('🔍 FileUpload Auth Status:', {
    isAuthenticated,
    hasToken: !!token,
    canWrite: canWrite(),
    userRole: user?.role,
    hasUploadPermission
  });

  // ✅ Render access denied message for non-admin users
  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground leading-tight flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload
          </h3>
          <p className="text-sm text-muted-foreground">
            Authentication required to upload files
          </p>
        </div>

        <div className="relative overflow-hidden backdrop-blur-xl bg-red-50/30 dark:bg-red-950/20 border border-red-200/40 dark:border-red-800/40 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
          
          <div className="relative p-6 text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Please Log In
            </h4>
            
            <p className="text-sm text-muted-foreground mb-4">
              You must be logged in with admin privileges to upload files.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasUploadPermission) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground leading-tight flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Upload
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload security data files with automatic tool detection
          </p>
        </div>

        <div className="relative overflow-hidden backdrop-blur-xl bg-amber-50/30 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/40 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
          
          <div className="relative p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Shield className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                <Lock className="h-5 w-5 text-amber-700 dark:text-amber-300 absolute -top-1 -right-1 bg-background rounded-full p-0.5" />
              </div>
            </div>
            
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Admin Access Required
            </h4>
            
            <p className="text-sm text-muted-foreground mb-4">
              File upload functionality requires administrator privileges. 
              Your current role ({user?.role || 'unknown'}) does not have permission to upload files.
            </p>

            {user?.role === 'general' && (
              <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/40 dark:border-blue-800/40 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <Info className="h-3 w-3 inline mr-1" />
                  Contact your administrator to request elevated permissions if you need to upload files.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ✅ Render full upload interface for admin users
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground leading-tight flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Enhanced File Upload
          <Badge variant="secondary" className="text-xs bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
            {user?.role === 'super_admin' ? '👑 Super Admin' : '👨‍💼 Admin'} Access
          </Badge>
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload security data files with automatic tool detection
        </p>
      </div>

      {/* Supported Tools Info */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/40 rounded-xl shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
        
        <div className="relative p-4">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Supports: </span>
              <span className="font-semibold text-foreground">
                {allowedTools.map(tool => tool.toUpperCase()).join(', ')}
              </span>
              <span className="text-muted-foreground"> file formats. Auto-detection available with manual override option.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Company Selection for Admins */}
      {showCompanySelection && hasUploadPermission && (
        <div className="relative overflow-hidden backdrop-blur-xl bg-background/40 dark:bg-background/30 border border-border/40 dark:border-border/30 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
          
          <div className="relative p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Target Company</label>
              {loadingCompanies && <RefreshCw className="h-3 w-3 animate-spin" />}
            </div>
            
            {canSelectCompany ? (
              <Select value={selectedCompany} onValueChange={setSelectedCompany} disabled={loadingCompanies}>
                <SelectTrigger className="bg-background/60 border-border/40 text-foreground backdrop-blur-sm">
                  <SelectValue placeholder="Select company to upload data for..." />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/40">
                  {companies.map(company => (
                    <SelectItem 
                      key={company} 
                      value={company}
                      className="text-popover-foreground hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3" />
                        {company}
                        {company === user?.company_name && (
                          <Badge variant="outline" className="text-xs">Your Company</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user?.company_name}</span>
                  <Badge variant="outline" className="text-xs">Your Company</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  You can only upload data for your own company
                </p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              Data will be available to all users from the selected company
            </p>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-background/40 dark:bg-background/30 border-2 border-dashed border-border/40 dark:border-border/30 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 transition-all duration-200 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:bg-background/50 dark:hover:bg-background/40">
        <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
        
        <div
          {...getRootProps()}
          className={`
            relative p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : ''}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
            rounded-xl
          `}
        >
          <input {...getInputProps()} />
          
          {uploadedFile ? (
            <div className="space-y-3">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600 dark:text-green-400" />
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm font-semibold text-foreground">{uploadedFile.name}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  disabled={uploading}
                  className="text-muted-foreground hover:text-foreground hover:bg-primary/5 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(uploadedFile.size)}
              </p>
              <div className="flex justify-center gap-2">
                <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground bg-background/40 backdrop-blur-sm">
                  {uploadedFile.type || 'Excel File'}
                </Badge>
                {detectedFileType && (
                  <Badge variant="secondary" className="text-xs bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                    {detectedFileType.toUpperCase()} Detected
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <>
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-sm font-medium text-primary">Drop the file here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    Drag & drop an Excel file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports .xlsx, .xls files up to {formatFileSize(maxFileSize)}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Manual Tool Type Selection */}
      {showManualSelection && uploadedFile && (
        <div className="relative overflow-hidden backdrop-blur-xl bg-background/40 dark:bg-background/30 border border-border/40 dark:border-border/30 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
          
          <div className="relative p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Manual Tool Type Selection</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Auto-detection failed. Please select the correct tool type for your file:
            </p>
            <div className="flex gap-2">
              <Select value={manualFileType} onValueChange={setManualFileType}>
                <SelectTrigger className="flex-1 bg-background/60 border-border/40 text-foreground backdrop-blur-sm">
                  <SelectValue placeholder="Select tool type..." />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/40">
                  {allowedTools.map(tool => (
                    <SelectItem 
                      key={tool} 
                      value={tool}
                      className="text-popover-foreground hover:bg-accent/50"
                    >
                      {tool.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleManualUpload}
                disabled={!manualFileType || uploading}
                className="bg-primary/80 hover:bg-primary/90 text-primary-foreground backdrop-blur-sm shadow-lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Process File
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="relative overflow-hidden backdrop-blur-xl bg-background/40 dark:bg-background/30 border border-border/40 dark:border-border/30 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
          
          <div className="relative p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">Processing file...</span>
              <span className="text-foreground font-semibold">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="bg-secondary/50 backdrop-blur-sm" />
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadError && !showManualSelection && (
        <div className="relative overflow-hidden backdrop-blur-xl bg-red-50/30 dark:bg-red-950/20 border border-red-200/40 dark:border-red-800/40 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
          
          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-300">
                {uploadError}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Processing Instructions */}
      <div className="relative overflow-hidden backdrop-blur-xl bg-background/40 dark:bg-background/30 border border-border/40 dark:border-border/30 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
        
        <div className="relative p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground text-sm">File Requirements:</p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
            <li><span className="font-medium text-foreground">GSuite:</span> Should contain sheets like "mail scanned", "phishing data", "whitelist"</li>
            <li><span className="font-medium text-foreground">MDM:</span> Should contain sheets like "users", "devices", "wipe outs", "compliance"</li>
            <li><span className="font-medium text-foreground">SIEM:</span> Should contain sheets like "events", "logs", "alerts", or quarterly data</li>
            <li><span className="font-medium text-foreground">EDR:</span> Should contain sheets like "endpoints", "threats", "malware"</li>
            <li><span className="font-medium text-foreground">Meraki:</span> Should contain sheets like "network", "access points", "traffic"</li>
            <li><span className="font-medium text-foreground">SonicWall:</span> Should contain sheets like "firewall", "logs", "intrusion"</li>
          </ul>
          <p className="mt-2 text-muted-foreground/80 text-xs">
            <span className="font-medium text-foreground">Note:</span> If auto-detection fails, you can manually select the correct tool type.
          </p>
        </div>
      </div>
    </div>
  );
};