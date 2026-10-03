import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

// Define schema matching the model
const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      coordinates: { lat: Number, lng: Number },
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
    dailyCapacity: { type: Number, required: true },
    slotDuration: { type: Number, default: 60 },
    operatingHours: {
      open: { type: String, required: true },
      close: { type: String, required: true },
    },
    images: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Venue data to seed
const venues = [
  {
    name: "Tirupati Balaji Venue",
    slug: "tirupati",
    description:
      "One of the most visited religious sites in the world, dedicated to Lord Venkateswara.",
    location: {
      address: "S Mada Street, Tirumala",
      city: "Tirumala",
      state: "Andhra Pradesh",
      coordinates: { lat: 13.6833, lng: 79.3475 },
    },
    zones: [
      {
        id: "zone-1",
        name: "Main Entrance",
        capacity: 500,
        currentCount: 0,
        status: "low",
      },
      {
        id: "zone-2",
        name: "Inner Sanctum",
        capacity: 200,
        currentCount: 0,
        status: "low",
      },
      {
        id: "zone-3",
        name: "Queue Area A",
        capacity: 400,
        currentCount: 0,
        status: "low",
      },
    ],
    gates: [
      { id: "gate-1", name: "Gate 1 (VIP)", type: "entry", isActive: true },
      { id: "gate-2", name: "Gate 2 (General)", type: "entry", isActive: true },
      { id: "gate-3", name: "Gate 3 (General)", type: "entry", isActive: true },
    ],
    dailyCapacity: 10000,
    slotDuration: 60,
    operatingHours: { open: "06:00", close: "21:00" },
    isActive: true,
  },
  {
    name: "Vaishno Devi Venue",
    slug: "vaishno-devi",
    description: "A major Hindu venue dedicated to Goddess Vaishno Devi.",
    location: {
      address: "Trikuta Mountains",
      city: "Katra",
      state: "Jammu & Kashmir",
      coordinates: { lat: 33.0314, lng: 74.9478 },
    },
    zones: [
      {
        id: "zone-1",
        name: "Base Camp",
        capacity: 800,
        currentCount: 0,
        status: "low",
      },
      {
        id: "zone-2",
        name: "Bhawan Area",
        capacity: 300,
        currentCount: 0,
        status: "low",
      },
    ],
    gates: [
      { id: "gate-1", name: "Main Gate", type: "both", isActive: true },
      { id: "gate-2", name: "VIP Gate", type: "entry", isActive: true },
    ],
    dailyCapacity: 8000,
    slotDuration: 60,
    operatingHours: { open: "05:00", close: "22:00" },
    isActive: true,
  },
  {
    name: "Somnath Venue",
    slug: "somnath",
    description: "One of the twelve Jyotirlinga shrines of Lord Shiva.",
    location: {
      address: "Somnath Mandir Road",
      city: "Veraval",
      state: "Gujarat",
      coordinates: { lat: 20.888, lng: 70.4012 },
    },
    zones: [
      {
        id: "zone-1",
        name: "Main Venue",
        capacity: 400,
        currentCount: 0,
        status: "low",
      },
      {
        id: "zone-2",
        name: "Courtyard",
        capacity: 600,
        currentCount: 0,
        status: "low",
      },
    ],
    gates: [
      { id: "gate-1", name: "East Gate", type: "entry", isActive: true },
      { id: "gate-2", name: "West Gate", type: "both", isActive: true },
    ],
    dailyCapacity: 6000,
    slotDuration: 60,
    operatingHours: { open: "06:00", close: "21:00" },
    isActive: true,
  },
  {
    name: "Kashi Vishwanath Venue",
    slug: "kashi-vishwanath",
    description:
      "One of the most famous Hindu venues dedicated to Lord Shiva.",
    location: {
      address: "Lahori Tola, Varanasi",
      city: "Varanasi",
      state: "Uttar Pradesh",
      coordinates: { lat: 25.3109, lng: 83.0107 },
    },
    zones: [
      {
        id: "zone-1",
        name: "Main Corridor",
        capacity: 500,
        currentCount: 0,
        status: "low",
      },
      {
        id: "zone-2",
        name: "Garbhagriha",
        capacity: 100,
        currentCount: 0,
        status: "low",
      },
    ],
    gates: [
      { id: "gate-1", name: "Gate 1", type: "entry", isActive: true },
      { id: "gate-2", name: "Gate 2", type: "entry", isActive: true },
    ],
    dailyCapacity: 7000,
    slotDuration: 60,
    operatingHours: { open: "04:00", close: "23:00" },
    isActive: true,
  },
];

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected to MongoDB");

    const Venue = mongoose.model("Venue", venueSchema);

    // Clear existing venues
    await Venue.deleteMany({});
    console.log("Cleared existing venues");

    // Insert new venues
    const result = await Venue.insertMany(venues);
    console.log(`Inserted ${result.length} venues:`);

    for (const venue of result) {
      console.log(`  - ${venue.name} (${venue.slug})`);
    }

    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seed();
