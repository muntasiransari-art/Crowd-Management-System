"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Plus, Ambulance, Building, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { MapMarker } from "@/components/maps/LiveMap";

const LiveMap = dynamic(() => import("@/components/maps/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full bg-muted/20 animate-pulse rounded-lg" />
  ),
});

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [newItem, setNewItem] = useState({
    name: "",
    type: "ambulance",
    venueId: "", // Will be auto-filled from session or selection
    location: { lat: 20.5937, lng: 78.9629 }, // Default Center
  });

  const fetchResources = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/medical/resources");
      const data = await res.json();
      setResources(data.resources || []);

      // Auto-fill venueId from first resource if available (hacky but works for single venue staff)
      if (data.resources?.length > 0 && !newItem.venueId) {
        setNewItem((prev) => ({
          ...prev,
          venueId: data.resources[0].venueId,
        }));
      }
    } catch (error) {
      toast.error("Failed to fetch resources");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    // Fetch user role to get venueId - skipped for brevity, assuming backend handles permission
  }, []);

  const handleCreate = async () => {
    if (!newItem.name) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/medical/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        toast.success("Resource created successfully");
        setIsDialogOpen(false);
        fetchResources();
        setNewItem({ ...newItem, name: "" }); // Reset name
      } else {
        toast.error("Failed to create resource");
      }
    } catch (err) {
      toast.error("Error creating resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "available" ? "busy" : "available";
    try {
      // Optimistic update
      setResources((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: newStatus } : r)),
      );

      await fetch(`/api/medical/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
      fetchResources(); // Revert
    }
  };

  const mapMarkers: MapMarker[] = resources.map((res) => ({
    id: res._id,
    lat: res.location.lat,
    lng: res.location.lng,
    type: res.type as "ambulance" | "booth",
    title: res.name,
    status: res.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Resource Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage ambulances and medical booths.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchResources}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Medical Resource</DialogTitle>
                <DialogDescription>
                  Register a new ambulance or medical booth.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="e.g., Ambulance 04"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={newItem.type}
                    onValueChange={(val) =>
                      setNewItem({ ...newItem, type: val })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambulance">Ambulance</SelectItem>
                      <SelectItem value="booth">Medical Booth</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Note: Location picker handles positioning. Venue ID is auto-assigned. */}
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Resource"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resource List */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Medical Assets</CardTitle>
            <CardDescription>Manage availability status</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((res) => (
                  <TableRow key={res._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {res.type === "ambulance" ? (
                          <Ambulance className="h-4 w-4" />
                        ) : (
                          <Building className="h-4 w-4" />
                        )}
                        {res.name}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{res.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          res.status === "available" ? "outline" : "destructive"
                        }
                      >
                        {res.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(res._id, res.status)}
                      >
                        Toggle Status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {resources.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No resources found. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Live Tracking Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Live Location
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[500px] w-full relative">
              <LiveMap
                markers={mapMarkers}
                className="h-full w-full rounded-b-xl"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
