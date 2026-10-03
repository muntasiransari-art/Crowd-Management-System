import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import ActivityLog from "@/models/activity-log.model";
import Notification from "@/models/notification.model";

// POST /api/admin/users/[id]/reject - Reject a pending user
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
    const body = await request.json();
    const { reason } = body;

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isActive) {
      return NextResponse.json(
        { error: "Cannot reject an active user. Deactivate instead." },
        { status: 400 }
      );
    }

    // Log activity (keep the user record but mark as rejected in activity log)
    await ActivityLog.create({
      adminId: adminUser._id,
      action: "reject_user",
      targetType: "user",
      targetId: user._id,
      targetName: `${user.firstName} ${user.lastName}`,
      details: { role: user.role, reason },
    });

    // Send notification to user
    await Notification.create({
      userId: user._id,
      title: "Account Application Rejected",
      message: reason
        ? `Your ${user.role.replace("_", " ")} account application was rejected. Reason: ${reason}`
        : `Your ${user.role.replace("_", " ")} account application was rejected.`,
      type: "error",
    });

    // Optionally delete the user record or keep it
    // For now, we keep it but leave isActive as false
    // await User.findByIdAndDelete(id);

    return NextResponse.json({ message: "User rejected successfully" });
  } catch (error) {
    console.error("Reject user error:", error);
    return NextResponse.json(
      { error: "Failed to reject user" },
      { status: 500 }
    );
  }
}
