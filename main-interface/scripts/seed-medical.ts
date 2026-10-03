import mongoose from "mongoose";
import User from "../src/models/user.model";
import Venue from "../src/models/venue.model";
import MedicalResource from "../src/models/medical-resource.model";
import SOS from "../src/models/sos.model";

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
  console.error("Usage: bun run seed:medical <CLERK_USER_ID>");
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

  // Update user role to medical
  user.role = "medical";
  user.roleData = {
    venueId: venue._id.toString(),
    venueName: venue.name,
    specialization: "Paramedic",
    licenseNumber: "MED-998877",
  };
  await user.save();
  console.log(
    `Updated user ${user.firstName} to Medical Staff for ${venue.name}`,
  );

  // 2. Create Medical Resources (Ambulances/Booths)
  await MedicalResource.deleteMany({ venueId: venue._id });

  // Base location
  // Base location
  if (!venue.location.coordinates) {
    console.error("Venue coordinates missing.");
    process.exit(1);
  }
  const baseLat = venue.location.coordinates.lat;
  const baseLng = venue.location.coordinates.lng;

  const resources = [
    {
      name: "Ambulance A1",
      type: "ambulance",
      venueId: venue._id,
      status: "available",
      location: {
        lat: baseLat + 0.001,
        lng: baseLng + 0.001,
        zone: "North Gate",
      },
      capabilities: ["ALS", "Oxygen"],
      assignedStaff: [user._id],
    },
    {
      name: "Ambulance A2",
      type: "ambulance",
      venueId: venue._id,
      status: "busy", // Simulate busy
      location: {
        lat: baseLat - 0.002,
        lng: baseLng + 0.001,
        zone: "South Parking",
      },
      capabilities: ["BLS"],
      assignedStaff: [], // No staff assigned
    },
    {
      name: "Medical Booth - Main",
      type: "booth",
      venueId: venue._id,
      status: "available",
      location: {
        lat: baseLat + 0.0005,
        lng: baseLng - 0.0005,
        zone: "Queues",
      },
      capabilities: ["First Aid", "Hydration"],
      assignedStaff: [],
    },
    {
      name: "Emergency Clinic",
      type: "booth",
      venueId: venue._id,
      status: "available",
      location: {
        lat: baseLat - 0.001,
        lng: baseLng - 0.001,
        zone: "Sanctum Exit",
      },
      capabilities: ["Doctor On-Call", "ECG"],
      assignedStaff: [],
    },
    {
      name: "Ambulance A3",
      type: "ambulance",
      venueId: venue._id,
      status: "maintenance",
      location: {
        lat: baseLat + 0.002,
        lng: baseLng + 0.002,
        zone: "East Parking",
      },
      capabilities: ["BLS", "Wheelchair"],
      assignedStaff: [],
    },
    {
      name: "Medical Booth - River Side",
      type: "booth",
      venueId: venue._id,
      status: "busy",
      location: {
        lat: baseLat - 0.0015,
        lng: baseLng + 0.0015,
        zone: "Ghats",
      },
      capabilities: ["First Aid"],
      assignedStaff: [],
    },
  ];

  const createdResources = await MedicalResource.insertMany(resources);
  console.log(`Created ${createdResources.length} medical resources.`);

  // 3. Create SOS Incidents
  await SOS.deleteMany({ venueId: venue._id });

  const sosIncidents = [
    {
      userId: user._id, // Reported by self (simulation)
      venueId: venue._id,
      type: "medical",
      location: {
        zone: "Queue Complex",
        description: "Near pillar 45, elderly devotee fainted.",
        coordinates: { lat: baseLat + 0.0006, lng: baseLng - 0.0006 },
      },
      description:
        "Patient complains of chest pain and dizziness. Possible cardiac issue.",
      priority: "critical",
      status: "active",
      createdAt: new Date(), // Just now
    },
    {
      userId: user._id,
      venueId: venue._id,
      type: "medical",
      location: {
        zone: "Ganga Dwar",
        description: "Slip and fall near the steps.",
        coordinates: { lat: baseLat - 0.001, lng: baseLng + 0.002 },
      },
      description: "Minor abrasion and twisted ankle.",
      priority: "medium",
      status: "in_progress",
      assignedTo: user._id, // Assigned to logged in user
      acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 mins ago
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      type: "medical",
      location: {
        zone: "Food Court",
        description: "Dehydration symptoms.",
        coordinates: { lat: baseLat + 0.002, lng: baseLng },
      },
      description: "Provided ORS and water. Patient stable.",
      priority: "low",
      status: "resolved",
      assignedTo: user._id,
      resolvedAt: new Date(),
      resolutionNotes: "Treated on site.",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      userId: user._id,
      venueId: venue._id,
      type: "medical",
      location: {
        zone: "Main Gate",
        description: "Fainted in queue.",
        coordinates: { lat: baseLat + 0.0001, lng: baseLng - 0.0001 },
      },
      description: "Young female, heat exhaustion suspect.",
      priority: "high",
      status: "active",
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      type: "medical",
      location: {
        zone: "Shoe Stand",
        description: "Cut foot on sharp object.",
        coordinates: { lat: baseLat - 0.002, lng: baseLng },
      },
      description: "Deep laceration on right foot, bleeding controlled.",
      priority: "medium",
      status: "resolved",
      resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      resolutionNotes: "Bandaged and tetanus shot recommended.",
      createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      type: "medical",
      location: {
        zone: "VIP Lounge",
        description: "Breathing difficulty.",
        coordinates: { lat: baseLat + 0.0005, lng: baseLng + 0.0005 },
      },
      description: "Asthma attack, inhaler missing.",
      priority: "critical",
      status: "in_progress",
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  ];

  await SOS.insertMany(sosIncidents);
  console.log(`Created ${sosIncidents.length} SOS incidents.`);

  console.log("Medical Staff seeding completed!");
  await mongoose.disconnect();
}

seed();
