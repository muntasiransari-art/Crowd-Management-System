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
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";

// Dynamic import to avoid SSR issues with camera
const QRScanner = dynamic(() => import("@/components/qr-scanner"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-muted rounded-xl">
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
  venueId?: { name: string; location?: { city: string } };
  venueName?: string;
  bookedBy?: { firstName: string; lastName: string; email?: string };
}

export default function OrganizerTicketVerificationPage() {
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
      // First try standard verification endpoint
      const res = await fetch("/api/bookings/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setCheckInSuccess(true);
        setBooking(data.booking);
        toast.success("Pass verified & checked in successfully!");
        return;
      }

      // If API returned structured response with booking details
      if (data.booking) {
        setBooking(data.booking);
        setError(data.message || "Ticket cannot be verified.");
        return;
      }

      // Fallback check-in endpoint
      const fallbackRes = await fetch(`/api/venue/check-in?code=${code}`);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        setBooking(fallbackData.booking);
        return;
      }

      setError(data.message || data.error || "Invalid booking ticket code");
    } catch (err) {
      console.error("Verification error:", err);
      setError("Network connection error. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckIn = async () => {
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
      toast.success("Pass verified & attendee checked in!");
    } catch (err) {
      console.error("Check-in error:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    let code = decodedText;
    if (decodedText.includes("PILGRIMGUARD:")) {
      code = decodedText.replace("PILGRIMGUARD:", "");
    } else if (decodedText.includes("bookingCode=")) {
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time?: string) => {
    if (!time) return "N/A";
    const [hour] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${time.split(":")[1]} ${period}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "checked_in":
        return <Badge className="bg-emerald-500 text-white">Checked In</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-500 text-white">Valid Pass</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "completed":
        return <Badge className="bg-purple-500 text-white">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" /> Organizer Ticket Verification
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Scan attendee QR code passes or enter booking codes for entry clearance.
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
          Live Scanner Mode
        </Badge>
      </div>

      {/* Verified Success State */}
      {checkInSuccess && booking && (
        <Card className="border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-950/20 shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center animate-bounce">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ENTRY APPROVED & VERIFIED!
                </h2>
                <p className="text-emerald-700 dark:text-emerald-300 text-sm mt-1">
                  {booking.visitors || 1} attendee(s) checked in successfully
                </p>
              </div>

              <div className="p-4 bg-background border rounded-2xl max-w-md mx-auto shadow-inner">
                <p className="text-xs text-muted-foreground uppercase font-mono">Verified Booking Pass</p>
                <p className="text-3xl font-mono font-black tracking-wider text-primary mt-1">
                  {booking.bookingCode}
                </p>
                {booking.gate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Gate: <span className="font-semibold text-foreground">{booking.gate}</span>
                  </p>
                )}
              </div>

              {booking.visitorDetails && booking.visitorDetails.length > 0 && (
                <div className="bg-background/80 p-4 rounded-xl border max-w-md mx-auto text-left text-xs space-y-1">
                  <p className="font-bold text-foreground">Verified Visitors:</p>
                  {booking.visitorDetails.map((v, idx) => (
                    <p key={idx} className="text-muted-foreground">
                      • {v.name} ({v.age}y, {v.gender})
                    </p>
                  ))}
                </div>
              )}

              <Button onClick={resetState} size="lg" className="rounded-full px-8 shadow-lg">
                <RotateCcw className="h-4 w-4 mr-2" />
                Scan Next Attendee Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Details Preview prior to manual checkin */}
      {booking && !checkInSuccess && (
        <Card className="border-primary/20 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Pass Information
              </CardTitle>
              {getStatusBadge(booking.status)}
            </div>
            <CardDescription>
              Review attendee pass details before approving venue gate entry
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-xl text-center border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Booking Reference Code
              </p>
              <p className="text-2xl font-mono font-bold tracking-widest mt-1">
                {booking.bookingCode}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Event Date</p>
                  <p className="font-semibold text-sm">{formatDate(booking.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Time Slot</p>
                  <p className="font-semibold text-sm">
                    {formatTime(booking.timeSlot?.start)} - {formatTime(booking.timeSlot?.end)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Gate</p>
                  <p className="font-semibold text-sm">{booking.gate || "Gate 1"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Pass Count</p>
                  <p className="font-semibold text-sm">{booking.visitors || 1} person(s)</p>
                </div>
              </div>
            </div>

            {booking.visitorDetails && booking.visitorDetails.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-2">Registered Attendees:</p>
                <div className="space-y-1">
                  {booking.visitorDetails.map((v, i) => (
                    <div key={i} className="text-xs text-muted-foreground flex justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="font-medium text-foreground">{i + 1}. {v.name}</span>
                      <span>{v.age} years • {v.gender}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetState} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCheckIn}
                disabled={checkingIn || booking.status !== "confirmed"}
                className="flex-1 shadow-lg"
              >
                {checkingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Entry
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && !booking && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
              <div>
                <h3 className="font-bold text-destructive text-lg">{error}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Ensure the ticket code matches an active booking pass.
                </p>
              </div>
              <Button variant="outline" onClick={resetState} size="sm">
                Try Scanning Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner & Manual Code Input Tabs */}
      {!booking && !error && (
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">
              <Keyboard className="h-4 w-4 mr-2" />
              Enter Code Manually
            </TabsTrigger>
            <TabsTrigger value="scan">
              <QrCode className="h-4 w-4 mr-2" />
              Camera Scanner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="mt-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Organizer Manual Verification</CardTitle>
                <CardDescription>
                  Enter ticket booking code (e.g. PG-2026-UP-1234)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Booking Ticket Code *</Label>
                    <Input
                      id="code"
                      placeholder="e.g., PG-2026-UP-1234"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      className="text-center text-lg font-mono tracking-wider uppercase h-12"
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 text-sm font-semibold shadow-md"
                    disabled={loading || manualCode.trim().length < 4}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying Ticket...
                      </>
                    ) : (
                      "Verify & Check In Attendee"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scan" className="mt-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Card className="border-0 shadow-lg p-4">
                <QRScanner onScanSuccess={handleScanSuccess} />
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
