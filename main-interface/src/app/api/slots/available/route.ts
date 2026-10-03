import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Slot from "@/models/slot.model";
import Venue from "@/models/venue.model";

// GET /api/slots/available - Get available slots for a venue on a date
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");
    const dateStr = searchParams.get("date");

    if (!venueId || !dateStr) {
      return NextResponse.json(
        { error: "venueId and date are required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Parse date
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get venue info for gate names
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Build gate map
    const gateMap: Record<string, string> = {};
    venue.gates?.forEach((g: { id: string; name: string }) => {
      gateMap[g.id] = g.name;
    });

    // Find available slots
    const slots = await Slot.find({
      venueId,
      date: { $gte: date, $lt: nextDay },
      status: { $ne: "full" },
    })
      .sort({ startTime: 1 })
      .lean();

    // Format slots with availability info
    const availableSlots = slots
      .filter((slot) => slot.capacity - slot.booked > 0)
      .map((slot) => ({
        _id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        available: slot.capacity - slot.booked,
        capacity: slot.capacity,
        gate: gateMap[slot.gateId] || "Gate 1",
        gateId: slot.gateId,
      }));

    return NextResponse.json({
      venue: {
        _id: venue._id,
        name: venue.name,
        city: venue.location?.city,
      },
      date: dateStr,
      slots: availableSlots,
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch slots" },
      { status: 500 },
    );
  }
}
