// Recent Incidents Timeline Component - Phase 1 Implementation
// Displays chronological timeline of recent security incidents and responses

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  AlertTriangle,
  Shield,
  User,
  CheckCircle,
  Play,
  Pause,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToolData } from "@/contexts/ToolDataContext";

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "investigating" | "resolved" | "closed";
  assignee: string;
  source: string;
  timestamp: Date;
  resolution?: string;
  responseTime?: number; // in minutes
  tags: string[];
}

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case "critical":
      return {
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-950/50",
        border: "border-red-200 dark:border-red-800",
        dot: "bg-red-500",
      };
    case "high":
      return {
        color: "text-orange-600 dark:text-orange-400",
        bg: "bg-orange-100 dark:bg-orange-950/50",
        border: "border-orange-200 dark:border-orange-800",
        dot: "bg-orange-500",
      };
    case "medium":
      return {
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-950/50",
        border: "border-yellow-200 dark:border-yellow-800",
        dot: "bg-yellow-500",
      };
    case "low":
      return {
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-100 dark:bg-blue-950/50",
        border: "border-blue-200 dark:border-blue-800",
        dot: "bg-blue-500",
      };
    default:
      return {
        color: "text-gray-600 dark:text-gray-400",
        bg: "bg-gray-100 dark:bg-gray-950/50",
        border: "border-gray-200 dark:border-gray-800",
        dot: "bg-gray-500",
      };
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "open":
      return {
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-100 dark:bg-red-950/50",
      };
    case "investigating":
      return {
        color: "text-yellow-600 dark:text-yellow-400",
        bg: "bg-yellow-100 dark:bg-yellow-950/50",
      };
    case "resolved":
      return {
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-100 dark:bg-green-950/50",
      };
    case "closed":
      return {
        color: "text-gray-600 dark:text-gray-400",
        bg: "bg-gray-100 dark:bg-gray-950/50",
      };
    default:
      return {
        color: "text-gray-600 dark:text-gray-400",
        bg: "bg-gray-100 dark:bg-gray-950/50",
      };
  }
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export const RecentIncidents: React.FC = () => {
  const { toolData } = useToolData();
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const incidentsPerPage = 3;

  // Extract real incidents from actual tool data - NO MOCK DATA
  const incidents = useMemo((): Incident[] => {
    const incidents: Incident[] = [];

    // EDR Threats - Use real threat data from details.threats
    if (
      toolData.edr.data?.details?.threats &&
      toolData.edr.data.details.threats.length > 0
    ) {
      toolData.edr.data.details.threats.forEach((threat, index) => {
        // Map threat confidence level to severity
        const getSeverityFromConfidence = (
          confidence: string
        ): "critical" | "high" | "medium" | "low" => {
          if (confidence?.toLowerCase().includes("high")) return "high";
          if (confidence?.toLowerCase().includes("medium")) return "medium";
          if (confidence?.toLowerCase().includes("low")) return "low";
          if (confidence?.toLowerCase().includes("malicious"))
            return "critical";
          return "medium";
        };

        // Map confidence level to status (since incident_status was removed)
        const getStatusFromConfidence = (
          confidence: string
        ): "open" | "investigating" | "resolved" | "closed" => {
          const conf = confidence?.toLowerCase() || "";
          if (conf.includes("malicious")) return "investigating";
          if (conf.includes("suspicious")) return "investigating";
          return "investigating";
        };

        incidents.push({
          id: `edr-threat-${index}`,
          title: threat.classification || "EDR Threat Detection",
          description:
            threat.threat_details || `Threat detected on ${threat.endpoints}`,
          severity: getSeverityFromConfidence(threat.confidence_level),
          status: getStatusFromConfidence(threat.confidence_level),
          assignee: threat.analyst_verdict || "EDR Security Team",
          source: "EDR",
          timestamp: threat.reported_time
            ? new Date(threat.reported_time)
            : new Date(threat.identifying_time || new Date()),
          responseTime:
            threat.reported_time && threat.identifying_time
              ? Math.abs(
                  new Date(threat.identifying_time).getTime() -
                    new Date(threat.reported_time).getTime()
                ) /
                (1000 * 60)
              : undefined,
          resolution: threat.completed_actions || undefined,
          tags: [
            threat.classification || "Threat",
            "Endpoint",
            threat.detecting_engine || "EDR",
          ].filter(Boolean),
        });
      });
    }

    // GSuite Phishing Attempts - Use real data from details.phishingAttempted
    if (
      toolData.gsuite.data?.details?.phishingAttempted &&
      toolData.gsuite.data.details.phishingAttempted.length > 0
    ) {
      toolData.gsuite.data.details.phishingAttempted.forEach(
        (phishing, index) => {
          const getSeverityFromAlert = (
            alertType: string
          ): "critical" | "high" | "medium" | "low" => {
            if (alertType?.toLowerCase().includes("critical"))
              return "critical";
            if (alertType?.toLowerCase().includes("high")) return "high";
            if (alertType?.toLowerCase().includes("medium")) return "medium";
            return "low";
          };

          incidents.push({
            id: `gsuite-phishing-${index}`,
            title: "Phishing Email Detected",
            description: `${phishing["Alert Type"]} reported by ${phishing["Reported By User"]}`,
            severity: getSeverityFromAlert(phishing.Severity),
            status: "resolved", // Phishing attempts are typically resolved quickly
            assignee: "Email Security Team",
            source: "Email Security",
            timestamp: new Date(phishing["Date Reported"]),
            tags: ["Phishing", "Email", phishing["Alert Type"]].filter(Boolean),
          });
        }
      );
    }

    // GSuite Suspicious Emails - Use real data from details.suspiciousEmails
    if (
      toolData.gsuite.data?.details?.suspiciousEmails &&
      toolData.gsuite.data.details.suspiciousEmails.length > 0
    ) {
      toolData.gsuite.data.details.suspiciousEmails.forEach(
        (suspicious, index) => {
          const getSeverityFromAlert = (
            alertType: string
          ): "critical" | "high" | "medium" | "low" => {
            if (alertType?.toLowerCase().includes("critical"))
              return "critical";
            if (alertType?.toLowerCase().includes("high")) return "high";
            if (alertType?.toLowerCase().includes("medium")) return "medium";
            return "low";
          };

          incidents.push({
            id: `gsuite-suspicious-${index}`,
            title: "Suspicious Email Detected",
            description: `${suspicious["Alert Type"]} reported by ${suspicious["Reported By User"]}`,
            severity: getSeverityFromAlert(suspicious.Severity),
            status: "investigating",
            assignee: "Email Security Team",
            source: "Email Security",
            timestamp: new Date(suspicious["Date Reported"]),
            tags: [
              "Suspicious Email",
              "Email",
              suspicious["Alert Type"],
            ].filter(Boolean),
          });
        }
      );
    }

    // Only return real data incidents - NO FALLBACK MOCK DATA
    return incidents
      .filter((incident) => incident.title && incident.description) // Only incidents with real data
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [toolData]);

  // Calculate pagination
  const totalPages = Math.ceil(incidents.length / incidentsPerPage);
  const startIndex = (currentPage - 1) * incidentsPerPage;
  const endIndex = startIndex + incidentsPerPage;
  const displayIncidents = incidents.slice(startIndex, endIndex);

  const toggleExpanded = (incidentId: string) => {
    setExpandedIncident(expandedIncident === incidentId ? null : incidentId);
  };

  return (
    <div className="w-[98%] max-w-8xl mx-auto mb-6">
      <div
        className="
        relative overflow-visible
        bg-white dark:bg-black
        border border-gray-200 dark:border-gray-800
        rounded-2xl
        shadow-xl shadow-gray-900/10 dark:shadow-black/50
        transition-all duration-300
        hover:shadow-2xl hover:shadow-gray-900/20 dark:hover:shadow-black/70
        hover:border-gray-300 dark:hover:border-gray-700
      "
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100/20 dark:from-gray-900/20 via-transparent to-gray-100/20 dark:to-gray-900/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-100/10 dark:from-gray-900/10 via-transparent to-gray-100/5 dark:to-gray-900/5 pointer-events-none" />

        <div className="relative px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-3">
                <Activity className="h-6 w-6 text-purple-500 dark:text-purple-400" />
                Recent Security Incidents
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300">
                Timeline of security events and response activities
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-green-600 dark:text-green-400 border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/30"
              >
                MTTR:{" "}
                {Math.floor(
                  incidents.reduce(
                    (acc, inc) => acc + (inc.responseTime || 0),
                    0
                  ) / incidents.length
                ) || 0}
                m avg
              </Badge>
              <Badge
                variant="outline"
                className="text-blue-600 dark:text-blue-400 border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/30"
              >
                {
                  incidents.filter(
                    (i) => i.status === "open" || i.status === "investigating"
                  ).length
                }{" "}
                Active
              </Badge>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {displayIncidents.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Recent Incidents
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No security incidents detected from connected data sources.
                  This indicates your security systems are operating normally.
                </p>
              </div>
            ) : (
              displayIncidents.map((incident, index) => {
                const severityConfig = getSeverityConfig(incident.severity);
                const statusConfig = getStatusConfig(incident.status);
                const isExpanded = expandedIncident === incident.id;

                return (
                  <div key={incident.id} className="relative">
                    <Card className="border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-900/50 transition-all duration-200 hover:shadow-md hover:bg-gray-100/70 dark:hover:bg-gray-900/70">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {incident.title}
                                  </h3>
                                  <Badge
                                    className={`text-xs ${severityConfig.color} ${severityConfig.bg}`}
                                  >
                                    {incident.severity.toUpperCase()}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${statusConfig.color} ${statusConfig.bg}`}
                                  >
                                    {incident.status.toUpperCase()}
                                  </Badge>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                  {incident.description}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {incident.assignee}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    {incident.source}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTimeAgo(incident.timestamp)}
                                  </div>
                                  {incident.responseTime && (
                                    <div>
                                      Response:{" "}
                                      {Math.round(incident.responseTime)}m
                                    </div>
                                  )}
                                </div>

                                {/* Tags */}
                                <div className="flex items-center gap-1 mt-2">
                                  {incident.tags
                                    .slice(0, 3)
                                    .map((tag, tagIndex) => (
                                      <Badge
                                        key={tagIndex}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleExpanded(incident.id)}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-border/30 bg-gray-100 dark:bg-black rounded-lg p-4 -mx-2">
                                <div className="space-y-3">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                      Incident Details
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      Reported at{" "}
                                      {incident.timestamp.toLocaleString()}
                                    </p>
                                  </div>

                                  {incident.resolution && (
                                    <div>
                                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                        Resolution
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {incident.resolution}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-300 dark:border-gray-700">
                                    <div>
                                      Severity:{" "}
                                      <span className="text-gray-900 dark:text-white">
                                        {incident.severity}
                                      </span>
                                    </div>
                                    <div>
                                      Status:{" "}
                                      <span className="text-gray-900 dark:text-white">
                                        {incident.status}
                                      </span>
                                    </div>
                                    {incident.responseTime && (
                                      <div>
                                        Response Time:{" "}
                                        <span className="text-gray-900 dark:text-white">
                                          {Math.round(incident.responseTime)}m
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages} ({incidents.length} total
                incidents)
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="bg-white dark:bg-black text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 min-w-[40px]"
                  >
                    {currentPage}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="bg-white dark:bg-black text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
      </div>
    </div>
  );
};
