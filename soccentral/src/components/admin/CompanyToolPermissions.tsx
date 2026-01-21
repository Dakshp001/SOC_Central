// frontend/src/components/admin/CompanyToolPermissions.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Shield,
  Settings2,
  Eye,
  Upload,
  Download,
  BarChart3,
  Database,
  Smartphone,
  Server,
  Network,
  Save,
  AlertCircle
} from "lucide-react";

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
  created_at: string;
  updated_at: string;
}

interface CompanyToolPermissionsProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
}

export const CompanyToolPermissions: React.FC<CompanyToolPermissionsProps> = ({
  companyId,
  companyName,
  onClose
}) => {
  const { token, user: currentUser } = useAuth();
  const [permissions, setPermissions] = useState<ToolPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch tool permissions
  const fetchPermissions = async () => {
    console.log('🔍 Fetching tool permissions...', {
      companyId,
      companyName,
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : 'null',
      user: currentUser?.email
    });

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/companies/${companyId}/tools/`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setPermissions(data.tool_permissions || []);
      } else {
        throw new Error(data.message || 'Failed to fetch tool permissions');
      }
    } catch (error) {
      console.error('Error fetching tool permissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tool permissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update tool permission
  const updatePermission = async (toolType: string, updates: Partial<ToolPermission>) => {
    console.log('🔄 Updating tool permission...', {
      companyId,
      toolType,
      updates,
      hasToken: !!token,
      user: currentUser?.email
    });

    setIsSaving(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/companies/${companyId}/tools/update/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool_type: toolType,
          permissions: updates
        })
      });

      const data = await response.json();
      if (data.success) {
        // Update local state
        setPermissions(prev =>
          prev.map(p =>
            p.tool_type === toolType
              ? { ...p, ...updates }
              : p
          )
        );
        toast({
          title: "Permission Updated",
          description: `${toolDisplayNames[toolType as keyof typeof toolDisplayNames]} permissions updated successfully`,
        });
      } else {
        throw new Error(data.message || 'Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Remove tool permission
  const removePermission = async (toolType: string) => {
    if (!confirm(`Remove ${toolDisplayNames[toolType as keyof typeof toolDisplayNames]} access for this company?`)) {
      return;
    }

    console.log('🗑️ Removing tool permission...', {
      companyId,
      toolType,
      hasToken: !!token,
      user: currentUser?.email
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/companies/${companyId}/tools/${toolType}/remove/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        setPermissions(prev => prev.filter(p => p.tool_type !== toolType));
        toast({
          title: "Tool Access Removed",
          description: data.message,
        });
      } else {
        throw new Error(data.message || 'Failed to remove permission');
      }
    } catch (error) {
      console.error('Error removing permission:', error);
      toast({
        title: "Error",
        description: "Failed to remove tool access",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [companyId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tool Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Manage tool access and permissions for {companyName}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {permissions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tool Permissions</h3>
            <p className="text-muted-foreground">
              This company doesn't have access to any tools yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {permissions.map((permission) => {
            const IconComponent = toolIcons[permission.tool_type as keyof typeof toolIcons];

            return (
              <Card key={permission.tool_type}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-5 w-5" />
                      {permission.tool_type_display}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={permission.is_enabled ? "default" : "secondary"}>
                        {permission.is_enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removePermission(permission.tool_type)}
                        disabled={isSaving}
                      >
                        Remove Access
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Permissions */}
                  <div>
                    <h4 className="font-medium mb-4">Basic Permissions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { key: 'can_view', label: 'View', icon: Eye },
                        { key: 'can_upload', label: 'Upload', icon: Upload },
                        { key: 'can_analyze', label: 'Analyze', icon: BarChart3 },
                        { key: 'can_export', label: 'Export', icon: Download },
                        { key: 'can_manage', label: 'Manage', icon: Settings2 }
                      ].map(({ key, label, icon: Icon }) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Switch
                            checked={permission[key as keyof ToolPermission] as boolean}
                            onCheckedChange={(checked) =>
                              updatePermission(permission.tool_type, { [key]: checked })
                            }
                            disabled={isSaving}
                          />
                          <div className="flex items-center gap-1">
                            <Icon className="h-4 w-4" />
                            <Label className="text-sm">{label}</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Data Limits */}
                  <div>
                    <h4 className="font-medium mb-4">Data Limits & Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`retention-${permission.tool_type}`}>
                          Data Retention (days)
                        </Label>
                        <Input
                          id={`retention-${permission.tool_type}`}
                          type="number"
                          value={permission.data_retention_days}
                          onChange={(e) =>
                            updatePermission(permission.tool_type, {
                              data_retention_days: parseInt(e.target.value) || 0
                            })
                          }
                          disabled={isSaving}
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          0 = unlimited retention
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`upload-size-${permission.tool_type}`}>
                          Max Upload Size (MB)
                        </Label>
                        <Input
                          id={`upload-size-${permission.tool_type}`}
                          type="number"
                          value={permission.max_upload_size_mb}
                          onChange={(e) =>
                            updatePermission(permission.tool_type, {
                              max_upload_size_mb: parseInt(e.target.value) || 0
                            })
                          }
                          disabled={isSaving}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`records-${permission.tool_type}`}>
                          Max Records Per Upload
                        </Label>
                        <Input
                          id={`records-${permission.tool_type}`}
                          type="number"
                          value={permission.max_records_per_upload}
                          onChange={(e) =>
                            updatePermission(permission.tool_type, {
                              max_records_per_upload: parseInt(e.target.value) || 0
                            })
                          }
                          disabled={isSaving}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(permission.updated_at).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};