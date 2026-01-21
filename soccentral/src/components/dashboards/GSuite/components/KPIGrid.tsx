// src/components/dashboards/GSuite/components/KPIGrid.tsx

import React from 'react';
import { 
  Mail, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Search 
} from 'lucide-react';
import { KPICard } from './KPICard';
import { EnhancedGSuiteData, KPICard as KPICardType } from '../types';
import { CHART_COLORS } from '../utils';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface KPIGridProps {
  data: EnhancedGSuiteData;
  filterSeverity: string;
  setFilterSeverity: (severity: string) => void;
  onCardClick: (detailKey: string) => void;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ 
  data, 
  filterSeverity, 
  setFilterSeverity, 
  onCardClick 
}) => {
  const { actualTheme } = useTheme();

  // Theme-aware color configurations using consistent pattern from KeyMetricsGrid
  const getThemeColors = () => {
    // Using consistent color scheme that works with CSS variables
    return {
      blue: { 
        color: 'text-blue-400', 
        bg: actualTheme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-100/50', 
        border: 'border-blue-600' 
      },
      red: { 
        color: 'text-red-400', 
        bg: actualTheme === 'dark' ? 'bg-red-900/20' : 'bg-red-100/50', 
        border: 'border-red-600' 
      },
      orange: { 
        color: 'text-orange-400', 
        bg: actualTheme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-100/50', 
        border: 'border-orange-600' 
      },
      green: { 
        color: 'text-green-400', 
        bg: actualTheme === 'dark' ? 'bg-green-900/20' : 'bg-green-100/50', 
        border: 'border-green-600' 
      },
      purple: { 
        color: 'text-purple-400', 
        bg: actualTheme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-100/50', 
        border: 'border-purple-600' 
      }
    };
  };

  const themeColors = getThemeColors();

  // KPI Cards configuration with theme-aware visuals
  const kpiCards: KPICardType[] = [
    {
      id: 'emailsScanned',
      title: 'Total Email Scanned',
      value: data.kpis.emailsScanned,
      icon: Mail,
      color: themeColors.blue.color,
      bgColor: themeColors.blue.bg,
      borderColor: themeColors.blue.border,
      description: 'Total emails processed and scanned from April to today',
      detailKey: 'totalEmailsScanned',
      detailTitle: 'All Scanned Emails',
      chartColor: CHART_COLORS.primary
    },
    {
      id: 'phishingAttempted',
      title: 'Phishing Attempted',
      value: data.kpis.phishingAttempted,
      icon: Shield,
      color: themeColors.red.color,
      bgColor: themeColors.red.bg,
      borderColor: themeColors.red.border,
      description: 'Phishing attempts detected and reported by users',
      detailKey: 'phishingAttempted',
      detailTitle: 'Phishing Attempts Reported',
      chartColor: CHART_COLORS.danger
    },
    {
      id: 'suspiciousEmails',
      title: 'Suspicious Email',
      value: data.kpis.suspiciousEmails,
      icon: AlertTriangle,
      color: themeColors.orange.color,
      bgColor: themeColors.orange.bg,
      borderColor: themeColors.orange.border,
      description: 'Suspicious messages flagged by system analysis',
      detailKey: 'suspiciousEmails',
      detailTitle: 'Suspicious Email Reports',
      chartColor: CHART_COLORS.warning
    },
    {
      id: 'whitelistRequests',
      title: 'Whitelisting Request',
      value: data.kpis.whitelistRequests,
      icon: CheckCircle,
      color: themeColors.green.color,
      bgColor: themeColors.green.bg,
      borderColor: themeColors.green.border,
      description: 'Domains added to whitelist for safe communication',
      detailKey: 'whitelistedDomains',
      detailTitle: 'Whitelisted Domains',
      chartColor: CHART_COLORS.secondary
    },
    {
      id: 'clientInvestigations',
      title: 'Total Investigation Co-ordinated with Client',
      value: data.kpis.clientInvestigations,
      icon: Search,
      color: themeColors.purple.color,
      bgColor: themeColors.purple.bg,
      borderColor: themeColors.purple.border,
      description: 'Email operations conducted by SOC with client collaboration',
      detailKey: 'clientInvestigations',
      detailTitle: 'Client Investigation Records',
      chartColor: CHART_COLORS.purple
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpiCards.map((card) => (
        <KPICard
          key={card.id}
          card={card}
          data={data}
          emailsScanned={data.kpis.emailsScanned}
          filterSeverity={filterSeverity}
          setFilterSeverity={setFilterSeverity}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  );
};