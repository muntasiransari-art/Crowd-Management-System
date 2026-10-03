import mongoose, { Schema, Document, Model } from "mongoose";

// Zone interface
export interface IZone {
  id: string;
  name: string;
  capacity: number;
  currentCount: number;
  status: "low" | "medium" | "high" | "critical";
}

// Gate interface
export interface IGate {
  id: string;
  name: string;
  type: "entry" | "exit" | "both";
  isActive: boolean;
}

// Operating hours interface
export interface IOperatingHours {
  open: string; // "06:00"
  close: string; // "21:00"
}

// Location interface
export interface ILocation {
  address: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Venue interface
export interface IVenue extends Document {
  name: string;
  slug: string;
  description?: string;
  location: ILocation;
  zones: IZone[];
  gates: IGate[];
  dailyCapacity: number;
  slotDuration: number; // in minutes
  operatingHours: IOperatingHours;
  images?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema
const venueSchema = new Schema<IVenue>(
  {
    name: {
      type: String,
      required: [true, "Venue name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    zones: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        capacity: { type: Number, required: true },
        currentCount: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["low", "medium", "high", "critical"],
          default: "low",
        },
      },
    ],
    gates: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ["entry", "exit", "both"],
          default: "both",
        },
        isActive: { type: Boolean, default: true },
      },
    ],
    dailyCapacity: {
      type: Number,
      required: [true, "Daily capacity is required"],
    },
    slotDuration: {
      type: Number,
      default: 60, // 60 minutes
    },
    operatingHours: {
      open: { type: String, required: true },
      close: { type: String, required: true },
    },
    images: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
venueSchema.index({ slug: 1 });
venueSchema.index({ "location.city": 1 });
venueSchema.index({ isActive: 1 });

const Venue: Model<IVenue> =
  mongoose.models.Venue || mongoose.model<IVenue>("Venue", venueSchema);

export default Venue;
