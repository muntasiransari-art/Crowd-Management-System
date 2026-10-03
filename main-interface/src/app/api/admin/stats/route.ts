import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Venue from "@/models/venue.model";
import Booking from "@/models/booking.model";
import SOS from "@/models/sos.model";

// GET /api/admin/stats - Get platform overview statistics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Check if user is admin
    const user = await User.findOne({ email: clerkId });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get counts in parallel
    const [
      totalAttendees,
      totalVenues,
      totalStaff,
      pendingApprovals,
      todayBookings,
      activeSOSCount,
      venueStats,
    ] = await Promise.all([
      // Total attendees (registered users with attendee role)
      User.countDocuments({ role: "attendee", isActive: true }),
      // Total active venues
      Venue.countDocuments({ isActive: true }),
      // Total staff (venue_staff, security, medical)
      User.countDocuments({
        role: { $in: ["venue_staff", "security", "medical"] },
        isActive: true,
      }),
      // Pending approvals (inactive users with staff roles)
      User.countDocuments({
        role: { $in: ["venue_staff", "security", "medical"] },
        isActive: false,
      }),
      // Today's bookings
      Booking.countDocuments({
        date: { $gte: today },
      }),
      // Active SOS alerts
      SOS.countDocuments({
        status: { $in: ["active", "responding"] },
      }),
      // Venue-wise statistics
      Venue.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: "bookings",
            let: { venueId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$venueId", "$$venueId"] },
                      { $gte: ["$date", today] },
                    ],
                  },
                },
              },
            ],
            as: "todayBookings",
          },
        },
        {
          $lookup: {
            from: "sos",
            let: { venueId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$venueId", "$$venueId"] },
                      { $in: ["$status", ["active", "responding"]] },
                    ],
                  },
                },
              },
            ],
            as: "activeSOS",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { venueId: { $toString: "$_id" } },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ["$role", ["venue_staff", "security", "medical"]] },
                      { $eq: ["$isActive", true] },
                      {
                        $or: [
                          { $eq: ["$roleData.venueId", "$$venueId"] },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: "staff",
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            registeredAttendees: { $size: "$todayBookings" },
presentAttendees: { $size: { $filter: { input: "$todayBookings", as: "booking", cond: { $eq: ["$booking.status", "checked_in"] } } } },
            zones: { $size: { $ifNull: ["$zones", []] } },
            sosCount: { $size: "$activeSOS" },
            staffCount: { $size: "$staff" },
            status: {
              $cond: {
                if: { $gt: [{ $size: "$activeSOS" }, 0] },
                then: "alert",
                else: "normal",
              },
            },
          },
        },
      ]),
    ]);

    // Get role breakdown
    const roleBreakdown = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    return NextResponse.json({
      overview: {
        totalAttendees,
        totalVenues,
        totalStaff,
        pendingApprovals,
        todayBookings,
        activeSOSCount,
      },
      venueStats,
      roleBreakdown: roleBreakdown.reduce(
        (acc, { _id, count }) => ({ ...acc, [_id]: count }),
        {}
      ),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin statistics" },
      { status: 500 }
    );
  }
}
