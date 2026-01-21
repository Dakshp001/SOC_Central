import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { AllToolData } from '@/lib/api';

interface GenericDashboardProps {
  data: AllToolData;
  toolType: string;
}

export const GenericDashboard: React.FC<GenericDashboardProps> = ({ data, toolType }) => {
  return (
    <div className="space-y-6">
      <Alert className="bg-yellow-900/20 border-yellow-800">
        <AlertCircle className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-300">
          Generic dashboard view. Data format not recognized or dashboard not yet implemented for this tool type: {toolType}
        </AlertDescription>
      </Alert>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-200 mb-4">Data Overview</h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-300">
            <strong className="text-gray-200">Tool Type:</strong> {toolType}
          </p>
          <p className="text-sm text-gray-300">
            <strong className="text-gray-200">Data Type:</strong> {typeof data}
          </p>
          {data && typeof data === 'object' && 'rawSheetNames' in data && (
            <p className="text-sm text-gray-300">
              <strong className="text-gray-200">Sheets:</strong> {(data as any).rawSheetNames?.join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};