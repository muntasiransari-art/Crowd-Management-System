import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ResourceType = "ambulance" | "booth";
export type ResourceStatus = "available" | "busy" | "maintenance";

export interface IMedicalResource extends Document {
  name: string;
  type: ResourceType;
  venueId: Types.ObjectId;
  status: ResourceStatus;
  location: {
    lat: number;
    lng: number;
    zone?: string;
  };
  capabilities: string[]; // e.g., ["ALS", "BLS", "First Aid"]
  assignedStaff: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const medicalResourceSchema = new Schema<IMedicalResource>(
  {
    name: {
      type: String,
      required: [true, "Resource name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["ambulance", "booth"],
      required: [true, "Resource type is required"],
      index: true,
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue ID is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["available", "busy", "maintenance"],
      default: "available",
      index: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      zone: String,
    },
    capabilities: [String],
    assignedStaff: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
medicalResourceSchema.index({ venueId: 1, type: 1 });
medicalResourceSchema.index({ venueId: 1, status: 1 });

const MedicalResource: Model<IMedicalResource> =
  mongoose.models.MedicalResource ||
  mongoose.model<IMedicalResource>("MedicalResource", medicalResourceSchema);

export default MedicalResource;
