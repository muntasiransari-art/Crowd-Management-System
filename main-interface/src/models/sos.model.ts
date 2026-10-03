import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type SOSType = "medical" | "security" | "lost_child" | "fire" | "other";
export type SOSPriority = "low" | "medium" | "high" | "critical";
export type SOSStatus = "active" | "acknowledged" | "in_progress" | "resolved";

export interface ISOSNote {
  by: Types.ObjectId;
  text: string;
  at: Date;
}

export interface ISOSLocation {
  zone?: string;
  description?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ISOS extends Document {
  userId: Types.ObjectId;
  venueId: Types.ObjectId;
  type: SOSType;
  location: ISOSLocation;
  description: string;
  priority: SOSPriority;
  status: SOSStatus;
  assignedTo?: Types.ObjectId;
  assignedResources?: Types.ObjectId[];
  acknowledgedAt?: Date;
  responseTime?: number; // minutes to first response
  resolvedAt?: Date;
  resolutionNotes?: string;
  notes: ISOSNote[];
  createdAt: Date;
  updatedAt: Date;
}

const sosSchema = new Schema<ISOS>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue ID is required"],
      index: true,
    },
    type: {
      type: String,
      enum: ["medical", "security", "lost_child", "fire", "other"],
      required: [true, "SOS type is required"],
    },
    location: {
      zone: String,
      description: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "high",
    },
    status: {
      type: String,
      enum: ["active", "acknowledged", "in_progress", "resolved"],
      default: "active",
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    assignedResources: [
      {
        type: Schema.Types.ObjectId,
        ref: "MedicalResource",
      },
    ],
    acknowledgedAt: Date,
    responseTime: Number,
    resolvedAt: Date,
    resolutionNotes: String,
    notes: [
      {
        by: { type: Schema.Types.ObjectId, ref: "User", required: true },
        text: { type: String, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
sosSchema.index({ venueId: 1, status: 1 });
sosSchema.index({ status: 1, priority: 1 });
sosSchema.index({ createdAt: -1 });

// Force model recompilation in dev to pick up schema changes
if (process.env.NODE_ENV === "development") {
  delete mongoose.models.SOS;
}

const SOS: Model<ISOS> =
  mongoose.models.SOS || mongoose.model<ISOS>("SOS", sosSchema);

export default SOS;
