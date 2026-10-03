import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Gate from "@/models/gate.model";

import User from "@/models/user.model";

// GET /api/venue/gates
// Fetch all gates for the current user's venue
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: userId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json(
        { error: "Forbidden: Only venue staff can access gates" },
        { status: 403 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const venueId = (user.roleData as any).venueId;

    if (!venueId) {
      return NextResponse.json(
        { error: "Venue ID not found for user" },
        { status: 400 },
      );
    }

    const gates = await Gate.find({ venueId }).sort({ name: 1 });

    return NextResponse.json({ gates });
  } catch (error) {
    console.error("Error fetching gates:", error);
    return NextResponse.json(
      { error: "Failed to fetch gates" },
      { status: 500 },
    );
  }
}

// POST /api/venue/gates
// Create a new gate for the current user's venue
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: userId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json(
        { error: "Forbidden: Only venue staff can create gates" },
        { status: 403 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const venueId = (user.roleData as any).venueId;

    if (!venueId) {
      return NextResponse.json(
        { error: "Venue ID not found for user" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { name, type, location } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and Type are required" },
        { status: 400 },
      );
    }

    const newGate = await Gate.create({
      name,
      venueId,
      type,
      location,
      status: "active",
      currentFlow: 0,
    });

    return NextResponse.json({ gate: newGate }, { status: 201 });
  } catch (error) {
    console.error("Error creating gate:", error);
    return NextResponse.json(
      { error: "Failed to create gate" },
      { status: 500 },
    );
  }
}
