import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MedicalResource from "@/models/medical-resource.model";
import User from "@/models/user.model";

// PATCH /api/medical/resources/[id] - Update resource status, location, or assignment
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

    // Verify user permissions (Medical/Venue staff)
    const user = await User.findOne({ email: clerkId });
    if (
      !user ||
      (user.role !== "medical" &&
        user.role !== "venue_staff" &&
        user.role !== "security")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // specific validations can be added here
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.location) updateData.location = body.location;
    if (body.assignedStaff) updateData.assignedStaff = body.assignedStaff;

    const updatedResource = await MedicalResource.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );

    if (!updatedResource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ resource: updatedResource });
  } catch (error) {
    console.error("Error updating medical resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 },
    );
  }
}

// DELETE /api/medical/resources/[id]
export async function DELETE(
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
    const user = await User.findOne({ email: clerkId });

    // Only Admin/Venue Staff usually delete resources
    if (!user || user.role === "attendee") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deletedResource = await MedicalResource.findByIdAndDelete(id);

    if (!deletedResource) {
      return NextResponse.json(
        { error: "Resource not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting medical resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 },
    );
  }
}
