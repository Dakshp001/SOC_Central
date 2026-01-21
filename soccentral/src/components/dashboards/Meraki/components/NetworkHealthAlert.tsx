// src/components/dashboards/Meraki/NetworkHealthAlert.tsx
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";
import { EnhancedMerakiData } from "@/lib/api";

interface NetworkHealthAlertProps {
  data: EnhancedMerakiData;
  actualTheme: 'light' | 'dark';
}

export const NetworkHealthAlert: React.FC<NetworkHealthAlertProps> = ({
  data,
  actualTheme,
}) => {
  const healthScore = data.kpis?.networkHealthScore || 0;
  const totalDevices = data.kpis?.totalDevices || 0;
  const totalClients = data.kpis?.totalClients || 0;
  const totalSSIDs = data.kpis?.totalSSIDs || 0;
  const avgClientsPerDevice = data.kpis?.avgClientsPerDevice;

  const getAlertStyle = () => {
    if (healthScore >= 80) {
      return actualTheme === 'dark' 
        ? "bg-green-900/30 border-green-800" 
        : "bg-green-50 border-green-200";
    } else if (healthScore >= 60) {
      return actualTheme === 'dark' 
        ? "bg-yellow-900/30 border-yellow-800" 
        : "bg-yellow-50 border-yellow-200";
    } else {
      return actualTheme === 'dark' 
        ? "bg-red-900/30 border-red-800" 
        : "bg-red-50 border-red-200";
    }
  };

  const getIconColor = () => {
    if (healthScore >= 80) return "text-green-400";
    if (healthScore >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getTextColor = () => {
    if (healthScore >= 80) {
      return "text-green-600 dark:text-green-300";
    } else if (healthScore >= 60) {
      return "text-yellow-600 dark:text-yellow-300";
    } else {
      return "text-red-600 dark:text-red-300";
    }
  };

  return (
    <Alert className={getAlertStyle()}>
      <Shield className={`h-4 w-4 ${getIconColor()}`} />
      <AlertDescription className={getTextColor()}>
        <strong>Network Status:</strong> Health score {healthScore}/100 with{" "}
        {totalDevices.toLocaleString()} devices serving{" "}
        {totalClients.toLocaleString()} clients across {totalSSIDs} SSIDs.
        {avgClientsPerDevice && (
          <>
            {" "}
            Average load: {avgClientsPerDevice.toFixed(1)} clients per device.
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};