// src/components/dashboards/EDR/tabs/IncidentsTab.tsx
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { EDRData, ModalData } from '../types';
import { formatNumber, getStatusColor } from '../utils';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface IncidentsTabProps {
  data: EDRData;
  openModal: (modalData: ModalData) => void;
  getAllThreatsData: () => ModalData;
}

export const IncidentsTab: React.FC<IncidentsTabProps> = ({ data, openModal, getAllThreatsData }) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  // Theme-aware colors
  const cardBg = isDark ? 'bg-card border-border' : 'bg-card border-border';
  const textPrimary = isDark ? 'text-foreground' : 'text-foreground';
  const textSecondary = isDark ? 'text-muted-foreground' : 'text-muted-foreground';
  const tableBorder = isDark ? 'border-border/50' : 'border-border/50';

  // Safely access analytics data with fallbacks
  const threatTypeData = data.analytics?.threatTypeDistribution || {};
  const classificationData = data.analytics?.classificationDistribution || {};

  // Get unique incident types for filter
  const incidentTypes = useMemo(() => {
    const types = new Set<string>();
    data.details.threats.forEach(threat => {
      if (threat.classification) {
        types.add(threat.classification);
      }
    });
    return Array.from(types).sort();
  }, [data.details.threats]);

  // Filter threats based on selected type
  const filteredThreats = useMemo(() => {
    if (selectedFilter === "all") {
      return data.details.threats;
    }
    return data.details.threats.filter(threat => threat.classification === selectedFilter);
  }, [data.details.threats, selectedFilter]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {/* Incident Classifications */}
        <Card className={cardBg}>
          <CardHeader>
            <CardTitle className={textPrimary}>Incident Classifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(classificationData)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 8)
                .map(([classification, count]) => (
                  <div key={classification} className="flex items-center justify-between">
                    <span className={textSecondary}>{classification}</span>
                    <span className={`${textPrimary} font-medium`}>
                      {formatNumber(count)}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents Table */}
      <Card className={cardBg}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className={textPrimary}>Recent Incident Activity</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-sm"
              >
                <option value="all">All Types ({data.details.threats.length})</option>
                {incidentTypes.map(type => (
                  <option key={type} value={type}>
                    {type} ({data.details.threats.filter(t => t.classification === type).length})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-border' : 'border-border'}`}>
                  <th className={`text-left py-3 px-2 ${textSecondary} font-semibold`}>Incident Details</th>
                  <th className={`text-left py-3 px-2 ${textSecondary} font-semibold`}>Severity</th>
                  <th className={`text-left py-3 px-2 ${textSecondary} font-semibold`}>Confidence</th>
                  <th className={`text-left py-3 px-2 ${textSecondary} font-semibold`}>Type</th>
                  <th className={`text-left py-3 px-2 ${textSecondary} font-semibold`}>Endpoint</th>
                </tr>
              </thead>
              <tbody>
                {filteredThreats.slice(0, 10).map((threat, index) => (
                  <tr
                    key={index}
                    className={`border-b ${tableBorder} hover:bg-muted/30 transition-colors cursor-pointer`}
                    onClick={() => openModal(getAllThreatsData())}
                    title="Click to view all incident details"
                  >
                    <td className={`py-3 px-2 max-w-md`}>
                      <div className="flex flex-col gap-1">
                        <span className={`${textPrimary} font-medium`}>
                          {threat.threat_name || 'Unknown Incident'}
                        </span>
                        {threat.threat_details && threat.threat_details !== threat.threat_name && (
                          <span className={`${textSecondary} text-xs line-clamp-2`} title={threat.threat_details}>
                            {threat.threat_details}
                          </span>
                        )}
                        {threat.mitre_id && threat.mitre_id !== 'N/A' && (
                          <span className={`${textSecondary} text-xs`}>
                            🎯 MITRE: {threat.mitre_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant="outline"
                        className={`${
                          threat.severity === 'Critical' ? 'text-red-500 border-red-500' :
                          threat.severity === 'High' ? 'text-orange-500 border-orange-500' :
                          threat.severity === 'Medium' ? 'text-yellow-500 border-yellow-500' :
                          'text-blue-500 border-blue-500'
                        } border-current font-semibold`}
                      >
                        {threat.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(threat.confidence_level)} border-current`}
                      >
                        {threat.confidence_level}
                      </Badge>
                    </td>
                    <td className={`py-3 px-2`}>
                      <div className="flex flex-col gap-1">
                        <span className={`${textPrimary} font-medium text-xs`}>
                          {threat.classification}
                        </span>
                        {threat.rule_id && (
                          <span className={`${textSecondary} text-xs`}>
                            Rule: {threat.rule_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`py-3 px-2 ${textSecondary}`}>
                      {threat.endpoint || threat.endpoints || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};