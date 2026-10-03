"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  MoreHorizontal,
  Building2,
  MapPin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Venue {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  location: {
    city: string;
    state: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  dailyCapacity: number;
  slotDuration: number;
  operatingHours: {
    open: string;
    close: string;
  };
  zones: any[];
  gates: any[];
  images?: string[];
  isActive: boolean;
  createdAt: string;
}

export default function VenuesManagement() {
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    city: "",
    state: "",
    address: "",
    capacity: 10000,
    slotDuration: 60,
    openTime: "06:00",
    closeTime: "21:00",
    lat: "",
    lng: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVenues();
  }, [statusFilter]);

  const fetchVenues = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/venues?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVenues(data.venues);
      }
    } catch (error) {
      console.error("Failed to fetch venues:", error);
      toast.error("Failed to fetch venues");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVenues();
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.city || !formData.state) {
      toast.error("Name, city, and state are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug || generateSlug(formData.name),
          description: formData.description,
          city: formData.city,
          state: formData.state,
          address: formData.address,
          capacity: formData.capacity,
          slotDuration: formData.slotDuration,
          operatingHours: {
            open: formData.openTime,
            close: formData.closeTime,
          },
          coordinates: formData.lat && formData.lng ? {
            lat: parseFloat(formData.lat),
            lng: parseFloat(formData.lng),
          } : undefined,
        }),
      });

      if (res.ok) {
        toast.success("Venue created successfully");
        setIsCreateDialogOpen(false);
        setFormData({
          name: "",
          slug: "",
          description: "",
          city: "",
          state: "",
          address: "",
          capacity: 10000,
          slotDuration: 60,
          openTime: "06:00",
          closeTime: "21:00",
          lat: "",
          lng: "",
        });
        fetchVenues();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create venue");
      }
    } catch (error) {
      toast.error("Failed to create venue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedVenue) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/venues/${selectedVenue._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          location: {
            city: formData.city,
            state: formData.state,
            address: formData.address,
            coordinates: formData.lat && formData.lng ? {
              lat: parseFloat(formData.lat),
              lng: parseFloat(formData.lng),
            } : undefined,
          },
          dailyCapacity: formData.capacity,
          slotDuration: formData.slotDuration,
          operatingHours: {
            open: formData.openTime,
            close: formData.closeTime,
          },
        }),
      });

      if (res.ok) {
        toast.success("Venue updated successfully");
        setIsEditDialogOpen(false);
        setSelectedVenue(null);
        fetchVenues();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update venue");
      }
    } catch (error) {
      toast.error("Failed to update venue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (venue: Venue) => {
    if (!confirm(`Are you sure you want to deactivate "${venue.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/venues/${venue._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Venue deactivated successfully");
        fetchVenues();
      } else {
        toast.error("Failed to deactivate venue");
      }
    } catch (error) {
      toast.error("Failed to deactivate venue");
    }
  };

  const openEditDialog = (venue: Venue) => {
    setSelectedVenue(venue);
    setFormData({
      name: venue.name,
      slug: venue.slug,
      description: venue.description || "",
      city: venue.location?.city || "",
      state: venue.location?.state || "",
      address: venue.location?.address || "",
      capacity: venue.dailyCapacity || 10000,
      slotDuration: venue.slotDuration || 60,
      openTime: venue.operatingHours?.open || "06:00",
      closeTime: venue.operatingHours?.close || "21:00",
      lat: venue.location?.coordinates?.lat?.toString() || "",
      lng: venue.location?.coordinates?.lng?.toString() || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleReactivate = async (venue: Venue) => {
    try {
      const res = await fetch(`/api/admin/venues/${venue._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });

      if (res.ok) {
        toast.success("Venue reactivated successfully");
        fetchVenues();
      } else {
        toast.error("Failed to reactivate venue");
      }
    } catch (error) {
      toast.error("Failed to reactivate venue");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Venues</h1>
          <p className="text-muted-foreground">
            Manage venues and their configurations
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Venue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Venue</DialogTitle>
              <DialogDescription>
                Create a new venue entry in the system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Venue Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  placeholder="e.g., Tirupati Balaji Venue"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="tirupati-balaji-venue"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Tirupati"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="Andhra Pradesh"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Full address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="capacity">Daily Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value) || 10000,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
                  <Input
                    id="slotDuration"
                    type="number"
                    value={formData.slotDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slotDuration: parseInt(e.target.value) || 60,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="openTime">Opening Time *</Label>
                  <Input
                    id="openTime"
                    type="time"
                    value={formData.openTime}
                    onChange={(e) =>
                      setFormData({ ...formData, openTime: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="closeTime">Closing Time *</Label>
                  <Input
                    id="closeTime"
                    type="time"
                    value={formData.closeTime}
                    onChange={(e) =>
                      setFormData({ ...formData, closeTime: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    type="text"
                    value={formData.lat}
                    onChange={(e) =>
                      setFormData({ ...formData, lat: e.target.value })
                    }
                    placeholder="e.g., 13.6833"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    type="text"
                    value={formData.lng}
                    onChange={(e) =>
                      setFormData({ ...formData, lng: e.target.value })
                    }
                    placeholder="e.g., 79.3477"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the venue"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting ? "Creating..." : "Create Venue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search venues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Venues Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Venues ({venues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venue</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Capacity</TableHead>
                <TableHead className="text-center">Zones</TableHead>
                <TableHead className="text-center">Gates</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No venues found
                  </TableCell>
                </TableRow>
              ) : (
                venues.map((venue) => (
                  <TableRow key={venue._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-chart-1/10">
                          <Building2 className="h-4 w-4 text-chart-1" />
                        </div>
                        <div>
                          <p className="font-medium">{venue.name}</p>
                          <p className="text-xs text-muted-foreground">
                            /{venue.slug}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {venue.location?.city}, {venue.location?.state}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {(venue.dailyCapacity || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {venue.zones?.length || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {venue.gates?.length || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={venue.isActive ? "default" : "secondary"}
                      >
                        {venue.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(venue)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {venue.isActive ? (
                            <DropdownMenuItem
                              onClick={() => handleDelete(venue)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleReactivate(venue)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Venue</DialogTitle>
            <DialogDescription>
              Update venue information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Venue Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-city">City *</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-state">State *</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-capacity">Daily Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: parseInt(e.target.value) || 10000,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slotDuration">Slot Duration (minutes)</Label>
                <Input
                  id="edit-slotDuration"
                  type="number"
                  value={formData.slotDuration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slotDuration: parseInt(e.target.value) || 60,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-openTime">Opening Time *</Label>
                <Input
                  id="edit-openTime"
                  type="time"
                  value={formData.openTime}
                  onChange={(e) =>
                    setFormData({ ...formData, openTime: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-closeTime">Closing Time *</Label>
                <Input
                  id="edit-closeTime"
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) =>
                    setFormData({ ...formData, closeTime: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-lat">Latitude</Label>
                <Input
                  id="edit-lat"
                  type="text"
                  value={formData.lat}
                  onChange={(e) =>
                    setFormData({ ...formData, lat: e.target.value })
                  }
                  placeholder="e.g., 13.6833"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-lng">Longitude</Label>
                <Input
                  id="edit-lng"
                  type="text"
                  value={formData.lng}
                  onChange={(e) =>
                    setFormData({ ...formData, lng: e.target.value })
                  }
                  placeholder="e.g., 79.3477"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
