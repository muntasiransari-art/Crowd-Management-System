import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PersonnelStatus =
  | "on_duty"
  | "off_duty"
  | "on_break"
  | "responding";

export interface IPersonnel extends Document {
  userId: Types.ObjectId;
  venueId: Types.ObjectId;

  // Assignment
  currentZone?: string;
  currentGate?: string;

  // Status
  status: PersonnelStatus;

  // Shift info
  shift: {
    start: Date;
    end?: Date;
  };

  // Contact
  contact: {
    radioChannel?: string;
  };

  // Stats for the day
  stats: {
    incidentsHandled: number;
    sosResponded: number;
  };

  lastActive: Date;
  updatedAt: Date;
}

const personnelSchema = new Schema<IPersonnel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One active personnel record per user
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
      index: true,
    },
    currentZone: { type: String, index: true },
    currentGate: String,

    status: {
      type: String,
      enum: ["on_duty", "off_duty", "on_break", "responding"],
      default: "off_duty",
      index: true,
    },

    shift: {
      start: { type: Date, default: Date.now },
      end: Date,
    },

    contact: {
      radioChannel: String,
    },

    stats: {
      incidentsHandled: { type: Number, default: 0 },
      sosResponded: { type: Number, default: 0 },
    },

    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

// Indexes for quick lookups
personnelSchema.index({ venueId: 1, status: 1 });
personnelSchema.index({ userId: 1 });

const Personnel: Model<IPersonnel> =
  mongoose.models.Personnel ||
  mongoose.model<IPersonnel>("Personnel", personnelSchema);

export default Personnel;
