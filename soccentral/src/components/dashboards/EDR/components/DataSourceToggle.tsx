// src/components/dashboards/EDR/components/DataSourceToggle.tsx
// Toggle component for switching between PDF Upload and Live Wazuh API data with auto-refresh

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, FileUp, Loader2, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { EDRData } from '@/lib/api';

export type DataSourceMode = 'pdf' | 'api';

interface DataSourceToggleProps {
  currentMode: DataSourceMode;
  onModeChange: (mode: DataSourceMode) => void;
  onLiveDataLoad: (data: EDRData) => void;
  isLoadingLive: boolean;
}

// Fixed refresh interval - 2 minutes
const AUTO_REFRESH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

// Feature flag for Wazuh API - can be toggled via environment variable
const WAZUH_API_ENABLED = import.meta.env.VITE_ENABLE_WAZUH_API === 'true';

export const DataSourceToggle: React.FC<DataSourceToggleProps> = ({
  currentMode,
  onModeChange,
  onLiveDataLoad,
  isLoadingLive
}) => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const handleLiveDataLoad = async (isAutoRefresh: boolean = false) => {
    setIsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

      const response = await fetch(`${API_BASE_URL}/tool/edr/live-data/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to fetch live data');
      }

      const data = await response.json();

      // Validate that we received EDR data
      if (!data.kpis || !data.details) {
        throw new Error('Invalid data format received from API');
      }

      onLiveDataLoad(data as EDRData);
      onModeChange('api');
      setLastRefreshTime(new Date());

      if (!isAutoRefresh) {
        toast({
          title: 'Live Data Loaded',
          description: `Successfully fetched ${data.kpis.totalEndpoints} endpoints and ${data.kpis.totalThreats} threats from Wazuh API`,
        });
      } else {
        console.log('🔄 Auto-refreshed Wazuh data:', {
          endpoints: data.kpis.totalEndpoints,
          threats: data.kpis.totalThreats,
          time: new Date().toLocaleTimeString()
        });
      }

    } catch (error) {
      console.error('Error loading live data:', error);

      toast({
        title: isAutoRefresh ? 'Auto-Refresh Failed' : 'Failed to Load Live Data',
        description: error instanceof Error ? error.message : 'Could not connect to Wazuh API',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Setup auto-refresh when switching to API mode (fixed 2-minute interval)
  useEffect(() => {
    // Clear existing timers
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    // Only setup auto-refresh if in API mode
    if (currentMode === 'api') {
      console.log(`🔄 Auto-refresh enabled: 2 minutes`);

      // Setup refresh timer (2 minutes)
      refreshTimerRef.current = setInterval(() => {
        handleLiveDataLoad(true);
      }, AUTO_REFRESH_INTERVAL_MS);

      // Setup countdown timer (updates every second)
      let secondsRemaining = AUTO_REFRESH_INTERVAL_MS / 1000;
      setNextRefreshIn(secondsRemaining);

      countdownTimerRef.current = setInterval(() => {
        secondsRemaining--;
        if (secondsRemaining <= 0) {
          secondsRemaining = AUTO_REFRESH_INTERVAL_MS / 1000;
        }
        setNextRefreshIn(secondsRemaining);
      }, 1000);
    } else {
      setNextRefreshIn(null);
    }

    // Cleanup on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [currentMode]);

  // Handle manual refresh
  const handleManualRefresh = () => {
    if (currentMode === 'api') {
      handleLiveDataLoad(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          EDR Data Source
        </CardTitle>
        <CardDescription>
          Choose between uploaded PDF data or live Wazuh API integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* PDF Upload Mode Button */}
          <Button
            variant={currentMode === 'pdf' ? 'default' : 'outline'}
            className="flex-1 h-auto py-4 flex flex-col gap-2"
            onClick={() => onModeChange('pdf')}
            disabled={isLoading || isLoadingLive}
          >
            <FileUp className="h-5 w-5" />
            <div className="text-sm font-semibold">PDF Upload</div>
            <div className="text-xs opacity-70">Use uploaded Excel/PDF data</div>
          </Button>

          {/* Live API Mode Button - Only show if feature flag is enabled */}
          {WAZUH_API_ENABLED && (
            <Button
              variant={currentMode === 'api' ? 'default' : 'outline'}
              className="flex-1 h-auto py-4 flex flex-col gap-2"
              onClick={() => handleLiveDataLoad()}
              disabled={isLoading || isLoadingLive}
            >
              {(isLoading || isLoadingLive) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Database className="h-5 w-5" />
              )}
              <div className="text-sm font-semibold">
                {(isLoading || isLoadingLive) ? 'Loading...' : 'Live Wazuh API'}
              </div>
              <div className="text-xs opacity-70">
                {(isLoading || isLoadingLive) ? 'Fetching data...' : 'Real-time data from Wazuh'}
              </div>
            </Button>
          )}
        </div>

        {/* Status indicator */}
        <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
          {currentMode === 'pdf' ? (
            <>
              <FileUp className="h-4 w-4" />
              <span>Currently viewing data from uploaded file</span>
            </>
          ) : (
            <>
              <Database className="h-4 w-4" />
              <span>Currently viewing live data from Wazuh API</span>
            </>
          )}
        </div>

        {/* Auto-Refresh Status - Fixed 2 Minutes */}
        {currentMode === 'api' && (
          <div className="mt-4 p-4 border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-500 animate-spin-slow" />
                <span className="font-medium text-sm">Auto-Refresh Active</span>
                <span className="text-xs text-muted-foreground">(Every 2 minutes)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isLoading || isLoadingLive}
                className="h-8"
              >
                {(isLoading || isLoadingLive) ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Refresh Now
              </Button>
            </div>

            {/* Refresh Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {nextRefreshIn !== null && (
                  <span>Next refresh in {formatTimeRemaining(Math.floor(nextRefreshIn))}</span>
                )}
              </div>

              {lastRefreshTime && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {lastRefreshTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* API Info */}
        {currentMode === 'api' && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md">
            <div className="flex items-start gap-2 text-xs">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">Live API Connection</div>
                <div className="text-muted-foreground">
                  Connected to Wazuh Indexer at 192.168.3.11:9200
                  <br />
                  Data is fetched in real-time from wazuh-alerts-* and wazuh-monitoring-* indices
                  <br />
                  <span className="text-green-500 font-medium">✓ Connection pooling enabled</span> | <span className="text-blue-500 font-medium">✓ Supports &gt;1000 records with pagination</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
