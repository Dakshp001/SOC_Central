// Comprehensive Security Dashboard with Tool-Specific KPIs and Charts
// Integrates GSuite, EDR, MDM, SIEM, Meraki, and SonicWall dashboards

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToolData } from "@/contexts/ToolDataContext";
import { ThemeProvider } from "./Main_dashboard/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  Mail,
  Smartphone,
  Shield,
  TrendingUp,
  Upload,
  RefreshCw,
  Database,
  Bell,
  CheckCircle,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  Network,
  Server,
  Eye,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Import comprehensive dashboard components
import { GSuiteDashboard } from "@/components/dashboards/GSuiteDashboard";
import { EDRDashboard } from "@/components/dashboards/EDRDashboard";
import { MDMDashboard } from "@/components/dashboards/MDMDashboard";
import { SIEMDashboard } from "@/components/dashboards/SIEMDashboard";
import { MerakiDashboard } from "@/components/dashboards/MerakiDashboard";

// Import main dashboard components for overview
import { Header } from "./Main_dashboard/Header";
// RealTimeAlerts removed from dashboard overview
import { RecentIncidents } from "./Main_dashboard/RecentIncidents";

const DashboardContent = () => {
  const navigate = useNavigate();
  const { user, canWrite, canRead } = useAuth();
  const {
    toolData,
    notifications,
    unreadCount,
    isLoadingData,
    lastSyncAt,
    loadActiveData,
    loadNotifications,
  } = useToolData();

  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (canRead()) {
      loadActiveData();
      loadNotifications();
    }
  }, [canRead, loadActiveData, loadNotifications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadActiveData(), loadNotifications()]);
      // Show refresh toast only once per session
      const refreshToastShown = sessionStorage.getItem('refreshToastShown');
      if (!refreshToastShown) {
        toast({
          title: "Dashboard Refreshed 🔄",
          description: "All data has been synchronized with the latest updates.",
        });
        sessionStorage.setItem('refreshToastShown', 'true');
      }
    } catch (error) {
      console.error("Refresh failed:", error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate real-time statistics based on actual data
  const getActiveDataCount = () => {
    return Object.values(toolData).filter((tool) => tool.data !== null).length;
  };

  // Tool tabs configuration with data status
  const toolTabs = [
    {
      id: "overview",
      label: "Security Overview",
      icon: TrendingUp,
      hasData: getActiveDataCount() > 0,
      component: null, // Special case for overview
    },
    {
      id: "gsuite",
      label: "GSuite Security",
      icon: Mail,
      hasData: !!toolData.gsuite.data,
      component: GSuiteDashboard,
      data: toolData.gsuite.data,
    },
    {
      id: "edr",
      label: "EDR Analytics",
      icon: Shield,
      hasData: !!toolData.edr.data,
      component: EDRDashboard,
      data: toolData.edr.data,
    },
    {
      id: "mdm",
      label: "MDM Dashboard",
      icon: Smartphone,
      hasData: !!toolData.mdm.data,
      component: MDMDashboard,
      data: toolData.mdm.data,
    },
    {
      id: "siem",
      label: "SIEM Analytics",
      icon: Eye,
      hasData: !!toolData.siem.data,
      component: SIEMDashboard,
      data: toolData.siem.data,
    },
    {
      id: "meraki",
      label: "Network Security",
      icon: Network,
      hasData: !!toolData.meraki.data,
      component: MerakiDashboard,
      data: toolData.meraki.data,
    },
    {
      id: "sonicwall",
      label: "Firewall Analytics",
      icon: Server,
      hasData: !!toolData.sonicwall.data,
      component: null, // TODO: Create SonicWall dashboard
      data: toolData.sonicwall.data,
    },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen transition-colors duration-300 bg-blue-50 dark:bg-gradient-to-b dark:from-black dark:via-gray-900 dark:to-gray-800">
        <Header />
        
        <main className="dashboard-container py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
            <div className="w-full lg:w-auto">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Welcome back, {user?.first_name}! 👋
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground break-words">
                <span className="inline-block">{user?.company_name}</span>
                <span className="hidden sm:inline"> • </span>
                <span className="block sm:inline">{user?.role?.replace("_", " ").toUpperCase()}</span>
                <span className="hidden md:inline"> • Comprehensive Security Analytics Dashboard</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
              {/* Sync Status */}
              {lastSyncAt && (
                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {isLoadingData ? (
                      <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                    ) : (
                      <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                    )}
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Last sync: {lastSyncAt.toLocaleTimeString()}</span>
                    <span className="sm:hidden">{lastSyncAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              )}

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoadingData}
                className="text-xs sm:text-sm"
              >
                <RefreshCw
                  className={`h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>

              {/* Upload Button (Admin Only) */}
              {canWrite() && (
                <Button
                  onClick={() => navigate("/data-analysis")}
                  size="sm"
                  className="text-xs sm:text-sm"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Upload Data</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              )}

              <Badge variant="secondary" className="flex items-center gap-1 text-xs whitespace-nowrap">
                <Database className="h-3 w-3 flex-shrink-0" />
                {getActiveDataCount()}/6
                <span className="hidden sm:inline">Active</span>
              </Badge>
            </div>
          </div>

          {/* Permission Alert for General Users */}
          {!canWrite() && (
            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                You have read-only access. All data is automatically synchronized
                from your admin team.
                {getActiveDataCount() === 0 &&
                  " Contact your administrator to upload security data."}
              </AlertDescription>
            </Alert>
          )}

          {/* Data Loading State */}
          {isLoadingData && (
            <Alert>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Synchronizing latest security data from server...
              </AlertDescription>
            </Alert>
          )}

          {/* Main Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 bg-card border border-border shadow-sm gap-0.5 sm:gap-1 p-1">
              {toolTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center justify-center gap-0.5 sm:gap-1 md:gap-2 text-[10px] sm:text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200 px-1 sm:px-2 md:px-3 py-1.5 sm:py-2 relative"
                  >
                    <Icon className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                    <span className="hidden md:inline truncate">{tab.label}</span>
                    <span className="hidden sm:inline md:hidden truncate text-[10px]">
                      {tab.id === 'overview' ? 'Overview' : tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}
                    </span>
                    <span className="sm:hidden truncate">
                      {tab.id === 'overview' ? 'Over' : tab.id.substring(0, 4).toUpperCase()}
                    </span>
                    {tab.hasData && (
                      <div className="absolute top-0.5 right-0.5 sm:static w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Overview Tab Content */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              {/* Global KPIs removed as requested; RealTimeAlerts removed */}

              {/* Recent Incidents */}
              <RecentIncidents />

              {/* Quick Tool Access Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                    Security Tools Quick Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {toolTabs.slice(1).map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <Card
                          key={tool.id}
                          className={`cursor-pointer transition-all duration-300 hover:shadow-lg active:scale-95 sm:hover:scale-105 ${
                            tool.hasData ? "ring-2 ring-green-200 dark:ring-green-800" : ""
                          }`}
                          onClick={() => setActiveTab(tool.id)}
                        >
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                              {tool.hasData ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-[10px] sm:text-xs">
                                  <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] sm:text-xs">No Data</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-foreground text-sm sm:text-base">{tool.label}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                              {tool.hasData
                                ? "Click to view detailed analytics and KPIs"
                                : "Upload data to enable dashboard"
                              }
                            </p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tool-Specific Dashboard Tabs */}
            {toolTabs.slice(1).map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-4 sm:mt-6">
                {tab.hasData && tab.component && tab.data ? (
                  <tab.component data={tab.data} />
                ) : (
                  <Card>
                    <CardContent className="p-6 sm:p-8 md:p-12">
                      <div className="text-center space-y-3 sm:space-y-4">
                        <tab.icon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto" />
                        <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                          No {tab.label} Data Available
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
                          {canWrite()
                            ? `Upload ${tab.label.toLowerCase()} data to view comprehensive analytics, KPIs, and interactive charts.`
                            : `${tab.label} data will appear here once uploaded by your administrator.`
                          }
                        </p>
                        {canWrite() && (
                          <Button onClick={() => navigate("/data-analysis")} size="sm" className="mt-2">
                            <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Upload {tab.label} Data
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>

          {/* Recent Notifications Section */}
          {notifications.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                    Recent Updates
                  </CardTitle>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-xs">{unreadCount} new</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3">
                  {notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-2 sm:p-3 border rounded-lg transition-all duration-300 hover:shadow-md ${
                        !notification.is_read
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs sm:text-sm truncate">
                            {notification.title}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                            {new Date(notification.created_at).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1 animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
};

export const Dashboard: React.FC = () => {
  return (
    <ThemeProvider>
      <DashboardContent />
    </ThemeProvider>
  );
};
