"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ZoneData {
  id: string;
  name: string;
  capacity: number;
  currentCount: number;
  density: number;
  status: "low" | "medium" | "high" | "critical";
}

interface ZoneCardProps {
  zone: ZoneData;
  onClick?: () => void;
}

const statusConfig = {
  low: {
    label: "Low",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-500/30",
  },
  medium: {
    label: "Moderate",
    color: "bg-yellow-500",
    bgColor: "bg-yellow-500/10",
    textColor: "text-yellow-600",
    borderColor: "border-yellow-500/30",
  },
  high: {
    label: "Crowded",
    color: "bg-orange-500",
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-600",
    borderColor: "border-orange-500/30",
  },
  critical: {
    label: "Very Crowded",
    color: "bg-red-500",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600",
    borderColor: "border-red-500/30",
  },
};

export function ZoneCard({ zone, onClick }: ZoneCardProps) {
  const config = statusConfig[zone.status];

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
    // Always open Google Maps for the zone location
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zone.name)}`;
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer border",
        config.borderColor,
        "bg-gradient-to-br from-background via-background to-muted/20",
      )}
      onClick={handleCardClick}
      title={`Click to open Google Maps for ${zone.name}`}
    >
      {/* Decorative colored glow on hover */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none",
          config.color.replace("bg-", "bg-gradient-to-br from-"),
        )}
      />

      {/* Top Status Strip */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1.5 w-full",
          config.color,
        )}
      />

      <CardContent className="p-5 pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg leading-tight tracking-tight group-hover:text-primary transition-colors flex items-center gap-2">
              {zone.name}
              <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
            </h3>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              Max Limit: {zone.capacity.toLocaleString()}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide border shadow-sm backdrop-blur-sm",
              config.bgColor,
              config.textColor,
              config.borderColor,
            )}
          >
            {config.label}
          </Badge>
        </div>

        {/* Density Metric */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider mb-0.5">
                Current Load
              </span>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold tabular-nums tracking-tight">
                  {zone.currentCount.toLocaleString()}
                </span>
              </div>
            </div>
            <span
              className={cn("text-lg font-bold tabular-nums", config.textColor)}
            >
              {zone.density}%
            </span>
          </div>

          <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden shadow-inner">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out shadow-sm",
                config.color,
              )}
              style={{ width: `${Math.min(zone.density, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Summary card for overall stats
interface ZoneSummaryProps {
  totalCount: number;
  totalCapacity: number;
  overallDensity: number;
  zoneCount: number;
}

export function ZoneSummary({
  totalCount,
  totalCapacity,
  overallDensity,
  zoneCount,
}: ZoneSummaryProps) {
  let status: "low" | "medium" | "high" | "critical";
  if (overallDensity < 50) status = "low";
  else if (overallDensity < 75) status = "medium";
  else if (overallDensity < 90) status = "high";
  else status = "critical";

  const config = statusConfig[status];

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Inside</p>
            <p className="text-2xl font-bold">{totalCount.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Capacity</p>
            <p className="text-lg font-semibold">
              {totalCapacity.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Zones</p>
            <p className="text-lg font-semibold">{zoneCount}</p>
          </div>
          <Badge
            className={cn("rounded-full px-4 py-1", config.color, "text-white")}
          >
            {overallDensity}% Overall
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
