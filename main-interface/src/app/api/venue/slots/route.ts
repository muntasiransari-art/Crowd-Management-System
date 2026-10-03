import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Venue from "@/models/venue.model";
import Slot from "@/models/slot.model";

// GET /api/venue/slots - Get slots for a date
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const roleData = user.roleData as { venueId?: string };
    const venueId = roleData?.venueId;

    const venue = venueId
      ? await Venue.findById(venueId)
      : await Venue.findOne({ isActive: true });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Get date from query params (default to today)
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    let queryDate: Date;
    if (dateStr) {
      queryDate = new Date(dateStr);
    } else {
      queryDate = new Date();
    }
    queryDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const slots = await Slot.find({
      venueId: venue._id,
      date: { $gte: queryDate, $lt: nextDay },
    }).sort({ startTime: 1 });

    // Get gates for reference
    const gates = venue.gates.map(
      (gate: {
        id: string;
        name: string;
        type: string;
        isActive: boolean;
      }) => ({
        id: gate.id,
        name: gate.name,
        type: gate.type,
        isActive: gate.isActive,
      }),
    );

    return NextResponse.json({
      slots: slots.map((slot) => ({
        _id: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        booked: slot.booked,
        available: slot.capacity - slot.booked,
        gateId: slot.gateId,
        status: slot.status,
      })),
      gates,
      venueId: venue._id,
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch slots" },
      { status: 500 },
    );
  }
}

// POST /api/venue/slots - Create a new slot
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, startTime, endTime, capacity, gateId } = await request.json();

    if (!date || !startTime || !endTime || !capacity || !gateId) {
      return NextResponse.json(
        { error: "Date, start time, end time, capacity and gate are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const roleData = user.roleData as { venueId?: string };
    const venueId = roleData?.venueId;

    const venue = venueId
      ? await Venue.findById(venueId)
      : await Venue.findOne({ isActive: true });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Check for duplicate slot (same date, start time, AND gate)
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);

    const existingSlot = await Slot.findOne({
      venueId: venue._id,
      date: slotDate,
      startTime,
      gateId, // Include gate in duplicate check
    });

    if (existingSlot) {
      return NextResponse.json(
        { error: "A slot already exists for this time and gate" },
        { status: 400 },
      );
    }

    const newSlot = await Slot.create({
      venueId: venue._id,
      date: slotDate,
      startTime,
      endTime,
      capacity: parseInt(capacity),
      booked: 0,
      gateId,
      status: "available",
    });

    return NextResponse.json({
      slot: {
        _id: newSlot._id,
        date: newSlot.date,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        capacity: newSlot.capacity,
        booked: newSlot.booked,
        gateId: newSlot.gateId,
        status: newSlot.status,
      },
      message: "Slot created successfully",
    });
  } catch (error) {
    console.error("Error creating slot:", error);
    return NextResponse.json(
      { error: "Failed to create slot" },
      { status: 500 },
    );
  }
}

// PATCH /api/venue/slots - Update a slot
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slotId, capacity, status, booked } = await request.json();

    if (!slotId) {
      return NextResponse.json(
        { error: "Slot ID is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const roleData = user.roleData as { venueId?: string };
    const venueId = roleData?.venueId;

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    // Verify slot belongs to user's venue
    if (venueId && slot.venueId.toString() !== venueId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (capacity !== undefined) slot.capacity = parseInt(capacity);
    if (status !== undefined) slot.status = status;
    if (booked !== undefined) slot.booked = parseInt(booked);

    // Auto-update status based on capacity
    if (slot.booked >= slot.capacity && slot.status === "available") {
      slot.status = "full";
    } else if (slot.booked < slot.capacity && slot.status === "full") {
      slot.status = "available";
    }

    await slot.save();

    return NextResponse.json({
      slot: {
        _id: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        booked: slot.booked,
        gateId: slot.gateId,
        status: slot.status,
      },
      message: "Slot updated successfully",
    });
  } catch (error) {
    console.error("Error updating slot:", error);
    return NextResponse.json(
      { error: "Failed to update slot" },
      { status: 500 },
    );
  }
}

// DELETE /api/venue/slots - Delete a slot
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("slotId");

    if (!slotId) {
      return NextResponse.json(
        { error: "Slot ID is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const roleData = user.roleData as { venueId?: string };
    const venueId = roleData?.venueId;

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    // Verify slot belongs to user's venue
    if (venueId && slot.venueId.toString() !== venueId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Prevent deleting slots with bookings
    if (slot.booked > 0) {
      return NextResponse.json(
        { error: "Cannot delete slot with existing bookings" },
        { status: 400 },
      );
    }

    await Slot.findByIdAndDelete(slotId);

    return NextResponse.json({ message: "Slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting slot:", error);
    return NextResponse.json(
      { error: "Failed to delete slot" },
      { status: 500 },
    );
  }
}
