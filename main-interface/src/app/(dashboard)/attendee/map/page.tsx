"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ZoneCard, ZoneSummary, ZoneData } from "@/components/zone-card";
import { MapPin, RefreshCw, Clock, Info, Loader2 } from "lucide-react";

interface Venue {
  _id: string;
  name: string;
}

interface ZoneResponse {
  venue: string;
  zones: ZoneData[];
  summary: {
    totalCapacity: number;
    totalCount: number;
    overallDensity: number;
    zoneCount: number;
  };
}

export default function MapPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<string>("");
  const [zoneData, setZoneData] = useState<ZoneResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch venues on mount
  useEffect(() => {
    async function fetchVenues() {
      try {
        const res = await fetch("/api/venues");
        const data = await res.json();
        setVenues(data.venues || []);
        if (data.venues?.length > 0) {
          setSelectedVenue(data.venues[0]._id);
        }
      } catch (error) {
        console.error("Failed to fetch venues:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchVenues();
  }, []);

  // Fetch zone data
  const fetchZones = useCallback(
    async (showRefreshing = false) => {
      if (!selectedVenue) return;

      if (showRefreshing) setRefreshing(true);

      try {
        const res = await fetch(`/api/venues/${selectedVenue}/zones`);
        const data = await res.json();
        setZoneData(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch zones:", error);
      } finally {
        setRefreshing(false);
      }
    },
    [selectedVenue],
  );

  // Fetch zones when venue changes
  useEffect(() => {
    if (selectedVenue) {
      fetchZones();
    }
  }, [selectedVenue, fetchZones]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh || !selectedVenue) return;

    const interval = setInterval(() => {
      fetchZones();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedVenue, fetchZones]);

  // Simulate crowd movement
  const handleSimulate = async () => {
    try {
      await fetch("/api/simulate", { method: "POST" });
      await fetchZones(true);
    } catch (error) {
      console.error("Simulation failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Venue Zone Map
          </h2>
          <p className="text-muted-foreground">
            Real-time crowd density across venue zones
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Venue Selector */}
          <Select value={selectedVenue} onValueChange={setSelectedVenue}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Venue" />
            </SelectTrigger>
            <SelectContent>
              {venues.map((venue) => (
                <SelectItem key={venue._id} value={venue._id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchZones(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>


        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last updated: {lastUpdated.toLocaleTimeString()}
          {autoRefresh && (
            <Badge variant="secondary" className="text-xs">
              Auto-refresh ON
            </Badge>
          )}
        </div>
      )}

      {/* Summary */}
      {zoneData && (
        <ZoneSummary
          totalCount={zoneData.summary.totalCount}
          totalCapacity={zoneData.summary.totalCapacity}
          overallDensity={zoneData.summary.overallDensity}
          zoneCount={zoneData.summary.zoneCount}
        />
      )}

      {/* Zone Grid */}
      {zoneData?.zones && zoneData.zones.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {zoneData.zones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No zone data available</p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            Crowd Density Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-emerald-500" />
              <span className="text-sm">Low (0-50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-yellow-500" />
              <span className="text-sm">Moderate (50-75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-orange-500" />
              <span className="text-sm">Crowded (75-90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-red-500" />
              <span className="text-sm">Very Crowded (90%+)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
