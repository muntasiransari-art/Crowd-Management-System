"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ZoneData {
  id: string;
  name: string;
  capacity: number;
  currentCount: number;
  status: "low" | "medium" | "high" | "critical";
  percentage?: number;
}

export default function HeatmapPage() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch zones from API
  const fetchZones = async () => {
    try {
      const res = await fetch("/api/venue/zones");
      if (res.ok) {
        const data = await res.json();
        setZones(data.zones || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch zones:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
    // Poll every 30s
    const interval = setInterval(fetchZones, 30000);
    return () => clearInterval(interval);
  }, []);

  const getColor = (status: string, opacity: number = 1) => {
    switch (status) {
      case "critical":
        return `rgba(239, 68, 68, ${opacity})`; // Red-500
      case "high":
        return `rgba(249, 115, 22, ${opacity})`; // Orange-500
      case "medium":
        return `rgba(245, 158, 11, ${opacity})`; // Amber-500
      default:
        return `rgba(34, 197, 94, ${opacity})`; // Green-500
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crowd Heatmap</h1>
          <p className="text-muted-foreground">
            Live density monitoring per zone
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            fetchZones();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Visualization Grid */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Zone Visualization</CardTitle>
            <CardDescription>
              Updated: {lastUpdated.toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {zones.length === 0 ? (
              <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground">
                No zones configured for this venue.
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-auto min-h-[400px]">
                {zones.map((zone) => {
                  const usage =
                    zone.percentage ||
                    Math.round((zone.currentCount / zone.capacity) * 100);
                  return (
                    <div
                      key={zone.id}
                      className="relative rounded-lg border flex flex-col items-center justify-center p-4 transition-all duration-500 shadow-sm"
                      style={{
                        backgroundColor: getColor(zone.status, 0.1),
                        borderColor: getColor(zone.status, 0.4),
                      }}
                    >
                      <h3 className="font-semibold text-lg text-center leading-tight">
                        {zone.name}
                      </h3>
                      <div
                        className="text-3xl font-bold mt-2"
                        style={{ color: getColor(zone.status) }}
                      >
                        {usage}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {zone.currentCount} / {zone.capacity}
                      </p>

                      {(zone.status === "critical" ||
                        zone.status === "high") && (
                        <Badge className="absolute top-2 right-2 bg-red-500 animate-pulse">
                          High Load
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Critical Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zones.filter(
                  (z) => z.status === "critical" || z.status === "high",
                ).length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No critical zones detected.
                  </p>
                ) : (
                  zones
                    .filter(
                      (z) => z.status === "critical" || z.status === "high",
                    )
                    .map((z) => (
                      <div
                        key={z.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/20"
                      >
                        <span className="font-medium">{z.name}</span>
                        <Badge variant="destructive">{z.percentage}%</Badge>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span>Safe (&lt; 50%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span>Moderate (50-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-orange-500" />
                <span>High (70-90%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span>Critical (&gt; 90%)</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
