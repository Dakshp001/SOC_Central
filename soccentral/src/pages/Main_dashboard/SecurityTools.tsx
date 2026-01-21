// Security Tools Component - Minimal Glass Morphism Design
// Save as: src/pages/Main_dashboard/SecurityTools.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Mail, 
  Smartphone, 
  Shield,
  Activity, 
  Wifi, 
  ShieldCheck,
  Upload,
  Globe,
  Network,
  ToggleLeft,
  ToggleRight,
  Filter
} from "lucide-react";
import { useToolData } from "@/contexts/ToolDataContext";
import { 
  GSuiteData, 
  MDMData, 
  SIEMData, 
  EDRData, 
  MerakiData, 
  SonicWallData, 
  EnhancedMerakiData,
  EnhancedGSuiteData,
  BaseGSuiteData,
  isEnhancedGSuiteData,
  isEnhancedMerakiData 
} from "@/lib/api";

interface SecurityTool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  status: 'active' | 'inactive';
  uploadSupported: boolean;
  kpis: Array<{
    label: string;
    value: string;
    severity?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  }>;
  isEnhanced?: boolean;
}

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// Helper function to get severity color for values
const getSeverityClass = (severity?: string) => {
  switch (severity) {
    case 'critical': return 'text-red-600 dark:text-red-400';
    case 'high': return 'text-orange-600 dark:text-orange-400';
    case 'medium': return 'text-yellow-600 dark:text-yellow-400';
    case 'low': return 'text-green-600 dark:text-green-400';
    case 'info': return 'text-blue-600 dark:text-blue-400';
    default: return 'text-foreground';
  }
};

export const SecurityTools: React.FC = () => {
  const navigate = useNavigate();
  const { toolData, loadCompanyData } = useToolData();
  const { user, token } = useAuth();
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [accessibleTools, setAccessibleTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolStatuses, setToolStatuses] = useState<Record<string, 'active' | 'inactive'>>({
    gsuite: 'active',
    mdm: 'active',
    siem: 'active',
    edr: 'active',
    meraki: 'active',
    sonicwall: 'active'
  });

  // Super Admin selectors
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<string>("all");

  // Fetch accessible tools based on company permissions
  useEffect(() => {
    const fetchAccessibleTools = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }

        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        const response = await fetch(`${API_BASE_URL}/auth/tools/accessible/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.tools) {
            const toolNames = data.tools.map((tool: { value: string }) => tool.value);
            setAccessibleTools(toolNames);
            console.log('Accessible tools for user:', toolNames);
            console.log('User role:', user?.role);
            console.log('Company:', data.company);
          } else {
            console.error('Failed to get tools from response:', data);
            // Only set empty array for non-super-admins to ensure proper filtering
            if (user?.role !== 'super_admin') {
              setAccessibleTools([]);
            } else {
              setAccessibleTools(['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall']);
            }
          }
        } else {
          console.error('Failed to fetch accessible tools:', response.status);
          // Only fallback for super admin, others get empty array
          if (user?.role === 'super_admin') {
            setAccessibleTools(['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall']);
          } else {
            setAccessibleTools([]);
          }
        }
      } catch (error) {
        console.error('Error fetching accessible tools:', error);
        // Only fallback for super admin, others get empty array
        if (user?.role === 'super_admin') {
          setAccessibleTools(['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall']);
        } else {
          setAccessibleTools([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAccessibleTools();
  }, [token, user?.role]);

  // Load companies for super admin
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        if (!token || user?.role !== 'super_admin') return;
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        const resp = await fetch(`${API_BASE_URL}/tool/admin/company-upload/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) return;
        const json = await resp.json();
        if (json.success) {
          const list: string[] = json.companies || [];
          setCompanies(list);
          if (!selectedCompany) {
            setSelectedCompany(json.user_company || "");
          }
        }
      } catch (e) {
        console.error('Failed to load companies:', e);
      }
    };
    fetchCompanies();
  }, [token, user?.role]);

  // When selected company changes, load that company's data
  useEffect(() => {
    if (user?.role === 'super_admin' && selectedCompany) {
      loadCompanyData?.(selectedCompany);
    }
  }, [selectedCompany]);

  // When role changes at runtime, re-run fetch without waiting for navigation
  useEffect(() => {
    // trigger re-render when user object updates to recalc controls
  }, [user?.role]);

  const toggleToolStatus = (toolId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setToolStatuses(prev => ({
      ...prev,
      [toolId]: prev[toolId] === 'active' ? 'inactive' : 'active'
    }));
  };

  const generateToolKPIs = () => {
    const tools: SecurityTool[] = [];

    // Only show tools that are accessible to the user

    // GSuite Tool - Only show if accessible
    if (accessibleTools.includes('gsuite')) {
      const gsuiteData = toolData.gsuite.data as GSuiteData;
    const isGSuiteEnhanced = gsuiteData && isEnhancedGSuiteData(gsuiteData);
    tools.push({
      id: 'gsuite',
      name: 'GSuite Security',
      description: 'Email security monitoring',
      icon: Mail,
      color: 'bg-blue-500/80',
      status: toolStatuses.gsuite,
      uploadSupported: true,
      isEnhanced: isGSuiteEnhanced,
      kpis: gsuiteData ? [
        { 
          label: 'Emails Scanned', 
          value: formatNumber(gsuiteData.kpis.emailsScanned || 0),
          severity: 'info'
        },
        { 
          label: 'Threats Blocked', 
          value: isGSuiteEnhanced 
            ? (gsuiteData as EnhancedGSuiteData).kpis.phishingAttempted?.toString() || '0'
            : ((gsuiteData as BaseGSuiteData).kpis.phishingBlocked?.toString() || '0'),
          severity: 'high'
        },
        { 
          label: 'Suspicious Activity', 
          value: isGSuiteEnhanced 
            ? (gsuiteData as EnhancedGSuiteData).kpis.suspiciousEmails?.toString() || '0'
            : ((gsuiteData as BaseGSuiteData).kpis.suspiciousFlags?.toString() || '0'),
          severity: 'medium'
        }
      ] : [
        { label: 'Emails Scanned', value: '0', severity: 'info' },
        { label: 'Threats Blocked', value: '0', severity: 'high' },
        { label: 'Suspicious Activity', value: '0', severity: 'medium' }
      ]
    });
    }

    // MDM Tool - Only show if accessible
    if (accessibleTools.includes('mdm')) {
      const mdmData = toolData.mdm.data as MDMData;
    tools.push({
      id: 'mdm',
      name: 'Mobile Device Management',
      description: 'Device compliance monitoring',
      icon: Smartphone,
      color: 'bg-green-500/80',
      status: toolStatuses.mdm,
      uploadSupported: true,
      kpis: mdmData ? [
        { 
          label: 'Total Devices', 
          value: formatNumber(mdmData.kpis.totalDevices || 0),
          severity: 'info'
        },
        { 
          label: 'Non-Compliant', 
          value: mdmData.kpis.nonCompliantDevices?.toString() || '0',
          severity: 'high'
        },
        { 
          label: 'Pending Actions', 
          value: mdmData.kpis.wipePendingDevices?.toString() || '0',
          severity: 'medium'
        }
      ] : [
        { label: 'Total Devices', value: '0', severity: 'info' },
        { label: 'Non-Compliant', value: '0', severity: 'high' },
        { label: 'Pending Actions', value: '0', severity: 'medium' }
      ]
    });
    }

    // SIEM Tool - Only show if accessible
    if (accessibleTools.includes('siem')) {
      const siemData = toolData.siem.data as SIEMData;
    tools.push({
      id: 'siem',
      name: 'SIEM Analytics',
      description: 'Security event monitoring',
      icon: Shield,
      color: 'bg-red-500/80',
      status: toolStatuses.siem,
      uploadSupported: true,
      kpis: siemData ? [
        { 
          label: 'Critical Alerts', 
          value: siemData.kpis.criticalAlerts?.toString() || '0',
          severity: 'critical'
        },
        { 
          label: 'Total Events', 
          value: formatNumber(siemData.kpis.totalEvents || 0),
          severity: 'info'
        },
        { 
          label: 'High Priority', 
          value: siemData.kpis.highSeverityEvents?.toString() || '0',
          severity: 'high'
        }
      ] : [
        { label: 'Critical Alerts', value: '0', severity: 'critical' },
        { label: 'Total Events', value: '0', severity: 'info' },
        { label: 'High Priority', value: '0', severity: 'high' }
      ]
    });
    }

    // EDR Tool - Only show if accessible
    if (accessibleTools.includes('edr')) {
      const edrData = toolData.edr.data as EDRData;
    tools.push({
      id: 'edr',
      name: 'Endpoint Detection',
      description: 'Endpoint threat monitoring',
      icon: Activity,
      color: 'bg-orange-500/80',
      status: toolStatuses.edr,
      uploadSupported: true,
      kpis: edrData ? [
        { 
          label: 'Endpoints', 
          value: formatNumber(edrData.kpis.totalEndpoints || 0),
          severity: 'info'
        },
        { 
          label: 'Threats Detected', 
          value: edrData.kpis.threatsDetected?.toString() || '0',
          severity: 'critical'
        },
        { 
          label: 'Detection Rate', 
          value: `${edrData.kpis.detectionRate?.toFixed(1) || 0}%`,
          severity: 'low'
        }
      ] : [
        { label: 'Endpoints', value: '0', severity: 'info' },
        { label: 'Threats Detected', value: '0', severity: 'critical' },
        { label: 'Detection Rate', value: '0%', severity: 'low' }
      ]
    });
    }

    // Meraki Tool - Only show if accessible
    if (accessibleTools.includes('meraki')) {
      const merakiData = toolData.meraki.data as MerakiData | EnhancedMerakiData;
    const isMerakiEnhanced = merakiData && isEnhancedMerakiData(merakiData);
    tools.push({
      id: 'meraki',
      name: 'Network Security',
      description: 'Network infrastructure monitoring',
      icon: isMerakiEnhanced ? Network : Wifi,
      color: 'bg-purple-500/80',
      status: toolStatuses.meraki,
      uploadSupported: true,
      isEnhanced: isMerakiEnhanced,
      kpis: merakiData ? (
        isMerakiEnhanced ? [
          { 
            label: 'Health Score', 
            value: `${(merakiData as EnhancedMerakiData).kpis.networkHealthScore || 0}/100`,
            severity: 'low'
          },
          { 
            label: 'Network Devices', 
            value: formatNumber((merakiData as EnhancedMerakiData).kpis.totalDevices || 0),
            severity: 'info'
          },
          { 
            label: 'Active Clients', 
            value: formatNumber((merakiData as EnhancedMerakiData).kpis.totalClients || 0),
            severity: 'info'
          }
        ] : [
          { 
            label: 'Network Uptime', 
            value: `${(merakiData as MerakiData).kpis.networkUptime?.toFixed(1) || '0'}%`,
            severity: 'low'
          },
          { 
            label: 'Connected Clients', 
            value: formatNumber((merakiData as MerakiData).kpis.connectedClients || 0),
            severity: 'info'
          },
          { 
            label: 'Security Incidents', 
            value: (merakiData as MerakiData).kpis.securityIncidents?.toString() || '0',
            severity: 'high'
          }
        ]
      ) : [
        { label: 'Network Uptime', value: '0%', severity: 'low' },
        { label: 'Connected Clients', value: '0', severity: 'info' },
        { label: 'Security Incidents', value: '0', severity: 'high' }
      ]
    });
    }

    // SonicWall Tool - Only show if accessible
    if (accessibleTools.includes('sonicwall')) {
      const sonicwallData = toolData.sonicwall.data as SonicWallData;
    tools.push({
      id: 'sonicwall',
      name: 'Firewall Security',
      description: 'Perimeter defense monitoring',
      icon: ShieldCheck,
      color: 'bg-indigo-500/80',
      status: toolStatuses.sonicwall,
      uploadSupported: true,
      kpis: sonicwallData ? [
        { 
          label: 'Intrusion Attempts', 
          value: sonicwallData.kpis.intrusionAttempts?.toString() || '0',
          severity: 'critical'
        },
        { 
          label: 'Blocked Attacks', 
          value: sonicwallData.kpis.blockedAttempts?.toString() || '0',
          severity: 'low'
        },
        { 
          label: 'VPN Connections', 
          value: formatNumber(sonicwallData.kpis.vpnConnections || 0),
          severity: 'info'
        }
      ] : [
        { label: 'Intrusion Attempts', value: '0', severity: 'critical' },
        { label: 'Blocked Attacks', value: '0', severity: 'low' },
        { label: 'VPN Connections', value: '0', severity: 'info' }
      ]
    });
    }

    return tools;
  };

  const securityTools = generateToolKPIs();
  let filteredTools = showOnlyActive
    ? securityTools.filter(tool => tool.status === 'active')
    : securityTools;
  if (selectedTool !== 'all') {
    filteredTools = filteredTools.filter(t => t.id === selectedTool);
  }

  // Debug logging
  console.log('Generated security tools:', securityTools.map(t => t.id));
  console.log('Accessible tools from API:', accessibleTools);
  console.log('Filtered tools to display:', filteredTools.map(t => t.id));

  const activeToolsCount = securityTools.filter(tool => tool.status === 'active').length;
  const totalDataSources = securityTools.filter(tool => 
    toolData[tool.id as keyof typeof toolData]?.data !== null
  ).length;

  // Show loading state while fetching accessible tools
  if (loading) {
    return (
      <div className="w-[98%] max-w-8xl mx-auto mb-6">
        <div className="backdrop-blur-2xl bg-background/60 dark:bg-background/40 border border-border/30 dark:border-border/20 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/20 transition-all duration-300">
          <div className="relative px-8 py-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading accessible tools...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[98%] max-w-8xl mx-auto mb-6">
      {/* Glass morphism container */}
      <div className="
        relative overflow-hidden
        backdrop-blur-2xl
        bg-background/60 dark:bg-background/40
        border border-border/30 dark:border-border/20
        rounded-2xl
        shadow-xl shadow-black/5 dark:shadow-black/20
        transition-all duration-300
        hover:shadow-2xl hover:shadow-black/8 dark:hover:shadow-black/30
        hover:bg-background/70 dark:hover:bg-background/50
      ">
        {/* Enhanced gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/5 pointer-events-none" />
        
        <div className="relative px-8 py-6">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground leading-tight">Security Tools</h2>
              <p className="text-base text-muted-foreground">Monitor and manage security infrastructure</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Super Admin selectors */}
              {user?.role === 'super_admin' && (
                <div className="hidden md:flex items-center gap-3">
                  <div>
                    <label className="sr-only">Company</label>
                    <select
                      className="rounded-md bg-background border border-border px-3 py-2 text-sm"
                      value={selectedCompany}
                      onChange={(e) => setSelectedCompany(e.target.value)}
                    >
                      {[...(selectedCompany ? [selectedCompany] : []), ...companies.filter(c => c !== selectedCompany)].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="sr-only">Dataset</label>
                    <select
                      className="rounded-md bg-background border border-border px-3 py-2 text-sm"
                      value={selectedTool}
                      onChange={(e) => setSelectedTool(e.target.value)}
                    >
                      <option value="all">All</option>
                      {['gsuite','mdm','siem','edr','meraki','sonicwall'].filter(t => accessibleTools.includes(t)).map(t => (
                        <option key={t} value={t}>{t.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {/* Status Summary */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                  <Activity className="h-3 w-3" />
                  {activeToolsCount} Active
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                  <Upload className="h-3 w-3" />
                  {totalDataSources} Sources
                </Badge>
              </div>

              {/* Filter Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOnlyActive(!showOnlyActive)}
                className="flex items-center gap-2 hover:bg-primary/5 text-sm"
              >
                <Filter className="h-4 w-4" />
                {showOnlyActive ? 'Show All' : 'Active Only'}
              </Button>
            </div>
          </div>

          {/* Tools Grid */}
          {filteredTools.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Security Tools Available</h3>
                <p className="text-muted-foreground max-w-md">
                  {accessibleTools.length === 0
                    ? "Your company doesn't have access to any security tools. Contact your administrator to request access."
                    : showOnlyActive
                      ? "No active tools found. Toggle the filter to show all tools."
                      : "No tools are currently configured for your account."
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 smooth-scroll">
              {filteredTools.map((tool) => {
                const Icon = tool.icon;
                const isActive = tool.status === 'active';
                const hasData = toolData[tool.id as keyof typeof toolData]?.data !== null;
              
              return (
                <Card 
                  key={tool.id} 
                  className={`
                    relative overflow-hidden h-full flex flex-col
                    backdrop-blur-xl 
                    bg-background/40 dark:bg-background/30 
                    border border-border/40 dark:border-border/30
                    rounded-xl
                    shadow-lg shadow-black/5 dark:shadow-black/20
                    transition-all duration-200 
                    ${isActive ? `
                      hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30
                      hover:bg-background/50 dark:hover:bg-background/40
                      hover:-translate-y-0.5
                      cursor-pointer group
                    ` : `
                      opacity-60 cursor-not-allowed
                    `}
                  `}
                  onClick={() => isActive && navigate(`/analytics?tool=${tool.id}`)}
                  title={!isActive ? "This tool is inactive and cannot be accessed" : undefined}
                >
                  {/* Card gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
                  
                  <CardHeader className="pb-4 relative">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${tool.color} backdrop-blur-sm flex items-center justify-center shadow-sm`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className={`text-lg transition-colors text-foreground leading-tight ${isActive ? 'group-hover:text-primary' : ''}`}>
                            {tool.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground leading-tight">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {/* Status Toggle - only admins/super admins */}
                        {(user?.role === 'admin' || user?.role === 'super_admin') && (
                          <button
                            onClick={(e) => toggleToolStatus(tool.id, e)}
                            className="flex items-center gap-1 text-sm hover:bg-primary/5 rounded px-2 py-1 transition-colors"
                          >
                            {isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                            <span className={isActive ? 'text-green-600' : 'text-gray-400'}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0 relative flex flex-col h-full">
                    {/* KPIs Section */}
                    <div className="space-y-3 flex-1">
                      {tool.kpis.slice(0, 3).map((kpi, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">{kpi.label}</span>
                          <span className={`text-sm font-medium ${getSeverityClass(kpi.severity)}`}>
                            {kpi.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Last Updated - Left aligned with top margin */}
                    <div className="mt-auto pt-6 mt-4 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        <span className="font-medium">
                          {hasData 
                            ? `Last updated: ${toolData[tool.id as keyof typeof toolData]?.uploadedAt?.toLocaleDateString() || 'Recently'}`
                            : 'No data available'
                          }
                        </span>
                      </div>
                    </div>
                    
                  </CardContent>
                  
                  {/* Accent line */}
                  <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                </Card>
              );
            })}
            </div>
          )}
        </div>

        {/* Enhanced accent lines for depth */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>
    </div>
  );
};