"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DoorOpen,
  Users,
  TrendingUp,
  TrendingDown,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
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
// import React from "react";

interface Gate {
  _id: string;
  name: string;
  type: "entry" | "exit" | "both";
  status: "active" | "paused" | "closed";
  currentFlow: number;
  venueId: string;
  location?: string;
}

export default function GatesPage() {
  const [gates, setGates] = useState<Gate[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: "",
    type: "entry",
    location: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGates();
  }, []);

  const fetchGates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/venue/gates");
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Unauthorized. Please sign in.");
          return;
        }
        throw new Error("Failed to fetch gates");
      }
      const data = await res.json();
      setGates(data.gates || []);
    } catch (error) {
      console.error("Error fetching gates:", error);
      toast.error(
        "Failed to load gates. Ensure you are logged in as Venue Staff.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddGate = async () => {
    if (!formData.name) {
      toast.error("Gate name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/venue/gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create gate");

      const data = await res.json();
      setGates([...gates, data.gate]);
      setIsAddDialogOpen(false);
      setFormData({ name: "", type: "entry", location: "" });
      toast.success("Gate added successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add gate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGate = async () => {
    if (!selectedGate) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/venue/gates/${selectedGate._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update gate");

      const data = await res.json();
      setGates(gates.map((g) => (g._id === data.gate._id ? data.gate : g)));
      setIsEditDialogOpen(false);
      setSelectedGate(null);
      toast.success("Gate updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update gate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGate = async () => {
    if (!selectedGate) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/venue/gates/${selectedGate._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete gate");

      setGates(gates.filter((g) => g._id !== selectedGate._id));
      setIsDeleteDialogOpen(false);
      setSelectedGate(null);
      toast.success("Gate deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete gate");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (gate: Gate) => {
    try {
      const newStatus = gate.status === "active" ? "paused" : "active";
      // fast optimistic update
      setGates(
        gates.map((g) =>
          g._id === gate._id ? { ...g, status: newStatus } : g,
        ),
      );

      const res = await fetch(`/api/venue/gates/${gate._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // revert on failure
        setGates(gates); // This might need a deeper revert but assuming fetchGates could fix it or just set back to old status
        throw new Error("Failed to update status");
      }
      const data = await res.json();
      // confirm with server state
      setGates(gates.map((g) => (g._id === data.gate._id ? data.gate : g)));
    } catch (error) {
      console.error(error);
      toast.error("Failed to toggle status");
    }
  };

  const openEditDialog = (gate: Gate) => {
    setSelectedGate(gate);
    setFormData({
      name: gate.name,
      type: gate.type,
      location: gate.location || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (gate: Gate) => {
    setSelectedGate(gate);
    setIsDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Entry Gate Controls</h2>
          <p className="text-muted-foreground">
            Manage entry and exit gates for the venue
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Gate
        </Button>
      </div>

      {/* Gate List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gates.map((gate) => (
          <Card
            key={gate._id}
            className="border-0 shadow-sm relative group overflow-hidden"
          >
            {gate.status === "paused" && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Badge
                  variant="outline"
                  className="bg-background text-foreground border-dashed"
                >
                  Paused
                </Badge>
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3 relative z-20">
                <div className="flex items-center gap-2">
                  <DoorOpen className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold line-clamp-1">{gate.name}</h3>
                    {gate.location && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {gate.location}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openEditDialog(gate)}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleStatus(gate)}>
                      <Power className="h-4 w-4 mr-2" />
                      {gate.status === "active"
                        ? "Pause Gate"
                        : "Activate Gate"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => openDeleteDialog(gate)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between relative z-20">
                <Badge
                  variant="secondary"
                  className={
                    gate.type === "entry"
                      ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                      : gate.type === "exit"
                        ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                        : "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"
                  }
                >
                  {gate.type.toUpperCase()}
                </Badge>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">
                    {gate.currentFlow}/hr
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {gates.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
            <DoorOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No gates found. Add a new gate to get started.</p>
          </div>
        )}
      </div>

      {/* Add Gate Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Gate</DialogTitle>
            <DialogDescription>
              Create a new entry or exit gate for the venue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Gate Name</Label>
              <Input
                id="name"
                placeholder="e.g. North Gate"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "entry" | "exit" | "both") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Only</SelectItem>
                  <SelectItem value="exit">Exit Only</SelectItem>
                  <SelectItem value="both">Entry & Exit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="e.g. Near Main Parking"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddGate} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Gate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Gate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gate</DialogTitle>
            <DialogDescription>Update gate details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Gate Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "entry" | "exit" | "both") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Only</SelectItem>
                  <SelectItem value="exit">Exit Only</SelectItem>
                  <SelectItem value="both">Entry & Exit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateGate} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              gate
              <span className="font-semibold text-foreground">
                {" "}
                {selectedGate?.name}{" "}
              </span>
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteGate}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
