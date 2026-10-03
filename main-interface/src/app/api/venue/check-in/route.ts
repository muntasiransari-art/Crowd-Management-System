import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";

// POST /api/venue/check-in - Check in a booking by code
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let { bookingCode } = await request.json();

    if (!bookingCode) {
      return NextResponse.json(
        { error: "Booking code is required" },
        { status: 400 },
      );
    }

    // Strip PILGRIMGUARD: prefix if present (from QR scan)
    if (bookingCode.startsWith("PILGRIMGUARD:")) {
      bookingCode = bookingCode.replace("PILGRIMGUARD:", "");
    }

    await connectDB();

    // Find and update booking in one operation
    const booking = await Booking.findOneAndUpdate(
      { bookingCode: bookingCode.toUpperCase() },
      { status: "checked_in", checkedInAt: new Date() },
      { new: true }
    );

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Check-in successful",
      booking: {
        bookingCode: booking.bookingCode,
        status: booking.status,
        checkedInAt: booking.checkedInAt,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}

// GET /api/venue/check-in?code=XXX - Get booking details by code
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let bookingCode = searchParams.get("code");

    if (!bookingCode) {
      return NextResponse.json(
        { error: "Booking code is required" },
        { status: 400 },
      );
    }

    // Strip PILGRIMGUARD: prefix if present (from QR scan)
    if (bookingCode.startsWith("PILGRIMGUARD:")) {
      bookingCode = bookingCode.replace("PILGRIMGUARD:", "");
    }

    await connectDB();

    const booking = await Booking.findOne({
      bookingCode: bookingCode.toUpperCase(),
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      booking: {
        bookingCode: booking.bookingCode,
        date: booking.date,
        timeSlot: booking.timeSlot,
        visitors: booking.visitors,
        status: booking.status,
        checkedInAt: booking.checkedInAt,
      },
    });
  } catch (error) {
    console.error("Booking lookup error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}
