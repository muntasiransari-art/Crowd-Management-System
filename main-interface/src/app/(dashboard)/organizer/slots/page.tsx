"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Clock,
  Users,
  Edit2,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface SlotData {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  available: number;
  gateId: string;
  status: string;
}

interface GateData {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export default function SlotsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [gates, setGates] = useState<GateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("10:00");
  const [newCapacity, setNewCapacity] = useState("500");
  const [newGateId, setNewGateId] = useState("");

  // Edit dialog state
  const [editingSlot, setEditingSlot] = useState<SlotData | null>(null);
  const [editCapacity, setEditCapacity] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Delete confirmation
  const [deletingSlot, setDeletingSlot] = useState<SlotData | null>(null);

  const fetchSlots = async () => {
    if (!selectedDate) return;

    try {
      // Use local date format (YYYY-MM-DD) instead of ISO which converts to UTC
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const res = await fetch(`/api/venue/slots?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
        setGates(data.gates || []);
        if (data.gates?.length > 0 && !newGateId) {
          setNewGateId(data.gates[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      toast.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSlots();
  }, [selectedDate]);

  const formatTime = (time: string) => {
    const [hour] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${time.split(":")[1]} ${period}`;
  };

  const statusColors: Record<string, string> = {
    available: "bg-emerald-500",
    full: "bg-amber-500",
    closed: "bg-muted text-muted-foreground",
  };

  // CREATE - Add new slot
  const handleAddSlot = async () => {
    if (
      !selectedDate ||
      !newStartTime ||
      !newEndTime ||
      !newCapacity ||
      !newGateId
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/venue/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          startTime: newStartTime,
          endTime: newEndTime,
          capacity: parseInt(newCapacity),
          gateId: newGateId,
        }),
      });

      if (res.ok) {
        toast.success("Slot created successfully");
        setShowAddDialog(false);
        setNewStartTime("09:00");
        setNewEndTime("10:00");
        setNewCapacity("500");
        fetchSlots();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create slot");
      }
    } catch (error) {
      console.error("Failed to create slot:", error);
      toast.error("Failed to create slot");
    } finally {
      setSaving(false);
    }
  };

  // UPDATE - Edit slot
  const handleEditSlot = (slot: SlotData) => {
    setEditingSlot(slot);
    setEditCapacity(slot.capacity.toString());
    setEditStatus(slot.status);
  };

  const handleSaveEdit = async () => {
    if (!editingSlot) return;

    setSaving(true);
    try {
      const res = await fetch("/api/venue/slots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: editingSlot._id,
          capacity: parseInt(editCapacity),
          status: editStatus,
        }),
      });

      if (res.ok) {
        toast.success("Slot updated successfully");
        setEditingSlot(null);
        fetchSlots();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update slot");
      }
    } catch (error) {
      console.error("Failed to update slot:", error);
      toast.error("Failed to update slot");
    } finally {
      setSaving(false);
    }
  };

  // DELETE - Remove slot
  const handleDeleteSlot = async () => {
    if (!deletingSlot) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/venue/slots?slotId=${deletingSlot._id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Slot deleted successfully");
        setDeletingSlot(null);
        fetchSlots();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete slot");
      }
    } catch (error) {
      console.error("Failed to delete slot:", error);
      toast.error("Failed to delete slot");
    } finally {
      setSaving(false);
    }
  };

  const getGateName = (gateId: string) => {
    const gate = gates.find((g) => g.id === gateId);
    return gate?.name || gateId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Slot Management</h2>
          <p className="text-muted-foreground">
            Manage daily time slots and capacity ({slots.length} slots)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSlots}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Slot
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Slots List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                Slots for{" "}
                {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-chart-1" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No slots for this date
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => setShowAddDialog(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Slot
                      </Button>
                    </div>
                  ) : (
                    slots.map((slot) => (
                      <div
                        key={slot._id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-background">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {formatTime(slot.startTime)} -{" "}
                              {formatTime(slot.endTime)}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              {slot.booked} / {slot.capacity} booked
                              <span className="text-xs">
                                • {getGateName(slot.gateId)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[slot.status]}>
                            {slot.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditSlot(slot)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingSlot(slot)}
                            className="text-destructive hover:text-destructive"
                            disabled={slot.booked > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Slot Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Slot</DialogTitle>
            <DialogDescription>
              Create a new time slot for{" "}
              {selectedDate?.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="500"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Entry Gate *</Label>
              <Select value={newGateId} onValueChange={setNewGateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gate" />
                </SelectTrigger>
                <SelectContent>
                  {gates.map((gate) => (
                    <SelectItem key={gate.id} value={gate.id}>
                      {gate.name} ({gate.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSlot} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Slot Dialog */}
      <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Slot</DialogTitle>
            <DialogDescription>
              {editingSlot &&
                `${formatTime(editingSlot.startTime)} - ${formatTime(editingSlot.endTime)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editCapacity">Capacity *</Label>
              <Input
                id="editCapacity"
                type="number"
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editingSlot && editingSlot.booked > 0 && (
              <p className="text-sm text-muted-foreground">
                This slot has {editingSlot.booked} bookings.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSlot(null)}>
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
        open={!!deletingSlot}
        onOpenChange={() => setDeletingSlot(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the slot from{" "}
              {deletingSlot && formatTime(deletingSlot.startTime)} to{" "}
              {deletingSlot && formatTime(deletingSlot.endTime)}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSlot}
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
