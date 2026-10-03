import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import ActivityLog from "@/models/activity-log.model";

// GET /api/admin/users/[id] - Get single user
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

    const adminUser = await User.findOne({ email: clerkId });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const user = await User.findById(id).select("-__v");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
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

    const adminUser = await User.findOne({ email: clerkId });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent changing admin's own role
    if (user.clerkId === clerkId && body.role && body.role !== "admin") {
      return NextResponse.json(
        { error: "Cannot change your own admin role" },
        { status: 400 }
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).select("-__v");

    // Log activity
    await ActivityLog.create({
      adminId: adminUser._id,
      action: "update_user",
      targetType: "user",
      targetId: user._id,
      targetName: `${user.firstName} ${user.lastName}`,
      details: { updatedFields: Object.keys(body) },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Deactivate user
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

    const adminUser = await User.findOne({ email: clerkId });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deactivating yourself
    if (user.clerkId === clerkId) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 }
      );
    }

    await User.findByIdAndUpdate(id, { isActive: false });

    // Log activity
    await ActivityLog.create({
      adminId: adminUser._id,
      action: "deactivate_user",
      targetType: "user",
      targetId: user._id,
      targetName: `${user.firstName} ${user.lastName}`,
    });

    return NextResponse.json({ message: "User deactivated successfully" });
  } catch (error) {
    console.error("Deactivate user error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate user" },
      { status: 500 }
    );
  }
}
