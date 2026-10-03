import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Booking from "@/models/booking.model";
import PriorityRequest from "@/models/priority-request.model";
import SOS from "@/models/sos.model";
import Venue from "@/models/venue.model";

// GET /api/venue/stats - Get dashboard stats for venue staff
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get user and verify venue_staff role
    const user = await User.findOne({ email: clerkId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get venueId from query params or user's roleData
    const { searchParams } = new URL(request.url);
    const queryVenueId = searchParams.get("venueId");
    const roleData = user.roleData as { venueId?: string };
    const venueId = queryVenueId || roleData?.venueId;

    // Get venue info
    const venue = venueId
      ? await Venue.findById(venueId)
      : await Venue.findOne({ isActive: true });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's stats
    const [
      todayBookings,
      todayVisitors,
      pendingPriority,
      activeSOS,
      checkedIn,
    ] = await Promise.all([
      Booking.countDocuments({
        venueId: venue._id,
        date: { $gte: today, $lt: tomorrow },
      }),
      Booking.aggregate([
        {
          $match: {
            venueId: venue._id,
            date: { $gte: today, $lt: tomorrow },
          },
        },
        { $group: { _id: null, total: { $sum: "$visitors" } } },
      ]),
      PriorityRequest.countDocuments({
        venueId: venue._id,
        status: "applied",
      }),
      SOS.countDocuments({
        venueId: venue._id,
        status: { $in: ["active", "acknowledged", "in_progress"] },
      }),
      Booking.countDocuments({
        venueId: venue._id,
        date: { $gte: today, $lt: tomorrow },
        status: "checked_in",
      }),
    ]);

    // Get zone stats with dynamically calculated status
    const zones = venue.zones.map(
      (zone: {
        id: string;
        name: string;
        capacity: number;
        currentCount: number;
      }) => {
        const percentage =
          zone.capacity > 0
            ? Math.round((zone.currentCount / zone.capacity) * 100)
            : 0;

        // Calculate status based on percentage thresholds
        let status: "low" | "medium" | "high" | "critical" = "low";
        if (percentage >= 90) status = "critical";
        else if (percentage >= 70) status = "high";
        else if (percentage >= 50) status = "medium";

        return {
          id: zone.id,
          name: zone.name,
          capacity: zone.capacity,
          currentCount: zone.currentCount,
          status,
          percentage,
        };
      },
    );

    // Recent SOS alerts
    const recentSOS = await SOS.find({
      venueId: venue._id,
      status: { $in: ["active", "acknowledged", "in_progress"] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "firstName lastName email phone");

    return NextResponse.json({
      venue: {
        _id: venue._id,
        name: venue.name,
        location: venue.location,
      },
      stats: {
        todayBookings,
        todayVisitors: todayVisitors[0]?.total || 0,
        checkedIn,
        pendingPriority,
        activeSOS,
        totalCapacity: venue.dailyCapacity,
      },
      zones,
      recentSOS: recentSOS.map((sos) => ({
        _id: sos._id,
        type: sos.type,
        priority: sos.priority,
        status: sos.status,
        location: sos.location,
        createdAt: sos.createdAt,
        user: sos.userId,
      })),
    });
  } catch (error) {
    console.error("Error fetching venue stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
