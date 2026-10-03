"use client";
import { useSession } from "next-auth/react";


import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  Loader2,
  Phone,
  Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface SOSAlert {
  _id: string;
  type: string;
  priority: string;
  status: string;
  description: string;
  location: { zone?: string; description?: string };
  userId: { firstName: string; lastName: string; phone: string };
  assignedTo?: { firstName: string; lastName: string };
  createdAt: string;
}

export default function SOSPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [venueId, setVenueId] = useState("");

  // Incident Form State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [newIncident, setNewIncident] = useState({
    description: "",
    zone: "",
    priority: "medium",
    type: "security",
  });

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/user/role");
        const data = await res.json();
        if (data.roleData?.venueId) {
          setVenueId(data.roleData.venueId);
          fetchAlerts(data.roleData.venueId);
        }
      } catch (error) {
        console.error("Failed to init:", error);
      }
    }
    init();

    // Poll for updates every 15s (Simulating realtime for now)
    const interval = setInterval(() => {
      if (venueId) fetchAlerts(venueId);
    }, 15000);
    return () => clearInterval(interval);
  }, [venueId]);

  async function fetchAlerts(tid: string) {
    try {
      const res = await fetch(`/api/security/sos?venueId=${tid}`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "acknowledge" | "resolve") {
    try {
      const res = await fetch(`/api/security/sos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note:
            action === "resolve" ? "Resolved by security dashboard" : undefined,
        }),
      });

      if (res.ok) {
        toast.success(`Alert ${action}d successfully`);
        fetchAlerts(venueId);
      }
    } catch (error) {
      toast.error("Failed to update alert");
    }
  }

  async function reportIncident() {
    try {
      const res = await fetch("/api/security/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          description: newIncident.description,
          location: { zone: newIncident.zone },
          type: newIncident.type,
          priority: newIncident.priority,
        }),
      });

      if (res.ok) {
        toast.success("Incident reported");
        setIsReportOpen(false);
        setNewIncident({
          description: "",
          zone: "",
          priority: "medium",
          type: "security",
        });
        fetchAlerts(venueId);
      }
    } catch (error) {
      toast.error("Failed to report incident");
    }
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "critical":
        return "bg-red-500 text-white border-red-600";
      case "high":
        return "bg-orange-500 text-white border-orange-600";
      case "medium":
        return "bg-yellow-500 text-white border-yellow-600";
      default:
        return "bg-blue-500 text-white border-blue-600";
    }
  };

  if (loading) return <div className="p-8 text-center">Loading alerts...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SOS & Alerts</h1>
          <p className="text-muted-foreground">
            Real-time emergency monitoring
          </p>
        </div>
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogTrigger asChild>
            <Button className="bg-destructive hover:bg-destructive/90">
              <Siren className="mr-2 h-4 w-4" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Security Incident</DialogTitle>
              <DialogDescription>
                Report a non-emergency security issue or incident.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={newIncident.type}
                    onValueChange={(v) =>
                      setNewIncident({ ...newIncident, type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security">Security Breach</SelectItem>
                      <SelectItem value="theft">Theft</SelectItem>
                      <SelectItem value="crowd">Crowd Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newIncident.priority}
                    onValueChange={(v) =>
                      setNewIncident({ ...newIncident, priority: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Zone / Location</Label>
                <Input
                  placeholder="e.g. North Gate"
                  value={newIncident.zone}
                  onChange={(e) =>
                    setNewIncident({ ...newIncident, zone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what happened..."
                  value={newIncident.description}
                  onChange={(e) =>
                    setNewIncident({
                      ...newIncident,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={reportIncident}>Submit Report</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {alerts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/50">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium">All Clear</h3>
            <p className="text-muted-foreground">
              No active alerts at this time.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <Card
              key={alert._id}
              className="border-l-4"
              style={{
                borderLeftColor:
                  alert.priority === "critical" ? "red" : "orange",
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge
                      className={`mb-2 hover:bg-opacity-80 ${getPriorityColor(alert.priority)}`}
                    >
                      {alert.priority.toUpperCase()} {alert.type.toUpperCase()}
                    </Badge>
                    <CardTitle className="text-xl">
                      {alert.description}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {alert.location?.zone || "Unknown Zone"}
                      {alert.location?.description &&
                        ` - ${alert.location.description}`}
                    </CardDescription>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </div>
                    {alert.assignedTo ? (
                      <p className="mt-1 text-blue-600 font-medium">
                        On it: {alert.assignedTo.firstName}
                      </p>
                    ) : (
                      <p className="mt-1 text-red-500 font-medium">
                        Unassigned
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="bg-muted/50 p-3 rounded-md text-sm">
                  <p className="font-semibold mb-1">Reporter Details:</p>
                  <div className="flex items-center gap-4">
                    <span>
                      {alert.userId?.firstName} {alert.userId?.lastName}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {alert.userId?.phone}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-2">
                {alert.status === "active" && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(alert._id, "acknowledge")}
                  >
                    Acknowledge
                  </Button>
                )}
                {alert.status === "in_progress" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    onClick={() => handleAction(alert._id, "resolve")}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Resolved
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
