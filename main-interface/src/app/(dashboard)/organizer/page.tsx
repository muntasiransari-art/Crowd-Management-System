"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  Ticket,
  AlertTriangle,
  ArrowRight,
  Loader2,
  MapPin,
  Clock,
  CheckCircle2,
  TrendingUp,
  QrCode,
  ExternalLink,
  User,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Check,
} from "lucide-react";

const QRScanner = dynamic(() => import("@/components/qr-scanner"), {
  ssr: false,
  loading: () => (
    <div className="h-44 flex items-center justify-center bg-muted rounded-xl">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
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

interface SOSAlert {
  _id: string;
  type: string;
  priority: string;
  status: string;
  location: {
    zone?: string;
    description?: string;
    coordinates?: { lat: number; lng: number };
  };
  description?: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

interface DashboardData {
  venue: {
    name: string;
    location: { city: string; coordinates?: { lat: number; lng: number } };
  };
  stats: {
    todayBookings: number;
    todayVisitors: number;
    checkedIn: number;
    activeSOS: number;
    totalCapacity: number;
  };
  zones: ZoneData[];
  recentSOS: SOSAlert[];
}

export default function VenueDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Quick QR Verification State
  const [quickCode, setQuickCode] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<any | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState(false);

  const handleVerifyTicket = async (codeToVerify?: string) => {
    const code = (codeToVerify || quickCode).trim();
    if (!code) return;

    setQuickLoading(true);
    setQuickError(null);
    setQuickResult(null);
    setQuickSuccess(false);

    try {
      const res = await fetch("/api/bookings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();

      if (res.ok && json.valid) {
        setQuickResult(json.booking);
        setQuickSuccess(true);
        toast.success("Ticket pass verified & checked in!");
        
        // Refresh venue stats
        const statsRes = await fetch("/api/venue/stats");
        if (statsRes.ok) {
          const updatedStats = await statsRes.json();
          setData(updatedStats);
        }
      } else if (json.booking) {
        setQuickResult(json.booking);
        setQuickError(json.message || "Ticket pass cannot be verified.");
      } else {
        setQuickError(json.message || json.error || "Invalid ticket code");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setQuickError("Network error. Please try again.");
    } finally {
      setQuickLoading(false);
    }
  };

  useEffect(() => {
    async function fetchStats() {
      try {
        // API uses user's venueId from roleData automatically
        const res = await fetch("/api/venue/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Auto-refresh every 10 seconds for live data
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusColors: Record<string, string> = {
    low: "bg-emerald-500",
    medium: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-destructive",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-blue-500",
    medium: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-destructive",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-chart-1" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Venue Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{data.venue.name}</h2>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {data.venue.location.city}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/organizer/verify-tickets">
            <Button className="flex items-center gap-2 shadow-md">
              <QrCode className="h-4 w-4" /> Verify QR Tickets
            </Button>
          </Link>
          <Badge variant="secondary" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-chart-1/10">
                <Ticket className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.todayBookings}</p>
                <p className="text-xs text-muted-foreground">
                  Today&apos;s Bookings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-chart-2/10">
                <Users className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.todayVisitors}</p>
                <p className="text-xs text-muted-foreground">
                  Expected Visitors
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.checkedIn}</p>
                <p className="text-xs text-muted-foreground">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-0 shadow-sm ${data.stats.activeSOS > 0 ? "border-l-4 border-l-destructive" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${data.stats.activeSOS > 0 ? "bg-destructive/10" : "bg-muted"}`}
              >
                <AlertTriangle
                  className={`h-5 w-5 ${data.stats.activeSOS > 0 ? "text-destructive" : "text-muted-foreground"}`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.activeSOS}</p>
                <p className="text-xs text-muted-foreground">Active SOS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Zone Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Zone Crowd Status</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/venue/heatmap">
                View Heatmap <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.zones.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No zones configured
              </p>
            ) : (
              data.zones.map((zone) => (
                <div 
                  key={zone.id} 
                  onClick={() => {
                    const coords = data.venue.location?.coordinates;
                    const query = coords?.lat && coords?.lng 
                      ? `${coords.lat},${coords.lng}` 
                      : `${zone.name}, ${data.venue.name}`;
                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer");
                  }}
                  className="space-y-2 p-3 rounded-xl border border-transparent hover:border-primary/30 hover:bg-muted/30 cursor-pointer transition-all group"
                  title="Click to view live Google Maps location"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {zone.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">
                        {zone.currentCount}/{zone.capacity}
                      </span>
                      <Badge className={`${statusColors[zone.status]} text-xs`}>
                        {zone.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={zone.percentage} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Active SOS Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Active Alerts</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/venue/alerts">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentSOS.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
                <p className="text-muted-foreground">No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentSOS.map((sos) => {
                  const coords = sos.location?.coordinates;
                  const mapsUrl = coords?.lat && coords?.lng
                    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sos.location?.description || sos.location?.zone || "Venue Location")}`;

                  const attendeeName = sos.user ? `${sos.user.firstName || 'Attendee'} ${sos.user.lastName || ''}`.trim() : "Attendee";
                  const attendeeEmail = sos.user?.email || "No email";
                  const attendeePhone = sos.user?.phone || "No phone";

                  return (
                    <div
                      key={sos._id}
                      className="p-3.5 rounded-xl bg-card border border-l-4 border-l-destructive shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={priorityColors[sos.priority]}>
                            {sos.priority.toUpperCase()}
                          </Badge>
                          <span className="font-bold text-sm uppercase">
                            {sos.type.replace("_", " ")} EMERGENCY
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(sos.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Attendee Details */}
                      <div className="p-2.5 bg-muted/40 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary" /> {attendeeName}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-[11px]">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-blue-500" /> {attendeeEmail}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="h-3 w-3 text-emerald-500" /> {attendeePhone}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Location / Zone:</span> {sos.location?.zone || "Live Location"} {sos.location?.description ? `(${sos.location.description})` : ""}
                      </p>

                      <div className="flex justify-end pt-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 text-xs flex items-center gap-1.5"
                          onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-primary" /> Open Live GPS Map
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live QR Ticket Verification & Check-In Widget */}
      <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-r from-primary/5 via-background to-chart-1/5 border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Live Gate QR Ticket Verification
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scan attendee QR ticket passes or enter booking code for instant gate verification.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/organizer/verify-tickets">
              Full Screen Scanner <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid grid-cols-2 max-w-xs mb-3">
              <TabsTrigger value="manual" className="text-xs flex items-center gap-1">
                <Search className="h-3.5 w-3.5" /> Code Lookup
              </TabsTrigger>
              <TabsTrigger value="camera" className="text-xs flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5" /> Camera Scanner
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Pass Code (e.g. PG-2026-UP-1234)"
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyTicket()}
                  className="font-mono text-sm uppercase"
                />
                <Button 
                  onClick={() => handleVerifyTicket()} 
                  disabled={quickLoading || !quickCode.trim()}
                  className="shrink-0"
                >
                  {quickLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-1.5" /> Verify Pass
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="camera">
              <div className="max-w-md mx-auto">
                <QRScanner
                  onScanSuccess={(decodedText) => {
                    let code = decodedText;
                    if (decodedText.includes("PILGRIMGUARD:")) {
                      code = decodedText.replace("PILGRIMGUARD:", "");
                    } else if (decodedText.includes("bookingCode=")) {
                      const url = new URL(decodedText);
                      code = url.searchParams.get("bookingCode") || decodedText;
                    }
                    setQuickCode(code);
                    handleVerifyTicket(code);
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Result Card */}
          {quickResult && (
            <Card className={`border shadow-sm p-4 ${quickSuccess ? "bg-emerald-500/10 border-emerald-500/30" : "bg-destructive/10 border-destructive/30"}`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={quickSuccess ? "bg-emerald-600 text-white" : "bg-destructive text-white"}>
                      {quickSuccess ? "VERIFIED & CHECKED IN" : "INVALID PASS"}
                    </Badge>
                    <span className="font-mono font-bold text-sm">{quickResult.bookingCode}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground pt-1">
                    Visitor: {quickResult.bookedBy ? `${quickResult.bookedBy.firstName} ${quickResult.bookedBy.lastName}` : quickResult.visitorDetails?.[0]?.name || "Attendee"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    📍 Event/Venue: <span className="font-medium">{quickResult.venueId?.name || quickResult.venueName || data.venue.name}</span> | Gate: <span className="font-medium">{quickResult.gate || "Gate 1"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ⏰ Time Slot: <span className="font-medium">{quickResult.timeSlot?.start || "09:00"} - {quickResult.timeSlot?.end || "13:00"}</span> | Visitors: <span className="font-medium">{quickResult.visitors || 1} Person(s)</span>
                  </p>
                </div>
                {quickSuccess && (
                  <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="h-6 w-6" />
                  </div>
                )}
              </div>
            </Card>
          )}

          {quickError && !quickResult && (
            <Card className="border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{quickError}</span>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <Link href="/organizer/verify-tickets">
                <QrCode className="h-5 w-5 text-primary" />
                <span className="text-xs">QR Scanner</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <Link href="/venue/gates">
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">Scan Entry</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <Link href="/venue/alerts">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xs">Send Alert</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              asChild
            >
              <Link href="/venue/slots">
                <Clock className="h-5 w-5" />
                <span className="text-xs">Manage Slots</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
