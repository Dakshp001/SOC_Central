// Enhanced Global KPIs Component - Production Ready with Real Data Only
// Enhanced version with info buttons and bento grid layout

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import KPITooltip from "@/components/ui/KPITooltip";
import { 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Zap,
  Clock,
  Database
} from "lucide-react";
import { useToolData } from "@/contexts/ToolDataContext";
import { AnimatedSection, FadeIn, StaggeredList, AnimatedCard } from "@/components/animations/ScrollAnimations";
import { 
  GSuiteData, 
  MDMData, 
  SIEMData, 
  EDRData, 
  MerakiData, 
  SonicWallData, 
  EnhancedMerakiData,
  isEnhancedGSuiteData,
  isEnhancedMerakiData 
} from "@/lib/api";

interface KPIData {
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'none';
  description: string;
  calculation: string;
  priority: 'top' | 'secondary';
  hasData: boolean;
  lastUpdated: Date;
}

const getSeverityColor = (severity: string, hasData: boolean) => {
  if (!hasData) return 'border-border/30 dark:border-border/20';
  
  switch (severity) {
    case 'critical': return 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/20';
    case 'high': return 'border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/20';
    case 'medium': return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/20';
    case 'low': return 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20';
    case 'info': return 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20';
    default: return 'border-border/30 dark:border-border/20';
  }
};

const getSeverityTextColor = (severity: string, hasData: boolean) => {
  if (!hasData) return 'text-muted-foreground';
  
  switch (severity) {
    case 'critical': return 'text-red-600 dark:text-red-400';
    case 'high': return 'text-orange-600 dark:text-orange-400';
    case 'medium': return 'text-yellow-600 dark:text-yellow-400';
    case 'low': return 'text-green-600 dark:text-green-400';
    case 'info': return 'text-blue-600 dark:text-blue-400';
    default: return 'text-foreground';
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const GlobalKPIs: React.FC = () => {
  const { toolData } = useToolData();

  // Production-ready KPI calculations based ONLY on real data
  const calculateGlobalKPIs = (): KPIData[] => {
    let totalEvents = 0;
    let activeThreats = 0;
    let complianceRate = 0;
    let responseTimeMinutes = 0;
    let protectedAssets = 0;
    let networkHealth = 0;
    let hasAnyData = false;

    const activeDataSources = Object.values(toolData).filter(tool => tool.data).length;
    hasAnyData = activeDataSources > 0;

    // Aggregate REAL data from all tools - NO MOCK DATA
    if (toolData.siem.data) {
      const siemData = toolData.siem.data as SIEMData;
      totalEvents += siemData.kpis.totalEvents || 0;
      activeThreats += (siemData.kpis.criticalAlerts || 0) + (siemData.kpis.highSeverityEvents || 0);
      if (siemData.kpis.averageResponseTime) {
        responseTimeMinutes = siemData.kpis.averageResponseTime / 60;
      }
    }

    if (toolData.gsuite.data) {
      const gsuiteData = toolData.gsuite.data as GSuiteData;
      totalEvents += gsuiteData.kpis.emailsScanned || 0;
      if (isEnhancedGSuiteData(gsuiteData)) {
        activeThreats += (gsuiteData.kpis.phishingAttempted || 0) + (gsuiteData.kpis.suspiciousEmails || 0);
      } else {
        activeThreats += (gsuiteData.kpis.phishingBlocked || 0) + (gsuiteData.kpis.suspiciousFlags || 0);
      }
    }

    if (toolData.mdm.data) {
      const mdmData = toolData.mdm.data as MDMData;
      protectedAssets += mdmData.kpis.totalDevices || 0;
      complianceRate = mdmData.kpis.complianceRate || 0;
    }

    if (toolData.edr.data) {
      const edrData = toolData.edr.data as EDRData;
      protectedAssets += edrData.kpis.totalEndpoints || 0;
      activeThreats += edrData.kpis.threatsDetected || 0;
    }

    if (toolData.meraki.data) {
      const merakiData = toolData.meraki.data as MerakiData | EnhancedMerakiData;
      
      if (isEnhancedMerakiData(merakiData)) {
        protectedAssets += merakiData.kpis.totalDevices || 0;
        networkHealth = merakiData.kpis.networkHealthScore || 0;
        
        if (merakiData.insights?.alerts) {
          activeThreats += merakiData.insights.alerts.filter(alert => 
            alert.severity === 'High' || alert.severity === 'Critical'
          ).length;
        }
      } else {
        protectedAssets += merakiData.kpis.totalDevices || 0;
        networkHealth = merakiData.kpis.networkUptime || 0;
        activeThreats += merakiData.kpis.securityIncidents || 0;
      }
    }

    if (toolData.sonicwall.data) {
      const sonicwallData = toolData.sonicwall.data as SonicWallData;
      activeThreats += sonicwallData.kpis.intrusionAttempts || 0;
      protectedAssets += sonicwallData.kpis.vpnConnections || 0;
    }

    // Production-ready Security Score with weighted components - NO MOCK DATA
    let securityScore = 0;
    if (hasAnyData) {
      let scoreComponents = {
        dataAvailability: 0,
        threatLevel: 0, 
        compliance: 0,
        networkHealth: 0,
        responseCapability: 0
      };
      
      // Data Availability Score (20%) - based on active monitoring tools
      scoreComponents.dataAvailability = Math.min(20, (activeDataSources / 6) * 20);
      
      // Threat Level Score (30%) - inverse scoring (fewer active threats = higher score)
      if (activeThreats === 0) scoreComponents.threatLevel = 30;
      else if (activeThreats <= 5) scoreComponents.threatLevel = 25;
      else if (activeThreats <= 20) scoreComponents.threatLevel = 15;
      else if (activeThreats <= 50) scoreComponents.threatLevel = 8;
      else scoreComponents.threatLevel = 0;
      
      // Compliance Score (20%) - only from actual MDM data
      if (toolData.mdm.data && complianceRate > 0) {
        scoreComponents.compliance = (complianceRate / 100) * 20;
      }
      
      // Network Health Score (20%) - only from actual Meraki data
      if (toolData.meraki.data && networkHealth > 0) {
        scoreComponents.networkHealth = (networkHealth / 100) * 20;
      }
      
      // Response Capability Score (10%) - only from actual SIEM data
      if (toolData.siem.data && responseTimeMinutes > 0) {
        if (responseTimeMinutes <= 5) scoreComponents.responseCapability = 10;
        else if (responseTimeMinutes <= 15) scoreComponents.responseCapability = 7;
        else if (responseTimeMinutes <= 30) scoreComponents.responseCapability = 4;
        else scoreComponents.responseCapability = 2;
      }
      
      securityScore = Math.round(
        scoreComponents.dataAvailability + 
        scoreComponents.threatLevel + 
        scoreComponents.compliance + 
        scoreComponents.networkHealth + 
        scoreComponents.responseCapability
      );
    }


    return [
      {
        label: "Security Score",
        value: hasAnyData ? `${securityScore}%` : "0%",
        icon: TrendingUp,
        severity: hasAnyData ? (securityScore >= 90 ? "low" : securityScore >= 75 ? "medium" : securityScore >= 50 ? "high" : "critical") : "none",
        description: "Overall security posture across all systems",
        calculation: "Weighted: Data Sources (20%) + Threat Level (30%) + Compliance (20%) + Network Health (20%) + Response Time (10%)",
        priority: "top",
        hasData: hasAnyData,
        lastUpdated: new Date()
      },
      {
        label: "Active Threats",
        value: hasAnyData ? activeThreats.toString() : "0",
        icon: AlertTriangle,
        severity: hasAnyData ? (activeThreats > 50 ? "critical" : activeThreats > 20 ? "high" : activeThreats > 10 ? "medium" : "low") : "none",
        description: "Critical and high-severity threats requiring attention",
        calculation: "Sum of critical + high severity events from SIEM, GSuite phishing/malware, Meraki security incidents, and SonicWall intrusions",
        priority: "top",
        hasData: hasAnyData && activeThreats > 0,
        lastUpdated: new Date()
      },
      {
        label: "Response Time",
        value: hasAnyData && responseTimeMinutes > 0 ? `${Math.round(responseTimeMinutes)}m` : "N/A",
        icon: Clock,
        severity: hasAnyData && responseTimeMinutes > 0 ? (responseTimeMinutes <= 5 ? "low" : responseTimeMinutes <= 15 ? "medium" : responseTimeMinutes <= 30 ? "high" : "critical") : "none",
        description: "Average time to respond to security incidents",
        calculation: "Average response time from SIEM data converted from seconds to minutes",
        priority: "top",
        hasData: hasAnyData && responseTimeMinutes > 0,
        lastUpdated: new Date()
      },
      {
        label: "Total Events",
        value: hasAnyData ? formatNumber(totalEvents) : "0",
        icon: Database,
        severity: hasAnyData ? (totalEvents > 100000 ? "high" : totalEvents > 10000 ? "medium" : totalEvents > 1000 ? "low" : "info") : "none",
        description: "Total security events processed across all systems",
        calculation: "Sum of all events from SIEM, GSuite email scans, and other security monitoring tools",
        priority: "top",
        hasData: hasAnyData && totalEvents > 0,
        lastUpdated: new Date()
      },
    ];
  };

  const globalKPIs = calculateGlobalKPIs();
  const topKPIs = globalKPIs.filter(kpi => kpi.priority === 'top');
  const activeDataSources = Object.values(toolData).filter(tool => tool.data).length;

  return (
    <AnimatedSection className="w-[98%] max-w-8xl mx-auto mb-6" delay={0}>
      <div className="
        relative overflow-visible
        backdrop-blur-2xl 
        bg-background/60 dark:bg-background/40 
        border border-border/30 dark:border-border/20
        rounded-2xl
        shadow-xl shadow-black/5 dark:shadow-black/20
        transition-all duration-300
        hover:shadow-2xl hover:shadow-black/8 dark:hover:shadow-black/30
        hover:bg-background/70 dark:hover:bg-background/50
      ">
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/5 pointer-events-none" />
        
        <div className="relative px-8 py-6">
          <FadeIn delay={0}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground leading-tight">Security Overview</h2>
                <p className="text-base text-muted-foreground">Production-ready security metrics based on real data only</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="flex items-center gap-1 bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
                  Live Monitoring
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                  <Zap className="h-4 w-4" />
                  {activeDataSources} Sources
                </Badge>
              </div>
            </div>
          </FadeIn>

          {/* Top Priority KPIs */}
          <AnimatedSection delay={200} duration={0.4}>
            <div className="mb-8">
              <FadeIn delay={50}>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Critical Security Metrics
                </h3>
              </FadeIn>
              <StaggeredList 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                staggerDelay={100}
              >
                {topKPIs.map((kpi, index) => {
                const Icon = kpi.icon;
                
                return (
                  <AnimatedCard 
                    key={index}
                    hoverScale={1.02}
                    hoverY={-4}
                    className={`
                      relative overflow-visible h-full
                      backdrop-blur-xl 
                      bg-background/40 dark:bg-background/30 
                      border ${getSeverityColor(kpi.severity, kpi.hasData)}
                      rounded-xl
                      shadow-lg shadow-black/5 dark:shadow-black/20
                      transition-all duration-200 ease-out
                      hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30
                      hover:bg-background/50 dark:hover:bg-background/40
                    `}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
                    
                    <CardContent className="p-5 relative h-full flex flex-col">
                      <div className="flex items-center justify-between mb-3 min-h-[24px]">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Icon className={`h-5 w-5 flex-shrink-0 ${getSeverityTextColor(kpi.severity, kpi.hasData)}`} />
                          <span className="text-sm font-semibold text-foreground truncate">{kpi.label}</span>
                        </div>
                            
                        <KPITooltip
                          label={kpi.label}
                          description={kpi.description}
                          calculation={kpi.calculation}
                          value={kpi.value}
                          lastUpdated={kpi.lastUpdated}
                          severity={kpi.severity}
                          hasData={kpi.hasData}
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col justify-between">
                        <div className={`text-3xl font-bold mb-3 min-h-[40px] flex items-center ${getSeverityTextColor(kpi.severity, kpi.hasData)}`}>
                          {kpi.value}
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {kpi.description}
                        </div>
                      </div>
                    </CardContent>
                    
                    <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
                  </AnimatedCard>
                );
              })}
              </StaggeredList>
            </div>
          </AnimatedSection>

        </div>

        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>
    </AnimatedSection>
  );
};