"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  AlertTriangle,
  Plus,
  Loader2,
  MapPin,
  Clock,
  Megaphone,
  ExternalLink,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

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
  description: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

interface Announcement {
  _id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "emergency";
  isActive: boolean;
  createdAt: string;
}

export default function AlertsPage() {
  const [sosAlerts, setSOSAlerts] = useState<SOSAlert[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Announcement Form Data
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    type: "info",
    expiresInHours: "24",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch stats for SOS (assuming this endpoint exists and returns recentSOS)
      const statsRes = await fetch("/api/venue/stats");
      if (statsRes.ok) {
        const data = await statsRes.json();
        setSOSAlerts(data.recentSOS || []);
      }

      // Fetch Announcements
      const annRes = await fetch("/api/venue/announcements");
      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load alerts and announcements");
    } finally {
      setLoading(false);
    }
  }

  const handleBroadcast = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast.error("Title and message are required");
      return;
    }

    try {
      setIsSubmitting(true);

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setHours(
        expiresAt.getHours() + parseInt(newAnnouncement.expiresInHours),
      );

      const res = await fetch("/api/venue/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          type: newAnnouncement.type,
          expiresAt: expiresAt.toISOString(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create announcement");
      }

      const data = await res.json();
      setAnnouncements([data.announcement, ...announcements]);
      setShowNewAnnouncement(false);
      setNewAnnouncement({
        title: "",
        message: "",
        type: "info",
        expiresInHours: "24",
      });
      toast.success("Announcement broadcasted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to broadcast announcement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityColors: Record<string, string> = {
    low: "bg-blue-500",
    medium: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-destructive",
  };

  const typeColors: Record<string, string> = {
    info: "bg-blue-500",
    warning: "bg-amber-500",
    emergency: "bg-destructive",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-chart-1" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alerts & Announcements</h2>
          <p className="text-muted-foreground">
            Manage SOS alerts and broadcast announcements
          </p>
        </div>
        <Button onClick={() => setShowNewAnnouncement(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="sos">
            <AlertTriangle className="h-4 w-4 mr-2" />
            SOS Alerts ({sosAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <Megaphone className="h-4 w-4 mr-2" />
            Announcements ({announcements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sos" className="mt-4 space-y-4">
          {sosAlerts.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No active SOS alerts</p>
              </CardContent>
            </Card>
          ) : (
            sosAlerts.map((alert) => {
              const coords = alert.location?.coordinates;
              const mapsUrl = coords?.lat && coords?.lng
                ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alert.location?.description || alert.location?.zone || "Venue Location")}`;

              const attendeeName = alert.user ? `${alert.user.firstName || 'Attendee'} ${alert.user.lastName || ''}`.trim() : "Attendee";
              const attendeeEmail = alert.user?.email || "No email provided";
              const attendeePhone = alert.user?.phone || "No phone provided";

              return (
                <Card
                  key={alert._id}
                  className="border-0 shadow-md border-l-4 border-l-destructive bg-card"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                          <span className="font-bold text-base uppercase tracking-wide">
                            {alert.type.replace("_", " ")} EMERGENCY
                          </span>
                          <Badge className={priorityColors[alert.priority]}>
                            {alert.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.status}
                          </Badge>
                        </div>

                        {/* Attendee Details Box */}
                        <div className="p-3 bg-muted/40 rounded-xl border space-y-1.5 text-xs">
                          <p className="font-bold text-sm text-foreground flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> {attendeeName}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-blue-500" /> {attendeeEmail}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="h-3.5 w-3.5 text-emerald-500" /> {attendeePhone}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm font-medium text-foreground/90">
                          {alert.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                          <span className="flex items-center gap-1 font-semibold text-primary">
                            <MapPin className="h-4 w-4" />
                            Zone: {alert.location?.zone || "Live Location"}
                          </span>
                          {alert.location?.description && (
                            <span className="font-mono text-xs opacity-80">
                              ({alert.location.description})
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(alert.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white shadow-md flex items-center gap-2"
                          onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
                        >
                          <ExternalLink className="h-4 w-4" /> Open Live GPS Map
                        </Button>
                        {attendeePhone && attendeePhone !== "No phone provided" && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`tel:${attendeePhone}`)}
                          >
                            <Phone className="h-3.5 w-3.5 mr-2" /> Call Attendee
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="announcements" className="mt-4 space-y-4">
          {announcements.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center">
                <Megaphone className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No announcements yet</p>
                <Button
                  className="mt-3"
                  onClick={() => setShowNewAnnouncement(true)}
                >
                  Create First Announcement
                </Button>
              </CardContent>
            </Card>
          ) : (
            announcements.map((ann) => (
              <Card key={ann._id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${typeColors[ann.type]} capitalize`}>
                          {ann.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(ann.createdAt), "PPp")}
                        </span>
                      </div>
                      <h3 className="font-medium text-lg">{ann.title}</h3>
                      <p className="text-muted-foreground mt-1">
                        {ann.message}
                      </p>
                    </div>
                    {/* Future: Add deactivate button */}
                    {/* <Button variant="ghost" size="sm">Deactivate</Button> */}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* New Announcement Dialog */}
      <Dialog open={showNewAnnouncement} onOpenChange={setShowNewAnnouncement}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Announcement title"
                value={newAnnouncement.title}
                onChange={(e) =>
                  setNewAnnouncement({
                    ...newAnnouncement,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Announcement message..."
                value={newAnnouncement.message}
                onChange={(e) =>
                  setNewAnnouncement({
                    ...newAnnouncement,
                    message: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newAnnouncement.type}
                  onValueChange={(v) =>
                    setNewAnnouncement({ ...newAnnouncement, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={newAnnouncement.expiresInHours}
                  onValueChange={(v) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      expiresInHours: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Hour</SelectItem>
                    <SelectItem value="4">4 Hours</SelectItem>
                    <SelectItem value="24">24 Hours</SelectItem>
                    <SelectItem value="48">2 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewAnnouncement(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleBroadcast} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
