// frontend/src/components/admin/CompanyManagement.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { CompanyToolPermissions } from "./CompanyToolPermissions";
import {
  Building2,
  Plus,
  Users,
  Shield,
  Settings2,
  Trash2,
  Eye,
  Upload,
  Download,
  BarChart3,
  Database,
  Smartphone,
  Server,
  Network,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

interface Company {
  id: string;
  name: string;
  display_name: string;
  description: string;
  email_domain: string;
  primary_contact_email: string;
  phone_number: string;
  address: string;
  enabled_tools: string[];
  enabled_tools_display: string[];
  is_active: boolean;
  user_count: number;
  admin_count: number;
  master_admin_count: number;
  max_users: number;
  remaining_user_slots?: number;
  created_at: string;
  updated_at: string;
}

interface ToolPermission {
  id: number;
  tool_type: string;
  tool_type_display: string;
  is_enabled: boolean;
  can_view: boolean;
  can_upload: boolean;
  can_analyze: boolean;
  can_export: boolean;
  can_manage: boolean;
  data_retention_days: number;
  max_upload_size_mb: number;
  max_records_per_upload: number;
}

interface CreateCompanyForm {
  name: string;
  display_name: string;
  description: string;
  email_domain: string;
  primary_contact_email: string;
  phone_number: string;
  address: string;
  max_users: number;
  enabled_tools: string[];
  tools_config: Array<{
    tool_type: string;
    is_enabled: boolean;
    can_view: boolean;
    can_upload: boolean;
    can_analyze: boolean;
    can_export: boolean;
    can_manage: boolean;
    data_retention_days: number;
    max_upload_size_mb: number;
    max_records_per_upload: number;
  }>;
}

const AVAILABLE_TOOLS = [
  { value: 'gsuite', label: 'G Suite' },
  { value: 'mdm', label: 'MDM' },
  { value: 'siem', label: 'SIEM' },
  { value: 'edr', label: 'EDR' },
  { value: 'meraki', label: 'Meraki' },
  { value: 'sonicwall', label: 'SonicWall' }
];

// Company Tool Management View Component
interface CompanyToolManagementViewProps {
  company: Company;
  availableTools: Array<{value: string, label: string}>;
  onUpdateTools: (companyId: string, tools: string[]) => Promise<boolean>;
  onClose: () => void;
  isUpdating: boolean;
  toast: any;
}

const CompanyToolManagementView: React.FC<CompanyToolManagementViewProps> = ({
  company,
  availableTools,
  onUpdateTools,
  onClose,
  isUpdating,
  toast
}) => {
  const [selectedTools, setSelectedTools] = useState<string[]>(company.enabled_tools || []);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if there are changes
  useEffect(() => {
    const originalTools = [...(company.enabled_tools || [])];
    const currentTools = [...selectedTools];
    originalTools.sort();
    currentTools.sort();
    setHasChanges(JSON.stringify(originalTools) !== JSON.stringify(currentTools));
  }, [selectedTools, company.enabled_tools]);

  const handleToolToggle = (toolValue: string) => {
    setSelectedTools(prev => {
      if (prev.includes(toolValue)) {
        return prev.filter(t => t !== toolValue);
      } else {
        return [...prev, toolValue];
      }
    });
  };

  const handleSaveChanges = async () => {
    const success = await onUpdateTools(company.id, selectedTools);
    if (success) {
      onClose();
    }
  };

  const handleResetChanges = () => {
    setSelectedTools(company.enabled_tools || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Manage Tools Access
          </h2>
          <p className="text-muted-foreground">
            Configure tool access for {company.display_name}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {company.display_name}
            <Badge variant={company.is_active ? "default" : "secondary"}>
              {company.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select which tools this company should have access to. Users in this company will inherit these permissions.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tool Selection Grid */}
          <div>
            <h4 className="font-medium mb-4">Available Tools</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTools.map((tool) => {
                const IconComponent = toolIcons[tool.value as keyof typeof toolIcons];
                const isSelected = selectedTools.includes(tool.value);
                const wasOriginallyEnabled = company.enabled_tools?.includes(tool.value);

                return (
                  <div
                    key={tool.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleToolToggle(tool.value)}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleToolToggle(tool.value)}
                      />
                      <IconComponent className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="font-medium">{tool.label}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          {isSelected ? 'Enabled' : 'Disabled'}
                          {wasOriginallyEnabled && !isSelected && (
                            <Badge variant="destructive" className="text-xs">
                              Will be removed
                            </Badge>
                          )}
                          {!wasOriginallyEnabled && isSelected && (
                            <Badge variant="default" className="text-xs">
                              Will be added
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">Currently Enabled:</span>
                <div className="text-muted-foreground">
                  {company.enabled_tools?.length || 0} tools
                </div>
              </div>
              <div>
                <span className="font-medium">Will Be Enabled:</span>
                <div className="text-muted-foreground">
                  {selectedTools.length} tools
                </div>
              </div>
              <div>
                <span className="font-medium">Affected Users:</span>
                <div className="text-muted-foreground">
                  {company.user_count} users will inherit these changes
                </div>
              </div>
            </div>
            {hasChanges && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  💡 <strong>Note:</strong> Changes will affect all users in this company immediately after saving.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t">
            <Button
              onClick={handleSaveChanges}
              disabled={!hasChanges || isUpdating}
              className="flex-1 max-w-xs"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>

            {hasChanges && (
              <Button
                variant="outline"
                onClick={handleResetChanges}
                disabled={isUpdating}
              >
                Reset
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const CompanyManagement: React.FC = () => {
  const { user: currentUser, token } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [showToolManagement, setShowToolManagement] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableTools, setAvailableTools] = useState<Array<{value: string, label: string}>>([]);
  const [isUpdatingTools, setIsUpdatingTools] = useState(false);
  const [isDeletingCompany, setIsDeletingCompany] = useState<string | null>(null);
  const [editUsersCompany, setEditUsersCompany] = useState<Company | null>(null);
  const [editUsersValue, setEditUsersValue] = useState<number>(0);
  const [isSavingUsers, setIsSavingUsers] = useState(false);

  // Create company form state
  const [createForm, setCreateForm] = useState<CreateCompanyForm>({
    name: '',
    display_name: '',
    description: '',
    email_domain: '',
    primary_contact_email: '',
    phone_number: '',
    address: '',
    max_users: 10,
    enabled_tools: [],
    tools_config: []
  });

  // Check if user is super admin
  const isSuperAdmin = currentUser?.role === "super_admin";

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    if (!isSuperAdmin) return;

    console.log('🔍 Fetching companies...', {
      isSuperAdmin,
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : 'null',
      user: currentUser?.email
    });

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/companies/`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCompanies(data.companies || []);
      } else {
        throw new Error(data.message || `HTTP ${response.status}: Failed to fetch companies`);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, token, currentUser?.email]);

  // Create company
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Creating company...', {
      companyName: createForm.name,
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : 'null',
      user: currentUser?.email,
      enabledTools: createForm.enabled_tools
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/companies/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast({
          title: "Company Created Successfully!",
          description: `${data.company.display_name} has been created with selected tool permissions.`,
        });
        setShowCreateForm(false);
        setCreateForm({
          name: '',
          display_name: '',
          description: '',
          email_domain: '',
          primary_contact_email: '',
          phone_number: '',
          address: '',
          max_users: 10,
          enabled_tools: [],
          tools_config: []
        });
        fetchCompanies();
      } else {
        throw new Error(data.message || `HTTP ${response.status}: Failed to create company`);
      }
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    }
  };

  // Toggle company status
  const toggleCompanyStatus = async (companyId: string) => {
    console.log('🔄 Toggling company status...', {
      companyId,
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : 'null',
      user: currentUser?.email
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/companies/${companyId}/toggle-status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast({
          title: "Status Updated",
          description: data.message,
        });
        fetchCompanies();
      } else {
        throw new Error(data.message || `HTTP ${response.status}: Failed to update status`);
      }
    } catch (error) {
      console.error('Error toggling company status:', error);
      toast({
        title: "Error",
        description: "Failed to update company status",
        variant: "destructive",
      });
    }
  };

  // Handle tool selection
  const handleToolToggle = (toolType: string, checked: boolean) => {
    try {
      setCreateForm(prev => {
        const newEnabledTools = checked
          ? [...prev.enabled_tools.filter(t => t !== toolType), toolType] // Avoid duplicates
          : prev.enabled_tools.filter(t => t !== toolType);

        const newToolsConfig = checked
          ? [...prev.tools_config.filter(config => config.tool_type !== toolType), {
              tool_type: toolType,
              is_enabled: true,
              can_view: true,
              can_upload: true,
              can_analyze: true,
              can_export: true,
              can_manage: false,
              data_retention_days: 365,
              max_upload_size_mb: 100,
              max_records_per_upload: 100000
            }]
          : prev.tools_config.filter(config => config.tool_type !== toolType);

        return {
          ...prev,
          enabled_tools: newEnabledTools,
          tools_config: newToolsConfig
        };
      });
    } catch (error) {
      console.error('Error toggling tool:', error);
      toast({
        title: "Error",
        description: "Failed to update tool selection",
        variant: "destructive",
      });
    }
  };

  // Load companies and available tools on mount
  useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
      fetchAvailableTools();
    }
  }, [fetchCompanies, isSuperAdmin]);

  // Fetch available tools
  const fetchAvailableTools = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/tools/available/`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAvailableTools(data.tools || []);
      }
    } catch (error) {
      console.error('Error fetching available tools:', error);
    }
  };

  // Update company tools (bulk) via company update endpoint
  const updateCompanyTools = async (companyId: string, newEnabledTools: string[]) => {
    setIsUpdatingTools(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(`${API_BASE_URL}/auth/companies/${companyId}/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled_tools: newEnabledTools
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast({
          title: "Tools Updated Successfully",
          description: `Company tool access has been updated. ${newEnabledTools.length} tools enabled.`,
        });
        fetchCompanies(); // Refresh companies list
        return true;
      } else {
        throw new Error(data.message || 'Failed to update tools');
      }
    } catch (error) {
      console.error('Error updating company tools:', error);
      toast({
        title: "Error",
        description: "Failed to update company tools",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdatingTools(false);
    }
  };

  // Update company users
  const handleSaveUsers = async () => {
    if (!editUsersCompany) return;
    setIsSavingUsers(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const response = await fetch(`${API_BASE_URL}/auth/companies/${editUsersCompany.id}/update/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ max_users: editUsersValue })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast({ title: "User Limit Updated", description: `Max users is now ${editUsersValue}` });
        setEditUsersCompany(null);
        fetchCompanies();
      } else {
        throw new Error(data.message || 'Failed to update user limit');
      }
    } catch (error) {
      toast({ title: "Error", description: 'Failed to update user limit', variant: 'destructive' });
    } finally {
      setIsSavingUsers(false);
    }
  };

  // Delete company
  const deleteCompany = async (companyId: string, companyName: string) => {
    const confirmMessage = `Are you sure you want to permanently delete "${companyName}"?\n\nThis action cannot be undone and will:\n- Remove the company from the system\n- Affect all users assigned to this company\n- Delete all associated tool permissions\n\nType "DELETE" to confirm:`;

    const userInput = prompt(confirmMessage);

    if (userInput !== 'DELETE') {
      if (userInput !== null) {
        toast({
          title: "Deletion Cancelled",
          description: "Company deletion was cancelled. You must type 'DELETE' to confirm.",
          variant: "destructive",
        });
      }
      return;
    }

    setIsDeletingCompany(companyId);
    try {
      console.log('🗑️ Deleting company...', {
        companyId,
        companyName,
        hasToken: !!token,
        user: currentUser?.email
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/companies/${companyId}/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast({
          title: "Company Deleted Successfully",
          description: data.message,
        });
        fetchCompanies(); // Refresh companies list
      } else {
        throw new Error(data.message || `HTTP ${response.status}: Failed to delete company`);
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete company",
        variant: "destructive",
      });
    } finally {
      setIsDeletingCompany(null);
    }
  };

  // Filter companies
  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email_domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Permission check
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Alert className="max-w-md">
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            Super Admin privileges required to access company management.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create New Company</h2>
            <p className="text-muted-foreground">
              Add a new company and configure their tool permissions
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            Cancel
          </Button>
        </div>

        <form onSubmit={handleCreateCompany} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={createForm.display_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Company display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_domain">Email Domain</Label>
                  <Input
                    id="email_domain"
                    value={createForm.email_domain}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email_domain: e.target.value }))}
                    placeholder="example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primary_contact_email">Primary Contact Email</Label>
                  <Input
                    id="primary_contact_email"
                    type="email"
                    value={createForm.primary_contact_email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, primary_contact_email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={createForm.phone_number}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+1-555-0123"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_users">Maximum Users *</Label>
                  <Input
                    id="max_users"
                    type="number"
                    min="1"
                    max="10000"
                    value={createForm.max_users}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, max_users: parseInt(e.target.value) || 10 }))}
                    placeholder="10"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of users allowed for this company (1-10,000)
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Company description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={createForm.address}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Company address"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Tool Permissions
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Select which tools this company should have access to
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_TOOLS.map((tool) => {
                  const IconComponent = toolIcons[tool.value as keyof typeof toolIcons];
                  const isSelected = createForm.enabled_tools.includes(tool.value);

                  return (
                    <div
                      key={tool.value}
                      className={`p-4 border rounded-lg transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToolToggle(tool.value, checked as boolean)}
                        />
                        <IconComponent className="h-5 w-5" />
                        <div className="cursor-pointer flex-1" onClick={() => handleToolToggle(tool.value, !isSelected)}>
                          <div className="font-medium">{tool.label}</div>
                          <div className="text-sm text-muted-foreground">
                            {isSelected ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={!createForm.name}>
              <Plus className="h-4 w-4 mr-2" />
              Create Company
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Show tool permissions view
  if (showPermissions) {
    const company = companies.find(c => c.id === showPermissions);
    if (company) {
      return (
        <CompanyToolPermissions
          companyId={company.id}
          companyName={company.display_name}
          onClose={() => setShowPermissions(null)}
        />
      );
    }
  }

  // Show tool management view
  if (showToolManagement) {
    const company = companies.find(c => c.id === showToolManagement);
    if (company) {
      return (
        <CompanyToolManagementView
          company={company}
          availableTools={availableTools}
          onUpdateTools={updateCompanyTools}
          onClose={() => setShowToolManagement(null)}
          isUpdating={isUpdatingTools}
          toast={toast}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Company Management</h2>
          <p className="text-muted-foreground">
            Manage companies and their tool permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Company
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Companies Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No companies match your search.' : 'No companies have been created yet.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Company
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{company.display_name}</h3>
                    <p className="text-sm text-muted-foreground">{company.name}</p>
                  </div>
                  <Badge variant={company.is_active ? "default" : "secondary"}>
                    {company.is_active ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    {company.user_count}/{company.max_users} users
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="xs" className="ml-2 px-2 py-0 h-6 text-xs"
                          onClick={() => { setEditUsersCompany(company); setEditUsersValue(company.max_users); }}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User Limit</DialogTitle>
                          <DialogDescription>
                            Set the maximum allowed users for <b>{company.display_name}</b>.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-3">
                          <Label htmlFor="max-users-input">Max Users</Label>
                          <Input id="max-users-input" type="number" min={1} max={10000} value={editUsersValue}
                            onChange={e => setEditUsersValue(Number(e.target.value) || 1)} />
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSaveUsers} disabled={isSavingUsers || !editUsersValue}>
                            {isSavingUsers ? 'Saving...' : 'Save'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{company.master_admin_count} master admin{company.master_admin_count !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{company.admin_count} admin{company.admin_count !== 1 ? 's' : ''}</span>
                  </div>
                  {company.remaining_user_slots !== undefined && (
                    <div className="flex items-center text-sm">
                      <Badge variant={company.remaining_user_slots > 0 ? "outline" : "destructive"} className="text-xs">
                        {company.remaining_user_slots} slots remaining
                      </Badge>
                    </div>
                  )}
                  {company.email_domain && (
                    <div className="flex items-center text-sm">
                      <Database className="h-4 w-4 mr-2 text-muted-foreground" />
                      {company.email_domain}
                    </div>
                  )}
                </div>

                {/* Enabled Tools */}
                <div className="mb-4 flex-1">
                  <p className="text-sm font-medium mb-2">Enabled Tools:</p>
                  <div className="flex flex-wrap gap-1">
                    {company.enabled_tools.map((tool) => {
                      const IconComponent = toolIcons[tool as keyof typeof toolIcons];
                      return (
                        <Badge key={tool} variant="outline" className="text-xs">
                          <IconComponent className="h-3 w-3 mr-1" />
                          {toolDisplayNames[tool as keyof typeof toolDisplayNames]}
                        </Badge>
                      );
                    })}
                    {company.enabled_tools.length === 0 && (
                      <span className="text-xs text-muted-foreground italic">No tools enabled</span>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Action Buttons - Better Layout */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCompany(company)}
                      className="flex-1 min-w-[100px]"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPermissions(company.id)}
                      className="flex-1 min-w-[120px]"
                    >
                      <Settings2 className="h-4 w-4 mr-1" />
                      Permissions
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowToolManagement(company.id)}
                      className="flex-1 min-w-[130px]"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Manage Tools
                    </Button>
                    <Button
                      size="sm"
                      variant={company.is_active ? "destructive" : "default"}
                      onClick={() => toggleCompanyStatus(company.id)}
                      className="flex-1 min-w-[100px]"
                    >
                      {company.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteCompany(company.id, company.display_name)}
                      disabled={isDeletingCompany === company.id}
                      className="flex-1"
                    >
                      {isDeletingCompany === company.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Company
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};