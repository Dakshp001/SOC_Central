// src/components/dashboards/Meraki/AvailableDataSections.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, BarChart3 } from "lucide-react";
import { DetailTable } from "./DetailTable";
import { EnhancedMerakiData } from "@/lib/api";

interface AvailableDataSectionsProps {
  data: EnhancedMerakiData;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  actualTheme: 'light' | 'dark';
}

export const AvailableDataSections: React.FC<AvailableDataSectionsProps> = ({
  data,
  cardBg,
  textPrimary,
  textSecondary,
  actualTheme,
}) => {
  return (
    <Card className={cardBg}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${textPrimary}`}>
          <Eye className="h-5 w-5 text-cyan-400" />
          Available Data Sections
          <Badge variant="outline" className="border-cyan-600 text-cyan-400">
            {Object.keys(data.details).length} sections
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(data.details).map(([key, value]) => (
            <Dialog key={key}>
              <DialogTrigger asChild>
                <Card className={`cursor-pointer transition-all duration-200 hover:scale-105 ${cardBg} hover:border-cyan-500`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`text-sm font-medium ${textPrimary} mb-1`}>
                          {key}
                        </h4>
                        <p className={`text-xs ${textSecondary}`}>
                          {(value as any[])?.length || 0} records
                        </p>
                      </div>
                      <div className={`w-8 h-8 rounded-full ${actualTheme === 'dark' ? 'bg-cyan-600/20' : 'bg-cyan-100'} flex items-center justify-center`}>
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </DialogTrigger>

              <DialogContent className={`max-w-[95vw] max-h-[95vh] ${cardBg} overflow-hidden`}>
                <DialogHeader className="sr-only">
                  <DialogTitle></DialogTitle>
                </DialogHeader>
                <div className="mt-4 overflow-hidden h-full">
                  <DetailTable detailKey={key} title={key} data={data} />
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};