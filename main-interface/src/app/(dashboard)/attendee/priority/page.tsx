"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Users,
  Baby,
  MapPin,
  Check,
  Loader2,
  Upload,
  AlertCircle,
  Ticket,
  ChevronRight,
  X,
  FileText,
  User,
} from "lucide-react";

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
    location: { city: string };
  };
  date: string;
  timeSlot: { start: string; end: string };
  gate: string;
  visitors: number;
  visitorDetails: VisitorData[];
  bookingCode: string;
  status: string;
}

interface PriorityRequestData {
  _id: string;
  bookingId: {
    bookingCode: string;
    date: string;
    timeSlot: { start: string };
    visitors: number;
  };
  venueId: { name: string };
  selectedVisitors: VisitorData[];
  types: string[];
  status: string;
  createdAt: string;
}

interface UploadedFile {
  url: string;
  originalName: string;
}

const priorityTypes = [
  {
    value: "elderly",
    label: "Senior Citizen",
    icon: Users,
    description: "Age 60 or above",
  },
  {
    value: "differently_abled",
    label: "Differently Abled",
    icon: Heart,
    description: "Physical or mental disability",
  },
  {
    value: "pregnant",
    label: "Pregnant Women",
    icon: Heart,
    description: "Expecting mothers",
  },
  {
    value: "woman_with_child",
    label: "Woman with Child",
    icon: Baby,
    description: "Children under 5 years",
  },
];

export default function PriorityAccessPage() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(
    null,
  );
  const [existingRequests, setExistingRequests] = useState<
    PriorityRequestData[]
  >([]);
  const [selectedVisitorIndices, setSelectedVisitorIndices] = useState<
    number[]
  >([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch upcoming bookings
  useEffect(() => {
    async function fetchData() {
      try {
        const [bookingsRes, requestsRes] = await Promise.all([
          fetch("/api/bookings?status=upcoming"),
          fetch("/api/priority-requests"),
        ]);

        const bookingsData = await bookingsRes.json();
        const requestsData = await requestsRes.json();

        setBookings(bookingsData.bookings || []);
        setExistingRequests(requestsData.requests || []);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Reset form when booking changes
  useEffect(() => {
    if (selectedBooking) {
      setSelectedVisitorIndices([]);
      setSelectedTypes([]);
      setReason("");
      setUploadedFiles([]);
    }
  }, [selectedBooking]);

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

  const hasExistingRequest = (bookingId: string) => {
    return existingRequests.some(
      (r) =>
        r.bookingId?.bookingCode &&
        bookings.find((b) => b._id === bookingId)?.bookingCode ===
          r.bookingId.bookingCode,
    );
  };

  const toggleVisitor = (index: number) => {
    setSelectedVisitorIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const toggleType = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value],
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedFiles((prev) => [...prev, ...data.files]);
      } else {
        alert("Failed to upload files");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (
      !selectedBooking ||
      selectedVisitorIndices.length === 0 ||
      selectedTypes.length === 0 ||
      !reason
    )
      return;

    setSubmitting(true);
    try {
      // Get selected visitors data
      const selectedVisitors = selectedVisitorIndices.map(
        (index) => selectedBooking.visitorDetails[index],
      );

      const res = await fetch("/api/priority-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedBooking._id,
          selectedVisitors,
          types: selectedTypes,
          reason,
          documents: uploadedFiles.map((f) => f.url),
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Refresh requests
        const requestsRes = await fetch("/api/priority-requests");
        const requestsData = await requestsRes.json();
        setExistingRequests(requestsData.requests || []);

        // Reset form
        setTimeout(() => {
          setSuccess(false);
          setSelectedBooking(null);
          setSelectedVisitorIndices([]);
          setSelectedTypes([]);
          setReason("");
          setUploadedFiles([]);
        }, 2000);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit request");
      }
    } catch (error) {
      console.error("Failed to submit:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Priority Access</h2>
        <p className="text-muted-foreground">
          Request priority entry for specific visitors in your booking
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Ticket Selection */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Select a Booking</h3>

          {bookings.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No upcoming bookings found.
                  <br />
                  Book a slot first to request priority access.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings
                .filter((booking) => !hasExistingRequest(booking._id))
                .map((booking) => {
                  const isSelected = selectedBooking?._id === booking._id;

                  return (
                    <Card
                      key={booking._id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary border-2 shadow-md"
                          : "border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <MapPin className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {booking.venueId.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(booking.date)} •{" "}
                                {formatTime(booking.timeSlot.start)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {booking.visitors}{" "}
                              {booking.visitors === 1 ? "visitor" : "visitors"}
                            </Badge>
                            {isSelected && (
                              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                            {!isSelected && (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              {bookings.filter((b) => !hasExistingRequest(b._id)).length ===
                0 && (
                <Card className="border-0 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Check className="h-12 w-12 text-emerald-500 mb-4" />
                    <p className="text-muted-foreground text-center">
                      All your upcoming bookings already have
                      <br />
                      priority access applied!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Existing Requests */}
          {existingRequests.length > 0 && (
            <div className="mt-8">
              <h3 className="font-semibold text-lg mb-3">Your Requests</h3>
              <div className="space-y-2">
                {existingRequests.map((req) => (
                  <Card key={req._id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">
                          {req.selectedVisitors?.length || 0}{" "}
                          {(req.selectedVisitors?.length || 0) === 1
                            ? "person"
                            : "people"}
                        </p>
                        <Badge
                          className={
                            req.status === "applied"
                              ? "bg-amber-500"
                              : req.status === "approved"
                                ? "bg-emerald-500"
                                : req.status === "rejected"
                                  ? "bg-destructive"
                                  : "bg-yellow-500"
                          }
                        >
                          {req.status.charAt(0).toUpperCase() +
                            req.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {req.venueId?.name} • {req.bookingId?.bookingCode}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {req.types?.map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="text-xs"
                          >
                            {priorityTypes.find((pt) => pt.value === t)?.label}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Request Form */}
        <div>
          {selectedBooking ? (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">
                  Request Priority Access
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  For {selectedBooking.venueId.name} on{" "}
                  {formatDate(selectedBooking.date)}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {success ? (
                  <div className="flex flex-col items-center py-8">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                      <Check className="h-8 w-8 text-emerald-500" />
                    </div>
                    <p className="text-lg font-semibold">
                      Priority Access Applied!
                    </p>
                    <p className="text-muted-foreground text-sm text-center mt-2">
                      Your request has been registered. Please bring
                      <br />
                      your documents for verification on visit.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Visitor Selection */}
                    <div className="space-y-3">
                      <Label>Select Visitors for Priority Access</Label>
                      <div className="space-y-2">
                        {selectedBooking.visitorDetails?.map(
                          (visitor, index) => (
                            <label
                              key={index}
                              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedVisitorIndices.includes(index)
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <Checkbox
                                checked={selectedVisitorIndices.includes(index)}
                                onCheckedChange={() => toggleVisitor(index)}
                              />
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">
                                  {visitor.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {visitor.age} years •{" "}
                                  {visitor.gender.charAt(0).toUpperCase() +
                                    visitor.gender.slice(1)}
                                </p>
                              </div>
                              {visitor.isMainBooker && (
                                <Badge variant="secondary" className="text-xs">
                                  Primary
                                </Badge>
                              )}
                            </label>
                          ),
                        )}
                      </div>
                      {selectedVisitorIndices.length > 0 && (
                        <p className="text-sm text-primary font-medium">
                          {selectedVisitorIndices.length} visitor
                          {selectedVisitorIndices.length > 1 ? "s" : ""}{" "}
                          selected
                        </p>
                      )}
                    </div>

                    {/* Priority Type Selection - Multi-select */}
                    <div className="space-y-3">
                      <Label>Select Priority Types (can select multiple)</Label>
                      <div className="grid grid-cols-1 gap-3">
                        {priorityTypes.map((type) => {
                          const isChecked = selectedTypes.includes(type.value);
                          return (
                            <label
                              key={type.value}
                              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                isChecked
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleType(type.value)}
                              />
                              <div
                                className={`p-2 rounded-lg ${
                                  isChecked
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <type.icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{type.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {type.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                      <Label htmlFor="reason">
                        Please explain why you need priority access
                      </Label>
                      <Textarea
                        id="reason"
                        placeholder="Provide details about your condition or situation..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                      />
                    </div>

                    {/* Document Upload */}
                    <div className="space-y-3">
                      <Label>
                        Supporting Documents for {selectedVisitorIndices.length}{" "}
                        {selectedVisitorIndices.length === 1
                          ? "person"
                          : "people"}
                      </Label>

                      {/* Uploaded Files */}
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="text-sm truncate max-w-[200px]">
                                  {file.originalName}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload Area */}
                      <div
                        className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 cursor-pointer transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        {uploading ? (
                          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        )}
                        <p className="text-sm text-muted-foreground">
                          {uploading
                            ? "Uploading..."
                            : "Drop files here or click to upload"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Age proof, medical certificate, etc.
                        </p>
                      </div>
                    </div>

                    {/* Submit */}
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={
                        selectedVisitorIndices.length === 0 ||
                        selectedTypes.length === 0 ||
                        !reason ||
                        submitting
                      }
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold mb-2">Select a Booking</p>
                <p className="text-muted-foreground text-center text-sm">
                  Choose a booking from the left to request
                  <br />
                  priority access for specific visitors
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
