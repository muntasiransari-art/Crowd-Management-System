import mongoose from "mongoose";
import User from "../src/models/user.model";
import Venue from "../src/models/venue.model";
import Booking from "../src/models/booking.model";
import PriorityRequest from "../src/models/priority-request.model";

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
  console.error("Usage: bun run seed:venue <CLERK_USER_ID>");
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

  // Update user role to venue_staff
  user.role = "venue_staff";
  user.roleData = {
    venueId: venue._id.toString(),
    venueName: venue.name,
    department: "Management",
    employeeId: "EMP-001",
  };
  await user.save();
  console.log(
    `Updated user ${user.firstName} to Venue Staff for ${venue.name}`,
  );

  // 2. Generate Today's Bookings (for Charts)
  // Delete "today's" bookings for this venue to reset stats
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  await Booking.deleteMany({
    venueId: venue._id,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  const bookings = [];
  // Generate 50 random bookings
  for (let i = 0; i < 50; i++) {
    const isCheckedIn = Math.random() > 0.4;
    const status = isCheckedIn ? "completed" : "confirmed";
    const timeHour = 6 + Math.floor(Math.random() * 14); // 6 AM to 8 PM

    bookings.push({
      userId: user._id, // Assign to self for simplicity, or could be random IDs if we had them
      venueId: venue._id,
      slotId: new mongoose.Types.ObjectId(),
      date: new Date(),
      timeSlot: { start: `${timeHour}:00`, end: `${timeHour + 1}:00` },
      gate: `Gate ${Math.floor(Math.random() * 3) + 1}`,
      visitorDetails: Array.from({
        length: 1 + Math.floor(Math.random() * 5),
      }).map((_, idx) => ({
        name: `Visitor ${i}-${idx}`,
        age: 20 + Math.floor(Math.random() * 40),
        gender: "male",
      })),
      members: 1 + Math.floor(Math.random() * 5),
      totalAmount: 50,
      status: status,
      bookingCode: `RND-${i}`,
      checkInTime: isCheckedIn ? new Date() : undefined,
      createdAt: new Date(),
    });
  }
  await Booking.insertMany(bookings);
  console.log(`Created 50 random bookings for today.`);

  // 3. Create Priority Requests
  await PriorityRequest.deleteMany({ venueId: venue._id }); // cleanup

  const priorityRequests = [
    {
      userId: user._id, // Self or other
      venueId: venue._id,
      bookingId: new mongoose.Types.ObjectId(), // Needs valid booking ideally
      type: "senior_citizen",
      groupSize: 2,
      preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      reason: "Requires wheelchair assistance for elderly parents.",
      details: "Requires wheelchair assistance.",
      selectedVisitors: [
        { name: "Suresh", age: 75, gender: "male" },
        { name: "Lata", age: 70, gender: "female" },
      ],
      types: ["elderly"],
      documentUrl: "http://example.com/doc",
      status: "pending",
      createdAt: new Date(),
    },
    {
      userId: user._id,
      venueId: venue._id,
      bookingId: new mongoose.Types.ObjectId(),
      type: "vip",
      groupSize: 5,
      preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      reason: "Official visit for MLA.",
      details: "Local MLA visit.",
      selectedVisitors: [{ name: "MLA sahab", age: 50, gender: "male" }],
      types: ["differently_abled"], // Mapping VIP to closest valid enum or adjust model
      documentUrl: "http://example.com/doc",
      status: "approved",
      approvedBy: user._id,
      approvedAt: new Date(),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      bookingId: new mongoose.Types.ObjectId(),
      type: "defense",
      groupSize: 3,
      preferredDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      status: "pending",
      reason: "Defense personnel quota request.",
      details: "Army personnel on leave.",
      selectedVisitors: [{ name: "Major Singh", age: 35, gender: "male" }],
      types: ["elderly"], // Just to pass enum validation
      createdAt: new Date(),
    },
    {
      userId: user._id,
      venueId: venue._id,
      bookingId: new mongoose.Types.ObjectId(),
      type: "senior_citizen",
      groupSize: 4,
      preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      details: "Group of elderly attendees from South India.",
      reason: "Group attendeeage.",
      selectedVisitors: [{ name: "Krishna", age: 80, gender: "male" }],
      types: ["elderly"],
      documentUrl: "http://example.com/doc",
      status: "approved",
      approvedBy: user._id,
      approvedAt: new Date(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      bookingId: new mongoose.Types.ObjectId(),
      type: "vip",
      groupSize: 2,
      preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      details: "High Court Judge visit.",
      reason: "Protocol visit.",
      selectedVisitors: [{ name: "Judge Reddy", age: 55, gender: "male" }],
      types: ["differently_abled"],
      documentUrl: "http://example.com/doc",
      status: "pending",
      createdAt: new Date(),
    },
    {
      userId: user._id,
      venueId: venue._id,
      bookingId: new mongoose.Types.ObjectId(),
      type: "school_trip",
      groupSize: 45,
      preferredDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: "pending",
      reason: "Annual school excursion.",
      details: "Local government school annual visit.",
      selectedVisitors: [{ name: "Class Monitor", age: 12, gender: "male" }],
      types: ["woman_with_child"], // Dummy type to pass enum
      createdAt: new Date(),
    },
  ];

  // Need to adjust PriorityRequest model import or schema if not matching exact fields,
  // but assuming standard model structure.
  await PriorityRequest.insertMany(priorityRequests);
  console.log(`Created ${priorityRequests.length} priority requests.`);

  // 4. Update Venue Crowd Stats
  // Simulate a busy day
  venue.zones.forEach((zone) => {
    if (zone.status === "low") {
      zone.currentCount = Math.floor(zone.capacity * 0.2);
    } else if (zone.status === "medium") {
      zone.currentCount = Math.floor(zone.capacity * 0.6);
    } else if (zone.status === "high") {
      zone.currentCount = Math.floor(zone.capacity * 0.85);
    } else if (zone.status === "critical") {
      zone.currentCount = Math.floor(zone.capacity * 0.98);
    }
  });
  await venue.save();
  console.log("Updated venue zone stats to simulated values.");

  console.log("Venue Staff seeding completed!");
  await mongoose.disconnect();
}

seed();
