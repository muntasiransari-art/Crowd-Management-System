import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Notification from "@/models/notification.model";
import Announcement from "@/models/announcement.model";
import Booking from "@/models/booking.model";

import User from "@/models/user.model";

// GET /api/notifications
// Fetch notifications and announcements for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Fetch personal notifications
    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // 2. Fetch Active Bookings to determine relevant venues
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeBookings = await Booking.find({
      userId: user._id,
      status: { $in: ["confirmed", "checked_in"] },
      date: { $gte: today },
    }).select("venueId");

    // Extract unique venue IDs
    const bookedVenueIds = [
      ...new Set(activeBookings.map((b) => b.venueId.toString())),
    ];

    // 3. Fetch active announcements ONLY for booked venues
    // If no bookings, no venue announcements (or simplify logic if you want global announcements too)
    let announcements = [];
    if (bookedVenueIds.length > 0) {
      announcements = await Announcement.find({
        isActive: true,
        expiresAt: { $gte: new Date() },
        venueId: { $in: bookedVenueIds },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("venueId", "name"); // Populate venue name (assumes Venue model has 'name')
    }

    // 4. Transform announcements to notification format
    const announcementNotifs = announcements.map((ann) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: `ann-${ann._id}`,
      type: "announcement",
      title: `${(ann.venueId as any)?.name || "Venue"} Announcement: ${ann.title}`,
      message: ann.message,
      createdAt: ann.createdAt,
      isRead: false,
      data: { venueId: (ann.venueId as any)?._id },
    }));

    // 5. Combine and sort
    const combined = [
      ...notifications.map((n) => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        isRead: n.isRead,
        data: n.data,
      })),
      ...announcementNotifs,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({ notifications: combined });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
