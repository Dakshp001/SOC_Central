// src/components/dashboards/Meraki/charts/NetworkTooltip.tsx
import React from "react";

export const NetworkTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border-border border rounded-lg p-3 shadow-xl">
        {label && (
          <p className="text-primary font-medium mb-2">
            {label}
          </p>
        )}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground text-sm">
              {entry.name}:{" "}
              <span className="font-semibold">
                {formatter ? formatter(entry.value) : entry.value}
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

