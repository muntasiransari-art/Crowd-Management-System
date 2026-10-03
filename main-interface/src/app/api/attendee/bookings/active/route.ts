import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Venue from "@/models/venue.model"; // Ensure Venue model is registered

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find bookings where date is today or in the future
    // AND status is 'confirmed' or 'checked_in'
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookings = await Booking.find({
      userId: user._id,
      date: { $gte: today },
      status: { $in: ["confirmed", "checked_in"] },
    })
      .populate("venueId", "name location") // Cleanly populate venue details
      .sort({ date: 1 })
      .limit(5);

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching active bookings:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
