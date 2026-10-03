import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User, { type RoleData } from "@/models/user.model";

// GET /api/user/role - Get current user's role
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email }).select("role roleData");

    if (!user) {
      // User not in DB yet (stale session), return 404
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      role: user.role,
      roleData: user.roleData,
    });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role, firstName, lastName, phone, roleData } = body;

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json(
        { error: "Missing email or role" },
        { status: 400 },
      );
    }

    const validRoles = ["attendee", "venue_staff", "security", "medical"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Save user to MongoDB if all data is provided
    if (email && firstName && lastName && phone && roleData) {
      await connectDB();

      // Check if user already exists
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        // Update existing user
        await User.findOneAndUpdate(
          { email },
          {
            firstName,
            lastName,
            phone,
            role,
            roleData: roleData as RoleData,
          },
        );
      } else {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 },
    );
  }
}
