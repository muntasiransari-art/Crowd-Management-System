import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Venue from "@/models/venue.model";
import Slot from "@/models/slot.model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/venues/[id]/slots?date=2026-01-20
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Verify venue exists
    const venue = await Venue.findById(id);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Parse date
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // Get slots for this venue and date
    let slots = await Slot.find({
      venueId: id,
      date: date,
      status: { $ne: "closed" },
    }).sort({ startTime: 1 });

    // If no slots exist for this date, generate them
    if (slots.length === 0) {
      slots = await generateSlots(venue, date);
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch slots" },
      { status: 500 },
    );
  }
}

// Helper to generate slots for a date
async function generateSlots(venue: any, date: Date) {
  const operatingHours = venue?.operatingHours || { open: "08:00", close: "20:00" };
  const openTime = operatingHours.open || "08:00";
  const closeTime = operatingHours.close || "20:00";
  const slotDuration = venue?.slotDuration || 60;
  const dailyCapacity = venue?.dailyCapacity || 10000;
  const gates = Array.isArray(venue?.gates) && venue.gates.length > 0
    ? venue.gates
    : [{ id: "gate-1", name: "Main Gate" }];

  // Parse operating hours
  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  const slots = [];
  const totalMinutes = Math.max(60, (closeHour * 60 + closeMin) - (openHour * 60 + openMin));
  const slotsPerDay = Math.max(1, Math.floor(totalMinutes / slotDuration));
  const capacityPerSlot = Math.max(10, Math.floor(dailyCapacity / slotsPerDay));

  let currentHour = openHour;
  let currentMin = openMin;

  while (
    currentHour * 60 + currentMin + slotDuration <=
    closeHour * 60 + closeMin
  ) {
    const startTime = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;

    // Calculate end time
    let endHour = currentHour;
    let endMin = currentMin + slotDuration;
    if (endMin >= 60) {
      endHour += Math.floor(endMin / 60);
      endMin = endMin % 60;
    }
    const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

    // Assign gate (round-robin)
    const gateIndex = slots.length % gates.length;
    const gate = gates[gateIndex];

    slots.push({
      venueId: venue._id,
      date: date,
      startTime,
      endTime,
      capacity: capacityPerSlot,
      booked: 0,
      gateId: gate.id || gate._id?.toString() || "gate-1",
      status: "available",
    });

    // Move to next slot
    currentMin += slotDuration;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }

  // Insert slots into database
  const insertedSlots = await Slot.insertMany(slots);
  return insertedSlots;
}
