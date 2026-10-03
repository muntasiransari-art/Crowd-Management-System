"use client";
import { useSession } from "next-auth/react";


import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Clock,
  Users,
  CalendarDays,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  User,
} from "lucide-react";

interface Venue {
  _id: string;
  name: string;
  slug: string;
  location: {
    city: string;
    state: string;
  };
}

interface Slot {
  _id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  gateId: string;
  status: string;
}

interface Visitor {
  name: string;
  age: string;
  gender: "male" | "female" | "other";
  isMainBooker: boolean;
}

export default function BookingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const [step, setStep] = useState(1);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedVenue, setSelectedVenue] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [visitors, setVisitors] = useState<Visitor[]>([
    { name: "", age: "", gender: "male", isMainBooker: true },
  ]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingCode, setBookingCode] = useState("");

  // Pre-fill first visitor with logged-in user's name
  useEffect(() => {
    if (user?.name || (user as any)?.fullName) {
      setVisitors((prev) => {
        if (prev[0].name === "") {
          const updated = [...prev];
          updated[0] = { ...updated[0], name: user.name || (user as any).fullName || "" };
          return updated;
        }
        return prev;
      });
    }
  }, [user]);

  // Fetch venues on mount
  useEffect(() => {
    async function fetchVenues() {
      try {
        const res = await fetch("/api/venues");
        const data = await res.json();
        setVenues(data.venues || []);
      } catch (error) {
        console.error("Failed to fetch venues:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchVenues();
  }, []);

  // Fetch slots when venue and date are selected
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedVenue || !selectedDate) return;

      setSlotsLoading(true);
      setSelectedSlot("");

      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const res = await fetch(
          `/api/venues/${selectedVenue}/slots?date=${dateStr}`,
        );
        const data = await res.json();
        setSlots(data.slots || []);
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }
    fetchSlots();
  }, [selectedVenue, selectedDate]);

  const venue = venues.find((t) => t._id === selectedVenue);
  const slot = slots.find((s) => s._id === selectedSlot);

  const addVisitor = () => {
    if (visitors.length < 10) {
      setVisitors([
        ...visitors,
        { name: "", age: "", gender: "male", isMainBooker: false },
      ]);
    }
  };

  const removeVisitor = (index: number) => {
    if (index > 0) {
      setVisitors(visitors.filter((_, i) => i !== index));
    }
  };

  const updateVisitor = (
    index: number,
    field: keyof Visitor,
    value: string,
  ) => {
    const updated = [...visitors];
    updated[index] = { ...updated[index], [field]: value };
    setVisitors(updated);
  };

  const isVisitorFormValid = () => {
    return visitors.every(
      (v) =>
        v.name.trim() && v.age && parseInt(v.age) > 0 && parseInt(v.age) <= 120,
    );
  };

  const handleBooking = async () => {
    if (
      !selectedVenue ||
      !selectedSlot ||
      !selectedDate ||
      !isVisitorFormValid()
    )
      return;

    setSubmitting(true);
    try {
      const visitorDetails = visitors.map((v) => ({
        name: v.name.trim(),
        age: parseInt(v.age),
        gender: v.gender,
        isMainBooker: v.isMainBooker,
      }));

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: selectedVenue,
          slotId: selectedSlot,
          date: selectedDate.toISOString(),
          visitorDetails,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBookingCode(data.booking.bookingCode);
        setShowConfirmation(true);
      } else {
        alert(data.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailabilityColor = (slot: Slot) => {
    const available = slot.capacity - slot.booked;
    const ratio = available / slot.capacity;
    if (ratio > 0.5) return "text-chart-2";
    if (ratio > 0.2) return "text-chart-4";
    if (ratio > 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const formatTime = (time: string) => {
    const [hour, min] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(min).padStart(2, "0")} ${period}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                step >= s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 4 && (
              <div
                className={`w-12 h-1 mx-2 rounded transition-colors ${
                  step > s ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Labels */}
      <div className="flex justify-center gap-8 text-sm text-muted-foreground mb-6">
        <span className={step === 1 ? "text-primary font-medium" : ""}>
          Venue
        </span>
        <span className={step === 2 ? "text-primary font-medium" : ""}>
          Date & Time
        </span>
        <span className={step === 3 ? "text-primary font-medium" : ""}>
          Visitors
        </span>
        <span className={step === 4 ? "text-primary font-medium" : ""}>
          Confirm
        </span>
      </div>

      {/* Step 1: Select Venue */}
      {step === 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Select Venue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {venues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No venues available. Please check back later.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {venues.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => setSelectedVenue(t._id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedVenue === t._id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.location.city}, {t.location.state}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedVenue}
                size="lg"
                className="gap-2"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) =>
                  date < new Date() ||
                  date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Select Time Slot
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a date first
                </div>
              ) : slotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No slots available for this date
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {slots.map((s) => {
                    const available = s.capacity - s.booked;
                    const isFull = available === 0;
                    return (
                      <button
                        key={s._id}
                        onClick={() => !isFull && setSelectedSlot(s._id)}
                        disabled={isFull}
                        className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                          selectedSlot === s._id
                            ? "border-primary bg-primary/5"
                            : isFull
                              ? "border-border bg-muted/50 cursor-not-allowed"
                              : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium">
                          {formatTime(s.startTime)} - {formatTime(s.endTime)}
                        </span>
                        <span className={`text-sm ${getAvailabilityColor(s)}`}>
                          {isFull ? "Full" : `${available} available`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} size="lg">
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedDate || !selectedSlot}
              size="lg"
              className="gap-2"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Visitor Details */}
      {step === 3 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Visitor Details
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter details for all visitors. Contact info will be from your
              account.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {visitors.map((visitor, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border bg-muted/30 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">
                      Visitor {index + 1}
                      {index === 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (Primary)
                        </span>
                      )}
                    </span>
                  </div>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeVisitor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`}>Full Name</Label>
                    <Input
                      id={`name-${index}`}
                      placeholder="Enter name"
                      value={visitor.name}
                      onChange={(e) =>
                        updateVisitor(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`age-${index}`}>Age</Label>
                    <Input
                      id={`age-${index}`}
                      type="number"
                      placeholder="Age"
                      min="1"
                      max="120"
                      value={visitor.age}
                      onChange={(e) =>
                        updateVisitor(index, "age", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <RadioGroup
                      value={visitor.gender}
                      onValueChange={(value) =>
                        updateVisitor(index, "gender", value)
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id={`male-${index}`} />
                        <Label
                          htmlFor={`male-${index}`}
                          className="font-normal"
                        >
                          Male
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id={`female-${index}`} />
                        <Label
                          htmlFor={`female-${index}`}
                          className="font-normal"
                        >
                          Female
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id={`other-${index}`} />
                        <Label
                          htmlFor={`other-${index}`}
                          className="font-normal"
                        >
                          Other
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            ))}

            {visitors.length < 10 && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={addVisitor}
              >
                <Plus className="h-4 w-4" />
                Add Another Visitor
              </Button>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)} size="lg">
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                disabled={!isVisitorFormValid()}
                size="lg"
                className="gap-2"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm Booking */}
      {step === 4 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Confirm Booking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking Summary */}
            <div className="p-4 rounded-xl bg-muted/50 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Venue</span>
                <span className="font-medium">{venue?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {selectedDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Slot</span>
                <span className="font-medium">
                  {slot &&
                    `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Visitors</span>
                <span className="font-medium">{visitors.length}</span>
              </div>
            </div>

            {/* Visitors List */}
            <div className="space-y-2">
              <h4 className="font-medium">Visitors</h4>
              <div className="space-y-2">
                {visitors.map((v, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.age} years •{" "}
                          {v.gender.charAt(0).toUpperCase() + v.gender.slice(1)}
                        </p>
                      </div>
                    </div>
                    {v.isMainBooker && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)} size="lg">
                Back
              </Button>
              <Button
                onClick={handleBooking}
                disabled={submitting}
                size="lg"
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="h-16 w-16 rounded-full bg-chart-2/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-chart-2" />
              </div>
              Booking Confirmed!
            </DialogTitle>
            <DialogDescription className="text-center">
              Your slot has been successfully booked. You will receive a
              confirmation email with your digital ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Venue</span>
              <span className="font-medium">{venue?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {selectedDate?.toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visitors</span>
              <span className="font-medium">{visitors.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booking Code</span>
              <span className="font-mono font-bold text-primary">
                {bookingCode}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => router.push("/attendee/tickets")}
            >
              View My Tickets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
