import mongoose from "mongoose";
import User from "../src/models/user.model";
import Venue from "../src/models/venue.model";
import SOS from "../src/models/sos.model";
import Report from "../src/models/report.model"; // Assuming this exists or we mock it with SOS

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const CLERK_USER_ID = args[0];

if (!CLERK_USER_ID) {
  console.error("Please provide a CLERK_USER_ID as the first argument.");
  console.error("Usage: bun run seed:security <CLERK_USER_ID>");
  process.exit(1);
}

async function seed() {
  console.log(`Connecting to MongoDB...`);
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected.");
  } catch (error) {
    console.error("Connection error:", error);
    process.exit(1);
  }

  // 1. Find User & Link to Venue
  const user = await User.findOne({ clerkId: CLERK_USER_ID });
  if (!user) {
    console.error(`User with Clerk ID ${CLERK_USER_ID} not found.`);
    process.exit(1);
  }

  const venue = await Venue.findOne({ slug: "kashi-vishwanath" });
  if (!venue) {
    console.error(
      "Venue 'Kashi Vishwanath' not found. Run seed:common first.",
    );
    process.exit(1);
  }

  // Update user role to security
  user.role = "security";
  user.roleData = {
    venueId: venue._id.toString(),
    venueName: venue.name,
    badgeNumber: "SEC-ALPHA-01",
  };
  await user.save();
  console.log(
    `Updated user ${user.firstName} to Security Staff for ${venue.name}`,
  );

  // Base location
  // Base location
  if (!venue.location.coordinates) {
    console.error("Venue coordinates missing.");
    process.exit(1);
  }
  const baseLat = venue.location.coordinates.lat;
  const baseLng = venue.location.coordinates.lng;

  // 2. Create Security Alerts (using SOS model for now as it handles alerts)
  // We can differentiate by type="security" | "lost_child" | "fire"

  // Clear only security/other types to avoid messing with medical too much if sharing db
  // But strictly we should just append or clean. Let's append but warn duplicates?
  // For seeding, it's safer to just add.

  const alerts = [
    {
      userId: user._id,
      venueId: venue._id,
      type: "security",
      location: {
        zone: "Gate 2",
        description: "Unattended bag found near lockers.",
        coordinates: { lat: baseLat + 0.0002, lng: baseLng + 0.0002 },
      },
      description: "Suspicious black backpack unattended for 20 mins.",
      priority: "high",
      status: "active",
      createdAt: new Date(),
    },
    {
      userId: user._id,
      venueId: venue._id,
      type: "lost_child",
      location: {
        zone: "Main Plaza",
        description: "Child found crying wearing blue shirt.",
        coordinates: { lat: baseLat, lng: baseLng },
      },
      description: "Boy, approx 5 years old. Name: Rohan.",
      priority: "critical",
      status: "active",
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      type: "fire",
      location: {
        zone: "Kitchen",
        description: "Small fire in waste bin.",
        coordinates: { lat: baseLat - 0.001, lng: baseLng - 0.002 },
      },
      description: "Extinguished by local staff. Requesting verification.",
      priority: "medium",
      status: "resolved",
      assignedTo: user._id,
      resolvedAt: new Date(),
      resolutionNotes: "Verified safe.",
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      type: "security",
      location: {
        zone: "Perimeter Wall",
        description: "Unauthorized entry attempt.",
        coordinates: { lat: baseLat - 0.003, lng: baseLng },
      },
      description: "Individual tried to climb North wall. Intercepted.",
      priority: "high",
      status: "resolved",
      resolvedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      resolutionNotes: "Handed over to local police.",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      type: "lost_child",
      location: {
        zone: "Laddu Counter",
        description: "Missing girl, age 7.",
        coordinates: { lat: baseLat + 0.002, lng: baseLng - 0.002 },
      },
      description:
        "Wearing red frock, name Priya. Parents waiting at helpdesk.",
      priority: "critical",
      status: "in_progress",
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      type: "security",
      location: {
        zone: "Vaikuntam Queue",
        description: "Argument between attendee groups.",
        coordinates: { lat: baseLat + 0.001, lng: baseLng + 0.001 },
      },
      description: "Heated exchange turning physical. Requesting backup.",
      priority: "medium",
      status: "active",
      createdAt: new Date(),
    },
  ];

  await SOS.insertMany(alerts);
  console.log(`Created ${alerts.length} security alerts.`);

  console.log("Security Staff seeding completed!");
  await mongoose.disconnect();
}

seed();
