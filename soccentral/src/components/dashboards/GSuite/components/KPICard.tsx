// src/components/dashboards/GSuite/components/KPICard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KPICard as KPICardType, EnhancedGSuiteData } from '../types';
import { DetailTable } from './DetailTable';
import { useTheme } from '@/pages/Main_dashboard/ThemeProvider';
import { ExternalLink } from 'lucide-react';

interface KPICardProps {
  card: KPICardType;
  data: EnhancedGSuiteData;
  emailsScanned: number;
  filterSeverity: string;
  setFilterSeverity: (severity: string) => void;
  onCardClick: (detailKey: string) => void;
}

export const KPICard: React.FC<KPICardProps> = ({ 
  card, 
  data, 
  emailsScanned, 
  filterSeverity, 
  setFilterSeverity, 
  onCardClick 
}) => {
  const { actualTheme } = useTheme();
  const IconComponent = card.icon;
  const percentage = emailsScanned > 0 ? (card.value / emailsScanned) * 100 : 0;
  
  // Theme-aware classes using CSS variables
  const cardBg = "bg-card border-border";
  const cardHover = "hover:bg-card/80";
  const textPrimary = "text-foreground";
  const textSecondary = "text-muted-foreground";
  const dialogClasses = "max-w-[95vw] max-h-[95vh] bg-popover border-border overflow-hidden";
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card 
          className={`${cardBg} cursor-pointer ${cardHover} transition-all duration-200 hover:shadow-md group relative overflow-hidden border`}
          onClick={() => onCardClick(card.detailKey)}
        >
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm font-medium ${textSecondary} group-hover:text-foreground transition-colors`}>
                {card.title}
              </CardTitle>
              <div className="relative">
                <div className={`p-2 rounded-md ${card.bgColor} transition-colors duration-200`}>
                  <IconComponent className={`h-4 w-4 ${card.color}`} />
                </div>
                <ExternalLink className={`h-3 w-3 ${card.color} absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10 pt-0">
            <div className="space-y-2">
              {/* Value and Percentage */}
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${textPrimary}`}>
                  {card.value.toLocaleString()}
                </p>
                {percentage > 0 && (
                  <span className={`text-sm ${textSecondary} font-medium`}>
                    ({percentage.toFixed(1)}%)
                  </span>
                )}
              </div>
              
              {/* Simple Progress Bar */}
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-700 ease-out`}
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: card.chartColor 
                    }}
                  />
                </div>
                
                {/* Description */}
                <p className={`text-xs ${textSecondary} leading-relaxed`}>
                  {card.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className={dialogClasses}>
        <DialogHeader className="sr-only">
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-hidden h-full">
          <DetailTable 
            detailKey={card.detailKey} 
            title={card.detailTitle} 
            data={data}
            filterSeverity={filterSeverity}
            setFilterSeverity={setFilterSeverity}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};