// Enhanced Analytics page supporting all 6 tools - Refactored with Theme Integration
// Save as: src/pages/Analytics.tsx

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useToolData } from "@/contexts/ToolDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { AllToolData } from "@/lib/api";
import { useTheme } from "@/pages/Main_dashboard/ThemeProvider";
import { AnimatedSection, FadeIn } from "@/components/animations/ScrollAnimations";
import { LazyWrapper } from "@/components/common/LazyWrapper";
import { usePrefetchToolData } from "@/hooks/usePrefetchData";
import { DashboardSkeleton } from "@/components/common/SkeletonLoader";


// Import refactored components
import { AnalyticsHeader } from "./ToolsNav/AnalyticsHeader";
import { ToolSelectionGrid } from "./ToolsNav/ToolSelectionGrid";
import { ToolHeader } from "./ToolsNav/ToolHeader";
import { AnalyticsTabs } from "./ToolsNav/AnalyticsTabs";
import { UploadTabContent } from "./ToolsNav/UploadTabContent";
import { ProcessesTabContent } from "./ToolsNav/ProcessesTabContent";
import { AnalyticsTabContent } from "./ToolsNav/AnalyticsTabContent";
import { toolsConfig, getToolById, ToolType } from "./ToolsNav/toolConfig";

export const Analytics: React.FC = () => {
  const { actualTheme } = useTheme();
  const { user, canWrite, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toolData, setToolData, clearToolData, getToolStatus, getToolData } =
    useToolData();

  const [selectedTool, setSelectedTool] = useState<ToolType>("general");
  const [activeTab, setActiveTab] = useState<
    "upload" | "processes" | "analytics"
  >("analytics");
  const [accessibleTools, setAccessibleTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch accessible tools
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
          } else {
            if (user?.role === 'super_admin') {
              setAccessibleTools(['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall']);
            } else {
              setAccessibleTools([]);
            }
          }
        } else {
          if (user?.role === 'super_admin') {
            setAccessibleTools(['gsuite', 'mdm', 'siem', 'edr', 'meraki', 'sonicwall']);
          } else {
            setAccessibleTools([]);
          }
        }
      } catch (error) {
        console.error('Error fetching accessible tools:', error);
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

  // Get tool from URL params on mount and validate access
  useEffect(() => {
    if (loading) return; // Wait for accessible tools to load

    const toolParam = searchParams.get("tool") as ToolType;
    if (toolParam && toolParam !== "general") {
      // Check if user has access to this tool
      if (user?.role === 'super_admin' || accessibleTools.includes(toolParam)) {
        setSelectedTool(toolParam);
        setActiveTab("analytics");
      } else {
        // Redirect to general view if no access
        console.warn(`User does not have access to tool: ${toolParam}`);
        setSearchParams({}, { replace: true });
        setSelectedTool("general");
      }
    }
  }, [loading, accessibleTools, user?.role]);

  const handleDataProcessed = (
    processedData: AllToolData,
    detectedFileType: string,
    fileName: string
  ) => {
    // Store data using generic setter
    setToolData(
      detectedFileType as keyof typeof toolData,
      processedData,
      fileName
    );

    // Auto-switch to analytics tab after successful upload
    setActiveTab("analytics");
  };

  const handleReset = (toolType: ToolType) => {
    if (toolType !== "general") {
      clearToolData(toolType);
      setActiveTab("analytics");
    }
  };

  const handleToolSelect = (toolType: ToolType) => {
    console.log('🔧 Tool selected:', toolType);

    // Validate tool access (except for general)
    if (toolType !== "general" && user?.role !== 'super_admin' && !accessibleTools.includes(toolType)) {
      console.warn(`Access denied for tool: ${toolType}`);
      return; // Don't allow selection
    }

    setSelectedTool(toolType);
    setSearchParams(toolType !== "general" ? { tool: toolType } : {});

    if (toolType !== "general") {
      // Always start on analytics tab for tool views
      setActiveTab("analytics");
    } else {
      setActiveTab("analytics");
    }
  };

  const handleTabChange = (value: string) => {
    console.log('🔄 Tab changed to:', value);
    setActiveTab(value as "upload" | "processes" | "analytics");
  };

  // Get current tool's data and metadata - memoized for performance
  const getCurrentToolData = useCallback(() => {
    if (selectedTool === "general") return null;
    return getToolData(selectedTool);
  }, [selectedTool, getToolData]);

  const getCurrentToolFileName = useCallback(() => {
    if (selectedTool === "general") return null;
    return toolData[selectedTool]?.fileName;
  }, [selectedTool, toolData]);

  const getCurrentToolUploadTime = useCallback(() => {
    if (selectedTool === "general") return null;
    return toolData[selectedTool]?.uploadedAt;
  }, [selectedTool, toolData]);

  const getDataStatusBadge = (toolId: ToolType) => {
    if (toolId === "general") return null;

    const status = getToolStatus(toolId);
    switch (status) {
      case "enhanced-data":
      case "has-data":
        return (
          <Badge
            variant="default"
            className="text-xs bg-green-500 text-white hover:bg-green-600"
          >
            Data Uploaded
          </Badge>
        );
      case "no-data":
      default:
        return (
          <Badge
            variant="secondary"
            className="text-xs bg-secondary text-secondary-foreground"
          >
            No Data
          </Badge>
        );
    }
  };

  const selectedToolData = useMemo(() => getToolById(selectedTool), [selectedTool]);
  const currentData = getCurrentToolData();
  const currentFileName = getCurrentToolFileName();
  const currentUploadTime = getCurrentToolUploadTime();

  return (
    <div className="analytics-page min-h-screen transition-colors duration-300 bg-blue-50 dark:bg-gradient-to-b dark:from-black dark:via-gray-900 dark:to-gray-800">
      {/* Header - Fixed positioning (no animation wrapper) */}
      <AnalyticsHeader />
      
      {/* Main content with proper top padding */}
      <div className="dashboard-container main-content pb-6 space-y-6 pt-6">

        {/* Tool Selection Grid */}
        <AnimatedSection delay={200} direction="up">
          <ToolSelectionGrid
            selectedTool={selectedTool}
            onToolSelect={handleToolSelect}
            getDataStatusBadge={getDataStatusBadge}
            showUploadInfo={canWrite()} // Hide upload info for general users
            accessibleTools={accessibleTools} // Pass accessible tools for filtering
          />
        </AnimatedSection>

        {/* Main Content */}
        {selectedTool !== "general" && selectedToolData && (
          <AnimatedSection delay={400} direction="up">
            <div className="space-y-6">
              {/* Tool Header */}
              <FadeIn delay={100}>
                <ToolHeader
                  selectedTool={selectedTool}
                  currentData={currentData}
                  currentUploadTime={currentUploadTime}
                  onReset={handleReset}
                  getDataStatusBadge={getDataStatusBadge}
                />
              </FadeIn>

              {/* Tabs Content */}
              <LazyWrapper threshold={0.1} minHeight="400px">
                <AnimatedSection delay={200} direction="up">
                  <AnalyticsTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    currentData={currentData}
                    showUploadTab={canWrite()} // Hide upload tab for general users
                  >
                    {canWrite() && (
                      <UploadTabContent
                        selectedTool={selectedTool}
                        uploadSupported={selectedToolData.uploadSupported}
                        currentData={currentData}
                        currentFileName={currentFileName}
                        currentUploadTime={currentUploadTime}
                        onDataProcessed={handleDataProcessed}
                        onSetActiveTab={setActiveTab}
                      />
                    )}

                    <ProcessesTabContent selectedTool={selectedTool} />

                    <AnalyticsTabContent
                      selectedTool={selectedTool}
                      selectedToolName={selectedToolData.name}
                      currentData={currentData}
                      onSetActiveTab={setActiveTab}
                    />
                  </AnalyticsTabs>
                </AnimatedSection>
              </LazyWrapper>
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
};

export default Analytics;
