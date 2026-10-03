import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AnnouncementType = "info" | "warning" | "emergency";

export interface IAnnouncement extends Document {
  venueId: Types.ObjectId;
  title: string;
  message: string;
  type: AnnouncementType;
  isActive: boolean;
  expiresAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue ID is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ["info", "warning", "emergency"],
      default: "info",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
announcementSchema.index({ venueId: 1, isActive: 1 });
announcementSchema.index({ expiresAt: 1 });

const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", announcementSchema);

export default Announcement;
