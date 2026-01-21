import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { MerakiData } from '@/lib/api';

interface LegacyMerakiDashboardProps {
  merakiData: MerakiData;
}

export const LegacyMerakiDashboard: React.FC<LegacyMerakiDashboardProps> = ({ merakiData }) => {
  return (
    <div className="space-y-6">
      <Alert className="bg-purple-900/20 border-purple-800">
        <Info className="h-4 w-4 text-purple-400" />
        <AlertDescription className="text-purple-300">
          Meraki dashboard is using legacy view. Individual Meraki dashboard coming soon.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Network Devices</h3>
          <p className="text-2xl font-bold text-gray-100">{merakiData.kpis.totalDevices.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Access Points</h3>
          <p className="text-2xl font-bold text-green-400">{merakiData.kpis.accessPoints.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Network Uptime</h3>
          <p className="text-2xl font-bold text-purple-400">{merakiData.kpis.networkUptime.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Connected Clients</h3>
          <p className="text-2xl font-bold text-cyan-400">{merakiData.kpis.connectedClients.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};