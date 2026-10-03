import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SOS from "@/models/sos.model";
import User from "@/models/user.model";

// GET /api/security/sos?venueId=...&status=...
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");
    const status = searchParams.get("status"); // optional: active, resolved

    if (!venueId) {
      return NextResponse.json(
        { error: "Venue ID is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const query: any = { venueId };

    // Default to active/in_progress/acknowledged if no status specified, unless 'history' requested
    if (status === "history") {
      query.status = "resolved";
    } else if (status) {
      query.status = status;
    } else {
      // Live board: excludes resolved
      query.status = { $ne: "resolved" };
    }

    const alerts = await SOS.find(query)
      .populate("userId", "firstName lastName phone") // The user who raised SOS
      .populate("assignedTo", "firstName lastName badgeNumber") // Security assigned
      .sort({ createdAt: -1 });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Error fetching SOS alerts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/security/sos - Create new Incident (Security Report)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { venueId, description, location, type, priority, latitude, longitude } = body;

    await connectDB();
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine latitude and longitude
    const lat = latitude || (location?.coordinates?.lat) || (location?.lat);
    const lng = longitude || (location?.coordinates?.lng) || (location?.lng);

    const formattedLocation = {
      zone: location?.zone || "Live Geolocation",
      description: location?.description || (lat && lng ? `GPS: ${lat}, ${lng}` : "Quick SOS alert triggered"),
      ...(lat && lng ? { coordinates: { lat: Number(lat), lng: Number(lng) } } : {}),
    };

    const newAlert = await SOS.create({
      userId: user._id,
      venueId,
      type: type || "security", // Default to security incident
      priority: priority || "high",
      location: formattedLocation,
      description: description || "Emergency SOS triggered",
      status: "active",
      notes: [
        {
          by: user._id,
          text: "Incident reported via SOS button",
          at: new Date(),
        },
      ],
    });

    // --- TWILIO INTEGRATION: Call & SMS the Event Organizer ---
    try {
      const twilio = require("twilio");
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const toPhone = process.env.ORGANIZER_PHONE_NUMBER || "+1987654321";
      const fromPhone = process.env.TWILIO_PHONE_NUMBER || "+1234567890";

      // Construct Google Maps Link
      let mapsUrl = "";
      if (lat && lng) {
        mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
      }

      // 1. Initiate Voice Call
      const twiml = `<Response>
        <Say>Emergency alert! An attendee named ${user.firstName || 'Attendee'} ${user.lastName || ''} has triggered an SOS for a ${type || 'security'} emergency. Location details have been sent to your phone via SMS. Please check your phone and security dashboard immediately.</Say>
      </Response>`;

      await client.calls.create({
        to: toPhone,
        from: fromPhone,
        url: 'http://twimlets.com/echo?Twiml=' + encodeURIComponent(twiml)
      });
      console.log(`Twilio Call: Successfully initiated call to organizer at ${toPhone}`);

      // 2. Send SMS with Location
      const smsBody = `🚨 SOS EMERGENCY ALERT 🚨\nFrom: ${user.firstName || ''} ${user.lastName || ''} (${user.phone || user.email})\nType: ${(type || 'security').toUpperCase()}\nDetails: ${description || 'Emergency alert'}\n${mapsUrl ? `Location: ${mapsUrl}` : 'Location: GPS unavailable'}`;

      await client.messages.create({
        body: smsBody,
        to: toPhone,
        from: fromPhone,
      });
      console.log(`Twilio SMS: Successfully sent SOS SMS with location to ${toPhone}`);

    } catch (twilioError: any) {
      console.error("Twilio Voice Call / SMS Failed:", twilioError.message);
      // We don't return an error to the frontend so the SOS is still registered in database
    }

    return NextResponse.json({ success: true, alert: newAlert });
  } catch (error) {
    console.error("Error reporting incident:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// PATCH /api/security/sos/[id] - Acknowledge or Resolve
export async function PATCH(request: Request) {
  // Note: We need to parse ID from URL in Next.js App Router dynamic routes if this was [id]/route.ts
  // But since we are using query params or body for standard route, let's assume body has ID or use a dynamic route file.
  // For simplicity in this structure, I'll use a specific route file for ID operations if needed,
  // BUT user requested "implement this", I will use a separate file for [id] to be cleaner.
  // Let's stick to creating just the collection route here and make a separate one for ID.
  return NextResponse.json(
    { error: "Use /api/security/sos/[id] for updates" },
    { status: 405 },
  );
}
