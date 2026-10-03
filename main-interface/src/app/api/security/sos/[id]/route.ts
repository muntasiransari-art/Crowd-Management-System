import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SOS from "@/models/sos.model";
import User from "@/models/user.model";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Await params before accessing properties
    const { id } = await params;

    const body = await request.json();
    const { action, note } = body; // action: 'acknowledge' | 'resolve'

    await connectDB();
    const user = await User.findOne({ email: userId });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const sos = await SOS.findById(id);
    if (!sos)
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });

    const updateData: any = {};
    const notes = sos.notes || [];

    if (action === "acknowledge") {
      updateData.status = "in_progress";
      updateData.assignedTo = user._id;
      updateData.acknowledgedAt = new Date();
      notes.push({
        by: user._id,
        text: "Acknowledged by security personnel",
        at: new Date(),
      });
    } else if (action === "resolve") {
      updateData.status = "resolved";
      updateData.resolvedAt = new Date();
      updateData.resolutionNotes = note;
      notes.push({
        by: user._id,
        text: `Resolved: ${note}`,
        at: new Date(),
      });
    }

    updateData.notes = notes;

    const updatedSOS = await SOS.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return NextResponse.json({ success: true, alert: updatedSOS });
  } catch (error) {
    console.error("Error updating SOS:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
