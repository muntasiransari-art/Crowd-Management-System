"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  CalendarDays,
  Clock,
  Users,
  ChevronRight,
  Ticket,
  Loader2,
  Star,
} from "lucide-react";
import { BookingQR } from "@/components/booking-qr";

interface BookingData {
  _id: string;
  venueId: {
    _id: string;
    name: string;
    location: {
      city: string;
    };
  };
  date: string;
  timeSlot: {
    start: string;
    end: string;
  };
  gate: string;
  visitors: number;
  bookingCode: string;
  status: string;
}

interface PriorityRequest {
  _id: string;
  bookingId: { _id: string } | string;
  status: string;
}

interface TicketCardProps {
  booking: BookingData;
  showQR?: boolean;
  hasPriority?: boolean;
}

function TicketCard({
  booking,
  showQR = true,
  hasPriority = false,
}: TicketCardProps) {
  const statusColors: Record<string, string> = {
    confirmed: "text-chart-2 bg-chart-2/10",
    checked_in: "text-chart-1 bg-chart-1/10",
    completed: "text-muted-foreground bg-muted",
    cancelled: "text-destructive bg-destructive/10",
    no_show: "text-muted-foreground bg-muted",
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hour, min] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(min).padStart(2, "0")} ${period}`;
  };

  const statusLabel =
    booking.status.charAt(0).toUpperCase() +
    booking.status.slice(1).replace("_", " ");

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{booking.venueId.name}</p>
                    {hasPriority && (
                      <Badge className="bg-amber-500 text-white gap-1 text-xs">
                        <Star className="h-3 w-3" />
                        Priority
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {booking.venueId.location.city}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  statusColors[booking.status] || statusColors.confirmed
                }`}
              >
                {statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="text-xs">Date</span>
                </div>
                <p className="text-sm font-medium">
                  {formatDate(booking.date)}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs">Time</span>
                </div>
                <p className="text-sm font-medium">
                  {formatTime(booking.timeSlot.start)}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-xs">Gate</span>
                </div>
                <p className="text-sm font-medium">{booking.gate}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-xs">Visitors</span>
                </div>
                <p className="text-sm font-medium">{booking.visitors}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Code:</span>
                <code className="font-mono font-semibold text-primary">
                  {booking.bookingCode}
                </code>
              </div>
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <Link href={`/attendee/tickets/${booking._id}`}>
                  View Details <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {showQR && booking.status === "confirmed" && (
            <div className="flex items-center justify-center p-5 bg-linear-to-br from-primary/5 to-accent/10 border-t md:border-t-0 md:border-l border-border">
              <BookingQR bookingCode={booking.bookingCode} size={80} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [priorityRequests, setPriorityRequests] = useState<PriorityRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [bookingsRes, priorityRes] = await Promise.all([
          fetch(`/api/bookings?status=${activeTab}`),
          fetch("/api/priority-requests"),
        ]);
        const bookingsData = await bookingsRes.json();
        const priorityData = await priorityRes.json();
        setBookings(bookingsData.bookings || []);
        setPriorityRequests(priorityData.requests || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab]);

  const hasPriorityForBooking = (bookingId: string) => {
    return priorityRequests.some((pr) => {
      const prBookingId =
        typeof pr.bookingId === "object" ? pr.bookingId?._id : pr.bookingId;
      return prBookingId === bookingId && pr.status === "applied";
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Tickets</h2>
        <Button asChild>
          <Link href="/attendee/booking">
            <Ticket className="h-4 w-4 mr-2" />
            Book New Slot
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">No Tickets Found</p>
                <p className="text-muted-foreground text-center mb-4">
                  {activeTab === "upcoming"
                    ? "You don't have any upcoming bookings"
                    : activeTab === "past"
                      ? "No past visits found"
                      : "No cancelled bookings"}
                </p>
                {activeTab === "upcoming" && (
                  <Button asChild>
                    <Link href="/attendee/booking">Book a Slot</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <TicketCard
                  key={booking._id}
                  booking={booking}
                  showQR={activeTab === "upcoming"}
                  hasPriority={hasPriorityForBooking(booking._id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
