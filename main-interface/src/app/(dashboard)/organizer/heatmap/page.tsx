"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, MapPin } from "lucide-react";
import type { MapMarker } from "@/components/maps/LiveMap";

// Dynamically import LiveMap to avoid SSR issues with Leaflet
const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-lg flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface ZoneData {
  id: string;
  name: string;
  capacity: number;
  currentCount: number;
  status: string;
  percentage: number;
}

interface VenueData {
  _id: string;
  name: string;
  location: {
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

export default function HeatmapPage() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchZones = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/venue/stats");
      if (res.ok) {
        const data = await res.json();
        setZones(data.zones || []);
        if (data.venue) {
          setVenue(data.venue);
        }
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch zones:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchZones();
    // Auto-refresh every 10 seconds for live data
    const interval = setInterval(() => fetchZones(), 10000);
    return () => clearInterval(interval);
  }, []);

  const statusColors: Record<string, string> = {
    low: "bg-emerald-500",
    medium: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-destructive",
  };

  const statusBgColors: Record<string, string> = {
    low: "bg-emerald-500/20 border-emerald-500",
    medium: "bg-amber-500/20 border-amber-500",
    high: "bg-orange-500/20 border-orange-500",
    critical: "bg-destructive/20 border-destructive",
  };

  // Generate map markers from zones
  const mapMarkers: MapMarker[] = useMemo(() => {
    if (!venue?.location?.coordinates) return [];

    // Helper to generate offset coordinates for zones (mocking positions around center)
    const centerLat = venue.location.coordinates.lat || 20.5937;
    const centerLng = venue.location.coordinates.lng || 78.9629;

    return zones.map((zone, index) => {
      // Create a circular distribution for visualization
      const angle = (index / zones.length) * 2 * Math.PI;
      const radius = 0.002; // Roughly 200-300 meters
      const lat = centerLat + radius * Math.cos(angle);
      const lng = centerLng + radius * Math.sin(angle);

      return {
        id: zone.id,
        lat,
        lng,
        type: "booth", // Using 'booth' icon style for zones for now, or could add 'zone' type
        title: zone.name,
        description: `${zone.percentage}% capacity (${zone.currentCount}/${zone.capacity})`,
        status:
          zone.status === "low"
            ? "available"
            : zone.status === "critical"
              ? "busy"
              : "active",
      };
    });
  }, [zones, venue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-chart-1" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" /> Live Heatmap
          </h2>
          <p className="text-muted-foreground">
            Real-time zone-wise crowd density visualization
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchZones(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/20 rounded-lg border">
        <span className="text-sm font-medium">Crowd Level:</span>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500 hover:bg-emerald-600">Low</Badge>
          <Badge className="bg-amber-500 hover:bg-amber-600">Medium</Badge>
          <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>
          <Badge className="bg-destructive hover:bg-destructive/90">
            Critical
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Zone Grid - Side Panel */}
        <div className="lg:col-span-1 space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {zones.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No zones configured for this venue
              </CardContent>
            </Card>
          ) : (
            zones.map((zone) => (
              <Card
                key={zone.id}
                className={`border-l-4 transition-all hover:shadow-md cursor-pointer ${
                  zone.status === "low"
                    ? "border-l-emerald-500"
                    : zone.status === "medium"
                      ? "border-l-amber-500"
                      : zone.status === "high"
                        ? "border-l-orange-500"
                        : "border-l-destructive"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{zone.name}</h3>
                    <Badge
                      variant="outline"
                      className={`${statusColors[zone.status]} text-white border-0`}
                    >
                      {zone.status}
                    </Badge>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Occupancy</p>
                      <p className="font-mono text-sm">
                        {zone.currentCount} / {zone.capacity}
                      </p>
                    </div>
                    <p
                      className={`text-2xl font-bold ${
                        zone.status === "low"
                          ? "text-emerald-600"
                          : zone.status === "medium"
                            ? "text-amber-600"
                            : zone.status === "high"
                              ? "text-orange-600"
                              : "text-destructive"
                      }`}
                    >
                      {zone.percentage}%
                    </p>
                  </div>
                  <div className="h-1.5 w-full bg-muted mt-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${statusColors[zone.status]}`}
                      style={{ width: `${Math.min(zone.percentage, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Live Map */}
        <Card className="lg:col-span-2 border-0 shadow-md h-[600px] flex flex-col">
          <CardHeader className="py-4 px-6 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Venue Layout View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 relative">
            <LiveMap
              className="h-full w-full rounded-b-lg"
              markers={mapMarkers}
              center={
                venue?.location?.coordinates
                  ? [
                      venue.location.coordinates.lat,
                      venue.location.coordinates.lng,
                    ]
                  : undefined
              }
              zoom={16}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
