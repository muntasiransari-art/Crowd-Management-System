import mongoose from "mongoose";
import User from "../src/models/user.model";
import Booking from "../src/models/booking.model";
import Notification from "../src/models/notification.model";
import Venue from "../src/models/venue.model";

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
  console.error("Usage: bun run seed:attendee <CLERK_USER_ID>");
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

  // 1. Find User
  const user = await User.findOne({ clerkId: CLERK_USER_ID });
  if (!user) {
    console.error(
      `User with Clerk ID ${CLERK_USER_ID} not found. Please log in first.`,
    );
    process.exit(1);
  }
  console.log(`Seeding data for Attendee: ${user.firstName} ${user.lastName}`);

  // 2. Ensure Role is Attendee (optional, but good for consistency or separate logic)
  // For now we just add data efficiently.

  const venue = await Venue.findOne({ slug: "kashi-vishwanath" });
  if (!venue) {
    console.error(
      "Venue 'Kashi Vishwanath' not found. Run seed:common first.",
    );
    process.exit(1);
  }

  // 3. Create Bookings
  // Clear existing bookings for this user to avoid dupe clutter if run multiple times
  await Booking.deleteMany({ userId: user._id });
  await Notification.deleteMany({ userId: user._id });

  const bookings = [
    {
      userId: user._id,
      venueId: venue._id,
      slotId: new mongoose.Types.ObjectId(),
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      timeSlot: { start: "10:00 AM", end: "11:00 AM" },
      gate: "Gate 1",
      visitorDetails: [
        { name: "Suresh", age: 45, gender: "male", isMainBooker: true },
        { name: "Ramesh", age: 10, gender: "male" },
      ],
      members: 2,
      totalAmount: 100,
      status: "confirmed",
      bookingCode: "KV-TOM-101",
      passUrl: "https://example.com/pass",
      paymentId: "pay_123",
      createdAt: new Date(),
    },
    {
      userId: user._id,
      venueId: venue._id,
      slotId: new mongoose.Types.ObjectId(),
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      timeSlot: { start: "09:00 AM", end: "10:00 AM" },
      gate: "Gate 2",
      visitorDetails: [
        { name: "Suresh", age: 45, gender: "male", isMainBooker: true },
        { name: "Ramesh", age: 10, gender: "male" },
        { name: "Anita", age: 40, gender: "female" },
        { name: "Priya", age: 12, gender: "female" },
      ],
      members: 4,
      totalAmount: 200,
      status: "completed",
      bookingCode: "KV-PAST-001",
      paymentId: "pay_past_1",
      checkInTime: new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000 + 1000 * 60 * 15,
      ),
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      slotId: new mongoose.Types.ObjectId(),
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      timeSlot: { start: "06:00 PM", end: "07:00 PM" },
      gate: "Gate 1",
      visitorDetails: [
        { name: "Suresh", age: 45, gender: "male", isMainBooker: true },
      ],
      members: 1,
      totalAmount: 50,
      status: "cancelled",
      bookingCode: "KV-CANC-002",
      paymentId: "pay_canc_1",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      slotId: new mongoose.Types.ObjectId(),
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
      timeSlot: { start: "04:00 PM", end: "05:00 PM" },
      gate: "Gate 3",
      visitorDetails: [
        { name: "Suresh", age: 45, gender: "male", isMainBooker: true },
        { name: "Ramesh", age: 10, gender: "male" },
        { name: "Anita", age: 40, gender: "female" },
      ],
      members: 3,
      totalAmount: 150,
      status: "confirmed",
      bookingCode: "KV-FUT-003",
      passUrl: "https://example.com/pass",
      paymentId: "pay_124",
      createdAt: new Date(),
    },
    {
      userId: user._id,
      venueId: venue._id,
      slotId: new mongoose.Types.ObjectId(),
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      timeSlot: { start: "07:00 AM", end: "08:00 AM" },
      gate: "Gate 1",
      visitorDetails: [
        { name: "Suresh", age: 45, gender: "male", isMainBooker: true },
        { name: "Anita", age: 40, gender: "female" },
      ],
      members: 2,
      totalAmount: 100,
      status: "completed",
      bookingCode: "KV-PAST-004",
      paymentId: "pay_past_2",
      checkInTime: new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000 + 1000 * 60 * 20,
      ),
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      userId: user._id,
      venueId: venue._id,
      slotId: new mongoose.Types.ObjectId(),
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      timeSlot: { start: "11:00 AM", end: "12:00 PM" },
      gate: "Gate 2",
      visitorDetails: [
        { name: "Suresh", age: 45, gender: "male", isMainBooker: true },
        { name: "Ramesh", age: 10, gender: "male" },
        { name: "Anita", age: 40, gender: "female" },
        { name: "Priya", age: 12, gender: "female" },
        { name: "Guest", age: 60, gender: "male" },
      ],
      members: 5,
      totalAmount: 250,
      status: "completed",
      bookingCode: "KV-PAST-005",
      paymentId: "pay_past_3",
      checkInTime: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000 + 1000 * 60 * 10,
      ),
      createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    },
  ];

  await Booking.insertMany(bookings);
  console.log(`Created ${bookings.length} bookings.`);

  // 4. Create Notifications
  const notifications = [
    {
      userId: user._id,
      type: "booking",
      title: "Booking Confirmed",
      message:
        "Your entry booking for tomorrow at Kashi Vishwanath is confirmed.",
      isRead: false,
      sentAt: new Date(),
    },
    {
      userId: user._id,
      type: "alert",
      title: "Crowd Advisory",
      message:
        "Heavy crowds expected tomorrow morning. Please arrive 30 mins early.",
      isRead: false,
      sentAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    },
    {
      userId: user._id,
      type: "announcement",
      title: "Venue Closure Update",
      message:
        "The venue will remain closed for cleaning from 2 PM to 4 PM today.",
      isRead: true,
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      userId: user._id,
      type: "alert", // Changed from security to alert
      title: "Lost Item Found",
      message: "A blue bag matching your description has been found at Gate 2.",
      isRead: false,
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      userId: user._id,
      type: "booking",
      title: "Feedback Request",
      message: "How was your recent entry? Please rate your experience.",
      isRead: true,
      sentAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    },
  ];

  await Notification.insertMany(notifications);
  console.log(`Created ${notifications.length} notifications.`);

  console.log("Attendee seeding completed!");
  await mongoose.disconnect();
}

seed();
