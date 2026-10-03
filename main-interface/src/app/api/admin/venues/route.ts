import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Venue from "@/models/venue.model";
import ActivityLog from "@/models/activity-log.model";

// GET /api/admin/venues - Get all venues
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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // 'active' | 'inactive' | 'all'

    const query: Record<string, any> = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
      ];
    }
    
    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    const venues = await Venue.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ venues });
  } catch (error) {
    console.error("Get venues error:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 }
    );
  }
}

// POST /api/admin/venues - Create a new venue
export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      name,
      slug,
      description,
      city,
      state,
      address,
      coordinates,
      capacity,
      slotDuration,
      zones,
      gates,
      operatingHours,
      imageUrl,
    } = body;

    // Validate required fields
    if (!name || !slug || !city || !state) {
      return NextResponse.json(
        { error: "Name, slug, city, and state are required" },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existingVenue = await Venue.findOne({ slug });
    if (existingVenue) {
      return NextResponse.json(
        { error: "A venue with this slug already exists" },
        { status: 400 }
      );
    }

    const venue = await Venue.create({
      name,
      slug,
      description,
      location: {
        address: address || "",
        city,
        state,
        coordinates,
      },
      dailyCapacity: capacity || 10000,
      slotDuration: slotDuration || 60,
      zones: zones || [],
      gates: gates || [],
      operatingHours: operatingHours || { open: "06:00", close: "21:00" },
      images: imageUrl ? [imageUrl] : [],
      isActive: true,
    }) as any;

    // Log activity
    await ActivityLog.create({
      adminId: user._id,
      action: "create_venue",
      targetType: "venue",
      targetId: venue._id,
      targetName: venue.name,
      details: { name, city, state },
    });

    return NextResponse.json({ venue }, { status: 201 });
  } catch (error) {
    console.error("Create venue error:", error);
    return NextResponse.json(
      { error: "Failed to create venue" },
      { status: 500 }
    );
  }
}
