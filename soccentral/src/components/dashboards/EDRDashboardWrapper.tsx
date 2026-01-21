// EDRDashboardWrapper.tsx - Wrapper to handle both PDF and Live API modes
import React, { useState } from 'react';
import { EDRDashboard } from './EDRDashboard';
import { DataSourceToggle, DataSourceMode } from './EDR/components/DataSourceToggle';
import { EDRData } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, FileUp, AlertCircle } from 'lucide-react';

interface EDRDashboardWrapperProps {
  data?: EDRData | null; // PDF upload data (optional)
}

export const EDRDashboardWrapper: React.FC<EDRDashboardWrapperProps> = ({ data: pdfData }) => {
  const [dataSourceMode, setDataSourceMode] = useState<DataSourceMode>(pdfData ? 'pdf' : 'api');
  const [liveApiData, setLiveApiData] = useState<EDRData | null>(null);
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(false);

  // Determine which data to use
  const activeData = dataSourceMode === 'api' && liveApiData ? liveApiData : pdfData;

  const handleModeChange = (mode: DataSourceMode) => {
    console.log(`🔄 Switching EDR data source mode to: ${mode}`);
    setDataSourceMode(mode);
  };

  const handleLiveDataLoad = (liveData: EDRData) => {
    console.log("📡 Live data loaded from Wazuh API");
    setLiveApiData(liveData);
    setIsLoadingLiveData(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Always show the data source toggle */}
      <DataSourceToggle
        currentMode={dataSourceMode}
        onModeChange={handleModeChange}
        onLiveDataLoad={handleLiveDataLoad}
        isLoadingLive={isLoadingLiveData}
      />

      {/* Show dashboard if we have data, otherwise show instructions */}
      {activeData ? (
        <EDRDashboard data={activeData} />
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {dataSourceMode === 'pdf' ? (
                <>
                  <FileUp className="h-5 w-5" />
                  No PDF Data Available
                </>
              ) : (
                <>
                  <Database className="h-5 w-5" />
                  No Live Data Loaded
                </>
              )}
            </CardTitle>
            <CardDescription>
              {dataSourceMode === 'pdf' ? (
                <>
                  Upload an EDR Excel file to view PDF data, or switch to "Live Wazuh API" mode to fetch real-time data.
                </>
              ) : (
                <>
                  Click the "Live Wazuh API" button above to fetch real-time data from Wazuh server.
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Quick Start:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click "Live Wazuh API" to fetch real-time data from your Wazuh server</li>
                  <li>Or upload an EDR Excel file and switch to "PDF Upload" mode</li>
                  <li>The dashboard will display comprehensive endpoint and threat analytics</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
