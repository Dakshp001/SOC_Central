// src/components/dashboards/Meraki/KPICard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { KPICardData } from "../types";
import { DetailTable } from "./DetailTable";
import { EnhancedMerakiData } from "@/lib/api";

interface KPICardProps {
  card: KPICardData;
  data: EnhancedMerakiData;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  setSelectedDetailView: (key: string) => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  card,
  data,
  cardBg,
  textPrimary,
  textSecondary,
  setSelectedDetailView,
}) => {
  const IconComponent = card.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card
          className={`cursor-pointer transition-all duration-300 hover:scale-105 ${cardBg} hover:border-blue-500 hover:shadow-2xl group relative overflow-hidden`}
          onClick={() => setSelectedDetailView(card.detailKey)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm font-medium ${textSecondary} group-hover:${textPrimary} transition-colors`}>
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor} group-hover:scale-110 transition-transform duration-300 border`}>
                <IconComponent className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${card.color}`}>
                  {(card.value || 0).toLocaleString()}
                  {card.unit}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className={`text-xs ${textSecondary} group-hover:${textPrimary} transition-colors leading-relaxed`}>
                    {card.description}
                  </p>
                </div>
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
          <DetailTable
            detailKey={card.detailKey}
            title={card.detailTitle}
            data={data}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};