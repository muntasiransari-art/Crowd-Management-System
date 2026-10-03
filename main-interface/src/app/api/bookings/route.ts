import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";
import Slot from "@/models/slot.model";
import Venue from "@/models/venue.model";
import User from "@/models/user.model";

// GET /api/bookings - Get user's bookings
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userId = (session?.user as any)?.id;

    if (!userEmail && !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get MongoDB user ID
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && userEmail) {
      user = await User.findOne({ email: { $regex: `^${userEmail}$`, $options: "i" } });
    }

    if (!user) {
      return NextResponse.json({ bookings: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // upcoming, past, cancelled

    const query: Record<string, unknown> = { userId: user._id };
    const now = new Date();

    if (status === "upcoming") {
      query.date = { $gte: now };
      query.status = { $in: ["confirmed", "checked_in"] };
    } else if (status === "past") {
      query.status = { $in: ["completed", "no_show"] };
    } else if (status === "cancelled") {
      query.status = "cancelled";
    }

    const bookings = await Booking.find(query)
      .populate("venueId", "name location.city")
      .sort({ date: status === "upcoming" ? 1 : -1 })
      .limit(20);

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    const userId = (session?.user as any)?.id;

    if (!userEmail && !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { venueId, slotId, date, visitorDetails } = body;

    // Validate required fields
    if (
      !venueId ||
      !slotId ||
      !date ||
      !visitorDetails ||
      visitorDetails.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate visitor details
    for (const visitor of visitorDetails) {
      if (!visitor.name || !visitor.age || !visitor.gender) {
        return NextResponse.json(
          { error: "Each visitor must have name, age, and gender" },
          { status: 400 },
        );
      }
    }

    const visitors = visitorDetails.length;

    await connectDB();

    // Get MongoDB user
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && userEmail) {
      user = await User.findOne({ email: { $regex: `^${userEmail}$`, $options: "i" } });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found. Please log in again." },
        { status: 404 },
      );
    }

    // Get slot and verify availability
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ error: "Selected slot not found" }, { status: 404 });
    }

    if (slot.status === "full" || (slot.booked || 0) + visitors > slot.capacity) {
      return NextResponse.json(
        { error: "Not enough spots available for this slot" },
        { status: 400 },
      );
    }

    // Get venue for gate info
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Find gate name safely
    let gateName = "Gate 1";
    if (venue && Array.isArray(venue.gates) && slot.gateId) {
      const g = venue.gates.find(
        (gateItem: any) =>
          gateItem.id === slot.gateId ||
          gateItem._id?.toString() === slot.gateId?.toString(),
      );
      if (g?.name) {
        gateName = g.name;
      }
    }

    const bookingCode = `PG-2026-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create booking with visitor details
    const booking = await Booking.create({
      userId: user._id,
      venueId,
      slotId,
      bookingCode,
      date: new Date(date),
      timeSlot: {
        start: slot.startTime,
        end: slot.endTime,
      },
      gate: gateName,
      visitorDetails,
      visitors,
    });

    // Update slot booked count
    slot.booked = (slot.booked || 0) + visitors;
    if (slot.booked >= slot.capacity) {
      slot.status = "full";
    }
    await slot.save();

    // Populate venue info safely for response
    try {
      await booking.populate("venueId", "name location.city");
    } catch (popErr) {
      console.warn("Populate venue notice:", popErr);
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create booking" },
      { status: 500 },
    );
  }
}
