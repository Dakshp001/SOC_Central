// frontend/src/components/admin/UserDetailView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Crown,
  CheckCircle,
  XCircle,
  Activity,
  Globe,
  Monitor,
  Smartphone,
  MapPinIcon,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronRight,
  LogIn,
  LogOut,
  Upload,
  Download,
  Eye,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { User } from '@/types/auth';

interface UserActivityLog {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  type: 'login' | 'logout' | 'upload' | 'download' | 'view' | 'settings' | 'security' | 'error' | 'success';
  ip_address?: string;
  user_agent?: string;
  location?: string;
  device_type?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface UserDetailViewProps {
  user: User;
  onBack: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getActivityIcon = (type: UserActivityLog['type']) => {
  switch (type) {
    case 'login': return LogIn;
    case 'logout': return LogOut;
    case 'upload': return Upload;
    case 'download': return Download;
    case 'view': return Eye;
    case 'settings': return Settings;
    case 'security': return Shield;
    case 'error': return AlertTriangle;
    case 'success': return CheckCircle;
    default: return Activity;
  }
};

const getActivityColor = (type: UserActivityLog['type'], severity: UserActivityLog['severity']) => {
  if (severity === 'critical') return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50';
  if (severity === 'high') return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50';
  
  switch (type) {
    case 'login': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50';
    case 'logout': return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/50';
    case 'upload': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50';
    case 'download': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50';
    case 'view': return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50';
    case 'settings': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50';
    case 'security': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50';
    case 'error': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50';
    case 'success': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50';
    default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950/50';
  }
};

const getSeverityBadge = (severity: UserActivityLog['severity']) => {
  switch (severity) {
    case 'critical': return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Critical' };
    case 'high': return { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'High' };
    case 'medium': return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Medium' };
    case 'low': return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Low' };
  }
};

export const UserDetailView: React.FC<UserDetailViewProps> = ({ user, onBack }) => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [activityLogs, setActivityLogs] = useState<UserActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserFullName = (user: User): string => {
    return user.full_name || `${user.first_name} ${user.last_name}`;
  };

  const getInitials = (user: User) => {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'super_admin':
        return { 
          icon: Crown, 
          color: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
          label: 'Super Admin',
          description: 'Full system access and user management'
        };
      case 'admin':
        return { 
          icon: Shield, 
          color: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white',
          label: 'Admin',
          description: 'Advanced tools and analytics access'
        };
      default:
        return { 
          icon: UserIcon, 
          color: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
          label: 'General User',
          description: 'Standard platform access'
        };
    }
  };

  // Mock activity logs - replace with actual API call
  const generateMockActivityLogs = (): UserActivityLog[] => [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      action: 'User Login',
      description: `Successful login from secure session`,
      type: 'login',
      ip_address: '192.168.1.100',
      user_agent: 'Chrome/91.0.4472.124',
      location: 'New York, NY',
      device_type: 'Desktop',
      severity: 'low',
      details: { session_id: 'sess_abc123', browser: 'Chrome 91' }
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      action: 'Data Upload',
      description: 'GSuite security data uploaded successfully',
      type: 'upload',
      severity: 'medium',
      details: { file: 'gsuite_security_q3.xlsx', size: '2.4 MB', tool: 'GSuite' }
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      action: 'Dashboard Access',
      description: 'Accessed SIEM analytics dashboard',
      type: 'view',
      severity: 'low',
      details: { dashboard: 'SIEM Analytics', duration: '12 minutes' }
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      action: 'Security Alert',
      description: 'Viewed high-priority security events',
      type: 'security',
      severity: 'high',
      details: { alerts_viewed: 5, critical_events: 2 }
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      action: 'Report Export',
      description: 'Monthly security report downloaded',
      type: 'download',
      severity: 'medium',
      details: { report: 'Security_Summary_November_2024.pdf', size: '8.7 MB' }
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
      action: 'Profile Update',
      description: 'Updated profile information',
      type: 'settings',
      severity: 'low',
      details: { changes: ['phone_number', 'department'] }
    },
    {
      id: '7',
      timestamp: new Date(Date.now() - 6 * 60 * 60000).toISOString(),
      action: 'Previous Session',
      description: 'User logged out normally',
      type: 'logout',
      severity: 'low',
      details: { session_duration: '2h 35m' }
    }
  ];

  const loadActivityLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        user_id: user.id,
        type: selectedType,
        severity: selectedSeverity,
        limit: '50'
      });
      
      const response = await fetch(`${API_BASE_URL}/auth/user-activity-logs/?${params}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setActivityLogs(data.activities || []);
      } else {
        // Fallback to mock data if API fails
        console.warn('API returned unsuccessful response, using mock data');
        setActivityLogs(generateMockActivityLogs());
      }
      
    } catch (error) {
      console.error('Failed to load user activity logs:', error);
      
      // Fallback to mock data for demo purposes
      setActivityLogs(generateMockActivityLogs());
      
      toast({
        title: "Using Demo Data",
        description: "Activity logs loaded with sample data for demonstration.",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user.id, selectedType, selectedSeverity, token, toast]);

  useEffect(() => {
    if (user && token) {
      loadActivityLogs();
    }
  }, [user, token, selectedType, selectedSeverity, loadActivityLogs]);

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const filteredLogs = activityLogs.filter(log => {
    if (selectedType !== 'all' && log.type !== selectedType) return false;
    if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) return false;
    return true;
  });

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const roleConfig = getRoleConfig(user.role);
  const RoleIcon = roleConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Button>
        
      </div>

      {/* User Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-border/30">
              <AvatarImage src="" alt={getUserFullName(user)} />
              <AvatarFallback className={`${roleConfig.color} text-xl`}>
                {getInitials(user)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{getUserFullName(user)}</h2>
                    <Badge className={`${roleConfig.color} border-0`}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleConfig.label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user.email}
                    </div>
                    {user.is_email_verified ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${user.is_active !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={user.is_active !== false ? 'text-green-600' : 'text-red-600'}>
                      {user.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {user.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
              
              <p className="text-muted-foreground">{roleConfig.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm mt-1">{getUserFullName(user)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <p className="text-sm mt-1 break-all">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {user.phone_number || 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                <p className="text-sm mt-1">{user.company_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Briefcase className="h-3 w-3" />
                  {user.job_title || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {user.department || 'Not specified'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Role</label>
                <p className="text-sm mt-1 capitalize">{user.role.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Status</label>
                <p className="text-sm mt-1">{user.is_active !== false ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Verification</label>
                <p className="text-sm mt-1">{user.is_email_verified ? 'Verified' : 'Pending'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Created</label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {formatDate(user.created_at)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {formatDate(user.last_login)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Activities</label>
                <p className="text-sm mt-1 flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  {activityLogs.length} logged events
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>User Activity Logs</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadActivityLogs}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Activity Log Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-sm border border-border/40 rounded px-2 py-1 bg-background"
              >
                <option value="all">All Types</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="upload">Upload</option>
                <option value="download">Download</option>
                <option value="view">View</option>
                <option value="settings">Settings</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="text-sm border border-border/40 rounded px-2 py-1 bg-background"
              >
                <option value="all">All Levels</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-96 smooth-scroll">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading activity logs...</span>
              </div>
            ) : filteredLogs.length > 0 ? (
              <div className="space-y-4">
                {filteredLogs.map((log) => {
                  const Icon = getActivityIcon(log.type);
                  const colorClass = getActivityColor(log.type, log.severity);
                  const severityBadge = getSeverityBadge(log.severity);
                  const isExpanded = expandedLogs.has(log.id);

                  return (
                    <div
                      key={log.id}
                      className="relative border border-border/40 rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-foreground">{log.action}</h4>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${severityBadge.color} border-0`}
                              >
                                {severityBadge.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(log.timestamp)}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">{log.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                              {log.ip_address && (
                                <div className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {log.ip_address}
                                </div>
                              )}
                              {log.location && (
                                <div className="flex items-center gap-1">
                                  <MapPinIcon className="h-3 w-3" />
                                  {log.location}
                                </div>
                              )}
                              {log.device_type && (
                                <div className="flex items-center gap-1">
                                  {log.device_type === 'Desktop' ? 
                                    <Monitor className="h-3 w-3" /> : 
                                    <Smartphone className="h-3 w-3" />
                                  }
                                  {log.device_type}
                                </div>
                              )}
                            </div>
                            
                            {log.details && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLogExpansion(log.id)}
                                className="h-6 px-2 text-xs"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                                Details
                              </Button>
                            )}
                          </div>
                          
                          {isExpanded && log.details && (
                            <div className="mt-3 p-3 bg-muted/50 rounded-md">
                              <div className="text-xs space-y-1">
                                {Object.entries(log.details).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-muted-foreground capitalize">
                                      {key.replace(/_/g, ' ')}:
                                    </span>
                                    <span className="font-medium">
                                      {Array.isArray(value) ? value.join(', ') : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No activity logs found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Activity logs for this user will appear here
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};