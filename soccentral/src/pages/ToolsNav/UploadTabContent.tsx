// Upload Tab Content Component - Glass Morphism
// Save as: src/pages/ToolsNav/UploadTabContent.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { CheckCircle, XCircle } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { AllToolData } from '@/lib/api';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

type ToolType = 'gsuite' | 'mdm' | 'siem' | 'edr' | 'meraki' | 'sonicwall' | 'general';

interface UploadTabContentProps {
  selectedTool: ToolType;
  uploadSupported: boolean;
  currentData: any;
  currentFileName: string | null;
  currentUploadTime: Date | null;
  onDataProcessed: (processedData: AllToolData, detectedFileType: string, fileName: string) => void;
  onSetActiveTab: (tab: 'upload' | 'processes' | 'analytics') => void;
}

export const UploadTabContent: React.FC<UploadTabContentProps> = ({
  selectedTool,
  uploadSupported,
  currentData,
  currentFileName,
  currentUploadTime,
  onDataProcessed,
  onSetActiveTab
}) => {
  const { actualTheme } = useTheme();

  return (
    <TabsContent value="upload" className="space-y-4 m-0">
      {uploadSupported ? (
        <div className="space-y-4">
          {currentData && currentFileName && (
            <div className="
              relative overflow-hidden
              backdrop-blur-xl 
              bg-background/40 dark:bg-background/30 
              border border-green-200/40 dark:border-green-800/40
              bg-green-50/20 dark:bg-green-950/20
              rounded-xl
              shadow-lg shadow-black/5 dark:shadow-black/20
              transition-all duration-200
            ">
              {/* Card gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
              
              <div className="relative p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        Data Loaded: {currentFileName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {currentUploadTime?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSetActiveTab('analytics')}
                    className="border-border/40 text-muted-foreground hover:bg-primary/5 transition-colors backdrop-blur-sm"
                  >
                    View Analytics
                  </Button>
                </div>
              </div>
              
              {/* Accent line */}
              <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-green-400/40 to-transparent" />
            </div>
          )}
          
          <div className="
            relative overflow-hidden
            backdrop-blur-xl 
            bg-background/40 dark:bg-background/30 
            border border-border/40 dark:border-border/30
            rounded-xl
            shadow-lg shadow-black/5 dark:shadow-black/20
          ">
            {/* Card gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
            
            <div className="relative p-6">
              <FileUpload
                onDataProcessed={onDataProcessed}
                allowedTools={[selectedTool]}
                showCompanySelection={true}
              />
            </div>
            
            {/* Accent line */}
            <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
          </div>
        </div>
      ) : (
        <div className="
          relative overflow-hidden
          backdrop-blur-xl 
          bg-background/40 dark:bg-background/30 
          border border-border/40 dark:border-border/30
          rounded-xl
          shadow-lg shadow-black/5 dark:shadow-black/20
        ">
          {/* Card gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
          
          <div className="relative p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Upload Not Available
            </h3>
            <p className="text-muted-foreground">
              This tool is configured for real-time data connection rather than file upload.
            </p>
          </div>
          
          {/* Accent line */}
          <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        </div>
      )}
    </TabsContent>
  );
};