import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Venue from "@/models/venue.model";

// PATCH /api/hardware/zones - Update a zone count via external IoT/Hardware (like YOLOv8)
export async function PATCH(request: Request) {
  try {
    const { zoneId, currentCount, apiKey } = await request.json();

    // Basic API Key protection for hardware
    // In production, move this to an environment variable like process.env.HARDWARE_API_KEY
    const EXPECTED_API_KEY = process.env.HARDWARE_API_KEY || "yolo-secret-key-123";

    if (apiKey !== EXPECTED_API_KEY) {
      return NextResponse.json({ error: "Unauthorized hardware" }, { status: 401 });
    }

    if (!zoneId || currentCount === undefined) {
      return NextResponse.json(
        { error: "Zone ID and currentCount are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Since a hardware camera doesn't belong to a user, it just updates the global venue
    const venue = await Venue.findOne({ isActive: true });

    if (!venue) {
      return NextResponse.json({ error: "Active venue not found" }, { status: 404 });
    }

    // Find and update zone
    const zoneIndex = venue.zones.findIndex(
      (z: { id: string }) => z.id === zoneId
    );
    
    if (zoneIndex === -1) {
      return NextResponse.json({ error: "Zone not found in active venue" }, { status: 404 });
    }

    // Update the headcount from the YOLOv8 script
    venue.zones[zoneIndex].currentCount = parseInt(currentCount);

    await venue.save();

    return NextResponse.json({
      success: true,
      zoneName: venue.zones[zoneIndex].name,
      newCount: venue.zones[zoneIndex].currentCount,
      message: "Hardware count updated successfully",
    });
  } catch (error) {
    console.error("Error processing hardware update:", error);
    return NextResponse.json(
      { error: "Failed to update zone from hardware" },
      { status: 500 }
    );
  }
}
