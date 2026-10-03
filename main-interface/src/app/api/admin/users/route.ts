import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import ActivityLog from "@/models/activity-log.model";

// GET /api/admin/users - Get all users with filters
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
    const role = searchParams.get("role"); // attendee | venue_staff | security | medical
    const status = searchParams.get("status"); // active | inactive | pending
    const venueId = searchParams.get("venueId");

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    } else if (status === "pending") {
      // Pending = inactive staff accounts waiting for approval
      query.isActive = false;
      query.role = { $in: ["venue_staff", "security", "medical"] };
    }

    if (venueId) {
      query["roleData.venueId"] = venueId;
    }

    const users = await User.find(query)
      .select("-__v")
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create a new user directly
export async function POST(request: Request) {
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

    const body = await request.json();
    const {
      clerkId: newUserClerkId,
      email,
      firstName,
      lastName,
      phone,
      role,
      roleData,
    } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Email, firstName, lastName, and role are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, ...(newUserClerkId ? [{ clerkId: newUserClerkId }] : [])],
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const newUser = await User.create({
      clerkId: newUserClerkId || `admin-created-${Date.now()}`,
      email,
      firstName,
      lastName,
      phone: phone || "",
      role,
      roleData: roleData || {},
      isActive: true, // Admin-created users are active by default
    });

    // Log activity
    await ActivityLog.create({
      adminId: adminUser._id,
      action: "create_user",
      targetType: "user",
      targetId: newUser._id,
      targetName: `${firstName} ${lastName}`,
      details: { role, email },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
