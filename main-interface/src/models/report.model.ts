import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ReportType = "daily" | "weekly";

export interface IReportStats {
  totalBookings: number;
  totalVisitors: number;
  peakHour: string;
  avgWaitTime: number;
  priorityRequests: number;
  sosIncidents: number;
  cancelledBookings: number;
  checkedInCount: number;
}

export interface IReport extends Document {
  venueId: Types.ObjectId;
  type: ReportType;
  date: Date; // Report date or week start
  stats: IReportStats;
  fileUrl: string; // Cloudinary PDF URL
  generatedAt: Date;
  generatedBy?: Types.ObjectId; // Staff or system
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "Venue ID is required"],
      index: true,
    },
    type: {
      type: String,
      enum: ["daily", "weekly"],
      required: [true, "Report type is required"],
    },
    date: {
      type: Date,
      required: [true, "Report date is required"],
      index: true,
    },
    stats: {
      totalBookings: { type: Number, default: 0 },
      totalVisitors: { type: Number, default: 0 },
      peakHour: { type: String, default: "" },
      avgWaitTime: { type: Number, default: 0 },
      priorityRequests: { type: Number, default: 0 },
      sosIncidents: { type: Number, default: 0 },
      cancelledBookings: { type: Number, default: 0 },
      checkedInCount: { type: Number, default: 0 },
    },
    fileUrl: {
      type: String,
      required: [true, "Report file URL is required"],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
reportSchema.index({ venueId: 1, type: 1, date: -1 });
reportSchema.index({ venueId: 1, date: 1 }, { unique: true });

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", reportSchema);

export default Report;
