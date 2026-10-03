import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SOS from "@/models/sos.model";
import User from "@/models/user.model";

// GET /api/medical/sos - Get active medical SOS alerts
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: clerkId });

    if (
      !user ||
      (user.role !== "medical" &&
        user.role !== "venue_staff" &&
        user.role !== "security")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const venueId = searchParams.get("venueId");

    let filter: any = { type: "medical" };

    if (status) {
      filter.status = status;
    } else {
      // Default to active/in_progress if no status specified
      filter.status = { $in: ["active", "in_progress", "acknowledged"] };
    }

    if (venueId) {
      filter.venueId = venueId;
    } else {
      // @ts-ignore
      const userVenueId = user.roleData?.venueId;
      if (userVenueId) {
        filter.venueId = userVenueId;
      }
    }

    const sosAlerts = await SOS.find(filter)
      .populate("userId", "firstName lastName phone roleData")
      .populate("assignedTo", "firstName lastName")
      .sort({ createdAt: -1 });

    return NextResponse.json({ alerts: sosAlerts });
  } catch (error) {
    console.error("Error fetching medical SOS:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 },
    );
  }
}
