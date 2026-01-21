import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Target, AlertTriangle } from "lucide-react";
import { EDRData } from '../types';
import { formatPercentage, formatNumber } from '../utils';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface SecondaryMetricsProps {
  data: EDRData;
}

export const SecondaryMetrics: React.FC<SecondaryMetricsProps> = ({ data }) => {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                Endpoint Availability
              </p>
              <p className="text-xl font-bold text-blue-400">
                {formatPercentage(data.kpis.endpointAvailabilityRate)}
              </p>
            </div>
            <Activity className="h-6 w-6 text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                Scan Success Rate
              </p>
              <p className="text-xl font-bold text-green-400">
                {formatPercentage(data.kpis.scanSuccessRate)}
              </p>
            </div>
            <Target className="h-6 w-6 text-green-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                Malicious Threats
              </p>
              <p className="text-xl font-bold text-red-400">
                {formatNumber(data.kpis.maliciousThreats)}
              </p>
              <p className={`text-xs ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'} mt-1`}>
                {data.kpis.totalThreats > 0
                  ? `${formatPercentage((data.kpis.maliciousThreats / data.kpis.totalThreats) * 100)} of total`
                  : 'No threats detected'}
              </p>
            </div>
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};