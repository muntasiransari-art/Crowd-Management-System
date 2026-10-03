"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Edit2, Trash2, Users, RefreshCw, ExternalLink, MapPin } from "lucide-react";
import { toast } from "sonner";

interface ZoneData {
  id: string;
  name: string;
  capacity: number;
  currentCount: number;
  status: string;
  percentage: number;
}

export default function ZonesPage() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [venueLocation, setVenueLocation] = useState<any>(null);
  const [venueName, setVenueName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add zone dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneCapacity, setNewZoneCapacity] = useState("");

  // Edit zone dialog
  const [editingZone, setEditingZone] = useState<ZoneData | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editCurrentCount, setEditCurrentCount] = useState("");

  // Delete confirmation
  const [deletingZone, setDeletingZone] = useState<ZoneData | null>(null);

  const fetchZones = async () => {
    try {
      const res = await fetch("/api/venue/zones");
      if (res.ok) {
        const data = await res.json();
        setZones(data.zones || []);
        if (data.location) setVenueLocation(data.location);
        if (data.venueName) setVenueName(data.venueName);
      }
    } catch (error) {
      console.error("Failed to fetch zones:", error);
      toast.error("Failed to load zones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const openGoogleMaps = (zoneName: string) => {
    const coords = venueLocation?.coordinates;
    const address = venueLocation?.address;
    const city = venueLocation?.city;

    let query = "";
    if (coords?.lat && coords?.lng) {
      query = `${coords.lat},${coords.lng}`;
    } else if (address && city) {
      query = `${zoneName}, ${address}, ${city}`;
    } else {
      query = `${zoneName} ${venueName}`;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const statusColors: Record<string, string> = {
    low: "bg-emerald-500",
    medium: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-destructive",
  };

  // CREATE - Add new zone
  const handleAddZone = async () => {
    if (!newZoneName.trim() || !newZoneCapacity) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/venue/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newZoneName,
          capacity: parseInt(newZoneCapacity),
        }),
      });

      if (res.ok) {
        toast.success("Zone created successfully");
        setShowAddDialog(false);
        setNewZoneName("");
        setNewZoneCapacity("");
        fetchZones();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create zone");
      }
    } catch (error) {
      console.error("Failed to create zone:", error);
      toast.error("Failed to create zone");
    } finally {
      setSaving(false);
    }
  };

  // UPDATE - Edit zone
  const handleEditZone = (zone: ZoneData) => {
    setEditingZone(zone);
    setEditName(zone.name);
    setEditCapacity(zone.capacity.toString());
    setEditCurrentCount(zone.currentCount.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingZone || !editName.trim() || !editCapacity) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/venue/zones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: editingZone.id,
          name: editName,
          capacity: parseInt(editCapacity),
          currentCount: parseInt(editCurrentCount),
        }),
      });

      if (res.ok) {
        toast.success("Zone updated successfully");
        setEditingZone(null);
        fetchZones();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update zone");
      }
    } catch (error) {
      console.error("Failed to update zone:", error);
      toast.error("Failed to update zone");
    } finally {
      setSaving(false);
    }
  };

  // DELETE - Remove zone
  const handleDeleteZone = async () => {
    if (!deletingZone) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/venue/zones?zoneId=${deletingZone.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Zone deleted successfully");
        setDeletingZone(null);
        fetchZones();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete zone");
      }
    } catch (error) {
      console.error("Failed to delete zone:", error);
      toast.error("Failed to delete zone");
    } finally {
      setSaving(false);
    }
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
          <h2 className="text-2xl font-bold">Zone Management</h2>
          <p className="text-muted-foreground">
            Configure and monitor venue zones ({zones.length} zones)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchZones()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {zones.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No zones configured. Add zones to manage crowd flow.
              </p>
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Zone
              </Button>
            </CardContent>
          </Card>
        ) : (
          zones.map((zone) => (
            <Card 
              key={zone.id} 
              onClick={() => openGoogleMaps(zone.name)}
              className="border-0 shadow-sm cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group relative overflow-hidden"
              title="Click to view live Google Maps location"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-base group-hover:text-primary transition-colors flex items-center gap-2">
                      {zone.name}
                      <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </h3>
                    <Badge className={statusColors[zone.status]}>
                      {zone.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {zone.percentage}%
                    </span>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditZone(zone)}
                      title="Edit Zone"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingZone(zone)}
                      className="text-destructive hover:text-destructive"
                      title="Delete Zone"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Current / Capacity
                    </span>
                    <span className="font-medium">
                      {zone.currentCount} / {zone.capacity}
                    </span>
                  </div>
                  <Progress value={zone.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Zone Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Zone</DialogTitle>
            <DialogDescription>
              Create a new zone to manage crowd flow in your venue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newZoneName">Zone Name *</Label>
              <Input
                id="newZoneName"
                placeholder="e.g., Main Hall, Entrance, Queue Area"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newZoneCapacity">Maximum Capacity *</Label>
              <Input
                id="newZoneCapacity"
                type="number"
                placeholder="e.g., 500"
                value={newZoneCapacity}
                onChange={(e) => setNewZoneCapacity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddZone} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Zone Dialog */}
      <Dialog open={!!editingZone} onOpenChange={() => setEditingZone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Zone</DialogTitle>
            <DialogDescription>
              Update zone settings and current crowd count.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Zone Name *</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCapacity">Maximum Capacity *</Label>
              <Input
                id="editCapacity"
                type="number"
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCurrentCount">Current Count</Label>
              <Input
                id="editCurrentCount"
                type="number"
                value={editCurrentCount}
                onChange={(e) => setEditCurrentCount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Manually adjust the current crowd count if needed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingZone(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingZone}
        onOpenChange={() => setDeletingZone(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingZone?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteZone}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
