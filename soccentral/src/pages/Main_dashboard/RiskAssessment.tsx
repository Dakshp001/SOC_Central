// Risk Assessment Dashboard Component - Phase 2 Implementation
// Comprehensive risk analysis with threat scoring and vulnerability management

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Shield, 
  Target,
  Eye,
  Server,
  Users,
  Globe,
  Lock,
  Unlock,
  Info,
  ChevronRight,
  Activity
} from "lucide-react";
import { useToolData } from "@/contexts/ToolDataContext";

interface RiskScore {
  category: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  factors: string[];
}

interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss: number;
  category: string;
  affectedAssets: number;
  discovered: Date;
  status: 'open' | 'patching' | 'mitigated' | 'resolved';
  description: string;
}

interface ThreatVector {
  name: string;
  likelihood: number;
  impact: number;
  riskLevel: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  description: string;
}

const getRiskColor = (score: number) => {
  if (score >= 80) return 'text-red-600 dark:text-red-400';
  if (score >= 60) return 'text-orange-600 dark:text-orange-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
};

const getRiskBg = (score: number) => {
  if (score >= 80) return 'bg-red-100 dark:bg-red-950/50';
  if (score >= 60) return 'bg-orange-100 dark:bg-orange-950/50';
  if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-950/50';
  return 'bg-green-100 dark:bg-green-950/50';
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

export const RiskAssessment: React.FC = () => {
  const { toolData } = useToolData();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  // Calculate risk scores based on real data
  const calculateRiskScores = (): RiskScore[] => {
    const scores: RiskScore[] = [];

    // Network Security Risk
    let networkScore = 30; // Base score
    let networkFactors: string[] = ['Baseline network monitoring active'];
    if (toolData.sonicwall.data && toolData.sonicwall.data.kpis.intrusionAttempts > 50) {
      networkScore += 25;
      networkFactors.push('High intrusion attempt volume detected');
    }
    if (toolData.meraki.data) {
      const merakiData = toolData.meraki.data;
      if ('networkHealthScore' in merakiData.kpis && merakiData.kpis.networkHealthScore < 85) {
        networkScore += 20;
        networkFactors.push('Network health score below acceptable threshold');
      }
    }
    scores.push({
      category: 'Network Security',
      score: Math.min(networkScore, 95),
      trend: networkScore > 50 ? 'up' : 'stable',
      impact: networkScore >= 80 ? 'critical' : networkScore >= 60 ? 'high' : 'medium',
      description: 'Risk from network-based threats and intrusions',
      factors: networkFactors
    });

    // Email Security Risk
    let emailScore = 25;
    let emailFactors: string[] = ['Email scanning and filtering active'];
    if (toolData.gsuite.data) {
      const gsuiteData = toolData.gsuite.data;
      if (gsuiteData.kpis.phishingBlocked > 10) {
        emailScore += 30;
        emailFactors.push('High phishing attempt volume');
      }
      if ('suspiciousEmails' in gsuiteData.kpis && gsuiteData.kpis.suspiciousEmails > 50) {
        emailScore += 20;
        emailFactors.push('Elevated suspicious email activity');
      }
    }
    scores.push({
      category: 'Email Security',
      score: Math.min(emailScore, 90),
      trend: emailScore > 40 ? 'up' : 'down',
      impact: emailScore >= 70 ? 'high' : emailScore >= 50 ? 'medium' : 'low',
      description: 'Risk from email-borne threats and phishing',
      factors: emailFactors
    });

    // Endpoint Security Risk
    let endpointScore = 35;
    let endpointFactors: string[] = ['Endpoint monitoring deployed'];
    if (toolData.edr.data) {
      const edrData = toolData.edr.data;
      if (edrData.kpis.threatsDetected > 5) {
        endpointScore += 35;
        endpointFactors.push('Active endpoint threats detected');
      }
      if (edrData.kpis.totalEndpoints > 100) {
        endpointScore += 10;
        endpointFactors.push('Large endpoint attack surface');
      }
    }
    scores.push({
      category: 'Endpoint Security',
      score: Math.min(endpointScore, 85),
      trend: endpointScore > 50 ? 'up' : 'stable',
      impact: endpointScore >= 75 ? 'high' : endpointScore >= 50 ? 'medium' : 'low',
      description: 'Risk from endpoint compromises and malware',
      factors: endpointFactors
    });

    // Identity & Access Risk
    let identityScore = 40;
    let identityFactors: string[] = ['Identity monitoring in place'];
    if (toolData.siem.data && toolData.siem.data.kpis.criticalAlerts > 3) {
      identityScore += 25;
      identityFactors.push('Critical authentication alerts detected');
    }
    scores.push({
      category: 'Identity & Access',
      score: Math.min(identityScore, 80),
      trend: 'stable',
      impact: identityScore >= 65 ? 'high' : 'medium',
      description: 'Risk from compromised accounts and access abuse',
      factors: identityFactors
    });

    // Data Protection Risk
    let dataScore = 30;
    let dataFactors: string[] = ['Data loss prevention monitoring active'];
    if (toolData.siem.data && toolData.siem.data.kpis.totalEvents > 10000) {
      dataScore += 15;
      dataFactors.push('High security event volume indicating potential data exposure');
    }
    scores.push({
      category: 'Data Protection',
      score: Math.min(dataScore, 75),
      trend: 'down',
      impact: 'medium',
      description: 'Risk of data breaches and exfiltration',
      factors: dataFactors
    });

    return scores;
  };

  // Generate vulnerabilities from tool data
  const generateVulnerabilities = (): Vulnerability[] => {
    const vulnerabilities: Vulnerability[] = [];
    const now = new Date();

    // EDR-based vulnerabilities
    if (toolData.edr.data && toolData.edr.data.kpis.threatsDetected > 0) {
      const edrData = toolData.edr.data;
      vulnerabilities.push({
        id: 'edr-threats-active',
        title: `${edrData.kpis.threatsDetected} Active Endpoint Threats`,
        severity: edrData.kpis.threatsDetected > 10 ? 'critical' : edrData.kpis.threatsDetected > 5 ? 'high' : 'medium',
        cvss: edrData.kpis.threatsDetected > 10 ? 9.2 : edrData.kpis.threatsDetected > 5 ? 7.8 : 6.1,
        category: 'Endpoint Security',
        affectedAssets: edrData.kpis.totalEndpoints,
        discovered: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'active',
        description: `Active malware and threats detected across ${edrData.kpis.totalEndpoints} endpoints`
      });
    }

    // SIEM-based vulnerabilities
    if (toolData.siem.data) {
      const siemData = toolData.siem.data;
      if (siemData.kpis.criticalAlerts > 0) {
        vulnerabilities.push({
          id: 'siem-critical-events',
          title: `${siemData.kpis.criticalAlerts} Critical Security Events`,
          severity: 'critical',
          cvss: 8.9,
          category: 'Security Operations',
          affectedAssets: Math.ceil(siemData.kpis.criticalAlerts / 2),
          discovered: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
          status: 'investigating',
          description: 'Critical security incidents requiring immediate investigation'
        });
      }
      
      if (siemData.kpis.highSeverityEvents > 20) {
        vulnerabilities.push({
          id: 'siem-high-volume',
          title: 'High-Volume Security Event Storm',
          severity: 'high',
          cvss: 7.3,
          category: 'Security Operations',
          affectedAssets: Math.floor(siemData.kpis.highSeverityEvents / 10),
          discovered: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
          status: 'monitoring',
          description: `${siemData.kpis.highSeverityEvents} high-severity events detected, indicating potential coordinated attack`
        });
      }
    }

    // GSuite/Email-based vulnerabilities
    if (toolData.gsuite.data) {
      const gsuiteData = toolData.gsuite.data;
      const phishingCount = (gsuiteData.kpis as any).phishingBlocked || gsuiteData.kpis.phishingAttempted || 0;
      
      if (phishingCount > 10) {
        vulnerabilities.push({
          id: 'gsuite-phishing-campaign',
          title: 'Active Phishing Campaign',
          severity: phishingCount > 50 ? 'critical' : 'high',
          cvss: phishingCount > 50 ? 8.7 : 7.2,
          category: 'Email Security',
          affectedAssets: Math.floor(phishingCount * 0.8),
          discovered: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
          status: 'mitigating',
          description: `${phishingCount} phishing attempts detected, indicating coordinated email-based attack`
        });
      }

      if (gsuiteData.kpis.suspiciousLogins > 15) {
        vulnerabilities.push({
          id: 'gsuite-suspicious-logins',
          title: 'Suspicious Authentication Activity',
          severity: 'medium',
          cvss: 6.8,
          category: 'Identity Security',
          affectedAssets: gsuiteData.kpis.suspiciousLogins,
          discovered: new Date(now.getTime() - 20 * 60 * 1000), // 20 minutes ago
          status: 'monitoring',
          description: `${gsuiteData.kpis.suspiciousLogins} suspicious login attempts from unusual locations`
        });
      }
    }

    // Network-based vulnerabilities from SonicWall
    if (toolData.sonicwall.data && toolData.sonicwall.data.kpis.intrusionAttempts > 50) {
      const sonicwallData = toolData.sonicwall.data;
      vulnerabilities.push({
        id: 'network-intrusion-spike',
        title: 'Network Intrusion Spike',
        severity: sonicwallData.kpis.intrusionAttempts > 200 ? 'high' : 'medium',
        cvss: sonicwallData.kpis.intrusionAttempts > 200 ? 7.9 : 6.4,
        category: 'Network Security',
        affectedAssets: Math.min(Math.floor(sonicwallData.kpis.intrusionAttempts / 20), 10),
        discovered: new Date(now.getTime() - 15 * 60 * 1000), // 15 minutes ago
        status: 'blocking',
        description: `${sonicwallData.kpis.intrusionAttempts} network intrusion attempts detected at perimeter`
      });
    }

    // Meraki-based vulnerabilities
    if (toolData.meraki.data) {
      const merakiData = toolData.meraki.data;
      if ('securityEvents' in merakiData.kpis && (merakiData.kpis as any).securityEvents > 25) {
        vulnerabilities.push({
          id: 'meraki-security-events',
          title: 'Network Security Events',
          severity: 'medium',
          cvss: 6.2,
          category: 'Network Security',
          affectedAssets: Math.floor((merakiData.kpis as any).securityEvents / 5),
          discovered: new Date(now.getTime() - 25 * 60 * 1000), // 25 minutes ago
          status: 'analyzing',
          description: `${(merakiData.kpis as any).securityEvents} security events detected across network infrastructure`
        });
      }
    }

    // Only return vulnerabilities if we have real data
    return vulnerabilities.length > 0 ? vulnerabilities.sort((a, b) => b.cvss - a.cvss) : [];
  };

  // Generate threat vectors based on real data analysis
  const generateThreatVectors = (): ThreatVector[] => {
    const threats: ThreatVector[] = [];

    // Email-based threats (Phishing, Social Engineering)
    if (toolData.gsuite.data) {
      const gsuiteData = toolData.gsuite.data;
      const phishingCount = (gsuiteData.kpis as any).phishingBlocked || gsuiteData.kpis.phishingAttempted || 0;
      const suspiciousLogins = gsuiteData.kpis.suspiciousLogins || 0;
      
      if (phishingCount > 0 || suspiciousLogins > 0) {
        const likelihood = Math.min(Math.max((phishingCount + suspiciousLogins) * 2, 20), 85);
        const impact = phishingCount > 50 ? 85 : phishingCount > 20 ? 75 : 65;
        
        threats.push({
          name: 'Email-Based Attacks',
          likelihood,
          impact,
          riskLevel: Math.round((likelihood * impact) / 100),
          trend: phishingCount > 30 ? 'increasing' : phishingCount > 10 ? 'stable' : 'decreasing',
          description: `Active phishing and social engineering attempts: ${phishingCount} blocked, ${suspiciousLogins} suspicious logins`
        });
      }
    }

    // Endpoint-based threats (Malware, Ransomware)
    if (toolData.edr.data) {
      const edrData = toolData.edr.data;
      if (edrData.kpis.threatsDetected > 0) {
        const likelihood = Math.min(Math.max(edrData.kpis.threatsDetected * 8, 25), 90);
        const impact = edrData.kpis.threatsDetected > 15 ? 90 : edrData.kpis.threatsDetected > 5 ? 80 : 70;
        
        threats.push({
          name: 'Endpoint Malware',
          likelihood,
          impact,
          riskLevel: Math.round((likelihood * impact) / 100),
          trend: edrData.kpis.threatsDetected > 10 ? 'increasing' : 'stable',
          description: `${edrData.kpis.threatsDetected} active threats detected across ${edrData.kpis.totalEndpoints} endpoints`
        });
      }
    }

    // Network-based threats
    if (toolData.sonicwall.data) {
      const sonicwallData = toolData.sonicwall.data;
      if (sonicwallData.kpis.intrusionAttempts > 0) {
        const likelihood = Math.min(Math.max(sonicwallData.kpis.intrusionAttempts / 4, 15), 80);
        const impact = sonicwallData.kpis.intrusionAttempts > 100 ? 80 : sonicwallData.kpis.intrusionAttempts > 50 ? 70 : 60;
        
        threats.push({
          name: 'Network Intrusions',
          likelihood,
          impact,
          riskLevel: Math.round((likelihood * impact) / 100),
          trend: sonicwallData.kpis.intrusionAttempts > 200 ? 'increasing' : 'stable',
          description: `${sonicwallData.kpis.intrusionAttempts} intrusion attempts detected at network perimeter`
        });
      }
    }

    // Advanced Persistent Threats (based on SIEM data)
    if (toolData.siem.data) {
      const siemData = toolData.siem.data;
      if (siemData.kpis.criticalAlerts > 0) {
        const likelihood = Math.min(Math.max(siemData.kpis.criticalAlerts * 15, 30), 75);
        const impact = siemData.kpis.criticalAlerts > 5 ? 90 : 80;
        
        threats.push({
          name: 'Advanced Persistent Threats',
          likelihood,
          impact,
          riskLevel: Math.round((likelihood * impact) / 100),
          trend: siemData.kpis.criticalAlerts > 3 ? 'increasing' : 'stable',
          description: `${siemData.kpis.criticalAlerts} critical security events suggest coordinated attack patterns`
        });
      }

      // Insider threats based on unusual authentication patterns
      if (siemData.kpis.totalEvents > 5000) {
        const likelihood = Math.min(Math.max(siemData.kpis.totalEvents / 500, 20), 60);
        const impact = 75; // Insider threats typically have high impact but variable likelihood
        
        threats.push({
          name: 'Insider Threat Activity',
          likelihood,
          impact,
          riskLevel: Math.round((likelihood * impact) / 100),
          trend: siemData.kpis.totalEvents > 10000 ? 'increasing' : 'stable',
          description: `${siemData.kpis.totalEvents} security events indicate potential unauthorized access patterns`
        });
      }
    }

    // Network infrastructure threats (Meraki)
    if (toolData.meraki.data) {
      const merakiData = toolData.meraki.data;
      if ('securityEvents' in merakiData.kpis && (merakiData.kpis as any).securityEvents > 0) {
        const securityEvents = (merakiData.kpis as any).securityEvents;
        const likelihood = Math.min(Math.max(securityEvents * 3, 25), 70);
        const impact = securityEvents > 50 ? 75 : 65;
        
        threats.push({
          name: 'Infrastructure Attacks',
          likelihood,
          impact,
          riskLevel: Math.round((likelihood * impact) / 100),
          trend: securityEvents > 30 ? 'increasing' : 'stable',
          description: `${securityEvents} security events detected across network infrastructure`
        });
      }
    }

    // Return threats sorted by risk level, or empty array if no data
    return threats.length > 0 ? threats.sort((a, b) => b.riskLevel - a.riskLevel) : [];
  };

  const riskScores = calculateRiskScores();
  const vulnerabilities = generateVulnerabilities();
  const threatVectors = generateThreatVectors();
  
  // Calculate overall risk score
  const overallRiskScore = Math.round(riskScores.reduce((acc, score) => acc + score.score, 0) / riskScores.length);

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
                <Target className="h-6 w-6 text-red-500" />
                Risk Assessment Dashboard
              </h2>
              <p className="text-base text-muted-foreground">Comprehensive threat analysis and vulnerability management</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1 ${getRiskColor(overallRiskScore)}`}
              >
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  overallRiskScore >= 80 ? 'bg-red-500' :
                  overallRiskScore >= 60 ? 'bg-orange-500' : 
                  overallRiskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                Overall Risk: {overallRiskScore}%
              </Badge>
              <Badge variant="secondary">
                {vulnerabilities.filter(v => v.status === 'active' || v.status === 'open').length} Active Issues
              </Badge>
            </div>
          </div>

          <div className="space-y-6">
            {/* Risk Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Risk Score */}
              <Card className={`${getRiskBg(overallRiskScore)} border-2`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Overall Risk Score</h3>
                      <p className="text-sm text-muted-foreground">Aggregated risk assessment</p>
                    </div>
                    <Target className={`h-8 w-8 ${getRiskColor(overallRiskScore)}`} />
                  </div>
                  
                  <div className={`text-4xl font-bold mb-2 ${getRiskColor(overallRiskScore)}`}>
                    {overallRiskScore}%
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {overallRiskScore >= 80 ? 'Critical Risk Level' :
                     overallRiskScore >= 60 ? 'High Risk Level' :
                     overallRiskScore >= 40 ? 'Medium Risk Level' : 'Low Risk Level'}
                  </div>

                  <div className="mt-4 w-full bg-muted/30 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        overallRiskScore >= 80 ? 'bg-red-500' :
                        overallRiskScore >= 60 ? 'bg-orange-500' :
                        overallRiskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${overallRiskScore}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Top Vulnerabilities */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Active Vulnerabilities</h3>
                      <p className="text-sm text-muted-foreground">Real-time security issues</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                  
                  {vulnerabilities.length > 0 ? (
                    <div className="space-y-3">
                      {vulnerabilities.slice(0, 3).map((vuln, index) => (
                        <div key={vuln.id} className="flex items-center justify-between p-2 bg-background/30 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getSeverityColor(vuln.severity)}`} />
                            <div>
                              <div className="font-medium text-sm text-foreground">{vuln.title}</div>
                              <div className="text-xs text-muted-foreground">CVSS: {vuln.cvss}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {vuln.affectedAssets} assets
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-2 bg-green-500/20 rounded-full">
                          <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">
                          No Active Vulnerabilities
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Current data shows no critical security issues
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Trends */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Risk Trends</h3>
                      <p className="text-sm text-muted-foreground">7-day movement</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                  
                  <div className="space-y-3">
                    {riskScores.slice(0, 3).map((score, index) => (
                      <div key={score.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-foreground">{score.category}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${getRiskColor(score.score)}`}>{score.score}%</span>
                          {score.trend === 'up' && <TrendingUp className="h-4 w-4 text-red-500" />}
                          {score.trend === 'down' && <TrendingDown className="h-4 w-4 text-green-500" />}
                          {score.trend === 'stable' && <div className="w-4 h-px bg-gray-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Risk Categories */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Risk Categories
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {riskScores.map((score) => {
                  const isSelected = selectedCategory === score.category;
                  const infoId = `risk-${score.category}`;
                  
                  return (
                    <Card 
                      key={score.category}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        isSelected ? 'ring-2 ring-primary' : ''
                      } ${getRiskBg(score.score)} border`}
                      onClick={() => setSelectedCategory(isSelected ? null : score.category)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm text-foreground">{score.category}</div>
                          <Tooltip 
                            open={activeInfo === infoId} 
                            onOpenChange={(open) => setActiveInfo(open ? infoId : null)}
                          >
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveInfo(activeInfo === infoId ? null : infoId);
                                }}
                              >
                                <Info className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="p-4 max-w-xs">
                              <div className="space-y-2">
                                <div className="font-medium">{score.category} Risk</div>
                                <div className="text-xs text-muted-foreground">{score.description}</div>
                                <div className="text-xs">
                                  <strong>Key Factors:</strong>
                                  <ul className="mt-1 space-y-1">
                                    {score.factors.map((factor, idx) => (
                                      <li key={idx}>• {factor}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        
                        <div className={`text-2xl font-bold mb-2 ${getRiskColor(score.score)}`}>
                          {score.score}%
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={`text-xs ${getRiskColor(score.score)}`}>
                            {score.impact.toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {score.trend === 'up' && <TrendingUp className="h-3 w-3 text-red-500" />}
                            {score.trend === 'down' && <TrendingDown className="h-3 w-3 text-green-500" />}
                            {score.trend === 'stable' && <div className="w-3 h-px bg-gray-500" />}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Threat Vectors */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-500" />
                Active Threat Vectors
              </h3>
              {threatVectors.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {threatVectors.slice(0, 4).map((threat) => (
                    <Card key={threat.name}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-medium text-foreground">{threat.name}</div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRiskColor(threat.riskLevel)}`}
                          >
                            {threat.riskLevel}% risk
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">{threat.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Likelihood:</span>
                            <span className="font-medium">{threat.likelihood}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Impact:</span>
                            <span className="font-medium">{threat.impact}%</span>
                          </div>
                          <div className="flex justify-between text-xs items-center">
                            <span className="text-muted-foreground">Trend:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium capitalize">{threat.trend}</span>
                              {threat.trend === 'increasing' && <TrendingUp className="h-3 w-3 text-red-500" />}
                              {threat.trend === 'decreasing' && <TrendingDown className="h-3 w-3 text-green-500" />}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/20">
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-green-500/20 rounded-full">
                        <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-green-700 dark:text-green-300 mb-1">
                          No Active Threat Vectors Detected
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Current security data shows minimal threat activity
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      </div>
    </div>
  );
};