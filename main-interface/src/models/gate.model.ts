import mongoose, { Document, Schema } from "mongoose";

export interface IGate extends Document {
  name: string;
  venueId: mongoose.Types.ObjectId;
  type: "entry" | "exit" | "both";
  status: "active" | "paused" | "closed";
  currentFlow: number;
  location?: string;
  qrCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const gateSchema = new Schema<IGate>(
  {
    name: {
      type: String,
      required: [true, "Gate name is required"],
      trim: true,
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue ID is required"],
    },
    type: {
      type: String,
      enum: ["entry", "exit", "both"],
      required: [true, "Gate type is required"],
    },
    status: {
      type: String,
      enum: ["active", "paused", "closed"],
      default: "active",
    },
    currentFlow: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      trim: true,
    },
    qrCode: {
      type: String, // Value for the QR code
    },
  },
  {
    timestamps: true,
  },
);

// Prevent model recompilation check
const Gate = mongoose.models.Gate || mongoose.model<IGate>("Gate", gateSchema);

export default Gate;
