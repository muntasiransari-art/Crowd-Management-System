import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MedicalResource from "@/models/medical-resource.model";
import User from "@/models/user.model";
import Venue from "@/models/venue.model";

// GET /api/medical/resources - Get all resources (optionally filtered by venue)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // specific filtering mostly for finding resources related to user's venue
    const user = await User.findOne({ email: clerkId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let filter: any = {};

    // If param venueId is passed, use it, else default to user's venue if they are staff
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get("venueId");

    const status = searchParams.get("status");
    if (status) {
      filter.status = status;
    }

    if (venueId) {
      filter.venueId = venueId;
    } else if (
      user.role === "venue_staff" ||
      user.role === "security" ||
      user.role === "medical"
    ) {
      // @ts-ignore
      const userVenueId = user.roleData?.venueId;
      if (userVenueId) {
        filter.venueId = userVenueId;
      }
    }

    const resources = await MedicalResource.find(filter)
      .populate("assignedStaff", "firstName lastName role")
      .sort({ type: 1, name: 1 });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Error fetching medical resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 },
    );
  }
}

// POST /api/medical/resources - Create a new resource
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: clerkId });

    // Only allow Medical Staff or Venue Staff/Admins to create resources
    if (!user || user.role === "attendee") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    let { name, type, venueId, location, capabilities } = body;

    // Auto-assign venueId from user profile if not provided or if user is staff
    // @ts-ignore
    if (user.roleData?.venueId) {
      // @ts-ignore
      venueId = user.roleData.venueId;
    }

    if (!name || !type || !venueId || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newResource = await MedicalResource.create({
      name,
      type,
      venueId,
      location,
      capabilities: capabilities || [],
      status: "available",
      assignedStaff: [],
    });

    return NextResponse.json({ resource: newResource }, { status: 201 });
  } catch (error) {
    console.error("Error creating medical resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 },
    );
  }
}
