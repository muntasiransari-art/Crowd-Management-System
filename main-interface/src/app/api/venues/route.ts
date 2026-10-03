import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Venue from "@/models/venue.model";

// GET /api/venues - List all active venues
export async function GET() {
  try {
    await connectDB();

    const venues = await Venue.find({ isActive: true })
      .select("name slug location.city location.state images dailyCapacity")
      .sort({ name: 1 });

    return NextResponse.json({ venues });
  } catch (error) {
    console.error("Error fetching venues:", error);
    return NextResponse.json(
      { error: "Failed to fetch venues" },
      { status: 500 },
    );
  }
}
