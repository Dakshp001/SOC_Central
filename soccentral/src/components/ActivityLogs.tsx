// Activity Logs Component
// Save as: src/components/ActivityLogs.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Activity,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  User,
  Upload,
  Download,
  Eye,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  Globe,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  type: 'login' | 'logout' | 'upload' | 'download' | 'view' | 'settings' | 'security' | 'error' | 'success';
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ActivityLogsProps {
  className?: string;
  maxHeight?: string;
  showFilters?: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getActivityIcon = (type: ActivityLog['type']) => {
  switch (type) {
    case 'login': return User;
    case 'logout': return User;
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

const getActivityColor = (type: ActivityLog['type'], severity: ActivityLog['severity']) => {
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

const getSeverityBadge = (severity: ActivityLog['severity']) => {
  switch (severity) {
    case 'critical': return { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Critical' };
    case 'high': return { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'High' };
    case 'medium': return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Medium' };
    case 'low': return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Low' };
  }
};

export const ActivityLogs: React.FC<ActivityLogsProps> = ({ 
  className = "", 
  maxHeight = "400px",
  showFilters = true 
}) => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Mock data for demonstration - replace with actual API call
  const mockLogs: ActivityLog[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      action: 'User Login',
      description: 'Successful authentication from secure session',
      type: 'login',
      ip_address: '192.168.1.100',
      user_agent: 'Chrome/91.0',
      severity: 'low',
      details: { location: 'New York, NY', device: 'Desktop' }
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
      action: 'Dashboard View',
      description: 'Accessed SIEM analytics dashboard',
      type: 'view',
      severity: 'low',
      details: { dashboard: 'SIEM Analytics', duration: '12 minutes' }
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      action: 'Security Alert',
      description: 'High-priority security event detected',
      type: 'security',
      severity: 'high',
      details: { alert_type: 'Suspicious Login Attempt', affected_systems: ['EDR', 'SIEM'] }
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      action: 'Data Export',
      description: 'Monthly security report exported',
      type: 'download',
      severity: 'medium',
      details: { report: 'Security_Summary_October_2024.pdf', size: '8.7 MB' }
    },
    {
      id: '6',
      timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
      action: 'Settings Update',
      description: 'Updated notification preferences',
      type: 'settings',
      severity: 'low',
      details: { changed: ['email_notifications', 'alert_frequency'] }
    }
  ];

  const loadActivityLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams({
        type: selectedType,
        severity: selectedSeverity,
        limit: '50'
      });
      
      const response = await fetch(`${API_BASE_URL}/auth/activity-logs/?${params}`, {
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
        setLogs(data.activities || []);
      } else {
        // Fallback to mock data if API fails
        console.warn('API returned unsuccessful response, using mock data');
        setLogs(mockLogs);
      }
      
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      
      // Fallback to mock data for demo purposes
      setLogs(mockLogs);
      
      toast({
        title: "Using Demo Data",
        description: "Activity logs loaded with sample data for demonstration.",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, selectedSeverity, token, toast]);

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

  const filteredLogs = logs.filter(log => {
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

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Activity Logs</CardTitle>
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

        {showFilters && (
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
                <option value="upload">Upload</option>
                <option value="view">View</option>
                <option value="security">Security</option>
                <option value="settings">Settings</option>
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
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea style={{ height: maxHeight }} className="smooth-scroll">
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
                Your activity will appear here once you start using the platform
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};