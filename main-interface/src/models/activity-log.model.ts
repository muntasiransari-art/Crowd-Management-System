import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: 
    | "create_venue"
    | "update_venue"
    | "delete_venue"
    | "create_user"
    | "update_user"
    | "deactivate_user"
    | "activate_user"
    | "approve_user"
    | "reject_user"
    | "update_settings";
  targetType: "venue" | "user" | "settings";
  targetId?: mongoose.Types.ObjectId;
  targetName?: string;
  details?: Record<string, any>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "create_venue",
        "update_venue",
        "delete_venue",
        "create_user",
        "update_user",
        "deactivate_user",
        "activate_user",
        "approve_user",
        "reject_user",
        "update_settings",
      ],
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["venue", "user", "settings"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      refPath: "targetType",
    },
    targetName: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
activityLogSchema.index({ createdAt: -1 });

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);

export default ActivityLog;
