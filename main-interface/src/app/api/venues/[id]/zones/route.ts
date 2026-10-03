import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Venue from "@/models/venue.model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/venues/[id]/zones - Get all zones with live counts
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    await connectDB();

    const venue = await Venue.findById(id).select("name zones");

    if (!venue) {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }

    // Calculate density and enhance zone data
    const zones = venue.zones.map(
      (zone: {
        id: string;
        name: string;
        capacity: number;
        currentCount: number;
        status: string;
      }) => {
        const density = Math.round((zone.currentCount / zone.capacity) * 100);

        // Auto-calculate status based on density
        let status: string;
        if (density < 50) status = "low";
        else if (density < 75) status = "medium";
        else if (density < 90) status = "high";
        else status = "critical";

        return {
          id: zone.id,
          name: zone.name,
          capacity: zone.capacity,
          currentCount: zone.currentCount,
          density,
          status,
        };
      },
    );

    // Calculate totals
    const totalCapacity = zones.reduce(
      (sum: number, z: { capacity: number }) => sum + z.capacity,
      0,
    );
    const totalCount = zones.reduce(
      (sum: number, z: { currentCount: number }) => sum + z.currentCount,
      0,
    );
    const overallDensity = Math.round((totalCount / totalCapacity) * 100);

    return NextResponse.json({
      venue: venue.name,
      zones,
      summary: {
        totalCapacity,
        totalCount,
        overallDensity,
        zoneCount: zones.length,
      },
    });
  } catch (error) {
    console.error("Error fetching zones:", error);
    return NextResponse.json(
      { error: "Failed to fetch zones" },
      { status: 500 },
    );
  }
}
