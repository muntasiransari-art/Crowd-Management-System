import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import ActivityLog from "@/models/activity-log.model";
import Notification from "@/models/notification.model";

// POST /api/admin/users/[id]/approve - Approve a pending user
export async function POST(
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

    if (user.isActive) {
      return NextResponse.json(
        { error: "User is already approved" },
        { status: 400 }
      );
    }

    // Approve user
    await User.findByIdAndUpdate(id, { isActive: true });

    // Log activity
    await ActivityLog.create({
      adminId: adminUser._id,
      action: "approve_user",
      targetType: "user",
      targetId: user._id,
      targetName: `${user.firstName} ${user.lastName}`,
      details: { role: user.role },
    });

    // Send notification to user
    await Notification.create({
      userId: user._id,
      title: "Account Approved",
      message: `Your ${user.role.replace("_", " ")} account has been approved. You can now access your dashboard.`,
      type: "success",
    });

    return NextResponse.json({ message: "User approved successfully" });
  } catch (error) {
    console.error("Approve user error:", error);
    return NextResponse.json(
      { error: "Failed to approve user" },
      { status: 500 }
    );
  }
}
