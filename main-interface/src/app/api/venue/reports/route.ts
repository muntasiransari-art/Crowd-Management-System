import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Report from "@/models/report.model";

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch reports for this venue
    const reports = await Report.find({ venueId: user.venueId })
      .sort({ date: -1 })
      .limit(30);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
