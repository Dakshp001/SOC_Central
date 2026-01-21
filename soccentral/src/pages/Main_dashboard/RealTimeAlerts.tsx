// Real-time Alert Banner Component - Phase 1 Implementation
// Displays critical security alerts with scrolling ticker and status indicators

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Shield,
  Clock,
  Users,
  Activity,
  ChevronRight,
  Zap,
  Bell,
  X,
} from "lucide-react";
import { useToolData } from "@/contexts/ToolDataContext";

interface Alert {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  source: string;
  timestamp: Date;
  status: "active" | "investigating" | "resolved";
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400";
    case "high":
      return "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400";
    case "medium":
      return "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400";
    case "low":
      return "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400";
    default:
      return "bg-gray-500/10 border-gray-500/30 text-gray-600 dark:text-gray-400";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300";
    case "investigating":
      return "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300";
    case "resolved":
      return "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300";
    default:
      return "bg-gray-100 dark:bg-gray-950/50 text-gray-700 dark:text-gray-300";
  }
};

export const RealTimeAlerts: React.FC = () => {
  const { toolData } = useToolData();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);

  // Generate real-time alerts based on actual tool data
  useEffect(() => {
    const generateRealTimeAlerts = (): Alert[] => {
      const generatedAlerts: Alert[] = [];
      const now = new Date();

      // Generate alerts from SIEM data
      if (toolData.siem.data) {
        const siemData = toolData.siem.data;
        if (siemData.kpis.criticalAlerts > 0) {
          generatedAlerts.push({
            id: "siem-critical",
            severity: "critical",
            title: `${siemData.kpis.criticalAlerts} Critical Security Events`,
            description:
              "Multiple high-severity security incidents detected requiring immediate attention",
            source: "SIEM",
            timestamp: new Date(now.getTime() - Math.random() * 3600000),
            status: "active",
          });
        }
        if (siemData.kpis.highSeverityEvents > 10) {
          generatedAlerts.push({
            id: "siem-high-volume",
            severity: "high",
            title: "High Volume Security Events",
            description: `${siemData.kpis.highSeverityEvents} high-severity events in the last hour`,
            source: "SIEM",
            timestamp: new Date(now.getTime() - Math.random() * 1800000),
            status: "investigating",
          });
        }
      }

      // Generate alerts from GSuite data
      if (toolData.gsuite.data) {
        const gsuiteData = toolData.gsuite.data;
        // Handle both phishingBlocked (BaseGSuiteData) and phishingAttempted (EnhancedGSuiteData)
        const phishingCount =
          (gsuiteData.kpis as any).phishingBlocked ||
          gsuiteData.kpis.phishingAttempted ||
          0;
        
        if (phishingCount > 50) {
          generatedAlerts.push({
            id: "gsuite-phishing-critical",
            severity: "critical",
            title: "Critical Phishing Campaign",
            description: `${phishingCount} phishing attempts detected - coordinated attack in progress`,
            source: "GSuite Security",
            timestamp: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
            status: "active",
          });
        } else if (phishingCount > 20) {
          generatedAlerts.push({
            id: "gsuite-phishing-high",
            severity: "high",
            title: "Elevated Phishing Activity",
            description: `${phishingCount} phishing attempts detected in the last hour`,
            source: "GSuite Security",
            timestamp: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
            status: "investigating",
          });
        } else if (phishingCount > 5) {
          generatedAlerts.push({
            id: "gsuite-phishing-medium",
            severity: "medium",
            title: "Phishing Attempts Detected",
            description: `${phishingCount} phishing attempts detected and blocked`,
            source: "GSuite Security",
            timestamp: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
            status: "investigating",
          });
        }

        // Get additional properties safely if they exist in enhanced variant
        const suspiciousLogins = (gsuiteData.kpis as any).suspiciousLogins || 0;
        const failedLogins = (gsuiteData.kpis as any).failedLogins || 0;

        // Suspicious login alerts
        if (suspiciousLogins > 20) {
          generatedAlerts.push({
            id: "gsuite-suspicious-logins",
            severity: "high",
            title: "Suspicious Authentication Activity",
            description: `${suspiciousLogins} suspicious login attempts from unusual locations`,
            source: "GSuite Authentication",
            timestamp: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
            status: "investigating",
          });
        } else if (suspiciousLogins > 10) {
          generatedAlerts.push({
            id: "gsuite-suspicious-logins-medium",
            severity: "medium",
            title: "Elevated Login Anomalies",
            description: `${suspiciousLogins} suspicious login attempts detected`,
            source: "GSuite Authentication",
            timestamp: new Date(now.getTime() - 25 * 60 * 1000), // 25 minutes ago
            status: "investigating",
          });
        }

        // Failed login alerts
        if (failedLogins > 100) {
          generatedAlerts.push({
            id: "gsuite-failed-logins",
            severity: "medium",
            title: "High Failed Login Volume",
            description: `${failedLogins} failed login attempts - potential brute force attack`,
            source: "GSuite Authentication",
            timestamp: new Date(now.getTime() - 20 * 60 * 1000), // 20 minutes ago
            status: "investigating",
          });
        }

        // Suspicious emails alert (using guaranteed property)
        const suspiciousEmails = gsuiteData.kpis.suspiciousEmails || 0;
        if (suspiciousEmails > 500) {
          generatedAlerts.push({
            id: "gsuite-suspicious-emails",
            severity: "high",
            title: "High Volume Suspicious Emails",
            description: `${suspiciousEmails} suspicious emails detected and quarantined`,
            source: "GSuite Security",
            timestamp: new Date(now.getTime() - 35 * 60 * 1000), // 35 minutes ago
            status: "investigating",
          });
        }

        // Client investigations alert
        const clientInvestigations = gsuiteData.kpis.clientInvestigations || 0;
        if (clientInvestigations > 10) {
          generatedAlerts.push({
            id: "gsuite-client-investigations",
            severity: "medium",
            title: "Multiple Security Investigations",
            description: `${clientInvestigations} security investigations initiated based on email analysis`,
            source: "GSuite Security",
            timestamp: new Date(now.getTime() - 42 * 60 * 1000), // 42 minutes ago
            status: "investigating",
          });
        }
      }

      // Generate alerts from EDR data
      if (toolData.edr.data) {
        const edrData = toolData.edr.data;
        const threatsDetected = edrData.kpis.threatsDetected || 0;
        const totalEndpoints = edrData.kpis.totalEndpoints || 0;
        
        if (threatsDetected > 15) {
          const endpointText = totalEndpoints > 0 ? `across ${totalEndpoints} endpoints` : 'on multiple endpoints';
          generatedAlerts.push({
            id: "edr-threats-critical",
            severity: "critical",
            title: "Critical Endpoint Threat Storm",
            description: `${threatsDetected} active threats ${endpointText} - immediate response required`,
            source: "EDR System",
            timestamp: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
            status: "active",
          });
        } else if (threatsDetected > 5) {
          generatedAlerts.push({
            id: "edr-threats-high",
            severity: "high",
            title: "Multiple Endpoint Threats",
            description: `${threatsDetected} active malware detections require investigation`,
            source: "EDR System",
            timestamp: new Date(now.getTime() - 12 * 60 * 1000), // 12 minutes ago
            status: "investigating",
          });
        } else if (threatsDetected > 0) {
          generatedAlerts.push({
            id: "edr-threats-medium",
            severity: "medium",
            title: "Endpoint Threats Detected",
            description: `${threatsDetected} threats detected and contained on endpoints`,
            source: "EDR System",
            timestamp: new Date(now.getTime() - 18 * 60 * 1000), // 18 minutes ago
            status: "investigating",
          });
        }
      }

      // Generate alerts from SonicWall data
      if (toolData.sonicwall.data) {
        const sonicwallData = toolData.sonicwall.data;
        if (sonicwallData.kpis.intrusionAttempts > 500) {
          generatedAlerts.push({
            id: "sonicwall-intrusion-critical",
            severity: "critical",
            title: "Massive Network Attack",
            description: `${sonicwallData.kpis.intrusionAttempts} intrusion attempts - coordinated network attack in progress`,
            source: "SonicWall Firewall",
            timestamp: new Date(now.getTime() - 8 * 60 * 1000), // 8 minutes ago
            status: "active",
          });
        } else if (sonicwallData.kpis.intrusionAttempts > 200) {
          generatedAlerts.push({
            id: "sonicwall-intrusion-high",
            severity: "high",
            title: "High Volume Network Attacks",
            description: `${sonicwallData.kpis.intrusionAttempts} intrusion attempts detected at network perimeter`,
            source: "SonicWall Firewall",
            timestamp: new Date(now.getTime() - 22 * 60 * 1000), // 22 minutes ago
            status: "investigating",
          });
        } else if (sonicwallData.kpis.intrusionAttempts > 50) {
          generatedAlerts.push({
            id: "sonicwall-intrusion-medium",
            severity: "medium",
            title: "Network Intrusion Attempts",
            description: `${sonicwallData.kpis.intrusionAttempts} intrusion attempts blocked at firewall`,
            source: "SonicWall Firewall",
            timestamp: new Date(now.getTime() - 35 * 60 * 1000), // 35 minutes ago
            status: "investigating",
          });
        }
      }

      // Generate alerts from Meraki data
      if (toolData.meraki.data) {
        const merakiData = toolData.meraki.data;
        
        // Check for security events
        if ('securityEvents' in merakiData.kpis && (merakiData.kpis as any).securityEvents > 100) {
          generatedAlerts.push({
            id: "meraki-security-events",
            severity: "high",
            title: "Network Security Events",
            description: `${(merakiData.kpis as any).securityEvents} security events detected across network infrastructure`,
            source: "Meraki Network",
            timestamp: new Date(now.getTime() - 28 * 60 * 1000), // 28 minutes ago
            status: "investigating",
          });
        } else if ('securityEvents' in merakiData.kpis && (merakiData.kpis as any).securityEvents > 50) {
          generatedAlerts.push({
            id: "meraki-security-events-medium",
            severity: "medium",
            title: "Network Security Events",
            description: `${(merakiData.kpis as any).securityEvents} security events detected on network`,
            source: "Meraki Network",
            timestamp: new Date(now.getTime() - 40 * 60 * 1000), // 40 minutes ago
            status: "investigating",
          });
        }

        // Check for network health issues
        if ('networkHealthScore' in merakiData.kpis && (merakiData.kpis as any).networkHealthScore < 70) {
          generatedAlerts.push({
            id: "meraki-network-health",
            severity: "medium",
            title: "Network Health Degraded",
            description: `Network health score dropped to ${(merakiData.kpis as any).networkHealthScore}% - performance issues detected`,
            source: "Meraki Network",
            timestamp: new Date(now.getTime() - 32 * 60 * 1000), // 32 minutes ago
            status: "investigating",
          });
        }
      }

      // Only show alerts if we have real data - no sample/mock alerts

      return generatedAlerts.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    };

    setAlerts(generateRealTimeAlerts());
  }, [toolData]);

  // Rotate through alerts for ticker display
  useEffect(() => {
    if (alerts.length > 1) {
      const interval = setInterval(() => {
        setCurrentAlertIndex((prev) => (prev + 1) % alerts.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [alerts.length]);

  const activeAlerts = alerts.filter(
    (alert) =>
      !dismissed.includes(alert.id) &&
      (alert.status === "active" || alert.status === "investigating")
  );

  const dismissAlert = (alertId: string) => {
    setDismissed((prev) => [...prev, alertId]);
  };

  if (activeAlerts.length === 0) {
    return null;
  }

  const currentAlert = activeAlerts[currentAlertIndex % activeAlerts.length];

  return (
    <div className="w-[98%] max-w-8xl mx-auto mb-6">
      <Card
        className={`border-2 ${getSeverityColor(
          currentAlert.severity
        )} transition-all duration-500`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Alert Content */}
            <div className="flex items-center gap-4 flex-1">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Bell className="h-5 w-5 text-red-600 dark:text-red-400 animate-pulse" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getSeverityColor(currentAlert.severity)}>
                    {currentAlert.severity.toUpperCase()}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getStatusColor(currentAlert.status)}
                  >
                    {currentAlert.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {currentAlert.source}
                  </span>
                </div>

                <div className="font-semibold text-foreground mb-1">
                  {currentAlert.title}
                </div>

                <div className="text-sm text-muted-foreground">
                  {currentAlert.description}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {currentAlert.timestamp.toLocaleTimeString()}
              </div>

              {activeAlerts.length > 1 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {currentAlertIndex + 1} of {activeAlerts.length}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                onClick={() => dismissAlert(currentAlert.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Progress bar for alert rotation */}
          {activeAlerts.length > 1 && (
            <div className="mt-3 w-full bg-muted/30 rounded-full h-1">
              <div
                className="bg-primary/60 h-1 rounded-full transition-all duration-5000 ease-linear"
                style={{
                  width: `${
                    ((currentAlertIndex + 1) / activeAlerts.length) * 100
                  }%`,
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
