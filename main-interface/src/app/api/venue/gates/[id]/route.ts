import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Gate from "@/models/gate.model";

// PUT /api/venue/gates/[id]
// Update a gate
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const updatedGate = await Gate.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedGate) {
      return NextResponse.json({ error: "Gate not found" }, { status: 404 });
    }

    return NextResponse.json({ gate: updatedGate });
  } catch (error) {
    console.error("Error updating gate:", error);
    return NextResponse.json(
      { error: "Failed to update gate" },
      { status: 500 },
    );
  }
}

// DELETE /api/venue/gates/[id]
// Delete a gate
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    const deletedGate = await Gate.findByIdAndDelete(id);

    if (!deletedGate) {
      return NextResponse.json({ error: "Gate not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Gate deleted successfully" });
  } catch (error) {
    console.error("Error deleting gate:", error);
    return NextResponse.json(
      { error: "Failed to delete gate" },
      { status: 500 },
    );
  }
}
