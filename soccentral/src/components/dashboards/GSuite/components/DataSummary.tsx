// src/components/dashboards/GSuite/components/DataSummary.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Eye, Shield, Calendar } from 'lucide-react';
import { EnhancedGSuiteData } from '../types';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface DataSummaryProps {
  data: EnhancedGSuiteData;
  analyticsData: {
    totalSecurityEvents: number;
    securityEventRate: string;
  };
}

export const DataSummary: React.FC<DataSummaryProps> = ({ data, analyticsData }) => {
  const { actualTheme } = useTheme();
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  const accentColor = "text-cyan-400";
  const borderColor = "border-border";
  
  return (
    <Card className={`${cardBg} ${actualTheme === 'dark' ? 'bg-gradient-to-br from-card to-card/80' : 'bg-gradient-to-br from-card to-card/95'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
          <Users className={`h-5 w-5 ${accentColor}`} />
          Data Processing Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div className="space-y-2">
            <p className={textSecondary}>Total Records</p>
            <div className="flex items-center gap-3">
              <p className={`text-2xl font-bold ${accentColor}`}>
                {Object.values(data.details).reduce((sum, arr) => sum + arr.length, 0).toLocaleString()}
              </p>
              <div className={`w-8 h-8 rounded-full ${actualTheme === 'dark' ? 'bg-cyan-600/20' : 'bg-cyan-100/80'} flex items-center justify-center`}>
                <FileText className={`w-4 h-4 ${accentColor}`} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className={textSecondary}>Sheets Processed</p>
            <div className="flex items-center gap-3">
              <p className={`text-2xl font-bold ${accentColor}`}>{data.rawSheetNames.length}</p>
              <div className={`w-8 h-8 rounded-full ${actualTheme === 'dark' ? 'bg-cyan-600/20' : 'bg-cyan-100/80'} flex items-center justify-center`}>
                <Eye className={`w-4 h-4 ${accentColor}`} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className={textSecondary}>Security Event Rate</p>
            <div className="flex items-center gap-3">
              <p className={`text-2xl font-bold ${accentColor}`}>{analyticsData.securityEventRate}%</p>
              <div className={`w-8 h-8 rounded-full ${actualTheme === 'dark' ? 'bg-cyan-600/20' : 'bg-cyan-100/80'} flex items-center justify-center`}>
                <Shield className={`w-4 h-4 ${accentColor}`} />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className={textSecondary}>Processed At</p>
            <div className="flex items-center gap-3">
              <p className={`text-sm ${accentColor} font-medium`}>
                {new Date(data.processedAt).toLocaleDateString()}
              </p>
              <div className={`w-8 h-8 rounded-full ${actualTheme === 'dark' ? 'bg-cyan-600/20' : 'bg-cyan-100/80'} flex items-center justify-center`}>
                <Calendar className={`w-4 h-4 ${accentColor}`} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Sheet Status with Progress Indicators */}
        <div className={`mt-6 pt-6 border-t ${borderColor}`}>
          <div className="flex items-center justify-between mb-4">
            <p className={`text-sm font-medium ${textSecondary}`}>Sheet Processing Status:</p>
            <Badge variant="outline" className="border-green-600 text-green-400">
              {data.rawSheetNames.length} / {data.rawSheetNames.length} Complete
            </Badge>
          </div>
          
          {/* Progress bar */}
          <div className={`w-full ${actualTheme === 'dark' ? 'bg-muted/50' : 'bg-muted/30'} rounded-full h-2 mb-4`}>
            <div 
              className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: '100%' }}
            ></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.rawSheetNames.map((sheet, index) => (
              <div 
                key={sheet}
                className={`flex items-center gap-2 p-2 rounded-lg ${actualTheme === 'dark' ? 'bg-muted/30' : 'bg-muted/20'} border ${borderColor} hover:border-green-500/50 transition-colors`}
              >
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className={`text-xs ${textSecondary} truncate`} title={sheet}>
                  {sheet}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};