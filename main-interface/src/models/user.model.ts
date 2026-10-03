import mongoose, { Schema, Document, Model } from "mongoose";

// Role types
export type UserRole = "attendee" | "venue_staff" | "security" | "medical" | "admin";

// Role-specific data interfaces
export interface AttendeeData {
  emergencyContactName: string;
  emergencyContactPhone: string;
  dateOfBirth?: Date;
  specialNeeds?: string;
}

export interface VenueStaffData {
  employeeId: string;
  venueId: string;
  venueName: string;
  department: string;
}

export interface SecurityData {
  badgeNumber: string;
  venueId: string; // Assigned venue
  venueName: string; // Cached venue name
  assignedZone?: string;
  unitType?: "police" | "crowd_control" | "barricade" | "response_team";
}

export interface MedicalData {
  licenseNumber: string;
  specialization: string;
  venueId: string;
  venueName: string;
  station?: string;
}

export interface AdminData {
  department: string;
  accessLevel: "super_admin" | "admin";
}

export type RoleData =
  | AttendeeData
  | VenueStaffData
  | SecurityData
  | MedicalData
  | AdminData;

// Main User interface
export interface IUser extends Document {
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  roleData: RoleData;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema definition
const userSchema = new Schema<IUser>(
  {
  password: {
      type: String,
      required: [true, "Password is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: {
        values: ["attendee", "venue_staff", "security", "medical", "admin"],
        message: "{VALUE} is not a valid role",
      },
      required: [true, "Role is required"],
      index: true,
    },
    roleData: {
      type: Schema.Types.Mixed,
      required: [true, "Role-specific data is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Model export (handle hot reloading in development)
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
