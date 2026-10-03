"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HeartPulse,
  Ambulance,
  Building,
  AlertCircle,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

// Dynamically import LiveMap to avoid SSR issues with Leaflet
const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg" />
  ),
});

export default function MedicalDashboard() {
  const [activeSOS, setActiveSOS] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sosRes, resourcesRes] = await Promise.all([
          fetch("/api/medical/sos?status=active"),
          fetch("/api/medical/resources"),
        ]);

        const sosData = await sosRes.json();
        const resourcesData = await resourcesRes.json();

        setActiveSOS(sosData.alerts || []);
        setResources(resourcesData.resources || []);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Poll every 30 seconds for specific updates (optional optimization)
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate stats
  const activeCasesCount = activeSOS.length;
  const ambulances = resources.filter((r) => r.type === "ambulance");
  const booths = resources.filter((r) => r.type === "booth");

  const availableAmbulances = ambulances.filter(
    (r) => r.status === "available",
  ).length;
  const openBooths = booths.filter((r) => r.status === "available").length;

  // Prepare Map Markers
  const mapMarkers = [
    ...activeSOS.map((sos) => ({
      id: sos._id,
      lat: sos.location?.coordinates?.lat || 20.5937,
      lng: sos.location?.coordinates?.lng || 78.9629,
      type: "incident" as const,
      title: sos.type.toUpperCase(),
      description: sos.description,
      status: "active",
    })),
    ...resources.map((res) => ({
      id: res._id,
      lat: res.location.lat,
      lng: res.location.lng,
      type: res.type as "ambulance" | "booth",
      title: res.name,
      status: res.status,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Medical Dashboard
          </h1>
          <p className="text-muted-foreground">
            Emergency response and medical operations overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/medical/resources">Manage Resources</Link>
          </Button>
          <Button variant="destructive" asChild>
            <Link href="/medical/sos">View Incidents</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Cases</p>
                <p className="text-3xl font-bold text-destructive">
                  {activeCasesCount}
                </p>
                <p className="text-xs text-destructive mt-1">Needs response</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medical Booths</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-chart-1">{openBooths} Open</Badge>
                  <Badge variant="secondary">
                    {booths.length - openBooths} Busy
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-chart-1/10 flex items-center justify-center">
                <Building className="h-6 w-6 text-chart-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ambulances</p>
                <p className="text-3xl font-bold">{ambulances.length}</p>
                <p className="text-xs text-chart-4 mt-1">
                  {availableAmbulances} available
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-chart-4/10 flex items-center justify-center">
                <Ambulance className="h-6 w-6 text-chart-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Response</p>
                <p className="text-3xl font-bold">--</p>
                <p className="text-xs text-chart-1 flex items-center gap-1 mt-1">
                  Stats coming soon
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <HeartPulse className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Live Map */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Live Operations Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] w-full relative">
              <LiveMap
                markers={mapMarkers}
                className="h-full w-full rounded-b-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Cases List */}
        <Card className="lg:col-span-3 border-destructive/50 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-destructive" />
              Active Incidents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 overflow-y-auto flex-1 max-h-[400px]">
            {activeSOS.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                <p>No active incidents</p>
              </div>
            ) : (
              activeSOS.map((sos) => (
                <Link href={`/medical/sos/${sos._id}`} key={sos._id}>
                  <div className="flex items-center justify-between p-3 bg-card hover:bg-accent rounded-lg border border-border/50 mb-2 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      <div>
                        <p className="font-medium capitalize">
                          {sos.type} - {sos.location?.zone || "Unknown Zone"}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {sos.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          sos.priority === "critical"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {sos.priority}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(sos.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
