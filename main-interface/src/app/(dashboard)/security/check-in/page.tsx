"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QrCode,
  Keyboard,
  CheckCircle,
  Users,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

// Dynamic import to avoid SSR issues with camera
const QRScanner = dynamic(() => import("@/components/qr-scanner"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
});

interface BookingData {
  _id: string;
  bookingCode: string;
  date: string;
  timeSlot: { start: string; end: string };
  gate: string;
  visitors: number;
  visitorDetails: { name: string; age: number; gender: string }[];
  status: string;
  checkedInAt?: string;
  venueName: string;
  bookedBy?: { firstName: string; lastName: string };
}

export default function CheckInPage() {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  const fetchBooking = async (code: string) => {
    setLoading(true);
    setError(null);
    setBooking(null);
    setCheckInSuccess(false);

    try {
      const res = await fetch(`/api/venue/check-in?code=${code}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to find booking");
        return;
      }

      setBooking(data.booking);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!booking) return;

    setCheckingIn(true);
    try {
      const res = await fetch("/api/venue/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingCode: booking.bookingCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Check-in failed");
        return;
      }

      setCheckInSuccess(true);
      setBooking(data.booking);
      toast.success("Check-in successful!");
    } catch (err) {
      console.error("Check-in error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    // The QR code should contain the booking code
    // It could be just the code or a URL containing the code
    let code = decodedText;

    // If it's a URL, try to extract the code
    if (decodedText.includes("bookingCode=")) {
      const url = new URL(decodedText);
      code = url.searchParams.get("bookingCode") || decodedText;
    } else if (decodedText.includes("/booking/")) {
      code = decodedText.split("/booking/").pop() || decodedText;
    }

    fetchBooking(code.trim());
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      fetchBooking(manualCode.trim());
    }
  };

  const resetState = () => {
    setBooking(null);
    setError(null);
    setCheckInSuccess(false);
    setManualCode("");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hour] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${time.split(":")[1]} ${period}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked_in":
        return "bg-green-500";
      case "confirmed":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      case "completed":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Check-In</h1>
        <p className="text-muted-foreground mt-1">
          Scan QR code or enter booking code to check in attendees
        </p>
      </div>

      {/* Success State */}
      {checkInSuccess && booking && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-700 dark:text-green-400">
                  Check-In Successful!
                </h2>
                <p className="text-green-600 dark:text-green-500">
                  {booking.visitors} visitor(s) checked in at{" "}
                  {new Date(booking.checkedInAt!).toLocaleTimeString()}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-background rounded-lg">
                <p className="text-2xl font-mono font-bold">
                  {booking.bookingCode}
                </p>
              </div>
              <Button onClick={resetState} size="lg">
                <RotateCcw className="h-4 w-4 mr-2" />
                Scan Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Preview */}
      {booking && !checkInSuccess && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Booking Details</CardTitle>
              <Badge className={getStatusColor(booking.status)}>
                {booking.status.replace("_", " ")}
              </Badge>
            </div>
            <CardDescription>
              Review and confirm check-in for this booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Booking Code
              </p>
              <p className="text-2xl font-mono font-bold mt-1">
                {booking.bookingCode}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(booking.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Time Slot</p>
                  <p className="font-medium">
                    {formatTime(booking.timeSlot.start)} -{" "}
                    {formatTime(booking.timeSlot.end)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Gate</p>
                  <p className="font-medium">{booking.gate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Visitors</p>
                  <p className="font-medium">{booking.visitors} person(s)</p>
                </div>
              </div>
            </div>

            {booking.visitorDetails && booking.visitorDetails.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Visitor Names:</p>
                <div className="space-y-1">
                  {booking.visitorDetails.map((v, i) => (
                    <p key={i} className="text-sm text-muted-foreground">
                      {i + 1}. {v.name} ({v.age}y, {v.gender})
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetState} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleCheckIn}
                disabled={checkingIn || booking.status !== "confirmed"}
                className="flex-1"
              >
                {checkingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Check-In
                  </>
                )}
              </Button>
            </div>

            {booking.status !== "confirmed" && (
              <p className="text-sm text-amber-600 text-center">
                This booking cannot be checked in (status: {booking.status})
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !booking && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">{error}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please check the code and try again
                </p>
              </div>
              <Button variant="outline" onClick={resetState}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner/Manual Entry */}
      {!booking && !error && (
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">
              <QrCode className="h-4 w-4 mr-2" />
              Scan QR
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Keyboard className="h-4 w-4 mr-2" />
              Enter Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <QRScanner onScanSuccess={handleScanSuccess} />
            )}
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Enter Booking Code</CardTitle>
                <CardDescription>
                  Type the 12-character booking code shown on the ticket
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Booking Code *</Label>
                    <Input
                      id="code"
                      placeholder="e.g., ABC123DEF456"
                      value={manualCode}
                      onChange={(e) =>
                        setManualCode(e.target.value.toUpperCase())
                      }
                      className="text-center text-lg font-mono tracking-widest uppercase"
                      maxLength={12}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || manualCode.length < 6}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Looking up...
                      </>
                    ) : (
                      "Find Booking"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
