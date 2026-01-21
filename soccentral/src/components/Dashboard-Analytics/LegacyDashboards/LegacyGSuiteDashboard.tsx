import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { GSuiteData } from '@/lib/api';

interface LegacyGSuiteDashboardProps {
  gsData: GSuiteData;
}

export const LegacyGSuiteDashboard: React.FC<LegacyGSuiteDashboardProps> = ({ gsData }) => {
  return (
    <div className="space-y-6">
      <Alert className="bg-orange-900/20 border-orange-800">
        <Info className="h-4 w-4 text-orange-400" />
        <AlertDescription className="text-orange-300">
          <strong>Legacy Data Format Detected:</strong> This file uses an older GSuite data format. 
          Please re-upload with the latest format for enhanced features, or continue with basic dashboard below.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Emails Scanned</h3>
          <p className="text-2xl font-bold text-gray-100">
            {(gsData.kpis?.emailsScanned || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Phishing Attempts</h3>
          <p className="text-2xl font-bold text-red-400">
            {((gsData.kpis as any)?.phishingBlocked || (gsData.kpis as any)?.phishingAttempted || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Suspicious Flags</h3>
          <p className="text-2xl font-bold text-orange-400">
            {((gsData.kpis as any)?.suspiciousFlags || (gsData.kpis as any)?.suspiciousEmails || 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Whitelist Requests</h3>
          <p className="text-2xl font-bold text-green-400">
            {(gsData.kpis?.whitelistRequests || 0).toLocaleString()}
          </p>
        </div>
      </div>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-200">Available Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Suspicious Emails</p>
              <p className="text-lg font-semibold text-gray-200">
                {(gsData.details as any)?.suspiciousEmails?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Phishing Attempts</p>
              <p className="text-lg font-semibold text-gray-200">
                {(gsData.details as any)?.phishingAttempts?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Whitelisted Domains</p>
              <p className="text-lg font-semibold text-gray-200">
                {(gsData.details as any)?.whitelistedDomains?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Client Investigations</p>
              <p className="text-lg font-semibold text-gray-200">
                {(gsData.details as any)?.clientInvestigation?.length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};