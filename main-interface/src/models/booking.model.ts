import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { nanoid } from "nanoid";

export type BookingStatus =
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export type Gender = "male" | "female" | "other";

// Visitor interface
export interface IVisitor {
  name: string;
  age: number;
  gender: Gender;
  isMainBooker?: boolean; // True for the person making the booking
}

export interface IBooking extends Document {
  userId: Types.ObjectId;
  venueId: Types.ObjectId;
  slotId: Types.ObjectId;
  bookingCode: string;
  date: Date;
  timeSlot: {
    start: string;
    end: string;
  };
  gate: string;
  visitorDetails: IVisitor[]; // Array of visitor information
  visitors: number; // Kept for backward compatibility
  status: BookingStatus;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const visitorSchema = new Schema<IVisitor>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    isMainBooker: { type: Boolean, default: false },
  },
  { _id: false },
);

const bookingSchema = new Schema<IBooking>(
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
    slotId: {
      type: Schema.Types.ObjectId,
      ref: "Slot",
      required: [true, "Slot ID is required"],
    },
    bookingCode: {
      type: String,
      unique: true,
      default: () => nanoid(12).toUpperCase(),
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      index: true,
    },
    timeSlot: {
      start: { type: String, required: true },
      end: { type: String, required: true },
    },
    gate: {
      type: String,
      required: [true, "Gate is required"],
    },
    visitorDetails: {
      type: [visitorSchema],
      default: [],
    },
    visitors: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
    },
    status: {
      type: String,
      enum: ["confirmed", "checked_in", "completed", "cancelled", "no_show"],
      default: "confirmed",
    },
    checkedInAt: Date,
    checkedOutAt: Date,
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to sync visitors count with visitorDetails length
bookingSchema.pre("save", function () {
  if (this.visitorDetails && this.visitorDetails.length > 0) {
    this.visitors = this.visitorDetails.length;
  }
});

// Indexes - bookingCode already has unique: true, so no need for separate index
bookingSchema.index({ userId: 1, date: 1 });
bookingSchema.index({ venueId: 1, date: 1, status: 1 });

const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", bookingSchema);

export default Booking;
