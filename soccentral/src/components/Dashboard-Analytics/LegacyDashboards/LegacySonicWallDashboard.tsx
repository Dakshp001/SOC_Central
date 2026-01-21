import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { SonicWallData } from '@/lib/api';

interface LegacySonicWallDashboardProps {
  sonicwallData: SonicWallData;
}

export const LegacySonicWallDashboard: React.FC<LegacySonicWallDashboardProps> = ({ sonicwallData }) => {
  return (
    <div className="space-y-6">
      <Alert className="bg-indigo-900/20 border-indigo-800">
        <Info className="h-4 w-4 text-indigo-400" />
        <AlertDescription className="text-indigo-300">
          SonicWall dashboard is using legacy view. Individual SonicWall dashboard coming soon.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Log Entries</h3>
          <p className="text-2xl font-bold text-gray-100">{sonicwallData.kpis.totalLogs.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Blocked Attempts</h3>
          <p className="text-2xl font-bold text-red-400">{sonicwallData.kpis.blockedAttempts.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Intrusion Attempts</h3>
          <p className="text-2xl font-bold text-orange-400">{sonicwallData.kpis.intrusionAttempts.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">VPN Connections</h3>
          <p className="text-2xl font-bold text-green-400">{sonicwallData.kpis.vpnConnections.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};