"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Stethoscope,
  ShieldAlert,
  Baby,
  Flame,
  HelpCircle,
  MapPin,
  Phone,
  Clock,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const sosTypes = [
  {
    id: "medical",
    name: "Medical Emergency",
    icon: Stethoscope,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description: "Health issues, injuries, or medical assistance needed",
  },
  {
    id: "security",
    name: "Security Issue",
    icon: ShieldAlert,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    description: "Theft, harassment, or suspicious activity",
  },
  {
    id: "lost_child",
    name: "Lost Child",
    icon: Baby,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Missing child or separated from family",
  },
  {
    id: "fire",
    name: "Fire Emergency",
    icon: Flame,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Fire hazard or smoke detected",
  },
  {
    id: "other",
    name: "Other Emergency",
    icon: HelpCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Any other urgent assistance needed",
  },
];

export default function SOSPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>("");
  const [venueId, setVenueId] = useState<string>("");
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Form State
  const [locationDetail, setLocationDetail] = useState("");
  const [description, setDescription] = useState("");

  // UI State
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hasActiveSOS, setHasActiveSOS] = useState(false);

  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch("/api/attendee/bookings/active");
        if (res.ok) {
          const data = await res.json();
          setActiveBookings(data.bookings || []);

          // Auto-select first booking if available
          if (data.bookings && data.bookings.length > 0) {
            setVenueId(data.bookings[0].venueId._id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      } finally {
        setLoadingBookings(false);
      }
    }
    fetchBookings();
  }, []);

  // Update default description when type changes
  useEffect(() => {
    if (selectedType) {
      const type = sosTypes.find((t) => t.id === selectedType);
      if (type && !description) {
        setDescription(
          `Reporting ${type.name}. Assistance required immediately.`,
        );
      }
    }
  }, [selectedType]);

  const handleSendSOS = async () => {
    if (!venueId) {
      toast.error("Please select a venue location");
      return;
    }
    if (!selectedType) {
      toast.error("Please select an emergency type");
      return;
    }

    setIsSending(true);
    try {
      let coords: { lat: number; lng: number } | null = null;
      if ("geolocation" in navigator) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => {
              console.warn("Geolocation denied/failed:", err);
              resolve(null);
            },
            { timeout: 5000, enableHighAccuracy: true }
          );
        });
      }

      const selectedSOS = sosTypes.find((t) => t.id === selectedType);

      const res = await fetch("/api/security/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          type: selectedType,
          priority: "high", // Defaulting to high for attendee SOS
          description: description,
          latitude: coords?.lat,
          longitude: coords?.lng,
          location: {
            zone: "Attendee App Alert",
            description: locationDetail || (coords ? `GPS: ${coords.lat}, ${coords.lng}` : "Location details provided by user"),
            coordinates: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
          },
        }),
      });

      if (res.ok) {
        setShowConfirmation(true);
        setHasActiveSOS(true);
      } else {
        toast.error("Failed to send alert. Please call emergency services.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error. Call emergency services immediately.");
    } finally {
      setIsSending(false);
    }
  };

  const selectedSOS = sosTypes.find((t) => t.id === selectedType);
  const currentVenue = activeBookings.find((b) => b.venueId._id === venueId);

  if (hasActiveSOS) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-destructive/10 animate-pulse">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-destructive mb-2">
                  SOS Alert Active
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your emergency alert has been sent to{" "}
                  {currentVenue?.venueId.name || "Security"}. Help is on the
                  way.
                </p>

                <div className="space-y-3 mb-6">
                  {selectedSOS && (
                    <div className="flex items-center gap-2 text-sm">
                      <selectedSOS.icon
                        className={`h-4 w-4 ${selectedSOS.color}`}
                      />
                      <span>{selectedSOS.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{currentVenue?.venueId.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Sent just now</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 mb-4">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                    <Check className="h-4 w-4" />
                    Alert Received
                  </div>
                  <p className="text-sm text-green-600/80 mt-1">
                    Security dashboard has received your alert.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Phone className="h-4 w-4" />
                    Emergency Call
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 text-muted-foreground hover:text-destructive"
                    onClick={() => setHasActiveSOS(false)}
                  >
                    Close Status
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Big SOS Button Header */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-destructive/5 to-destructive/10">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Emergency SOS</h2>
            <p className="text-muted-foreground">
              Select an emergency type below to alert security.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 1. Select Venue Location */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Current Location (Venue)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingBookings ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding active bookings...
            </div>
          ) : activeBookings.length > 0 ? (
            <Select value={venueId} onValueChange={setVenueId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Venue" />
              </SelectTrigger>
              <SelectContent>
                {activeBookings.map((booking) => (
                  <SelectItem key={booking._id} value={booking.venueId._id}>
                    {booking.venueId.name} ({booking.gate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
              No active bookings found. You must have a confirmed ticket for
              today/upcoming to use SOS here.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Type Selection (Only enabled if venue selected) */}
      <Card
        className={`border-0 shadow-sm ${!venueId ? "opacity-50 pointer-events-none" : ""}`}
      >
        <CardHeader>
          <CardTitle className="text-base">Type of Emergency</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sosTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                selectedType === type.id
                  ? "border-destructive bg-destructive/5"
                  : "border-border hover:border-destructive/30"
              }`}
            >
              <div className={`p-2 rounded-lg ${type.bgColor} shrink-0`}>
                <type.icon className={`h-5 w-5 ${type.color}`} />
              </div>
              <div>
                <p className="font-medium text-sm">{type.name}</p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* 3. Details & Send */}
      {selectedType && (
        <Card className="border-0 shadow-sm animate-in slide-in-from-bottom-4 fade-in">
          <CardHeader>
            <CardTitle>Confirm & Send</CardTitle>
            <CardDescription>
              Security will be alerted immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              className="w-full gap-2 bg-destructive hover:bg-destructive/90 h-14 text-lg shadow-lg shadow-destructive/20"
              onClick={handleSendSOS}
              disabled={isSending}
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
              {isSending ? "Sending Alert..." : "SEND SOS ALERT"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              By clicking send, you consent to sharing your location and details
              with security.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              Alert Sent Successfully
            </DialogTitle>
            <DialogDescription className="text-center">
              Security at <strong>{currentVenue?.venueId.name}</strong> has
              been notified.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => setShowConfirmation(false)}
            >
              Track Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
