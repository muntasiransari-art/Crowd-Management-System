import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Venue from "@/models/venue.model";
import { v4 as uuidv4 } from "uuid";

// GET /api/venue/zones - Get all zones for the venue
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user || (user.role !== "venue_staff" && user.role !== "security")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const roleData = user.roleData as { venueId?: string };
    const venueId = roleData?.venueId;

    const venue = venueId
      ? await Venue.findById(venueId)
      : await Venue.findOne({ isActive: true });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Calculate dynamic status for each zone - convert to plain objects
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
        let status: "low" | "medium" | "high" | "critical" = "low";
        if (percentage >= 90) status = "critical";
        else if (percentage >= 70) status = "high";
        else if (percentage >= 50) status = "medium";

        // Return plain object, not Mongoose subdocument
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

    return NextResponse.json({ zones, venueId: venue._id });
  } catch (error) {
    console.error("Error fetching zones:", error);
    return NextResponse.json(
      { error: "Failed to fetch zones" },
      { status: 500 },
    );
  }
}

// POST /api/venue/zones - Create a new zone
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, capacity } = await request.json();

    if (!name || !capacity) {
      return NextResponse.json(
        { error: "Name and capacity are required" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const roleData = user.roleData as { venueId?: string };
    const venueId = roleData?.venueId;

    const venue = venueId
      ? await Venue.findById(venueId)
      : await Venue.findOne({ isActive: true });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Create new zone
    const newZone = {
      id: uuidv4(),
      name: name.trim(),
      capacity: parseInt(capacity),
      currentCount: 0,
      status: "low",
    };

    venue.zones.push(newZone);
    await venue.save();

    return NextResponse.json({
      zone: newZone,
      message: "Zone created successfully",
    });
  } catch (error) {
    console.error("Error creating zone:", error);
    return NextResponse.json(
      { error: "Failed to create zone" },
      { status: 500 },
    );
  }
}

// PATCH /api/venue/zones - Update a zone
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { zoneId, name, capacity, currentCount } = await request.json();

    if (!zoneId) {
      return NextResponse.json(
        { error: "Zone ID is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const roleData = user.roleData as { venueId?: string };
    const venueId = roleData?.venueId;

    const venue = venueId
      ? await Venue.findById(venueId)
      : await Venue.findOne({ isActive: true });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Find and update zone
    const zoneIndex = venue.zones.findIndex(
      (z: { id: string }) => z.id === zoneId,
    );
    if (zoneIndex === -1) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    if (name !== undefined) venue.zones[zoneIndex].name = name.trim();
    if (capacity !== undefined)
      venue.zones[zoneIndex].capacity = parseInt(capacity);
    if (currentCount !== undefined)
      venue.zones[zoneIndex].currentCount = parseInt(currentCount);

    await venue.save();

    return NextResponse.json({
      zone: venue.zones[zoneIndex],
      message: "Zone updated successfully",
    });
  } catch (error) {
    console.error("Error updating zone:", error);
    return NextResponse.json(
      { error: "Failed to update zone" },
      { status: 500 },
    );
  }
}

// DELETE /api/venue/zones - Delete a zone
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");

    if (!zoneId) {
      return NextResponse.json(
        { error: "Zone ID is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: clerkId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const roleData = user.roleData as { venueId?: string };
    const venueId = roleData?.venueId;

    const venue = venueId
      ? await Venue.findById(venueId)
      : await Venue.findOne({ isActive: true });

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Remove zone
    const initialLength = venue.zones.length;
    venue.zones = venue.zones.filter((z: { id: string }) => z.id !== zoneId);

    if (venue.zones.length === initialLength) {
      return NextResponse.json({ error: "Zone not found" }, { status: 404 });
    }

    await venue.save();

    return NextResponse.json({ message: "Zone deleted successfully" });
  } catch (error) {
    console.error("Error deleting zone:", error);
    return NextResponse.json(
      { error: "Failed to delete zone" },
      { status: 500 },
    );
  }
}
