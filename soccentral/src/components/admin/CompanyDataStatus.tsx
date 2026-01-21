// soccentral/src/components/admin/CompanyDataStatus.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Database, 
  Users, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CompanyDataInfo {
  company_name: string;
  active_tools: string[];
  total_datasets: number;
  last_updated: string;
  user_count?: number;
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
    'Authorization': `Bearer ${token}`
  };
  
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

export const CompanyDataStatus: React.FC = () => {
  const { user, canWrite } = useAuth();
  const { toast } = useToast();
  
  const [companyData, setCompanyData] = useState<CompanyDataInfo | null>(null);
  const [currentCompany, setCurrentCompany] = useState<string>('SOC Central');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<string[]>(['SOC Central']);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);

  const hasAdminAccess = canWrite() && (user?.role === 'admin' || user?.role === 'super_admin');

  const loadCompanyDataStatus = async (company?: string) => {
    if (!hasAdminAccess) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userCompany = (user as any)?.company_name || (user as any)?.company || 'SOC Central';
      const requested = (company || currentCompany || userCompany || 'SOC Central').trim();
      const canSpecifyCompany = (user?.role === 'super_admin') || (user?.role === 'admin' && requested === userCompany);

      const endpoint = canSpecifyCompany ? `/tool/active-data/?company=${encodeURIComponent(requested)}` : `/tool/active-data/`;

      let activeDataResponse: any;
      try {
        activeDataResponse = await makeAuthenticatedAPICall(endpoint);
      } catch (e: any) {
        if (typeof e?.message === 'string' && e.message.toLowerCase().includes('not authorized')) {
          activeDataResponse = await makeAuthenticatedAPICall('/tool/active-data/');
        } else {
          throw e;
        }
      }

      if (activeDataResponse.success) {
        const activeTools = Object.keys(activeDataResponse.data || {});
        
        setCompanyData({
          company_name: activeDataResponse.company_name || requested,
          active_tools: activeTools,
          total_datasets: activeTools.length,
          last_updated: new Date().toISOString(),
          user_count: 0
        });
        setCurrentCompany(activeDataResponse.company_name || requested);
      } else {
        throw new Error(activeDataResponse.message || 'Failed to load company data status');
      }
    } catch (error) {
      console.error('Error loading company data status:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const defaultCompany = (user as any)?.company_name || 'SOC Central';
    loadCompanyDataStatus(defaultCompany);
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);
        if (user?.role === 'super_admin') {
          const resp = await makeAuthenticatedAPICall('/tool/admin/company-upload/');
          if (resp?.success) {
            const apiCompanies: string[] = resp.companies || [];
            const unique = Array.from(new Set([defaultCompany, ...apiCompanies]));
            setCompanies(unique);
          }
        } else {
          setCompanies([defaultCompany]);
        }
      } catch (e) {
        setCompanies([defaultCompany]);
      } finally {
        setLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, [hasAdminAccess]);

  const handleRefresh = () => {
    loadCompanyDataStatus(currentCompany);
    toast({
      title: "Refreshing Data Status",
      description: "Loading latest company data information...",
    });
  };

  const getToolIcon = (tool: string) => {
    const icons: Record<string, string> = {
      'gsuite': '📧',
      'mdm': '📱',
      'siem': '🛡️',
      'edr': '🔍',
      'meraki': '🌐',
      'sonicwall': '🔥'
    };
    return icons[tool] || '📊';
  };

  const getToolLabel = (tool: string) => {
    const labels: Record<string, string> = {
      'gsuite': 'G Suite',
      'mdm': 'MDM',
      'siem': 'SIEM',
      'edr': 'EDR',
      'meraki': 'Meraki',
      'sonicwall': 'SonicWall'
    };
    return labels[tool] || tool.toUpperCase();
  };

  if (!hasAdminAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Data Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Admin privileges required to view company data status.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Data Status
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={currentCompany}
              onValueChange={(val) => {
                setCurrentCompany(val);
                loadCompanyDataStatus(val);
              }}
              disabled={loadingCompanies}
            >
              <SelectTrigger className="h-8 w-56">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
              variant="outline"
              title="Refresh current company status"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Active data overview. Default: SOC Central. Use the button to view it anytime, or switch via Company Upload dropdown.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : companyData ? (
          <>
            {/* Company Info */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">{companyData.company_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {companyData.total_datasets} active dataset{companyData.total_datasets !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>

            {/* Active Tools */}
            {companyData.active_tools.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Active Data Sources
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {companyData.active_tools.map(tool => (
                    <div key={tool} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <span className="text-lg">{getToolIcon(tool)}</span>
                      <div>
                        <p className="text-sm font-medium">{getToolLabel(tool)}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  No active data sources found for {companyData.company_name}. 
                  Upload data files to get started.
                </AlertDescription>
              </Alert>
            )}

            {/* Info */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>How it works:</strong> Users from {companyData.company_name} can view and analyze 
                the active data sources shown above. Admins can upload new data or activate different datasets 
                using the Company Upload tab.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No company data information available.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};