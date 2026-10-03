import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SOS from "@/models/sos.model";
import User from "@/models/user.model";

// GET /api/medical/sos/[id] - Get specific SOS details
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const sos = await SOS.findById(id)
      .populate("userId", "firstName lastName phone email roleData")
      .populate("assignedTo", "firstName lastName phone")
      .populate("assignedResources")
      .populate("notes.by", "firstName lastName");

    if (!sos) {
      return NextResponse.json({ error: "SOS not found" }, { status: 404 });
    }

    return NextResponse.json({ sos });
  } catch (error) {
    console.error("Error fetching SOS details:", error);
    return NextResponse.json(
      { error: "Failed to fetch details" },
      { status: 500 },
    );
  }
}

// PATCH /api/medical/sos/[id] - Update status, assign staff, add notes
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email; // using email as ID for NextAuth compatibility
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await connectDB();
    const user = await User.findOne({ email: clerkId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (body.status) updateData.status = body.status;
    if (body.assignedTo) updateData.assignedTo = body.assignedTo;

    // Handle resource assignment
    if (body.assignedResources) {
      updateData.assignedResources = body.assignedResources;

      // OPTIONAL: Auto-update status of assigned resources to 'busy'
      // This would ensure they don't get double booked easily
      /* 
       await MedicalResource.updateMany(
         { _id: { $in: body.assignedResources } },
         { $set: { status: 'busy' } }
       );
       */
    }

    if (body.priority) updateData.priority = body.priority;
    if (body.resolutionNotes) updateData.resolutionNotes = body.resolutionNotes;

    if (body.status === "resolved" && !body.resolutionNotes) {
      return NextResponse.json(
        { error: "Resolution notes required" },
        { status: 400 },
      );
    }
    if (body.status === "resolved") {
      updateData.resolvedAt = new Date();
    }
    if (body.status === "acknowledged" || body.status === "in_progress") {
      updateData.acknowledgedAt = new Date();
    }

    // Add note
    if (body.note) {
      updateData.$push = {
        notes: {
          by: user._id,
          text: body.note,
          at: new Date(),
        },
      };
    }

    const updatedSOS = await SOS.findByIdAndUpdate(
      id,
      updateData.notes ? { $set: updateData, ...updateData.$push } : updateData,
      { new: true },
    );

    if (!updatedSOS) {
      return NextResponse.json({ error: "SOS not found" }, { status: 404 });
    }

    return NextResponse.json({ sos: updatedSOS });
  } catch (error) {
    console.error("Error updating SOS:", error);
    return NextResponse.json(
      { error: "Failed to update SOS" },
      { status: 500 },
    );
  }
}
