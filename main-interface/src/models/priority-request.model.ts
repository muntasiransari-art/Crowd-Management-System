import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PriorityType =
  | "elderly"
  | "differently_abled"
  | "pregnant"
  | "woman_with_child";

export type PriorityStatus = "applied" | "pending" | "approved" | "rejected";

// Selected visitor for priority access
export interface ISelectedVisitor {
  name: string;
  age: number;
  gender: string;
}

export interface IPriorityRequest extends Document {
  userId: Types.ObjectId;
  bookingId: Types.ObjectId;
  venueId: Types.ObjectId;
  selectedVisitors: ISelectedVisitor[]; // Which visitors need priority
  types: PriorityType[]; // Multiple types allowed
  reason: string;
  documents: string[]; // Cloudinary URLs
  status: PriorityStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const selectedVisitorSchema = new Schema<ISelectedVisitor>(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
  },
  { _id: false },
);

const priorityRequestSchema = new Schema<IPriorityRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking ID is required"],
      index: true,
    },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue ID is required"],
      index: true,
    },
    selectedVisitors: {
      type: [selectedVisitorSchema],
      required: true,
      validate: {
        validator: (v: ISelectedVisitor[]) => v.length >= 1,
        message: "At least one visitor must be selected",
      },
    },
    types: {
      type: [String],
      enum: ["elderly", "differently_abled", "pregnant", "woman_with_child"],
      required: [true, "At least one priority type is required"],
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
    },
    documents: [String],
    status: {
      type: String,
      enum: ["applied", "pending", "approved", "rejected"],
      default: "applied",
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    reviewNotes: String,
    validUntil: Date,
  },
  {
    timestamps: true,
  },
);

// Indexes
priorityRequestSchema.index({ userId: 1, status: 1 });
priorityRequestSchema.index({ venueId: 1, status: 1 });
priorityRequestSchema.index({ bookingId: 1 });

const PriorityRequest: Model<IPriorityRequest> =
  mongoose.models.PriorityRequest ||
  mongoose.model<IPriorityRequest>("PriorityRequest", priorityRequestSchema);

export default PriorityRequest;
