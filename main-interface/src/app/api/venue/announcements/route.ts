import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Announcement from "@/models/announcement.model";
import User from "@/models/user.model";


// GET /api/venue/announcements
// Fetch active announcements for the current user's venue
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: userId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json(
        { error: "Forbidden: Only venue staff can access announcements" },
        { status: 403 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const venueId = (user.roleData as any).venueId;

    if (!venueId) {
      return NextResponse.json(
        { error: "Venue ID not found for user" },
        { status: 400 },
      );
    }

    const announcements = await Announcement.find({
      venueId,
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "firstName lastName");

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 },
    );
  }
}

// POST /api/venue/announcements
// Create a new announcement
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: userId });
    if (!user || user.role !== "venue_staff") {
      return NextResponse.json(
        { error: "Forbidden: Only venue staff can create announcements" },
        { status: 403 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const venueId = (user.roleData as any).venueId;

    const body = await request.json();
    const { title, message, type, expiresAt } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and Message are required" },
        { status: 400 },
      );
    }

    const newAnnouncement = await Announcement.create({
      venueId,
      title,
      message,
      type: type || "info",
      isActive: true,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: user._id,
    });

    return NextResponse.json(
      { announcement: newAnnouncement },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 },
    );
  }
}
