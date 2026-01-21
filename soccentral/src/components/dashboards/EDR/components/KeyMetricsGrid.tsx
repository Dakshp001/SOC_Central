import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Monitor, Shield, AlertTriangle, RefreshCw, Wifi, WifiOff, 
  CheckCircle2, Clock, ExternalLink, 
  Info,
  X
} from "lucide-react";
import { EDRData, ModalData } from '../types';
import { formatNumber, formatPercentage, getStatusColor, getSecurityScoreColor, getSecurityScoreLabel } from '../utils';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface KeyMetricsGridProps {
  data: EDRData;
  openModal: (modalData: ModalData) => void;
  getEndpointsModalData: () => ModalData;
  getConnectedEndpointsData: () => ModalData;
  getDisconnectedEndpointsData: () => ModalData;
  getAllThreatsData: () => ModalData;
  getMaliciousThreatsData: () => ModalData;
  getSuspiciousThreatsData: () => ModalData;
  getUpToDateEndpointsData: () => ModalData;
}

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({
  data,
  openModal,
  getEndpointsModalData,
  getConnectedEndpointsData,
  getDisconnectedEndpointsData,
  getAllThreatsData,
  getMaliciousThreatsData,
  getSuspiciousThreatsData,
  getUpToDateEndpointsData,
}) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);

  // Theme-aware colors
  const cardBg = "bg-card border-border";
  const cardHover = isDark ? "hover:bg-card/80" : "hover:bg-card/80";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  const popoverBg = "bg-popover border-border";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Endpoints - Clickable */}
      <Card
        className={`${cardBg} cursor-pointer ${cardHover} transition-all duration-200 hover:border-blue-600 group`}
        onClick={() => openModal(getEndpointsModalData())}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${textSecondary}`}>Total Endpoints</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>
                {formatNumber(data.kpis.totalEndpoints)}
              </p>
              <p className="text-xs text-blue-400 mt-1 group-hover:text-blue-300">
                Click to view details
              </p>
            </div>
            <div className="relative">
              <Monitor className="h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform" />
              <ExternalLink className="h-3 w-3 text-blue-400 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="flex items-center gap-1 cursor-pointer hover:bg-green-500/10 px-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                openModal(getConnectedEndpointsData());
              }}
            >
              <Wifi className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400 hover:text-green-300">
                {formatNumber(data.kpis.connectedEndpoints)} connected
              </span>
            </div>
            <div
              className="flex items-center gap-1 cursor-pointer hover:bg-red-500/10 px-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                openModal(getDisconnectedEndpointsData());
              }}
            >
              <WifiOff className="h-3 w-3 text-red-400" />
              <span className="text-xs text-red-400 hover:text-red-300">
                {formatNumber(data.kpis.disconnectedEndpoints)} offline
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Score - Non-clickable */}
      <Card className={`${cardBg} relative`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${textSecondary}`}>Security Score</span>
            <button
              onClick={() => setShowSecurityInfo(!showSecurityInfo)}
              className={`p-1 ${textSecondary} hover:text-blue-400 ${isDark ? 'hover:bg-muted/50' : 'hover:bg-muted/50'} rounded transition-all duration-200`}
              title="How is this calculated?"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-2xl font-bold ${getSecurityScoreColor(data.kpis.securityScore)}`}>
                {formatPercentage(data.kpis.securityScore)}
              </p>
              <span className={`text-xs ${getSecurityScoreColor(data.kpis.securityScore)}`}>
                {getSecurityScoreLabel(data.kpis.securityScore)} security posture
              </span>
            </div>
            <Shield className={`h-8 w-8 ${getSecurityScoreColor(data.kpis.securityScore)}`} />
          </div>
        </CardContent>

        {/* Simple Info Tooltip */}
        {showSecurityInfo && (
          <div className={`absolute top-full left-0 mt-2 w-72 ${popoverBg} rounded-lg shadow-xl z-50 p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${textPrimary}`}>Security Score Calculation</h3>
              <button
                onClick={() => setShowSecurityInfo(false)}
                className={`${textSecondary} hover:text-foreground`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className={`text-xs ${textSecondary} space-y-2`}>
              <p>
                The security score is calculated using a weighted average of three key components:
              </p>

              <ul className="space-y-1 ml-3">
                <li>• <span className="text-green-400">Endpoint Availability</span> (30%) - Connected endpoints rate</li>
                <li>• <span className="text-blue-400">Update Compliance</span> (30%) - Up-to-date endpoints rate</li>
                <li>• <span className="text-orange-400">Threat Impact</span> (40%) - Based on malicious threat ratio</li>
              </ul>

              <p className={`${isDark ? 'text-muted-foreground/70' : 'text-muted-foreground/70'} pt-2 border-t border-border`}>
                Score is reduced when there are high disconnection rates or a high proportion of malicious threats.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Incident Overview - Clickable */}
      <Card
        className={`${cardBg} cursor-pointer ${cardHover} transition-all duration-200 hover:border-orange-600 group`}
        onClick={() => openModal(getAllThreatsData())}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${textSecondary}`}>Total Incidents</p>
              <p className={`text-2xl font-bold ${textPrimary}`}>
                {formatNumber(data.kpis.totalThreats)}
              </p>
              <p className="text-xs text-orange-400 mt-1 group-hover:text-orange-300">
                Click to view details
              </p>
            </div>
            <div className="relative">
              <AlertTriangle className="h-8 w-8 text-orange-400 group-hover:scale-110 transition-transform" />
              <ExternalLink className="h-3 w-3 text-orange-400 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div
              className="flex items-center gap-1 cursor-pointer hover:bg-red-500/10 px-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                openModal(getMaliciousThreatsData());
              }}
            >
              <AlertTriangle className="h-3 w-3 text-red-400" />
              <span className="text-xs text-red-400 hover:text-red-300">
                {formatNumber(data.kpis.maliciousThreats)} malicious
              </span>
            </div>
            <div
              className="flex items-center gap-1 cursor-pointer hover:bg-yellow-500/10 px-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                openModal(getSuspiciousThreatsData());
              }}
            >
              <Clock className="h-3 w-3 text-yellow-400" />
              <span className="text-xs text-yellow-400 hover:text-yellow-300">
                {formatNumber(data.kpis.suspiciousThreats)} suspicious
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update Compliance - Clickable */}
      <Card
        className={`${cardBg} cursor-pointer ${cardHover} transition-all duration-200 hover:border-green-600 group`}
        onClick={() => openModal(getUpToDateEndpointsData())}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${textSecondary}`}>Update Compliance</p>
              <p className="text-2xl font-bold text-green-400">
                {formatPercentage(data.kpis.updateComplianceRate)}
              </p>
              <p className="text-xs text-green-400 mt-1 group-hover:text-green-300">
                Click to view compliant endpoints
              </p>
            </div>
            <div className="relative">
              <RefreshCw className="h-8 w-8 text-green-400 group-hover:scale-110 transition-transform" />
              <ExternalLink className="h-3 w-3 text-green-400 absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="mt-2">
            <span className={`text-xs ${textSecondary}`}>
              {formatNumber(data.kpis.upToDateEndpoints)} /{" "}
              {formatNumber(data.kpis.totalEndpoints)} up to date
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};