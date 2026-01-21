// Compliance Tracking Component - Phase 2 Implementation
// Comprehensive compliance monitoring and audit readiness dashboard

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Clock,
  FileText, 
  Shield, 
  Award,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  Info,
  Download,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { useToolData } from "@/contexts/ToolDataContext";

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  overallScore: number;
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';
  lastAssessment: Date;
  nextAudit: Date;
  controls: ComplianceControl[];
  trend: 'improving' | 'declining' | 'stable';
}

interface ComplianceControl {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'implemented' | 'partial' | 'planned' | 'not-implemented';
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  lastReview: Date;
  evidence: string[];
  remediation?: string;
  daysOverdue?: number;
}

interface AuditActivity {
  id: string;
  framework: string;
  activity: string;
  type: 'assessment' | 'remediation' | 'review' | 'training';
  status: 'completed' | 'in-progress' | 'scheduled';
  assignee: string;
  dueDate: Date;
  completedDate?: Date;
  description: string;
}

const getComplianceColor = (status: string) => {
  switch (status) {
    case 'compliant':
    case 'implemented':
    case 'completed':
      return 'text-green-600 dark:text-green-400';
    case 'partial':
    case 'in-progress':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'non-compliant':
    case 'not-implemented':
    case 'planned':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

const getComplianceBg = (status: string) => {
  switch (status) {
    case 'compliant':
    case 'implemented':
    case 'completed':
      return 'bg-green-100 dark:bg-green-950/50';
    case 'partial':
    case 'in-progress':
      return 'bg-yellow-100 dark:bg-yellow-950/50';
    case 'non-compliant':
    case 'not-implemented':
    case 'planned':
      return 'bg-red-100 dark:bg-red-950/50';
    default:
      return 'bg-gray-100 dark:bg-gray-950/50';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'compliant':
    case 'implemented':
    case 'completed':
      return CheckCircle;
    case 'partial':
    case 'in-progress':
      return AlertCircle;
    case 'non-compliant':
    case 'not-implemented':
      return XCircle;
    case 'scheduled':
    case 'planned':
      return Clock;
    default:
      return AlertCircle;
  }
};

export const ComplianceTracking: React.FC = () => {
  const { toolData } = useToolData();
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'controls' | 'activities'>('overview');

  // Calculate comprehensive compliance frameworks based on real security tool data
  const generateComplianceFrameworks = (): ComplianceFramework[] => {
    const now = new Date();
    
    // Real security posture assessment based on actual data
    const securityToolsDeployed = Object.values(toolData).filter(tool => tool.data).length;
    const totalToolsAvailable = Object.keys(toolData).length;
    const toolDeploymentRatio = securityToolsDeployed / totalToolsAvailable;
    
    // Advanced security metrics from real data
    const securityMetrics = {
      // Detection capability
      detectionCoverage: toolData.siem.data ? 1.0 : toolData.edr.data ? 0.7 : 0.3,
      
      // Threat response
      threatResponseCapability: (() => {
        if (toolData.edr.data && toolData.siem.data) return 1.0;
        if (toolData.edr.data || toolData.siem.data) return 0.6;
        return 0.2;
      })(),
      
      // Email security
      emailSecurityPosture: (() => {
        if (!toolData.gsuite.data) return 0.3;
        const gsuiteData = toolData.gsuite.data;
        const phishingCount = (gsuiteData.kpis as any).phishingBlocked || gsuiteData.kpis.phishingAttempted || 0;
        const suspiciousLogins = (gsuiteData.kpis as any).suspiciousLogins || 0;
        
        if (phishingCount < 5 && suspiciousLogins < 10) return 0.95;
        if (phishingCount < 20 && suspiciousLogins < 25) return 0.8;
        if (phishingCount < 50 && suspiciousLogins < 50) return 0.6;
        return 0.4;
      })(),
      
      // Network security
      networkSecurityPosture: (() => {
        if (!toolData.sonicwall.data && !toolData.meraki.data) return 0.3;
        let score = 0.5; // Base score for having network security tools
        
        if (toolData.sonicwall.data) {
          const intrusionAttempts = toolData.sonicwall.data.kpis.intrusionAttempts;
          if (intrusionAttempts < 50) score += 0.3;
          else if (intrusionAttempts < 200) score += 0.2;
          else score += 0.1;
        }
        
        if (toolData.meraki.data) {
          score += 0.2; // Additional score for network visibility
          if ('networkHealthScore' in toolData.meraki.data.kpis) {
            const healthScore = (toolData.meraki.data.kpis as any).networkHealthScore;
            if (healthScore > 90) score += 0.1;
            else if (healthScore > 80) score += 0.05;
          }
        }
        
        return Math.min(score, 1.0);
      })(),
      
      // Endpoint security
      endpointSecurityPosture: (() => {
        if (!toolData.edr.data) return 0.3;
        const edrData = toolData.edr.data;
        const threatRatio = edrData.kpis.threatsDetected / Math.max(edrData.kpis.totalEndpoints, 1);
        
        if (threatRatio < 0.01) return 0.95; // Less than 1% infected
        if (threatRatio < 0.05) return 0.8;  // Less than 5% infected
        if (threatRatio < 0.1) return 0.6;   // Less than 10% infected
        return 0.4;
      })(),
      
      // Incident response capability
      incidentResponseCapability: (() => {
        if (!toolData.siem.data) return 0.4;
        const siemData = toolData.siem.data;
        const criticalAlertRatio = siemData.kpis.criticalAlerts / Math.max(siemData.kpis.totalEvents, 1) * 100;
        
        if (criticalAlertRatio < 0.1) return 0.9; // Less than 0.1% critical
        if (criticalAlertRatio < 0.5) return 0.7; // Less than 0.5% critical
        if (criticalAlertRatio < 1.0) return 0.5; // Less than 1% critical
        return 0.3;
      })()
    };
    
    // ISO 27001 Compliance Framework - Based on Annex A Controls
    const iso27001Score = Math.round(
      (securityMetrics.detectionCoverage * 0.25) +          // A.12 Operations Security
      (securityMetrics.threatResponseCapability * 0.20) +   // A.16 Information Security Incident Management
      (securityMetrics.emailSecurityPosture * 0.15) +       // A.13 Communications Security
      (securityMetrics.networkSecurityPosture * 0.15) +     // A.13 Communications Security
      (securityMetrics.endpointSecurityPosture * 0.15) +    // A.12 Operations Security
      (toolDeploymentRatio * 0.10) * 100                    // A.14 System Acquisition
    );

    const iso27001Status = iso27001Score >= 85 ? 'compliant' : iso27001Score >= 70 ? 'partial' : 'non-compliant';

    return [
      {
        id: 'iso27001',
        name: 'ISO 27001',
        description: 'Information Security Management System',
        overallScore: iso27001Score,
        status: iso27001Status,
        lastAssessment: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        nextAudit: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        trend: securityMetrics.incidentResponseCapability > 0.7 ? 'improving' : 
               securityMetrics.incidentResponseCapability < 0.5 ? 'declining' : 'stable',
        controls: [
          {
            id: 'iso-a5',
            title: 'A.5 Information Security Policies',
            description: 'Management direction and support for information security',
            category: 'Organizational',
            status: securityToolsDeployed >= 2 ? 'implemented' : 'partial',
            riskLevel: securityToolsDeployed >= 2 ? 'low' : 'medium',
            lastReview: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            evidence: securityToolsDeployed >= 2 ? 
              ['Security Policy Document v2.1', 'Board Approval Minutes', 'Security Tool Implementations'] :
              ['Security Policy Document v2.1']
          },
          {
            id: 'iso-a6',
            title: 'A.6 Organization of Information Security',
            description: 'Organization of information security within the organization',
            category: 'Organizational',
            status: toolDeploymentRatio >= 0.6 ? 'implemented' : 
                   toolDeploymentRatio >= 0.4 ? 'partial' : 'not-implemented',
            riskLevel: toolDeploymentRatio >= 0.6 ? 'low' : 'medium',
            lastReview: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
            evidence: toolDeploymentRatio >= 0.6 ? 
              ['RACI Matrix', 'Security Committee Charter', 'Security Architecture Documentation'] :
              ['RACI Matrix'],
            remediation: toolDeploymentRatio < 0.6 ? 'Deploy additional security controls and documentation' : undefined
          },
          {
            id: 'iso-a12',
            title: 'A.12 Operations Security',
            description: 'Correct and secure operation of information processing facilities',
            category: 'Technical',
            status: securityMetrics.detectionCoverage >= 0.8 ? 'implemented' : 
                   securityMetrics.detectionCoverage >= 0.5 ? 'partial' : 'not-implemented',
            riskLevel: securityMetrics.detectionCoverage >= 0.8 ? 'low' : 'high',
            lastReview: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
            evidence: toolData.siem.data ? 
              ['SIEM Deployment', 'Incident Response Procedures', 'Log Management System'] :
              toolData.edr.data ? ['EDR Deployment', 'Endpoint Monitoring'] : [],
            daysOverdue: securityMetrics.detectionCoverage < 0.5 ? 15 : undefined,
            remediation: securityMetrics.detectionCoverage < 0.8 ? 'Enhance security monitoring and logging capabilities' : undefined
          },
          {
            id: 'iso-a13',
            title: 'A.13 Communications Security',
            description: 'Protection of information in networks and supporting information processing facilities',
            category: 'Technical',
            status: securityMetrics.networkSecurityPosture >= 0.8 && securityMetrics.emailSecurityPosture >= 0.8 ? 'implemented' :
                   securityMetrics.networkSecurityPosture >= 0.5 || securityMetrics.emailSecurityPosture >= 0.5 ? 'partial' : 'not-implemented',
            riskLevel: securityMetrics.networkSecurityPosture >= 0.8 && securityMetrics.emailSecurityPosture >= 0.8 ? 'low' : 'high',
            lastReview: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
            evidence: [
              ...(toolData.sonicwall.data ? ['Firewall Configuration'] : []),
              ...(toolData.gsuite.data ? ['Email Security Controls'] : []),
              ...(toolData.meraki.data ? ['Network Security Monitoring'] : [])
            ],
            remediation: securityMetrics.networkSecurityPosture < 0.8 || securityMetrics.emailSecurityPosture < 0.8 ? 
              'Strengthen network and email security controls' : undefined
          },
          {
            id: 'iso-a16',
            title: 'A.16 Information Security Incident Management',
            description: 'Consistent and effective approach to information security incident management',
            category: 'Incident Response',
            status: securityMetrics.incidentResponseCapability >= 0.8 ? 'implemented' :
                   securityMetrics.incidentResponseCapability >= 0.5 ? 'partial' : 'not-implemented',
            riskLevel: securityMetrics.incidentResponseCapability >= 0.8 ? 'low' : 'critical',
            lastReview: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
            evidence: toolData.siem.data ? 
              ['Incident Response Plan', 'SIEM Alert Configuration', 'Security Incident Logs'] :
              ['Incident Response Plan'],
            remediation: securityMetrics.incidentResponseCapability < 0.8 ? 
              'Enhance incident detection and response capabilities' : undefined,
            daysOverdue: securityMetrics.incidentResponseCapability < 0.5 ? 30 : undefined
          },
          {
            id: 'iso-a18',
            title: 'A.18 Compliance',
            description: 'Compliance with legal, statutory, regulatory and contractual requirements',
            category: 'Legal',
            status: 'partial',
            riskLevel: 'medium',
            lastReview: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
            evidence: ['Legal Review Q4-2024', 'Compliance Assessment'],
            remediation: 'Update privacy policy and conduct regular compliance reviews',
            daysOverdue: 30
          }
        ]
      },
      // NIST Cybersecurity Framework - Based on Five Core Functions
      (() => {
        // Calculate NIST CSF scores for each function
        const identifyScore = toolDeploymentRatio * 0.6 + (securityToolsDeployed >= 1 ? 0.4 : 0.2);
        const protectScore = (securityMetrics.networkSecurityPosture * 0.3) + 
                            (securityMetrics.emailSecurityPosture * 0.3) + 
                            (securityMetrics.endpointSecurityPosture * 0.4);
        const detectScore = securityMetrics.detectionCoverage;
        const respondScore = securityMetrics.incidentResponseCapability;
        const recoverScore = toolData.edr.data && toolData.siem.data ? 0.8 : 
                            toolData.edr.data || toolData.siem.data ? 0.5 : 0.3;

        const nistScore = Math.round(
          (identifyScore * 0.2 + protectScore * 0.25 + detectScore * 0.25 + 
           respondScore * 0.2 + recoverScore * 0.1) * 100
        );

        const nistStatus = nistScore >= 80 ? 'compliant' : nistScore >= 65 ? 'partial' : 'non-compliant';

        return {
          id: 'nist',
          name: 'NIST Cybersecurity Framework',
          description: 'Framework for improving critical infrastructure cybersecurity',
          overallScore: nistScore,
          status: nistStatus,
          lastAssessment: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          nextAudit: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000),
          trend: detectScore >= 0.7 && respondScore >= 0.7 ? 'improving' : 
                 detectScore < 0.5 || respondScore < 0.5 ? 'declining' : 'stable',
          controls: [
            {
              id: 'nist-identify',
              title: 'Identify (ID)',
              description: 'Develop organizational understanding to manage cybersecurity risk',
              category: 'Identify',
              status: identifyScore >= 0.8 ? 'implemented' : identifyScore >= 0.6 ? 'partial' : 'not-implemented',
              riskLevel: identifyScore >= 0.8 ? 'low' : identifyScore >= 0.6 ? 'medium' : 'high',
              lastReview: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
              evidence: [
                'Asset Inventory',
                'Risk Assessment',
                ...(securityToolsDeployed >= 3 ? ['Comprehensive Security Architecture'] : [])
              ],
              remediation: identifyScore < 0.8 ? 'Complete asset inventory and risk assessment activities' : undefined
            },
            {
              id: 'nist-protect',
              title: 'Protect (PR)',
              description: 'Develop and implement appropriate safeguards',
              category: 'Protect',
              status: protectScore >= 0.85 ? 'implemented' : protectScore >= 0.6 ? 'partial' : 'not-implemented',
              riskLevel: protectScore >= 0.85 ? 'low' : protectScore >= 0.6 ? 'medium' : 'critical',
              lastReview: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
              evidence: [
                ...(toolData.sonicwall.data ? ['Network Access Controls'] : []),
                ...(toolData.gsuite.data ? ['Email Security Controls'] : []),
                ...(toolData.edr.data ? ['Endpoint Protection'] : []),
                ...(toolData.meraki.data ? ['Network Segmentation'] : [])
              ],
              remediation: protectScore < 0.85 ? 'Enhance protective security controls across all domains' : undefined
            },
            {
              id: 'nist-detect',
              title: 'Detect (DE)',
              description: 'Develop and implement activities to identify cybersecurity events',
              category: 'Detect',
              status: detectScore >= 0.8 ? 'implemented' : detectScore >= 0.5 ? 'partial' : 'not-implemented',
              riskLevel: detectScore >= 0.8 ? 'low' : 'critical',
              lastReview: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
              evidence: [
                ...(toolData.siem.data ? ['SIEM Implementation', 'Security Event Correlation'] : []),
                ...(toolData.edr.data ? ['Endpoint Detection and Response'] : []),
                ...(detectScore >= 0.8 ? ['Continuous Monitoring', 'Threat Intelligence'] : [])
              ],
              remediation: detectScore < 0.8 ? 'Deploy comprehensive security monitoring and detection capabilities' : undefined,
              daysOverdue: detectScore < 0.5 ? 45 : undefined
            },
            {
              id: 'nist-respond',
              title: 'Respond (RS)',
              description: 'Develop and implement activities to respond to detected cybersecurity events',
              category: 'Respond',
              status: respondScore >= 0.8 ? 'implemented' : respondScore >= 0.5 ? 'partial' : 'not-implemented',
              riskLevel: respondScore >= 0.8 ? 'low' : 'critical',
              lastReview: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
              evidence: [
                'Incident Response Plan',
                ...(toolData.siem.data ? ['Incident Response Automation'] : []),
                ...(respondScore >= 0.8 ? ['Response Team Training', 'Tabletop Exercises'] : [])
              ],
              remediation: respondScore < 0.8 ? 'Enhance incident response capabilities and automation' : undefined
            },
            {
              id: 'nist-recover',
              title: 'Recover (RC)',
              description: 'Develop and implement activities to maintain resilience plans',
              category: 'Recover',
              status: recoverScore >= 0.7 ? 'implemented' : recoverScore >= 0.5 ? 'partial' : 'not-implemented',
              riskLevel: recoverScore >= 0.7 ? 'medium' : 'high',
              lastReview: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
              evidence: [
                'Business Continuity Plan',
                ...(recoverScore >= 0.7 ? ['Disaster Recovery Procedures', 'Backup Systems'] : [])
              ],
              remediation: recoverScore < 0.7 ? 'Develop comprehensive recovery and continuity capabilities' : undefined
            }
          ]
        };
      })(),
      // SOC 2 Type II - Trust Service Criteria
      (() => {
        // Calculate SOC 2 scores for each trust service principle
        const securityScore = (securityMetrics.detectionCoverage * 0.3) + 
                             (securityMetrics.threatResponseCapability * 0.3) + 
                             (securityMetrics.networkSecurityPosture * 0.2) + 
                             (securityMetrics.emailSecurityPosture * 0.2);
        
        const availabilityScore = (() => {
          // Base availability on security tool diversity and incident response
          let score = 0.6; // Base score
          if (toolData.edr.data && toolData.siem.data) score += 0.2;
          if (toolData.meraki.data || toolData.sonicwall.data) score += 0.1;
          if (securityMetrics.incidentResponseCapability > 0.7) score += 0.1;
          return Math.min(score, 1.0);
        })();

        const confidentialityScore = securityMetrics.emailSecurityPosture * 0.6 + 
                                    securityMetrics.networkSecurityPosture * 0.4;

        const processingIntegrityScore = securityMetrics.detectionCoverage * 0.7 + 
                                        securityMetrics.incidentResponseCapability * 0.3;

        const privacyScore = toolData.gsuite.data ? 0.7 : 0.4; // Basic score based on data handling

        const soc2Score = Math.round(
          (securityScore * 0.35 + availabilityScore * 0.25 + confidentialityScore * 0.2 + 
           processingIntegrityScore * 0.15 + privacyScore * 0.05) * 100
        );

        const soc2Status = soc2Score >= 85 ? 'compliant' : soc2Score >= 70 ? 'partial' : 'non-compliant';

        return {
          id: 'soc2',
          name: 'SOC 2 Type II',
          description: 'Service Organization Control 2',
          overallScore: soc2Score,
          status: soc2Status,
          lastAssessment: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          nextAudit: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
          trend: securityScore >= 0.8 && availabilityScore >= 0.8 ? 'improving' : 
                 securityScore < 0.6 || availabilityScore < 0.6 ? 'declining' : 'stable',
          controls: [
            {
              id: 'soc2-security',
              title: 'Security',
              description: 'Protection against unauthorized access (both logical and physical)',
              category: 'Security',
              status: securityScore >= 0.85 ? 'implemented' : securityScore >= 0.7 ? 'partial' : 'not-implemented',
              riskLevel: securityScore >= 0.85 ? 'low' : securityScore >= 0.7 ? 'medium' : 'critical',
              lastReview: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
              evidence: [
                'Security Policy and Procedures',
                ...(toolData.siem.data ? ['Security Incident Monitoring'] : []),
                ...(toolData.edr.data ? ['Endpoint Security Controls'] : []),
                ...(securityScore >= 0.85 ? ['Penetration Testing', 'Vulnerability Assessments'] : [])
              ],
              remediation: securityScore < 0.85 ? 'Enhance security controls and monitoring capabilities' : undefined
            },
            {
              id: 'soc2-availability',
              title: 'Availability',
              description: 'System availability and performance commitments and agreements',
              category: 'Availability',
              status: availabilityScore >= 0.8 ? 'implemented' : availabilityScore >= 0.6 ? 'partial' : 'not-implemented',
              riskLevel: availabilityScore >= 0.8 ? 'low' : 'high',
              lastReview: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
              evidence: [
                'System Monitoring Procedures',
                ...(toolData.meraki.data ? ['Network Performance Monitoring'] : []),
                ...(availabilityScore >= 0.8 ? ['Backup and Recovery Procedures', 'Uptime Reports'] : ['Basic Monitoring'])
              ],
              remediation: availabilityScore < 0.8 ? 'Implement comprehensive backup and disaster recovery procedures' : undefined
            },
            {
              id: 'soc2-processing-integrity',
              title: 'Processing Integrity',
              description: 'System processing is complete, valid, accurate, timely and authorized',
              category: 'Processing Integrity',
              status: processingIntegrityScore >= 0.8 ? 'implemented' : 
                     processingIntegrityScore >= 0.6 ? 'partial' : 'not-implemented',
              riskLevel: processingIntegrityScore >= 0.8 ? 'medium' : 'high',
              lastReview: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
              evidence: [
                'Data Processing Controls',
                ...(toolData.siem.data ? ['Data Integrity Monitoring'] : []),
                ...(processingIntegrityScore >= 0.8 ? ['Change Management Procedures'] : [])
              ],
              remediation: processingIntegrityScore < 0.8 ? 'Strengthen data processing integrity controls' : undefined
            },
            {
              id: 'soc2-confidentiality',
              title: 'Confidentiality',
              description: 'Information designated as confidential is protected',
              category: 'Confidentiality',
              status: confidentialityScore >= 0.8 ? 'implemented' : 
                     confidentialityScore >= 0.6 ? 'partial' : 'not-implemented',
              riskLevel: confidentialityScore >= 0.8 ? 'medium' : 'high',
              lastReview: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
              evidence: [
                'Data Classification Policy',
                ...(toolData.gsuite.data ? ['Email Security and Encryption'] : []),
                ...(toolData.sonicwall.data ? ['Network Encryption'] : [])
              ],
              remediation: confidentialityScore < 0.8 ? 'Enhance data confidentiality protection measures' : undefined
            },
            {
              id: 'soc2-privacy',
              title: 'Privacy',
              description: 'Personal information is collected, used, retained and disclosed in conformity with privacy notice',
              category: 'Privacy',
              status: privacyScore >= 0.8 ? 'implemented' : privacyScore >= 0.6 ? 'partial' : 'not-implemented',
              riskLevel: 'medium',
              lastReview: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
              evidence: [
                'Privacy Policy',
                ...(toolData.gsuite.data ? ['Email Data Protection'] : []),
                ...(privacyScore >= 0.8 ? ['Privacy Impact Assessments', 'Data Subject Rights Procedures'] : [])
              ],
              remediation: privacyScore < 0.8 ? 'Develop comprehensive privacy protection and data subject rights procedures' : undefined,
              daysOverdue: privacyScore < 0.6 ? 20 : undefined
            }
          ]
        };
      })()
    ];
  };

  // Generate real audit activities based on compliance gaps and requirements
  const generateAuditActivities = (frameworks: ComplianceFramework[]): AuditActivity[] => {
    const now = new Date();
    const activities: AuditActivity[] = [];
    const auditors = ['Security Team', 'Compliance Officer', 'IT Manager', 'Risk Manager'];
    
    // Generate activities based on actual compliance status and gaps
    frameworks.forEach(framework => {
      // Annual assessment activities
      if (framework.nextAudit && framework.nextAudit.getTime() - now.getTime() < 90 * 24 * 60 * 60 * 1000) {
        activities.push({
          id: `audit-${framework.id}-assessment`,
          framework: framework.name,
          activity: `Annual ${framework.name} Assessment`,
          type: 'assessment',
          status: framework.nextAudit.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000 ? 'in-progress' : 'scheduled',
          assignee: auditors[0],
          dueDate: framework.nextAudit,
          description: `Comprehensive review of ${framework.name} compliance controls and requirements`
        });
      }

      // Remediation activities for non-compliant controls
      framework.controls.forEach(control => {
        if (control.status === 'not-implemented' || (control.status === 'partial' && control.riskLevel === 'critical')) {
          activities.push({
            id: `remediation-${control.id}`,
            framework: framework.name,
            activity: `Remediate ${control.title}`,
            type: 'remediation',
            status: control.daysOverdue ? 'in-progress' : 'scheduled',
            assignee: control.category === 'Technical' ? 'IT Manager' : 
                     control.category === 'Legal' ? 'Compliance Officer' : 'Security Team',
            dueDate: new Date(now.getTime() + (control.daysOverdue ? 7 : 30) * 24 * 60 * 60 * 1000),
            description: control.remediation || `Implement and document ${control.title} controls`
          });
        }
      });

      // Review activities for controls that haven't been reviewed recently
      framework.controls.forEach(control => {
        const daysSinceReview = Math.floor((now.getTime() - control.lastReview.getTime()) / (24 * 60 * 60 * 1000));
        if (daysSinceReview > 90 && control.status === 'implemented') {
          activities.push({
            id: `review-${control.id}`,
            framework: framework.name,
            activity: `Review ${control.title}`,
            type: 'review',
            status: daysSinceReview > 120 ? 'in-progress' : 'scheduled',
            assignee: auditors[1],
            dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            description: `Periodic review and validation of ${control.title} implementation`
          });
        }
      });
    });

    // Add framework-specific activities based on security posture
    const securityToolsDeployed = Object.values(toolData).filter(tool => tool.data).length;
    
    // Security awareness training (mandatory)
    activities.push({
      id: 'training-security-awareness',
      framework: 'All Frameworks',
      activity: 'Security Awareness Training',
      type: 'training',
      status: 'scheduled',
      assignee: 'Security Team',
      dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      description: 'Mandatory quarterly security awareness training for all personnel'
    });

    // Tool-specific activities
    if (!toolData.siem.data) {
      activities.push({
        id: 'implementation-siem',
        framework: 'NIST CSF',
        activity: 'SIEM Implementation Project',
        type: 'remediation',
        status: 'scheduled',
        assignee: 'IT Manager',
        dueDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        description: 'Deploy and configure Security Information and Event Management system'
      });
    }

    if (securityToolsDeployed < 3) {
      activities.push({
        id: 'assessment-security-gaps',
        framework: 'ISO 27001',
        activity: 'Security Controls Gap Assessment',
        type: 'assessment',
        status: 'in-progress',
        assignee: 'Security Team',
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        description: 'Identify and prioritize security control implementation gaps'
      });
    }

    // Incident response testing
    if (toolData.siem.data || toolData.edr.data) {
      activities.push({
        id: 'testing-incident-response',
        framework: 'All Frameworks',
        activity: 'Incident Response Tabletop Exercise',
        type: 'assessment',
        status: 'scheduled',
        assignee: 'Security Team',
        dueDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
        description: 'Test incident response procedures with simulated security incident'
      });
    }

    // Compliance documentation review
    activities.push({
      id: 'review-compliance-docs',
      framework: 'All Frameworks',
      activity: 'Compliance Documentation Review',
      type: 'review',
      status: 'scheduled',
      assignee: 'Compliance Officer',
      dueDate: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
      description: 'Annual review and update of all compliance policies and procedures'
    });

    // Sort activities by due date and priority (overdue first, then by due date)
    return activities.sort((a, b) => {
      const aOverdue = a.dueDate < now;
      const bOverdue = b.dueDate < now;
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      return a.dueDate.getTime() - b.dueDate.getTime();
    }).slice(0, 12); // Limit to most important 12 activities
  };

  const frameworks = generateComplianceFrameworks();
  const activities = generateAuditActivities(frameworks);
  
  // Calculate overall compliance metrics
  const overallCompliance = Math.round(frameworks.reduce((acc, f) => acc + f.overallScore, 0) / frameworks.length);
  const compliantFrameworks = frameworks.filter(f => f.status === 'compliant').length;
  const overdueActivities = activities.filter(a => 
    a.status !== 'completed' && a.dueDate < new Date()
  ).length;

  return (
    <div className="w-[98%] max-w-8xl mx-auto mb-6">
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground leading-tight flex items-center gap-3">
                <Award className="h-6 w-6 text-blue-500" />
                Compliance Tracking
              </h2>
              <p className="text-base text-muted-foreground">Regulatory compliance monitoring and audit readiness</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1 ${getComplianceColor(
                  overallCompliance >= 90 ? 'compliant' : 
                  overallCompliance >= 70 ? 'partial' : 'non-compliant'
                )}`}
              >
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  overallCompliance >= 90 ? 'bg-green-500' :
                  overallCompliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                {overallCompliance}% Compliant
              </Badge>
              <Badge variant="secondary">
                {compliantFrameworks}/{frameworks.length} Frameworks
              </Badge>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 mb-6">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'controls', label: 'Controls', icon: Shield },
              { id: 'activities', label: 'Activities', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={viewMode === tab.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode(tab.id as any)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>

          <div className="space-y-6">
            {/* Overview Mode */}
            {viewMode === 'overview' && (
              <>
                {/* Compliance Overview Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <Card className={`${getComplianceBg(
                    overallCompliance >= 90 ? 'compliant' : 
                    overallCompliance >= 70 ? 'partial' : 'non-compliant'
                  )} border-2`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Overall Compliance</h3>
                          <p className="text-sm text-muted-foreground">Aggregate compliance score</p>
                        </div>
                        <Award className={`h-8 w-8 ${getComplianceColor(
                          overallCompliance >= 90 ? 'compliant' : 
                          overallCompliance >= 70 ? 'partial' : 'non-compliant'
                        )}`} />
                      </div>
                      
                      <div className={`text-4xl font-bold mb-2 ${getComplianceColor(
                        overallCompliance >= 90 ? 'compliant' : 
                        overallCompliance >= 70 ? 'partial' : 'non-compliant'
                      )}`}>
                        {overallCompliance}%
                      </div>
                      
                      <div className="mt-4 w-full bg-muted/30 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            overallCompliance >= 90 ? 'bg-green-500' :
                            overallCompliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${overallCompliance}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Audit Readiness</h3>
                          <p className="text-sm text-muted-foreground">Ready for external audit</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                      
                      <div className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
                        {compliantFrameworks}/{frameworks.length}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Frameworks Ready
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Pending Actions</h3>
                          <p className="text-sm text-muted-foreground">Items requiring attention</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-500" />
                      </div>
                      
                      <div className="text-2xl font-bold mb-2 text-orange-600 dark:text-orange-400">
                        {activities.filter(a => a.status === 'in-progress' || a.status === 'scheduled').length}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Active Tasks
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Overdue Items</h3>
                          <p className="text-sm text-muted-foreground">Past due activities</p>
                        </div>
                        <AlertCircle className="h-8 w-8 text-red-500" />
                      </div>
                      
                      <div className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
                        {overdueActivities}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Require Immediate Action
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Frameworks Overview */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Compliance Frameworks
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {frameworks.map((framework) => {
                      const StatusIcon = getStatusIcon(framework.status);
                      
                      return (
                        <Card key={framework.id} className="hover:shadow-md transition-all duration-200">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-semibold text-foreground">{framework.name}</h4>
                                <p className="text-sm text-muted-foreground">{framework.description}</p>
                              </div>
                              <StatusIcon className={`h-6 w-6 ${getComplianceColor(framework.status)}`} />
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Compliance Score:</span>
                                <span className={`font-bold ${getComplianceColor(framework.status)}`}>
                                  {framework.overallScore}%
                                </span>
                              </div>
                              
                              <div className="w-full bg-muted/30 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    framework.overallScore >= 90 ? 'bg-green-500' :
                                    framework.overallScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${framework.overallScore}%` }}
                                />
                              </div>
                              
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                  Last Assessment: {framework.lastAssessment.toLocaleDateString()}
                                </span>
                                <div className="flex items-center gap-1">
                                  {framework.trend === 'improving' && <TrendingUp className="h-3 w-3 text-green-500" />}
                                  {framework.trend === 'declining' && <TrendingDown className="h-3 w-3 text-red-500" />}
                                  {framework.trend === 'stable' && <div className="w-3 h-px bg-gray-500" />}
                                </div>
                              </div>
                              
                              <Badge 
                                variant="outline" 
                                className={`w-full justify-center ${getComplianceColor(framework.status)} ${getComplianceBg(framework.status)}`}
                              >
                                {framework.status.replace('-', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Controls Mode */}
            {viewMode === 'controls' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Compliance Controls
                </h3>
                
                {frameworks.map((framework) => (
                  <Card key={framework.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-foreground">{framework.name}</h4>
                        <Badge variant="outline" className={getComplianceColor(framework.status)}>
                          {framework.overallScore}% Complete
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        {framework.controls.map((control) => {
                          const StatusIcon = getStatusIcon(control.status);
                          
                          return (
                            <div key={control.id} className="flex items-center justify-between p-3 bg-background/30 rounded-lg">
                              <div className="flex items-center gap-3">
                                <StatusIcon className={`h-5 w-5 ${getComplianceColor(control.status)}`} />
                                <div>
                                  <div className="font-medium text-foreground">{control.title}</div>
                                  <div className="text-sm text-muted-foreground">{control.description}</div>
                                  {control.remediation && (
                                    <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                      Action: {control.remediation}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {control.category}
                                </Badge>
                                {control.daysOverdue && (
                                  <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400">
                                    {control.daysOverdue}d overdue
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Activities Mode */}
            {viewMode === 'activities' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  Audit Activities
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activities.map((activity) => {
                    const StatusIcon = getStatusIcon(activity.status);
                    const isOverdue = activity.status !== 'completed' && activity.dueDate < new Date();
                    
                    return (
                      <Card key={activity.id} className={`${isOverdue ? 'border-red-200 dark:border-red-800' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-foreground">{activity.activity}</h4>
                              <p className="text-sm text-muted-foreground">{activity.description}</p>
                            </div>
                            <StatusIcon className={`h-5 w-5 ${getComplianceColor(activity.status)}`} />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Framework:</span>
                              <Badge variant="outline" className="text-xs">{activity.framework}</Badge>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Assignee:</span>
                              <span className="font-medium">{activity.assignee}</span>
                            </div>
                            
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Due Date:</span>
                              <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                                {activity.dueDate.toLocaleDateString()}
                              </span>
                            </div>
                            
                            {activity.completedDate && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Completed:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  {activity.completedDate.toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <Badge 
                              variant="outline" 
                              className={`${getComplianceColor(activity.status)} ${getComplianceBg(activity.status)}`}
                            >
                              {activity.status.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>
    </div>
  );
};