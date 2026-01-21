// Communication Matrix Component - Glass Morphism
// Save as: src/components/SOCProcesses/CommunicationMatrix.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  Eye, 
  FileText, 
  Mail, 
  Phone 
} from 'lucide-react';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';

interface CommunicationMatrixProps {
  tool: string;
}

export const CommunicationMatrix: React.FC<CommunicationMatrixProps> = ({ tool }) => {
  const { actualTheme } = useTheme();
  
  return (
    <div className="
      relative overflow-hidden
      backdrop-blur-xl 
      bg-background/40 dark:bg-background/30 
      border border-border/40 dark:border-border/30
      rounded-xl
      shadow-lg shadow-black/5 dark:shadow-black/20
      transition-all duration-200 
      hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30
      hover:bg-background/50 dark:hover:bg-background/40
    ">
      {/* Card gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/10 pointer-events-none" />
      
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Communication Protocol</h3>
        </div>

        <div className="space-y-3">
          <div className="
            relative overflow-hidden
            backdrop-blur-sm 
            bg-red-50/30 dark:bg-red-950/20
            border border-red-200/40 dark:border-red-800/40
            rounded-lg
            p-3
          ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="font-medium text-foreground">Critical/High</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <MessageSquare className="h-4 w-4" />
                <Phone className="h-4 w-4" />
                <span>Immediate</span>
              </div>
            </div>
          </div>
          
          <div className="
            relative overflow-hidden
            backdrop-blur-sm 
            bg-yellow-50/30 dark:bg-yellow-950/20
            border border-yellow-200/40 dark:border-yellow-800/40
            rounded-lg
            p-3
          ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="font-medium text-foreground">Medium</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <MessageSquare className="h-4 w-4" />
                <span>15-24 hours</span>
              </div>
            </div>
          </div>
          
          <div className="
            relative overflow-hidden
            backdrop-blur-sm 
            bg-green-50/30 dark:bg-green-950/20
            border border-green-200/40 dark:border-green-800/40
            rounded-lg
            p-3
          ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-medium text-foreground">Low</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Every 3 days</span>
              </div>
            </div>
          </div>
          
          {tool !== 'mdm' && (
            <div className="
              relative overflow-hidden
              backdrop-blur-sm 
              bg-background/40 dark:bg-background/30
              border border-border/40 dark:border-border/30
              rounded-lg
              p-3
            ">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Info</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Weekly</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Accent line */}
      <div className="absolute bottom-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
    </div>
  );
};