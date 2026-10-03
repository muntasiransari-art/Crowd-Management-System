import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";

// POST /api/bookings/verify - Verify booking QR code
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "Booking code is required" },
        { status: 400 },
      );
    }

    // Extract code from QR format if needed
    const bookingCode = code.startsWith("PILGRIMGUARD:")
      ? code.replace("PILGRIMGUARD:", "")
      : code;

    await connectDB();

    // Find booking by code
    const booking = await Booking.findOne({ bookingCode }).populate(
      "venueId",
      "name location.city",
    );

    if (!booking) {
      return NextResponse.json(
        { valid: false, message: "Invalid booking code" },
        { status: 404 },
      );
    }

    // Check status
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { valid: false, message: "This booking has been cancelled" },
        { status: 400 },
      );
    }

    if (booking.status === "checked_in") {
      return NextResponse.json(
        { valid: false, message: "Already checked in", booking },
        { status: 400 },
      );
    }

    if (booking.status === "completed") {
      return NextResponse.json(
        { valid: false, message: "Visit already completed", booking },
        { status: 400 },
      );
    }

    // Check date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(booking.date);
    bookingDate.setHours(0, 0, 0, 0);

    if (bookingDate.getTime() !== today.getTime()) {
      const isBeforeToday = bookingDate < today;
      return NextResponse.json(
        {
          valid: false,
          message: isBeforeToday
            ? "This booking date has passed"
            : `This booking is for ${bookingDate.toLocaleDateString()}`,
          booking,
        },
        { status: 400 },
      );
    }

    // Check time window (allow entry 30 min before to 30 min after slot start)
    const now = new Date();
    const [slotHour, slotMin] = booking.timeSlot.start.split(":").map(Number);
    const slotStart = new Date();
    slotStart.setHours(slotHour, slotMin, 0, 0);

    const windowStart = new Date(slotStart.getTime() - 30 * 60 * 1000); // 30 min before
    const windowEnd = new Date(slotStart.getTime() + 30 * 60 * 1000); // 30 min after

    if (now < windowStart) {
      return NextResponse.json(
        {
          valid: false,
          message: `Too early. Entry allowed from ${windowStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          booking,
        },
        { status: 400 },
      );
    }

    if (now > windowEnd) {
      return NextResponse.json(
        {
          valid: false,
          message: "Entry time has passed for this slot",
          booking,
        },
        { status: 400 },
      );
    }

    // Valid! Mark as checked in
    booking.status = "checked_in";
    booking.checkedInAt = new Date();
    await booking.save();

    return NextResponse.json({
      valid: true,
      message: "Entry approved! Welcome to the venue.",
      booking: {
        _id: booking._id,
        bookingCode: booking.bookingCode,
        venue: booking.venueId,
        date: booking.date,
        timeSlot: booking.timeSlot,
        gate: booking.gate,
        visitors: booking.visitors,
        status: booking.status,
        checkedInAt: booking.checkedInAt,
      },
    });
  } catch (error) {
    console.error("Error verifying booking:", error);
    return NextResponse.json(
      { valid: false, message: "Verification failed" },
      { status: 500 },
    );
  }
}
