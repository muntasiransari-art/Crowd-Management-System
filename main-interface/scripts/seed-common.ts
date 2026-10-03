import mongoose from "mongoose";

// Load environment variables from .env.local

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
  process.exit(1);
}

import Venue from "../src/models/venue.model";

async function seed() {
  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected.");
  } catch (error) {
    console.error("Connection error:", error);
    process.exit(1);
  }

  const venues = [
    {
      name: "Kashi Vishwanath",
      slug: "kashi-vishwanath",
      description:
        "One of the most famous Hindu venues dedicated to Lord Shiva.",
      location: {
        address: "Varanasi",
        city: "Varanasi",
        state: "Uttar Pradesh",
        coordinates: {
          lat: 25.3109,
          lng: 83.0107,
        },
      },
      zones: [
        {
          id: "gate-1",
          name: "Main Entrance (Gate 1)",
          capacity: 500,
          currentCount: 120,
          status: "low",
        },
        {
          id: "gate-2",
          name: "Ganga Dwar (Gate 2)",
          capacity: 400,
          currentCount: 350,
          status: "high",
        },
        {
          id: "sanctum",
          name: "Inner Sanctum",
          capacity: 100,
          currentCount: 95,
          status: "critical",
        },
        {
          id: "queue-complex",
          name: "Queue Complex",
          capacity: 1000,
          currentCount: 400,
          status: "medium",
        },
      ],
      gates: [
        { id: "g1", name: "Main Gate", type: "entry", isActive: true },
        { id: "g2", name: "River Gate", type: "exit", isActive: true },
      ],
      dailyCapacity: 50000,
      operatingHours: { open: "04:00", close: "23:00" },
    },
    {
      name: "Tirupati Balaji",
      slug: "tirupati-balaji",
      description:
        "A landmark Vaishnavite venue dedicated to Lord Venkateswara.",
      location: {
        address: "Tirumala",
        city: "Tirupati",
        state: "Andhra Pradesh",
        coordinates: {
          lat: 13.6833,
          lng: 79.3479,
        },
      },
      zones: [
        {
          id: "mk-1",
          name: "Maha Dwaram",
          capacity: 800,
          currentCount: 600,
          status: "high",
        },
        {
          id: "v-q",
          name: "Vaikuntam Queue",
          capacity: 5000,
          currentCount: 2500,
          status: "medium",
        },
        {
          id: "laddu",
          name: "Laddu Prasadam",
          capacity: 1000,
          currentCount: 200,
          status: "low",
        },
      ],
      gates: [
        {
          id: "entry-1",
          name: "Vaikuntam Entry",
          type: "entry",
          isActive: true,
        },
        { id: "exit-1", name: "Main Exit", type: "exit", isActive: true },
      ],
      dailyCapacity: 70000,
      operatingHours: { open: "03:00", close: "23:59" },
    },
    {
      name: "Vaishno Devi",
      slug: "vaishno-devi",
      description: "A holy cave venue dedicated to Goddess Vaishno Devi.",
      location: {
        address: "Katra",
        city: "Reasi",
        state: "Jammu and Kashmir",
        coordinates: {
          lat: 33.0308,
          lng: 74.949,
        },
      },
      zones: [
        {
          id: "bhawan",
          name: "Bhawan",
          capacity: 2000,
          currentCount: 1500,
          status: "high",
        },
        {
          id: "ardhkuwari",
          name: "Ardhkuwari Cave",
          capacity: 500,
          currentCount: 450,
          status: "critical",
        },
        {
          id: "ban-ganga",
          name: "Ban Ganga Checkpost",
          capacity: 1000,
          currentCount: 300,
          status: "low",
        },
      ],
      gates: [
        {
          id: "g1",
          name: "Yatra Parchi Counter",
          type: "entry",
          isActive: true,
        },
        { id: "g2", name: "Exit Route", type: "exit", isActive: true },
      ],
      dailyCapacity: 40000,
      operatingHours: { open: "00:00", close: "23:59" },
    },
    {
      name: "Golden Venue",
      slug: "golden-venue",
      description: "Harmandir Sahib, the holiest Gurdwara of Sikhism.",
      location: {
        address: "Amritsar",
        city: "Amritsar",
        state: "Punjab",
        coordinates: {
          lat: 31.62,
          lng: 74.8765,
        },
      },
      zones: [
        {
          id: "sanctum",
          name: "Main Sanctum",
          capacity: 300,
          currentCount: 280,
          status: "critical",
        },
        {
          id: "langar",
          name: "Langar Hall",
          capacity: 5000,
          currentCount: 3500,
          status: "medium",
        },
        {
          id: "parikrama",
          name: "Parikrama",
          capacity: 10000,
          currentCount: 2000,
          status: "low",
        },
      ],
      gates: [
        { id: "main", name: "Ghanta Ghar", type: "entry", isActive: true },
        { id: "side", name: "Langar Gate", type: "entry", isActive: true },
      ],
      dailyCapacity: 100000,
      operatingHours: { open: "00:00", close: "23:59" },
    },
  ];

  for (const venueData of venues) {
    // Upsert venue
    const existing = await Venue.findOne({ slug: venueData.slug });
    if (existing) {
      console.log(`Updating ${venueData.name}...`);
      Object.assign(existing, venueData);
      await existing.save();
    } else {
      console.log(`Creating ${venueData.name}...`);
      await Venue.create(venueData);
    }
  }

  console.log("Common data seeded successfully.");
  await mongoose.disconnect();
}

seed();
