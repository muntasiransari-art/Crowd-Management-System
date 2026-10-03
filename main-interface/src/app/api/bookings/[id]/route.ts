import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";
import Slot from "@/models/slot.model";
import User from "@/models/user.model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bookings/[id] - Get single booking
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    const { id } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Try to find by booking ID or booking code
    let booking = await Booking.findById(id).populate(
      "venueId",
      "name location",
    );

    if (!booking) {
      booking = await Booking.findOne({ bookingCode: id }).populate(
        "venueId",
        "name location",
      );
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify user owns this booking
    const user = await User.findOne({ email: clerkId });
    if (!user || !booking.userId.equals(user._id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 },
    );
  }
}

// DELETE /api/bookings/[id] - Cancel booking
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    const { id } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify user owns this booking
    const user = await User.findOne({ email: clerkId });
    if (!user || !booking.userId.equals(user._id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Can only cancel if not already completed/cancelled
    if (["completed", "cancelled", "no_show"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Cannot cancel this booking" },
        { status: 400 },
      );
    }

    // Update booking status
    booking.status = "cancelled";
    await booking.save();

    // Free up the slot
    await Slot.findByIdAndUpdate(booking.slotId, {
      $inc: { booked: -booking.visitors },
      status: "available",
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 },
    );
  }
}
