import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type NotificationType =
  | "booking"
  | "reminder"
  | "alert"
  | "crowd"
  | "sos"
  | "announcement"
  | "priority_status";

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>; // Related entity data
  isRead: boolean;
  readAt?: Date;
  sentAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      enum: [
        "booking",
        "reminder",
        "alert",
        "crowd",
        "sos",
        "announcement",
        "priority_status",
      ],
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    sentAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  },
);

// Indexes
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, sentAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
