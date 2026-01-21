import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Zap, Sparkles, Network, Shield } from 'lucide-react';
import { AllToolData } from '@/lib/api';
import { FeatureStatus } from '../types/FeatureStatus.types';

interface ToolHeaderProps {
  toolType: string;
  data: AllToolData;
  featureStatus: FeatureStatus;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({ toolType, data, featureStatus }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Badge variant="default" className="capitalize bg-blue-600 text-white border-blue-500">
          {toolType} Analytics
        </Badge>
        {data && typeof data === 'object' && 'fileType' in data && (
          <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-800">
            File Type: {data.fileType}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-green-700 text-green-100">
          Live Dashboard
        </Badge>
        
        {/* Enhanced Feature Badges */}
        {featureStatus.enhanced && (
          <>
            {featureStatus.type === 'siem' && (
              <>
                <Badge variant="default" className="bg-purple-600 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  Enhanced SIEM
                </Badge>
                <Badge variant="outline" className="border-blue-500 text-blue-300">
                  {featureStatus.totalAlerts?.toLocaleString()} Total Alerts
                </Badge>
              </>
            )}
            
            {featureStatus.type === 'gsuite' && (
              <>
                <Badge variant="default" className="bg-blue-600 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Enhanced GSuite
                </Badge>
                <Badge variant="outline" className="border-green-500 text-green-300">
                  {featureStatus.emailsScanned?.toLocaleString()} Emails Processed
                </Badge>
              </>
            )}
            
            {featureStatus.type === 'mdm' && (
              <Badge variant="default" className="bg-green-600 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Enhanced MDM
              </Badge>
            )}

            {featureStatus.type === 'meraki' && (
              <>
                <Badge variant="default" className="bg-purple-600 text-white">
                  <Network className="h-3 w-3 mr-1" />
                  Enhanced Meraki
                </Badge>
                <Badge variant="outline" className="border-purple-500 text-purple-300">
                  {featureStatus.totalDevices?.toLocaleString()} Network Devices
                </Badge>
              </>
            )}

            {featureStatus.type === 'edr' && (
              <>
                <Badge variant="default" className="bg-red-600 text-white">
                  <Shield className="h-3 w-3 mr-1" />
                  Enhanced EDR
                </Badge>
                <Badge variant="outline" className="border-red-500 text-red-300">
                  {featureStatus.totalEndpoints?.toLocaleString()} Endpoints
                </Badge>
              </>
            )}
            
            <Badge variant="outline" className="border-green-500 text-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Advanced Features Active
            </Badge>
          </>
        )}
        
        {/* Legacy View Indicators */}
        {!featureStatus.enhanced && ['gsuite', 'edr', 'meraki', 'sonicwall'].includes(toolType) && (
          <Badge variant="outline" className="border-yellow-500 text-yellow-300">
            Legacy View
          </Badge>
        )}
      </div>
    </div>
  );
};