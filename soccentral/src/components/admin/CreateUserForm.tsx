// soccentral/src/components/admin/CreateUserForm.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  UserPlus,
  Mail,
  User,
  Building2,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  Database,
  Smartphone,
  Server,
  Network,
  Eye
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  display_name: string;
  enabled_tools: string[];
  enabled_tools_display: string[];
  is_active: boolean;
}

interface CreateUserFormData {
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  company_id?: string;
  role: 'general' | 'admin' | 'master_admin' | 'super_admin';
}

interface CreateUserFormProps {
  onUserCreated?: (user: any) => void;
  onCancel?: () => void;
  defaultCompany?: string;
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

export const CreateUserForm: React.FC<CreateUserFormProps> = ({
  onUserCreated,
  onCancel,
  defaultCompany
}) => {
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    first_name: '',
    last_name: '',
    company_name: defaultCompany || user?.company_name || '',
    company_id: '',
    role: 'general'
  });

  const [loading, setLoading] = useState(false);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [emailSent, setEmailSent] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const roleOptions = [
    { value: 'general', label: 'General User', icon: '👤', description: 'Standard user access' },
    { value: 'admin', label: 'Admin', icon: '👨‍💼', description: 'Company admin privileges' },
    { value: 'master_admin', label: 'Master Admin', icon: '⚡', description: 'Manage admins and company users' },
    { value: 'super_admin', label: 'Super Admin', icon: '👑', description: 'Full system access' }
  ];

  // Filter role options based on current user's role
  const availableRoles = roleOptions.filter(role => {
    if (user?.role === 'super_admin') {
      return true; // Super admin can create any role
    } else if (user?.role === 'master_admin') {
      return role.value !== 'super_admin' && role.value !== 'master_admin'; // Master admin can only create general and admin
    } else if (user?.role === 'admin') {
      return role.value === 'general'; // Admin can only create general users
    }
    return false; // General users cannot create accounts
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = ['Email is required'];
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = ['Please enter a valid email address'];
    }

    // Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = ['First name is required'];
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = ['Last name is required'];
    }

    // Company validation
    if (canSelectCompany) {
      if (!formData.company_id || !formData.company_name.trim()) {
        newErrors.company_name = ['Please select a company'];
      }
    } else {
      if (!formData.company_name.trim()) {
        newErrors.company_name = ['Company name is required'];
      }
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = ['Role is required'];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below and try again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await makeAuthenticatedAPICall('/auth/admin/create-user/', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        setEmailSent(true);
        
        toast({
          title: "✅ User Created Successfully!",
          description: `${formData.first_name} ${formData.last_name} has been created and will receive an activation email.`,
          duration: 5000,
        });

        // Show additional success information
        setTimeout(() => {
          toast({
            title: "📧 Activation Email Sent",
            description: `An email with password setup instructions has been sent to ${formData.email}.`,
            duration: 4000,
          });
        }, 1000);

        if (onUserCreated) {
          onUserCreated(response.user);
        }

        // Reset form
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          company_name: defaultCompany || user?.company_name || '',
          company_id: '',
          role: 'general'
        });
        setSelectedCompany(null);

      } else {
        throw new Error(response.message || 'Failed to create user');
      }

    } catch (error: any) {
      console.error('User creation error:', error);
      
      let errorTitle = 'User Creation Failed';
      let errorMessage = 'Failed to create user account';
      
      if (error.message) {
        if (error.message.includes('already exists')) {
          errorTitle = '👤 User Already Exists';
          errorMessage = 'A user with this email address already exists in the system.';
        } else if (error.message.includes('Invalid email')) {
          errorTitle = '📧 Invalid Email';
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Admin privileges')) {
          errorTitle = '🔒 Permission Denied';
          errorMessage = 'You do not have permission to create user accounts.';
        } else if (error.message.includes('company')) {
          errorTitle = '🏢 Company Restriction';
          errorMessage = 'You can only create users for your own company.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });

    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const canSelectCompany = user?.role === 'super_admin';

  // Tool icons mapping
  const toolIcons = {
    gsuite: Database,
    mdm: Smartphone,
    siem: Shield,
    edr: Server,
    meraki: Network,
    sonicwall: Shield
  };

  // Tool display names
  const toolDisplayNames = {
    gsuite: 'G Suite',
    mdm: 'MDM',
    siem: 'SIEM',
    edr: 'EDR',
    meraki: 'Meraki',
    sonicwall: 'SonicWall'
  };

  // Fetch companies when component mounts (for super admins)
  useEffect(() => {
    if (canSelectCompany) {
      fetchCompanies();
    }
  }, [canSelectCompany]);

  const fetchCompanies = async () => {
    if (!canSelectCompany) return;

    setCompaniesLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/companies/`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCompanies(data.companies || []);
        console.log('Fetched companies:', data.companies?.length || 0);
      } else {
        throw new Error(data.message || 'Failed to fetch companies');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies list",
        variant: "destructive",
      });
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Handle company selection
  const handleCompanyChange = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompany(company);
      setFormData(prev => ({
        ...prev,
        company_id: company.id,
        company_name: company.name
      }));

      // Clear company name errors
      if (errors.company_name) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.company_name;
          return newErrors;
        });
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <Card className="w-full">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <UserPlus className="h-6 w-6" />
                Create New User Account
                <Badge variant="secondary" className="text-sm">
                  {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'master_admin' ? 'Master Admin' : 'Admin'}
                </Badge>
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Create a new user account and send them activation instructions via email.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Email Field - Takes full width on smaller screens, 2 columns on large */}
                <div className="lg:col-span-2 space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="user@company.com"
                    disabled={loading}
                    className={`h-11 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email[0]}
                    </p>
                  )}
                </div>
                
                {/* Role Field - Takes 1 column */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    User Role *
                  </Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleInputChange('role', value)}
                    disabled={loading}
                  >
                    <SelectTrigger className={`h-11 ${errors.role ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Select user role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <span>{role.icon}</span>
                            <div>
                              <div className="font-medium">{role.label}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.role[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="John"
                    disabled={loading}
                    className={`h-11 ${errors.first_name ? 'border-red-500' : ''}`}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.first_name[0]}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Doe"
                    disabled={loading}
                    className={`h-11 ${errors.last_name ? 'border-red-500' : ''}`}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.last_name[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Company Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </h3>
              <div className="space-y-6">
                {/* Company Selection */}
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-sm font-medium">
                    Company *
                  </Label>
                  {canSelectCompany ? (
                    <div className="space-y-4">
                      <Select
                        value={formData.company_id}
                        onValueChange={handleCompanyChange}
                        disabled={loading || companiesLoading}
                      >
                        <SelectTrigger className={`h-11 ${errors.company_name ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder={companiesLoading ? "Loading companies..." : "Select a company..."} />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(company => (
                            <SelectItem key={company.id} value={company.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{company.display_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {company.enabled_tools.length} tools enabled • {company.is_active ? 'Active' : 'Inactive'}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Show selected company tools */}
                      {selectedCompany && (
                        <div className="p-4 bg-muted/50 rounded-lg border">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Available Tools for {selectedCompany.display_name}
                            </h4>
                            <Badge variant={selectedCompany.is_active ? "default" : "secondary"}>
                              {selectedCompany.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          {selectedCompany.enabled_tools.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedCompany.enabled_tools.map((tool) => {
                                const IconComponent = toolIcons[tool as keyof typeof toolIcons];
                                return (
                                  <Badge key={tool} variant="outline" className="flex items-center gap-1">
                                    <IconComponent className="h-3 w-3" />
                                    {toolDisplayNames[tool as keyof typeof toolDisplayNames]}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No tools enabled for this company
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mt-2">
                            💡 Users created in this company will have access to these tools
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-muted rounded-md h-11 flex items-center">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formData.company_name}</span>
                        <Badge variant="outline" className="text-xs">Your Company</Badge>
                      </div>
                    </div>
                  )}
                  {!canSelectCompany && (
                    <p className="text-xs text-muted-foreground">
                      You can only create users for your own company
                    </p>
                  )}
                  {errors.company_name && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.company_name[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Status Messages */}
            <div className="space-y-4">
              {/* Success Message */}
              {emailSent && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>User created successfully!</strong> An activation email has been sent with instructions to set up their password.
                  </AlertDescription>
                </Alert>
              )}

              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>How it works:</strong> The new user will receive an email with a secure link to set their password. 
                  The activation link will expire in 24 hours for security.
                </AlertDescription>
              </Alert>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="sm:flex-1 max-w-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create User & Send Email
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  size="lg"
                  className="max-w-xs"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};