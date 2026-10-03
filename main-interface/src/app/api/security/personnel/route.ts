import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Personnel from "@/models/personnel.model";
import User from "@/models/user.model";

// GET /api/security/personnel?venueId=...
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");

    if (!venueId) {
      return NextResponse.json(
        { error: "Venue ID is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Fetch all security users for this venue
    // Note: We need to aggregate User and Personnel data
    // 1. Find all users with role 'security' and matching venueId in roleData
    const users = await User.find({
      role: "security",
      "roleData.venueId": venueId,
    }).select("firstName lastName roleData email");

    // 2. Fetch live status from Personnel model
    const personnelRecords = await Personnel.find({
      venueId,
    });

    // 3. Merge data
    const roster = users.map((user) => {
      const liveData = personnelRecords.find(
        (p) => p.userId.toString() === user._id.toString(),
      );

      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        badgeNumber: (user.roleData as any)?.badgeNumber,
        unitType: (user.roleData as any)?.unitType || "crowd_control",
        status: liveData?.status || "off_duty",
        currentZone: liveData?.currentZone,
        lastActive: liveData?.lastActive,
      };
    });

    return NextResponse.json({ personnel: roster });
  } catch (error) {
    console.error("Error fetching personnel:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST /api/security/personnel - Update status
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { status, venueId, currentZone } = body;

    await connectDB();

    // Find internal user ID
    const user = await User.findOne({ email: userId });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Upsert personnel record
    const personnel = await Personnel.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          venueId,
          status,
          currentZone,
          lastActive: new Date(),
          "shift.end": status === "off_duty" ? new Date() : undefined,
        },
        $setOnInsert: {
          "shift.start": new Date(),
          stats: { incidentsHandled: 0, sosResponded: 0 },
        },
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true, personnel });
  } catch (error) {
    console.error("Error updating personnel status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
