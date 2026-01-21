import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EDRData } from '../types';
import { formatNumber } from '../utils';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface DataSummaryFooterProps {
  data: EDRData;
}

export const DataSummaryFooter: React.FC<DataSummaryFooterProps> = ({ data }) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  // Handle both PDF (with rawSheetNames) and API data (with dataSource)
  const isLiveApiData = data.dataSource === 'wazuh_api';
  const sheetsCount = data.rawSheetNames?.length || 0;

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className={`flex items-center justify-between text-sm ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
          <div className="flex items-center gap-4">
            {!isLiveApiData && <span>Sheets processed: {sheetsCount}</span>}
            {isLiveApiData && <span>Data source: Wazuh API</span>}
            <span>Endpoints: {formatNumber(data.details?.endpoints?.length || 0)}</span>
            <span>Threats: {formatNumber(data.details?.threats?.length || 0)}</span>
            <span>Status records: {formatNumber(data.details?.detailedStatus?.length || 0)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLiveApiData ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            <span>{isLiveApiData ? 'Live API Data' : 'PDF Data'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};