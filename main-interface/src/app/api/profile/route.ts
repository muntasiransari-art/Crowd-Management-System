import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Booking from "@/models/booking.model";
import PriorityRequest from "@/models/priority-request.model";

// GET /api/profile - Get user profile with stats
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

    // Get booking stats
    const totalBookings = await Booking.countDocuments({ userId: user._id });
    const upcomingBookings = await Booking.countDocuments({
      userId: user._id,
      date: { $gte: new Date() },
      status: { $in: ["confirmed", "checked_in"] },
    });
    const completedBookings = await Booking.countDocuments({
      userId: user._id,
      status: "completed",
    });

    // Get priority requests
    const priorityRequests = await PriorityRequest.find({
      userId: user._id,
      status: "applied",
    })
      .populate("venueId", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // Extract emergency contact from roleData
    const roleData = user.roleData as {
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      emergencyContactRelation?: string;
    };

    return NextResponse.json({
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        emergencyContact: {
          name: roleData?.emergencyContactName || "",
          phone: roleData?.emergencyContactPhone || "",
          relation: roleData?.emergencyContactRelation || "",
        },
      },
      stats: {
        totalBookings,
        upcomingBookings,
        completedBookings,
      },
      priorityRequests: priorityRequests.map((pr) => ({
        _id: pr._id,
        types: pr.types,
        status: pr.status,
        venueId: pr.venueId,
        selectedVisitors: pr.selectedVisitors,
        createdAt: pr.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

// PATCH /api/profile - Update user profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
    } = body;

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update roleData with emergency contact
    user.roleData = {
      ...user.roleData,
      emergencyContactName:
        emergencyContactName ||
        (user.roleData as { emergencyContactName?: string })
          .emergencyContactName,
      emergencyContactPhone:
        emergencyContactPhone ||
        (user.roleData as { emergencyContactPhone?: string })
          .emergencyContactPhone,
      emergencyContactRelation:
        emergencyContactRelation ||
        (user.roleData as { emergencyContactRelation?: string })
          .emergencyContactRelation,
    };

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
