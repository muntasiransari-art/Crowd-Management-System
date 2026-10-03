import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Venue from "@/models/venue.model";
import ActivityLog from "@/models/activity-log.model";

// GET /api/admin/venues/[id] - Get single venue
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const venue = await Venue.findById(id);

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    return NextResponse.json({ venue });
  } catch (error) {
    console.error("Get venue error:", error);
    return NextResponse.json(
      { error: "Failed to fetch venue" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/venues/[id] - Update venue
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    const venue = await Venue.findById(id);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Check slug uniqueness if changing
    if (body.slug && body.slug !== venue.slug) {
      const existingVenue = await Venue.findOne({ slug: body.slug });
      if (existingVenue) {
        return NextResponse.json(
          { error: "A venue with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const updatedVenue = await Venue.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );

    // Log activity
    await ActivityLog.create({
      adminId: user._id,
      action: "update_venue",
      targetType: "venue",
      targetId: venue._id,
      targetName: venue.name,
      details: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json({ venue: updatedVenue });
  } catch (error) {
    console.error("Update venue error:", error);
    return NextResponse.json(
      { error: "Failed to update venue" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/venues/[id] - Soft delete (deactivate) venue
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const venue = await Venue.findById(id);
    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Soft delete - just deactivate
    await Venue.findByIdAndUpdate(id, { isActive: false });

    // Log activity
    await ActivityLog.create({
      adminId: user._id,
      action: "delete_venue",
      targetType: "venue",
      targetId: venue._id,
      targetName: venue.name,
    });

    return NextResponse.json({ message: "Venue deactivated successfully" });
  } catch (error) {
    console.error("Delete venue error:", error);
    return NextResponse.json(
      { error: "Failed to delete venue" },
      { status: 500 }
    );
  }
}
