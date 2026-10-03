import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Booking from "@/models/booking.model";
import Notification from "@/models/notification.model";
import Announcement from "@/models/announcement.model";
import User from "@/models/user.model";
import Venue from "@/models/venue.model";

// GET /api/attendee/dashboard - Aggregate dashboard data
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Ensure models are registered before populate to avoid MissingSchemaError
    Venue.init();

    const user = await User.findOne({ email: clerkId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date();

    // 1. Fetch Upcoming Booking (Nearest Future)
    const upcomingBooking = await Booking.findOne({
      userId: user._id,
      date: { $gte: new Date(today.setHours(0, 0, 0, 0)) },
      status: { $in: ["confirmed", "checked_in"] },
    })
      .sort({ date: 1 })
      .populate("venueId", "name location");

    // 2. Fetch Recent Bookings (Last 5)
    // Exclude the upcoming one if it's the same? Usually dashboard shows history separately.
    // Let's just show history here.
    const recentBookings = await Booking.find({
      userId: user._id,
    })
      .sort({ date: -1 }) // Newest first
      .limit(5)
      .populate("venueId", "name");

    // 3. Fetch Notifications (Unread or recent 5)
    const notifications = await Notification.find({
      userId: user._id,
    })
      .sort({ sentAt: -1 })
      .limit(5);

    // 4. Counts
    const totalBookings = await Booking.countDocuments({ userId: user._id });
    const upcomingCount = await Booking.countDocuments({
      userId: user._id,
      date: { $gte: new Date() },
      status: "confirmed",
    });

    return NextResponse.json({
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
      stats: {
        upcomingVisits: upcomingCount,
        totalBookings: totalBookings,
        sosAlerts: 0, // Placeholder, maybe fetch if we have user-specific SOS
        priorityStatus: "Inactive", // Placeholder
      },
      upcomingBooking,
      recentBookings,
      notifications,
    });
  } catch (error) {
    console.error("Error fetching attendee dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
