// src/components/dashboards/Meraki/MerakiErrorComponent.tsx
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { EnhancedMerakiData } from "@/lib/api";

interface MerakiErrorComponentProps {
  data: EnhancedMerakiData | null;
  actualTheme: 'light' | 'dark';
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
}

export const MerakiErrorComponent: React.FC<MerakiErrorComponentProps> = ({
  data,
  actualTheme,
  cardBg,
  textPrimary,
  textSecondary,
}) => {
  return (
    <div className="space-y-6">
      <Alert className={actualTheme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}>
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <AlertDescription className="text-red-300 dark:text-red-700">
          <strong>Data Structure Error:</strong> The Meraki data provided does
          not have the expected structure. Please ensure the backend is
          returning properly formatted EnhancedMerakiData.
        </AlertDescription>
      </Alert>

      <div className={`${cardBg} rounded-lg p-6`}>
        <h3 className={`text-lg font-medium ${textPrimary} mb-4`}>
          Debug Information
        </h3>
        <div className="space-y-2 text-sm">
          <p className={textSecondary}>
            <strong>Data exists:</strong> {data ? "Yes" : "No"}
          </p>
          <p className={textSecondary}>
            <strong>KPIs exist:</strong> {data?.kpis ? "Yes" : "No"}
          </p>
          <p className={textSecondary}>
            <strong>Details exist:</strong> {data?.details ? "Yes" : "No"}
          </p>
          {data && (
            <p className={textSecondary}>
              <strong>Available keys:</strong> {Object.keys(data).join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};