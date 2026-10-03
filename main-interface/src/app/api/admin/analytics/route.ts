import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Booking from "@/models/booking.model";
import SOS from "@/models/sos.model";

// GET /api/admin/analytics - Get trend analytics
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("range") || searchParams.get("period") || "7d"; // 7d, 30d, 90d

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (period === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (period === "90d") {
      startDate.setDate(now.getDate() - 90);
    }

    // Daily visitor trends
    const visitorTrends = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" },
          },
          count: { $sum: "$visitors" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Hourly patterns (peak hours)
    const hourlyPatterns = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: "$timeSlot",
          count: { $sum: "$visitors" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Booking status breakdown
    const bookingStatus = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // SOS trends
    const sosTrends = await SOS.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // SOS by type
    const sosByType = await SOS.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
    ]);

    // Venue-wise comparison
    const venueComparison = await Booking.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: now },
        },
      },
      {
        $group: {
          _id: "$venueId",
          totalVisitors: { $sum: "$visitors" },
          totalBookings: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "venues",
          localField: "_id",
          foreignField: "_id",
          as: "venue",
        },
      },
      { $unwind: "$venue" },
      {
        $project: {
          venueName: "$venue.name",
          totalVisitors: 1,
          totalBookings: 1,
        },
      },
      { $sort: { totalVisitors: -1 } },
    ]);

    // Week comparison (this week vs last week)
    const thisWeekStart = new Date();
    thisWeekStart.setDate(now.getDate() - 7);
    const lastWeekStart = new Date();
    lastWeekStart.setDate(now.getDate() - 14);

    const [thisWeekBookings, lastWeekBookings] = await Promise.all([
      Booking.aggregate([
        { $match: { date: { $gte: thisWeekStart, $lte: now } } },
        { $group: { _id: null, total: { $sum: "$visitors" } } },
      ]),
      Booking.aggregate([
        { $match: { date: { $gte: lastWeekStart, $lt: thisWeekStart } } },
        { $group: { _id: null, total: { $sum: "$visitors" } } },
      ]),
    ]);

    const weekComparison = {
      thisWeek: thisWeekBookings[0]?.total || 0,
      lastWeek: lastWeekBookings[0]?.total || 0,
      change:
        lastWeekBookings[0]?.total > 0
          ? (((thisWeekBookings[0]?.total || 0) - lastWeekBookings[0].total) /
              lastWeekBookings[0].total) *
            100
          : 0,
    };

    return NextResponse.json({
      visitorTrends: visitorTrends.map((t) => ({
        date: t._id,
        visitors: t.count || 0,
      })),
      hourlyPatterns: hourlyPatterns.map((h) => ({
        hour: h._id || "Unknown",
        visitors: h.count || 0,
      })),
      bookingStatus: bookingStatus.map((b) => ({
        name: b._id || "Unknown",
        value: b.count || 0,
      })),
      sosTrends: sosTrends.map((s) => ({
        date: s._id,
        count: s.count || 0,
      })),
      sosByType: sosByType.map((s) => ({
        type: s._id || "Unknown",
        count: s.count || 0,
      })),
      venueComparison: venueComparison.map((t) => ({
        name: t.venueName || "Unknown",
        visitors: t.totalVisitors || 0,
        bookings: t.totalBookings || 0,
      })),
      weekComparison: {
        current: weekComparison.thisWeek,
        previous: weekComparison.lastWeek,
        percentChange: Math.round(weekComparison.change),
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
