import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type SlotStatus = "available" | "active" | "full" | "closed";

export interface ISlot extends Document {
  venueId: Types.ObjectId;
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  capacity: number;
  booked: number;
  gateId: string;
  status: SlotStatus;
  createdAt: Date;
  updatedAt: Date;
}

const slotSchema = new Schema<ISlot>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue ID is required"],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: 1,
    },
    booked: {
      type: Number,
      default: 0,
      min: 0,
    },
    gateId: {
      type: String,
      required: [true, "Gate ID is required"],
    },
    status: {
      type: String,
      enum: ["available", "active", "full", "closed"],
      default: "available",
    },
  },
  {
    timestamps: true,
  },
);

// Pre-validate hook to map "active" to "available" if needed
slotSchema.pre("validate", function () {
  if ((this.status as string) === "active") {
    this.status = "available";
  }
});

// Virtual for available spots
slotSchema.virtual("available").get(function () {
  return this.capacity - this.booked;
});

// Compound index for efficient queries
slotSchema.index({ venueId: 1, date: 1, status: 1 });
slotSchema.index(
  { venueId: 1, date: 1, startTime: 1, gateId: 1 },
  { unique: true },
);

slotSchema.set("toJSON", { virtuals: true });
slotSchema.set("toObject", { virtuals: true });

// Always delete stale cached model in development to force schema re-registration
if (mongoose.models && mongoose.models.Slot) {
  delete (mongoose.models as any).Slot;
}

const Slot: Model<ISlot> = mongoose.model<ISlot>("Slot", slotSchema);

export default Slot;
