// Updated KPI Grid Component with Enhanced Device Modal
// src/components/dashboards/MDM/components/KPIGrid.tsx

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Smartphone,
  Shield,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
} from "lucide-react";
import { MDMKPIs, MDMDetails, EnhancedSecurityViolation } from "../types";
import { formatNumber } from "../utils";
import { DeviceDetailsModal } from "./DeviceDetailsModal";
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface KPIGridProps {
  kpis: MDMKPIs;
  details: MDMDetails;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis, details }) => {
  const { actualTheme } = useTheme();
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);

  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const cardHover = "hover:bg-card/80";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";

  // Create enhanced security violations for the modal
  const enhancedViolations: EnhancedSecurityViolation[] = useMemo(() => {
    if (!details) return [];

    // Helper function to calculate percentage and severity
    const calculatePercentage = (value: number, total: number): number => {
      return total > 0 ? (value / total) * 100 : 0;
    };

    const getSeverityFromPercentage = (percentage: number, violationType: string): "critical" | "high" | "medium" | "low" => {
      if (violationType === "compromised" && percentage > 0) return "critical";
      if (percentage > 15) return "high";
      if (percentage > 5) return "medium";
      if (percentage > 0) return "low";
      return "low";
    };

    const violations = [
      {
        type: "total",
        count: kpis.totalDevices,
        description: "Total devices in the system",
        color: "#3B82F6",
        // Respect backend filtering - if KPI is 0, show no devices
        devices: kpis.totalDevices > 0 ? (details.allUsers || []) : [],
      },
      {
        type: "enrolled",
        count: kpis.enrolledDevices,
        description: "Enrolled devices",
        color: "#10B981",
        // Respect backend filtering - if KPI is 0, show no devices
        devices: kpis.enrolledDevices > 0 
          ? (details.allUsers || []).filter((device: any) => {
              const enrollment = device.Enrollment || device.enrollment || device.EnrollmentStatus || "";
              return enrollment.toLowerCase().includes('enrolled') || enrollment.toLowerCase() === 'active';
            }).slice(0, kpis.enrolledDevices) // Limit to KPI count for consistency
          : [], // If KPI is 0, show no devices (respects backend filtering)
      },
      {
        type: "compliant",
        count: kpis.compliantDevices,
        description: "Compliant devices",
        color: "#10B981",
        // Respect backend filtering - if KPI is 0, show no devices
        devices: kpis.compliantDevices > 0 
          ? (details.allUsers || []).filter((device: any) => {
              const compliance = device["Compliance Status"] || device.compliance_status || device.ComplianceStatus || "";
              return compliance.toLowerCase().includes('compliant');
            }).slice(0, kpis.compliantDevices) // Limit to KPI count for consistency
          : [], // If KPI is 0, show no devices (respects backend filtering)
      },
      {
        type: "non_compliant",
        count: kpis.nonCompliantDevices,
        description: "Non-compliant devices",
        color: "#F97316",
        // Respect backend filtering - backend already filters nonCompliant data
        devices: kpis.nonCompliantDevices > 0 ? (details.nonCompliant || []) : [],
      },
      {
        type: "security_issues",
        count: kpis.securityIssues,
        description: "Devices with security issues",
        color: "#EF4444",
        // Respect backend filtering - if KPI is 0, show no devices
        devices: kpis.securityIssues > 0 
          ? [
              ...(details.noPass || []),
              ...(details.notEncrypted || []),
              ...(details.nonCompliant || []),
              ...((details.allUsers || []).filter((device: any) => {
                const compromised = device.Compromised || device.compromised || "";
                return compromised.toString().toLowerCase() === "y";
              })),
            ]
          : [], // If KPI is 0, show no devices (respects backend filtering)
      },
    ];

    return violations.map((violation) => {
      const percentage = calculatePercentage(violation.count, kpis.totalDevices);
      const severity = getSeverityFromPercentage(percentage, violation.type);

      return {
        ...violation,
        percentage,
        severity,
      };
    });
  }, [kpis, details]);

  // Theme-aware KPI items configuration
  const getThemeAwareColors = () => {
    if (actualTheme === 'dark') {
      return {
        blue: { bg: 'bg-blue-900/30', border: 'border-blue-800', text: 'text-blue-400', value: textPrimary },
        green: { bg: 'bg-green-900/30', border: 'border-green-800', text: 'text-green-400', value: 'text-green-400' },
        orange: { bg: 'bg-orange-900/30', border: 'border-orange-800', text: 'text-orange-400', value: 'text-orange-400' },
        red: { bg: 'bg-red-900/30', border: 'border-red-800', text: 'text-red-400', value: 'text-red-400' },
        purple: { bg: 'bg-purple-900/30', border: 'border-purple-800', text: 'text-purple-400', value: 'text-purple-400' }
      };
    } else {
      return {
        blue: { bg: 'bg-blue-100/50', border: 'border-blue-300', text: 'text-blue-600', value: textPrimary },
        green: { bg: 'bg-green-100/50', border: 'border-green-300', text: 'text-green-600', value: 'text-green-600' },
        orange: { bg: 'bg-orange-100/50', border: 'border-orange-300', text: 'text-orange-600', value: 'text-orange-600' },
        red: { bg: 'bg-red-100/50', border: 'border-red-300', text: 'text-red-600', value: 'text-red-600' },
        purple: { bg: 'bg-purple-100/50', border: 'border-purple-300', text: 'text-purple-600', value: 'text-purple-600' }
      };
    }
  };

  const colors = getThemeAwareColors();

  const kpiItems = [
    {
      title: "Total Devices",
      value: formatNumber(kpis.totalDevices),
      icon: Smartphone,
      bgColor: colors.blue.bg,
      borderColor: colors.blue.border,
      textColor: colors.blue.text,
      valueColor: colors.blue.value,
      modalKey: "total",
      hasModal: true,
    },
    {
      title: "Enrolled",
      value: formatNumber(kpis.enrolledDevices),
      icon: Users,
      bgColor: colors.green.bg,
      borderColor: colors.green.border,
      textColor: colors.green.text,
      valueColor: colors.green.value,
      showProgress: true,
      progressValue: kpis.enrollmentRate,
      modalKey: "enrolled",
      hasModal: true,
    },
    {
      title: "Compliant",
      value: formatNumber(kpis.compliantDevices),
      icon: CheckCircle,
      bgColor: colors.green.bg,
      borderColor: colors.green.border,
      textColor: colors.green.text,
      valueColor: colors.green.value,
      subtitle: `${kpis.complianceRate.toFixed(1)}%`,
      modalKey: "compliant",
      hasModal: true,
    },
    {
      title: "Non-Compliant",
      value: formatNumber(kpis.nonCompliantDevices),
      icon: AlertTriangle,
      bgColor: colors.orange.bg,
      borderColor: colors.orange.border,
      textColor: colors.orange.text,
      valueColor: colors.orange.value,
      modalKey: "non_compliant",
      hasModal: true,
    },
    {
      title: "Security Issues",
      value: formatNumber(kpis.securityIssues),
      icon: Shield,
      bgColor: colors.red.bg,
      borderColor: colors.red.border,
      textColor: colors.red.text,
      valueColor: colors.red.value,
      modalKey: "security_issues",
      hasModal: true,
    },
    {
      title: "Security Score",
      value: kpis.securityScore.toFixed(2),
      icon: Target,
      bgColor: colors.purple.bg,
      borderColor: colors.purple.border,
      textColor: colors.purple.text,
      valueColor: colors.purple.value,
      showProgress: true,
      progressValue: kpis.securityScore,
      hasModal: false,
    },
  ];

  const handleKPIClick = (modalKey: string) => {
    if (modalKey) {
      setSelectedKPI(modalKey);
    }
  };

  const getModalTitle = (modalKey: string): string => {
    const titles: Record<string, string> = {
      total: "All Devices",
      enrolled: "Enrolled Devices",
      compliant: "Compliant Devices",
      non_compliant: "Non-Compliant Devices",
      security_issues: "Security Issues",
    };
    return titles[modalKey] || "Device List";
  };

  // Find the current violation for the modal
  const currentViolation = useMemo(() => {
    if (!selectedKPI) return null;
    return enhancedViolations.find(v => v.type === selectedKPI) || null;
  }, [selectedKPI, enhancedViolations]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {kpiItems.map((item, index) => (
          <Card 
            key={index} 
            className={`${cardBg} transition-all duration-200 ${
              item.hasModal 
                ? `cursor-pointer hover:shadow-lg hover:scale-[1.02] ${cardHover} hover:border-blue-500 group` 
                : ''
            }`}
            onClick={() => item.hasModal && handleKPIClick(item.modalKey)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${item.bgColor} rounded-lg flex items-center justify-center border ${item.borderColor} transition-all duration-200 ${
                  item.hasModal ? 'group-hover:scale-110' : ''
                }`}>
                  <item.icon className={`h-5 w-5 ${item.textColor}`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${textSecondary} mb-1`}>
                    {item.title}
                  </p>
                  <p className={`text-xl font-bold ${item.valueColor} mb-1`}>
                    {item.value}
                  </p>
                  {item.subtitle && (
                    <p className={`text-xs ${textSecondary} mb-1`}>
                      {item.subtitle}
                    </p>
                  )}
                  {item.showProgress && (
                    <Progress 
                      value={item.progressValue} 
                      className="mt-1 h-1.5 mb-1" 
                    />
                  )}
                  {item.hasModal && (
                    <p className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Click to view details →
                    </p>
                  )}
                </div>
              </div>
              {item.hasModal && (
                <div className={`absolute inset-0 ${actualTheme === 'dark' ? 'bg-gradient-to-r from-blue-500/5 to-purple-500/5' : 'bg-gradient-to-r from-blue-400/5 to-purple-400/5'} opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-lg pointer-events-none`} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Device Details Modal */}
      <DeviceDetailsModal
        selectedViolation={selectedKPI}
        violations={enhancedViolations}
        details={details}
        onClose={() => setSelectedKPI(null)}
      />
    </>
  );
};