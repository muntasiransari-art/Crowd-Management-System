import mongoose from "mongoose";
import User from "../src/models/user.model";
import Venue from "../src/models/venue.model";
import Booking from "../src/models/booking.model";
import Slot from "../src/models/slot.model";
import PriorityRequest from "../src/models/priority-request.model";
import MedicalResource from "../src/models/medical-resource.model";

import Gate from "../src/models/gate.model";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
  process.exit(1);
}

async function seed() {
  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected.");
  } catch (error) {
    console.error("Connection error:", error);
    process.exit(1);
  }

  // 1. Setup Target Venue
  const venue = await Venue.findOne({ slug: "kashi-vishwanath" });
  if (!venue) {
    console.error(
      "Venue 'Kashi Vishwanath' not found. Run seed:common first.",
    );
    process.exit(1);
  }

  // 1a. Generate Gates for Venue (Dashboard Requirement)
  console.log("Generating gates...");
  await Gate.deleteMany({ venueId: venue._id });

  const gateDefinitions = [
    {
      name: "Gate 1 (Main)",
      type: "both",
      location: "North Entrance",
      status: "active",
    },
    {
      name: "Gate 2 (VIP)",
      type: "entry",
      location: "West Wing",
      status: "active",
    },
    {
      name: "Gate 3 (Exit Only)",
      type: "exit",
      location: "South Exit",
      status: "active",
    },
    {
      name: "Gate 4 (Emergency)",
      type: "both",
      location: "East Service Road",
      status: "closed",
    },
  ];

  const createdGates = [];
  for (const def of gateDefinitions) {
    const gate = await Gate.create({
      venueId: venue._id,
      name: def.name,
      type: def.type,
      location: def.location,
      status: def.status,
      currentFlow: Math.floor(Math.random() * 50), // Random flow
      qrCode: `GATE-${def.name.toUpperCase().replace(/\s/g, "-")}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    createdGates.push(gate);
  }
  console.log(`Created ${createdGates.length} gates.`);

  // Update Venue Model's internal gates array for consistency
  venue.gates = createdGates.map((g) => ({
    id: g._id.toString(),
    name: g.name,
    type: g.type,
    isActive: g.status === "active",
  }));
  await venue.save();
  console.log("Updated Venue.gates array.");

  // 1b. Generate Slots for Past & Future...
  // ... (rest of the file)

  // 2. Create/Find a Dummy User for background data
  // We use this user to own all the background noise data so we don't pollute real users
  let dummyUser = await User.findOne({
    email: "dummy-data-filler@eventguard.com",
  });
  if (!dummyUser) {
    console.log("Creating dummy user for background data...");
    dummyUser = await User.create({
      clerkId: `dummy_filler_${Date.now()}`,
      email: "dummy-data-filler@eventguard.com",
      firstName: "Background",
      lastName: "Data",
      phone: "0000000000",
      role: "attendee",
      roleData: {
        emergencyContactName: "System",
        emergencyContactPhone: "911",
      },
    });
  }

  console.log(`Using dummy user: ${dummyUser._id}`);

  // 1b. Generate Slots for Past & Future (Essential for Bookings)
  console.log("Generating slots...");
  try {
    await Slot.collection.dropIndexes();
  } catch (e) {
    console.log("No indexes to drop or drop failed", e);
  }
  await Slot.deleteMany({ venueId: venue._id });

  const slotsMap = new Map(); // Key: "YYYY-MM-DD", Value: [SlotDocs]

  // Generate slots for last 30 days and next 30 days
  for (let d = -30; d <= 30; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

    const daySlots = [];
    const activeEntryGates = ["Gate 1 (Main)", "Gate 2 (VIP)"];

    // Create slots for 6 AM to 8 PM
    for (let hour = 6; hour < 20; hour++) {
      const startTime = `${hour < 10 ? "0" : ""}${hour}:00`;
      const endTimeRaw = hour + 1;
      const endTime = `${endTimeRaw < 10 ? "0" : ""}${endTimeRaw}:00`;

      // Create multiple slots per hour (e.g. one for each gate) or just random
      // Let's create one slot structure for each active gate to allow parallel bookings
      for (const gateName of activeEntryGates) {
        daySlots.push({
          venueId: venue._id,
          date: date,
          startTime: startTime,
          endTime: endTime,
          capacity: 50, // Capacity per gate per hour
          booked: 0,
          gateId: gateName,
          status: "available",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    const createdSlots = await Slot.insertMany(daySlots);
    slotsMap.set(dateStr, createdSlots);
  }
  console.log("Created slots for +/- 30 days.");

  // 3. Generate Historical Bookings (Trend Data)
  console.log("Generating historical bookings (Last 30 days)...");
  await Booking.deleteMany({ userId: dummyUser._id });

  const historicalBookings = [];
  for (let d = 1; d <= 30; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split("T")[0];

    // Get slots for this day
    const availableSlots = slotsMap.get(dateStr) || [];
    if (availableSlots.length === 0) continue;

    // 40-80 bookings per day
    const count = 40 + Math.floor(Math.random() * 41);

    for (let i = 0; i < count; i++) {
      // Pick a random slot
      const slot =
        availableSlots[Math.floor(Math.random() * availableSlots.length)];
      slot.booked += 1;

      historicalBookings.push({
        userId: dummyUser._id,
        venueId: venue._id,
        slotId: slot._id, // Link to REAL slot
        date: date,
        timeSlot: { start: slot.startTime, end: slot.endTime },
        gate: slot.gateId,
        visitorDetails: [{ name: "Dummy", age: 30, gender: "other" }],
        members: 1,
        totalAmount: 50,
        status: "completed",
        bookingCode: `HIST-${d}-${i}`,
        checkInTime: date,
        createdAt: date,
        updatedAt: date,
      });
    }
  }
  await Booking.insertMany(historicalBookings);
  console.log(
    `Added ${historicalBookings.length} historical bookings linked to slots.`,
  );

  // 4. Generate Today's Bookings
  console.log("Generating today's bookings...");
  const todayBookings = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const todaySlots = slotsMap.get(todayStr) || [];

  if (todaySlots.length > 0) {
    for (let i = 0; i < 120; i++) {
      const slot = todaySlots[Math.floor(Math.random() * todaySlots.length)];
      slot.booked += 1;

      const bookingDate = new Date(); // Use current time for creation
      const startHour = parseInt(slot.startTime.split(":")[0]);
      const isFuture = startHour > new Date().getHours();
      const status = isFuture
        ? "confirmed"
        : Math.random() > 0.3
          ? "checked_in"
          : "completed";

      todayBookings.push({
        userId: dummyUser._id,
        venueId: venue._id,
        slotId: slot._id,
        date: today, // Date object for querying
        timeSlot: { start: slot.startTime, end: slot.endTime },
        gate: slot.gateId,
        visitorDetails: [{ name: "Live Visitor", age: 25, gender: "female" }],
        members: 1,
        totalAmount: 50,
        status: status,
        bookingCode: `TODAY-${i}`,
        checkInTime: status !== "confirmed" ? bookingDate : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await Booking.insertMany(todayBookings);
    console.log(
      `Added ${todayBookings.length} bookings for today linked to slots.`,
    );
  }

  // Update Slot booked counts in DB
  console.log("Updating slot booked counts...");
  // Gather all modified slots across all days
  const allSlots = Array.from(slotsMap.values())
    .flat()
    .filter((s) => s.booked > 0);

  // Bulk update for performance
  if (allSlots.length > 0) {
    const bulkOps = allSlots.map((slot) => ({
      updateOne: {
        filter: { _id: slot._id },
        update: {
          $set: {
            booked: slot.booked,
            status: slot.booked >= slot.capacity ? "full" : "available",
          },
        },
      },
    }));
    await Slot.bulkWrite(bulkOps);
  }
  console.log("Slots updated.");

  // 5. Generate SOS Alerts (Active & Resolved)
  console.log("Generating SOS alerts...");
  // Use DB collection direct access to avoid model import issues if definitions vary
  const sosCollection = mongoose.connection.collection("sos");
  await sosCollection.deleteMany({ userId: dummyUser._id });

  const sosAlerts = [
    // Active Alerts
    {
      type: "medical",
      priority: "critical",
      location: { zone: "Main Queue" },
      description: "Elderly attendee collapsed, breathing difficulty",
      status: "active",
    },
    {
      type: "lost_child",
      priority: "high",
      location: { zone: "Shoe Stand" },
      description: "Boy, 5 years, blue shirt",
      status: "active",
    },
    {
      type: "security",
      priority: "medium",
      location: { zone: "Gate 2" },
      description: "Unattended luggage spotted",
      status: "in_progress",
    },
    {
      type: "fire",
      priority: "critical",
      location: { zone: "Kitchen" },
      description: "Small fire reported in kitchen area",
      status: "active",
    },

    // Resolved History
    {
      type: "medical",
      priority: "high",
      location: { zone: "Parking" },
      description: "Minor injury",
      status: "resolved",
      resolvedAt: new Date(),
    },
    {
      type: "other",
      priority: "low",
      location: { zone: "Office" },
      description: "Lost phone reported",
      status: "resolved",
      resolvedAt: new Date(),
    },
  ];

  await sosCollection.insertMany(
    sosAlerts.map((alert) => ({
      ...alert,
      userId: dummyUser._id,
      venueId: venue._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      notes: [],
      assignedResources: [],
    })),
  );
  console.log(`Added ${sosAlerts.length} SOS alerts.`);

  // 6. Generate Priority Requests
  console.log("Generating Priority Requests...");
  await PriorityRequest.deleteMany({ userId: dummyUser._id });

  const priorities = [
    {
      type: "senior_citizen",
      status: "pending",
      groupSize: 2,
      reason: "Wheelchair needed",
    },
    {
      type: "vip",
      status: "approved",
      groupSize: 5,
      reason: "Government Official",
    },
    {
      type: "defense",
      status: "pending",
      groupSize: 1,
      reason: "Army Personnel",
    },
    {
      type: "pregnant",
      status: "pending",
      groupSize: 2,
      reason: "Assistance required",
    },
    {
      type: "senior_citizen",
      status: "rejected",
      groupSize: 10,
      reason: "Group too large for quota",
    },
  ];

  await PriorityRequest.insertMany(
    priorities.map((p) => ({
      ...p,
      userId: dummyUser._id,
      venueId: venue._id,
      bookingId: new mongoose.Types.ObjectId(),
      selectedVisitors: [{ name: "Requester", age: 50, gender: "male" }], // Dummy
      types: [p.type === "vip" ? "differently_abled" : "elderly"], // fallback for enum mapping
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  );
  console.log(`Added ${priorities.length} priority requests.`);

  // 7. Update Crowd Stats
  console.log("Updating crowd stats...");
  venue.zones.forEach((zone) => {
    // Randomize values to look dynamic
    const randomFill = 0.3 + Math.random() * 0.6; // 30% to 90% full
    zone.currentCount = Math.floor(zone.capacity * randomFill);
  });
  await venue.save();

  console.log("Dummy data seeding completed successfully!");
  await mongoose.disconnect();
}

seed().catch((err) => console.error("SEEDING ERROR:", err.message));
