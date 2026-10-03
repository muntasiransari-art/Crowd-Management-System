import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PriorityRequest from "@/models/priority-request.model";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";

// GET /api/priority-requests - Get user's priority requests
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
      return NextResponse.json({ requests: [] });
    }

    const requests = await PriorityRequest.find({ userId: user._id })
      .populate(
        "bookingId",
        "bookingCode date timeSlot gate visitors visitorDetails",
      )
      .populate("venueId", "name location.city")
      .sort({ createdAt: -1 });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching priority requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}

// POST /api/priority-requests - Create new priority request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, selectedVisitors, types, reason, documents } = body;

    if (
      !bookingId ||
      !selectedVisitors ||
      selectedVisitors.length === 0 ||
      !types ||
      types.length === 0 ||
      !reason
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await connectDB();

    // Get user
    const user = await User.findOne({ email: clerkId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get booking and verify ownership
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.userId.equals(user._id)) {
      return NextResponse.json(
        { error: "Booking does not belong to you" },
        { status: 403 },
      );
    }

    // Validate selected visitors count doesn't exceed booking visitors
    if (selectedVisitors.length > booking.visitors) {
      return NextResponse.json(
        { error: "Selected visitors count exceeds booking visitors" },
        { status: 400 },
      );
    }

    // Check if request already exists for this booking
    const existing = await PriorityRequest.findOne({
      bookingId,
      status: { $in: ["pending", "approved"] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Priority request already exists for this booking" },
        { status: 400 },
      );
    }

    // Create priority request - auto-applied, verified on ground
    const priorityRequest = await PriorityRequest.create({
      userId: user._id,
      bookingId,
      venueId: booking.venueId,
      selectedVisitors,
      types,
      reason,
      documents: documents || [],
      status: "applied", // Auto-applied, verified on-ground at visit
    });

    await priorityRequest.populate("venueId", "name");
    await priorityRequest.populate("bookingId", "bookingCode date timeSlot");

    return NextResponse.json({ request: priorityRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating priority request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 },
    );
  }
}
