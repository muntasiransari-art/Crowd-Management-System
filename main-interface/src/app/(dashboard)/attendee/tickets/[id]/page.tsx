"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  CalendarDays,
  Clock,
  Users,
  Share2,
  ArrowLeft,
  Check,
  Loader2,
  Trash2,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LargeBookingQR } from "@/components/booking-qr";

interface VisitorData {
  name: string;
  age: number;
  gender: string;
  isMainBooker?: boolean;
}

interface BookingData {
  _id: string;
  venueId: {
    _id: string;
    name: string;
    location: {
      city: string;
      state: string;
    };
  };
  date: string;
  timeSlot: {
    start: string;
    end: string;
  };
  gate: string;
  visitors: number;
  visitorDetails: VisitorData[];
  bookingCode: string;
  status: string;
  createdAt: string;
}

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [hasPriority, setHasPriority] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bookingRes, priorityRes] = await Promise.all([
          fetch(`/api/bookings/${id}`),
          fetch("/api/priority-requests"),
        ]);
        const bookingData = await bookingRes.json();
        const priorityData = await priorityRes.json();

        if (bookingRes.ok) {
          setBooking(bookingData.booking);
          // Check if this booking has priority request
          const hasPriorityReq = priorityData.requests?.some(
            (r: { bookingId?: { _id?: string }; status: string }) =>
              r.bookingId?._id === bookingData.booking._id &&
              r.status === "applied",
          );
          setHasPriority(hasPriorityReq);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/attendee/tickets");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Failed to cancel:", error);
    } finally {
      setCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      full: date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      day: date.toLocaleDateString("en-US", { weekday: "long" }),
    };
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

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Booking not found</p>
        <Button asChild className="mt-4">
          <Link href="/attendee/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  const dateInfo = formatDate(booking.date);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" className="gap-2 -ml-2" asChild>
        <Link href="/attendee/tickets">
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </Link>
      </Button>

      {/* Ticket Card */}
      <Card className="border-0 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-primary to-primary/80 text-primary-foreground p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium opacity-80">
              Digital Ticket
            </span>
            <span className="flex items-center gap-1 text-sm font-medium bg-primary-foreground/20 px-3 py-1 rounded-full">
              <Check className="h-3.5 w-3.5" />
              {booking.status.charAt(0).toUpperCase() +
                booking.status.slice(1).replace("_", " ")}
            </span>
          </div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {booking.venueId.name}
            {hasPriority && (
              <Badge className="bg-amber-500 text-white gap-1">
                <Star className="h-3 w-3" />
                Priority
              </Badge>
            )}
          </h2>
          <p className="text-primary-foreground/80">
            {booking.venueId.location.city}, {booking.venueId.location.state}
          </p>
        </div>

        {/* QR Code Section */}
        <CardContent className="p-6">
          <div className="flex flex-col items-center mb-6">
            <LargeBookingQR
              bookingCode={booking.bookingCode}
              venueName={booking.venueId.name}
              date={dateInfo.full}
              time={formatTime(booking.timeSlot.start)}
            />
          </div>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-border" />
            </div>
            <div className="absolute -left-6 top-1/2 -translate-y-1/2 h-6 w-6 bg-background rounded-full" />
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 h-6 w-6 bg-background rounded-full" />
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CalendarDays className="h-4 w-4" />
                <span className="text-sm">Date</span>
              </div>
              <p className="font-semibold">{dateInfo.full}</p>
              <p className="text-sm text-muted-foreground">{dateInfo.day}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Time</span>
              </div>
              <p className="font-semibold">
                {formatTime(booking.timeSlot.start)}
              </p>
              <p className="text-sm text-muted-foreground">
                to {formatTime(booking.timeSlot.end)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Entry Gate</span>
              </div>
              <p className="font-semibold">{booking.gate}</p>
              <p className="text-sm text-muted-foreground">Main Entrance</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Visitors</span>
              </div>
              <p className="font-semibold">{booking.visitors} Persons</p>
              <p className="text-sm text-muted-foreground">Including you</p>
            </div>
          </div>

          {/* Visitors List */}
          {booking.visitorDetails && booking.visitorDetails.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Visitors
              </h4>
              <div className="space-y-2">
                {booking.visitorDetails.map((visitor, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{visitor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {visitor.age} years •{" "}
                          {visitor.gender.charAt(0).toUpperCase() +
                            visitor.gender.slice(1)}
                        </p>
                      </div>
                    </div>
                    {visitor.isMainBooker && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1 gap-2">
              <Share2 className="h-4 w-4" />
              Share Ticket
            </Button>
          </div>

          {/* Cancel Button */}
          {booking.status === "confirmed" && (
            <Button
              variant="destructive"
              className="w-full mt-3 gap-2"
              onClick={() => setShowCancelDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
              Cancel Booking
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <h3 className="font-semibold mb-3">Important Guidelines</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Arrive at least 30 minutes before your slot time
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Carry a valid ID proof along with this digital ticket
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Mobile phones must be deposited at the entrance
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Traditional/modest attire is mandatory
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Booking Info */}
      <p className="text-center text-sm text-muted-foreground">
        Booked on{" "}
        {new Date(booking.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this booking? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cancel Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
