import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user.model";
import Booking from "@/models/booking.model";
import Venue from "@/models/venue.model";
import Slot from "@/models/slot.model";
import Announcement from "@/models/announcement.model";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Function declarations for Gemini (using string types)
const bookingTools = [
  {
    functionDeclarations: [
      {
        name: "get_venues",
        description: "Get list of available venues for booking",
        parameters: {
          type: "OBJECT" as const,
          properties: {},
        },
      },
      {
        name: "get_available_slots",
        description:
          "Get available time slots for a specific venue on a specific date",
        parameters: {
          type: "OBJECT" as const,
          properties: {
            venueName: {
              type: "STRING" as const,
              description: "Name of the venue (partial match allowed)",
            },
            date: {
              type: "STRING" as const,
              description: "Date in YYYY-MM-DD format",
            },
          },
          required: ["venueName", "date"],
        },
      },
      {
        name: "create_booking",
        description:
          "Create a new booking for the user. Call this only after confirming slot and visitor details.",
        parameters: {
          type: "OBJECT" as const,
          properties: {
            slotId: {
              type: "STRING" as const,
              description: "The slot ID to book",
            },
            venueId: {
              type: "STRING" as const,
              description: "The venue ID",
            },
            date: {
              type: "STRING" as const,
              description: "Date in YYYY-MM-DD format",
            },
            visitorDetails: {
              type: "ARRAY" as const,
              description: "Array of visitor details",
              items: {
                type: "OBJECT" as const,
                properties: {
                  name: {
                    type: "STRING" as const,
                    description: "Visitor name",
                  },
                  age: {
                    type: "NUMBER" as const,
                    description: "Visitor age",
                  },
                  gender: {
                    type: "STRING" as const,
                    description: "Gender: male, female, or other",
                  },
                },
                required: ["name", "age", "gender"],
              },
            },
          },
          required: ["slotId", "venueId", "date", "visitorDetails"],
        },
      },
    ],
  },
];

// Function implementations
async function getVenues() {
  const venues = await Venue.find({ isActive: true }).select(
    "name location.city location.state",
  );
  return venues.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    city: t.location?.city,
    state: t.location?.state,
  }));
}

async function getAvailableSlots(venueName: string, dateStr: string) {
  // Find venue by name (partial match)
  const venue = await Venue.findOne({
    name: { $regex: venueName, $options: "i" },
    isActive: true,
  });

  if (!venue) {
    return { error: `Venue "${venueName}" not found` };
  }

  // Parse date
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  // Build gate map
  const gateMap: Record<string, string> = {};
  venue.gates?.forEach((g: { id: string; name: string }) => {
    gateMap[g.id] = g.name;
  });

  // Find available slots
  const slots = await Slot.find({
    venueId: venue._id,
    date: { $gte: date, $lt: nextDay },
    status: { $ne: "full" },
  })
    .sort({ startTime: 1 })
    .lean();

  const availableSlots = slots
    .filter((slot) => slot.capacity - slot.booked > 0)
    .map((slot, index) => ({
      option: index + 1,
      id: slot._id.toString(), // THIS IS THE SLOT ID TO USE FOR BOOKING
      startTime: slot.startTime,
      endTime: slot.endTime,
      spotsAvailable: slot.capacity - slot.booked,
      gate: gateMap[slot.gateId] || "Main Gate",
    }));

  return {
    venueId: venue._id.toString(), // USE THIS FOR BOOKING
    venueName: venue.name,
    date: dateStr,
    availableSlots: availableSlots,
    instructions:
      "To book, use create_booking with: slotId (the 'id' field from a slot), venueId (provided above), date, and visitorDetails array",
  };
}

async function createBooking(
  userId: string,
  slotId: string,
  venueId: string,
  dateStr: string,
  visitorDetails: { name: string; age: number; gender: string }[],
) {
  // Get slot
  const slot = await Slot.findById(slotId);
  if (!slot) {
    return { error: "Slot not found" };
  }

  const visitors = visitorDetails.length;

  if (slot.status === "full" || slot.booked + visitors > slot.capacity) {
    return { error: "Not enough spots available in this slot" };
  }

  // Get venue for gate info
  let venue;
  if (/^[0-9a-fA-F]{24}$/.test(venueId)) {
    venue = await Venue.findById(venueId);
  } else {
    venue = await Venue.findOne({
      name: { $regex: venueId, $options: "i" },
    });
  }

  if (!venue) {
    return { error: "Venue not found" };
  }

  const gate = venue.gates?.find((g: { id: string }) => g.id === slot.gateId);

  // Create booking
  const booking = await Booking.create({
    userId,
    venueId: venue._id,
    slotId,
    date: new Date(dateStr),
    timeSlot: {
      start: slot.startTime,
      end: slot.endTime,
    },
    gate: gate?.name || "Gate 1",
    visitorDetails,
    visitors,
  });

  // Update slot
  slot.booked += visitors;
  if (slot.booked >= slot.capacity) {
    slot.status = "full";
  }
  await slot.save();

  return {
    success: true,
    bookingCode: booking.bookingCode,
    venueName: venue.name,
    date: dateStr,
    time: `${slot.startTime} - ${slot.endTime}`,
    gate: gate?.name || "Gate 1",
    visitors,
  };
}

// POST /api/chat - RAG AI Assistant
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const clerkId = session?.user?.email;

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    await connectDB();

    // Get user data
    const user = await User.findOne({ email: clerkId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. RAG Retrieval: User's Confirmed Tickets & Passes
    const userBookings = await Booking.find({ userId: user._id })
      .populate("venueId", "name location.city location.address")
      .sort({ date: -1 })
      .lean();

    const bookingContext =
      userBookings.length > 0
        ? userBookings
            .map((b: any) => {
              const v = b.venueId;
              return `- Ticket Pass Code: ${b.bookingCode} | Event/Venue: ${v?.name || "Event"} (${v?.location?.city || ""}) | Date: ${new Date(b.date).toLocaleDateString()} | Slot Time: ${b.timeSlot?.start || "09:00"} - ${b.timeSlot?.end || "13:00"} | Gate: ${b.gate || "Gate 1"} | Visitors: ${b.visitors} | Status: ${b.status?.toUpperCase()}`;
            })
            .join("\n")
        : "No active or past tickets found.";

    // 2. RAG Retrieval: All Live Venues, Gates, Operating Hours, and Real-Time Zone Density
    const allVenues = await Venue.find({ isActive: true }).lean();
    const venueContext = allVenues.length > 0
      ? allVenues.map((v: any) => {
          const zoneSummary = v.zones?.map((z: any) => 
            `   * Zone: "${z.name}" | Density Status: ${z.status?.toUpperCase() || 'LOW'} | Occupancy: ${z.currentCount}/${z.capacity}`
          ).join("\n") || "   * No zone data";

          const gateSummary = v.gates?.map((g: any) => 
            `   * Gate: "${g.name}" (${g.type}) - Active: ${g.isActive ? 'Yes' : 'No'}`
          ).join("\n") || "   * Main Gate";

          return `📍 VENUE / EVENT: ${v.name}
   Address & Location: ${v.location?.address}, ${v.location?.city}, ${v.location?.state}
   Daily Capacity: ${v.dailyCapacity} | Operating Hours: ${v.operatingHours?.open || "08:00"} - ${v.operatingHours?.close || "20:00"}
   Description: ${v.description || "N/A"}
   Zones & Real-Time Crowd Density:
${zoneSummary}
   Entry Gates:
${gateSummary}`;
        }).join("\n\n")
      : "No active venues registered.";

    // 3. RAG Retrieval: Active Organizer Announcements & Alerts
    const announcements = await Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(8).lean();
    const announcementContext = announcements.length > 0
      ? announcements.map((a: any) => `- [${a.type?.toUpperCase() || "INFO"}] ${a.title}: "${a.message}"`).join("\n")
      : "No active broadcast announcements.";

    const todayStr = new Date().toISOString().split("T")[0];

    // RAG System Prompt
    const systemPrompt = `You are EventGuard RAG AI Assistant, an advanced Retrieval-Augmented Generation (RAG) assistant for crowd management and venue booking.

CURRENT SYSTEM DATE: ${todayStr}
LOGGED-IN ATTENDEE: ${user.firstName + " " + user.lastName || "Attendee"} (Email: ${user.email})

=======================================================
*** RETRIEVAL-AUGMENTED GENERATION (RAG) KNOWLEDGE BASE ***
=======================================================

--- 1. REAL-TIME VENUES, EVENTS & CROWD DENSITY ---
${venueContext}

--- 2. LIVE ORGANIZER ANNOUNCEMENTS & ALERTS ---
${announcementContext}

--- 3. ATTENDEE'S CONFIRMED PASSES & BOOKINGS ---
${bookingContext}

=======================================================
*** RAG RESPONSE RULES & GUIDELINES ***
=======================================================
1. STRICTLY PLATFORM-GROUNDED (RAG):
   - Answer user queries using the exact live RAG Knowledge Base provided above.
   - When asked about venue locations, crowd density, low-crowd zones, operating hours, or gates, quote exact figures from the Knowledge Base.
2. TICKET & PASS DETAILS:
   - If asked about their tickets or bookings, quote their exact ticket codes (e.g. PG-2026-UP-1234), dates, time slots, gate names, visitor counts, and status.
3. SLOT BOOKING VIA TOOLS:
   - You have booking tools (get_venues, get_available_slots, create_booking).
   - Use 'get_available_slots' to find slots for any venue, ask for visitor details, and call 'create_booking' with the 24-character slotId ObjectId.
   - NEVER use time strings as slotId - use the 24-char ObjectId returned by get_available_slots.
4. EMERGENCY & CROWD SAFETY:
   - If a zone is High/Critical or if overcrowding/emergency is mentioned, advise them on lower-density zones or using the floating red SOS button for emergency Twilio voice/SMS dispatch.
5. CONCISE & HELPFUL:
   - Keep answers clear, professional, warm, and helpful.`;

    // Try multiple model candidates in case of 503 server capacity or 404 deprecation
    const modelCandidates = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-2.5-flash"];
    let textResponse = "";

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: bookingTools as any,
        });

        const chatHistory = [
          {
            role: "user" as const,
            parts: [{ text: systemPrompt }],
          },
          {
            role: "model" as const,
            parts: [
              {
                text: `Namaste ${user.firstName || "Attendee"}! I'm your EventGuard RAG AI Assistant. I have live access to all event venues, crowd density metrics, organizer announcements, and your ticket passes. How can I help you today?`,
              },
            ],
          },
          ...(history || []).map((msg: { role: string; content: string }) => ({
            role: msg.role === "user" ? ("user" as const) : ("model" as const),
            parts: [{ text: msg.content }],
          })),
        ];

        const chat = model.startChat({ history: chatHistory });
        let result = await chat.sendMessage(message);
        let response = result.response;

        let functionCall = response.functionCalls()?.[0];
        let maxIterations = 5;

        while (functionCall && maxIterations > 0) {
          maxIterations--;
          const { name, args } = functionCall;
          const typedArgs = args as Record<string, unknown>;
          let functionResult: unknown;

          try {
            switch (name) {
              case "get_venues":
                functionResult = await getVenues();
                break;
              case "get_available_slots":
                functionResult = await getAvailableSlots(
                  typedArgs.venueName as string,
                  typedArgs.date as string,
                );
                break;
              case "create_booking":
                functionResult = await createBooking(
                  user._id.toString(),
                  typedArgs.slotId as string,
                  typedArgs.venueId as string,
                  typedArgs.date as string,
                  typedArgs.visitorDetails as {
                    name: string;
                    age: number;
                    gender: string;
                  }[],
                );
                break;
              default:
                functionResult = { error: `Unknown function: ${name}` };
            }
          } catch (err) {
            console.error(`Function ${name} error:`, err);
            functionResult = { error: `Failed to execute ${name}` };
          }

          result = await chat.sendMessage([
            {
              functionResponse: {
                name,
                response: { result: functionResult },
              },
            },
          ]);

          response = result.response;
          functionCall = response.functionCalls()?.[0];
        }

        textResponse = response.text();
        if (textResponse) break;
      } catch (err: any) {
        console.warn(`Model ${modelName} failed or unavailable:`, err?.message || err);
      }
    }

    // Smart RAG Fallback if LLM capacity (503) or API fails
    if (!textResponse) {
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes("how many event") || lowerMsg.includes("list event") || lowerMsg.includes("active event") || lowerMsg.includes("what event")) {
        textResponse = `📌 **Available Events & Venues (${allVenues.length} Total):**\n\n` +
          allVenues.map((v: any, idx: number) => `${idx + 1}. **${v.name}**\n📍 Location: ${v.location?.address || ""}, ${v.location?.city || "City"}\n👥 Capacity: ${v.dailyCapacity} | Hours: ${v.operatingHours?.open || "08:00"} - ${v.operatingHours?.close || "20:00"}`).join("\n\n");
      } else if (lowerMsg.includes("ticket") || lowerMsg.includes("booking") || lowerMsg.includes("pass")) {
        textResponse = `🎫 **Your Ticket Passes:**\n\n${bookingContext}`;
      } else if (lowerMsg.includes("density") || lowerMsg.includes("crowd") || lowerMsg.includes("occupancy") || lowerMsg.includes("zone")) {
        textResponse = `📊 **Real-Time Venue Zone Occupancy:**\n\n${venueContext}`;
      } else if (lowerMsg.includes("announcement") || lowerMsg.includes("alert") || lowerMsg.includes("broadcast")) {
        textResponse = `📢 **Active Organizer Announcements:**\n\n${announcementContext}`;
      } else {
        textResponse = `Namaste ${user.firstName || "Attendee"}! Here is the latest live platform context retrieved for your query:\n\n` +
          `📌 **Events Available:** ${allVenues.length} registered venues\n` +
          `🎫 **Your Tickets:** ${userBookings.length} confirmed bookings\n` +
          `📢 **Active Alerts:** ${announcements.length} broadcasts\n\n` +
          `*Feel free to ask for specific ticket pass codes, event locations, or zone density metrics!*`;
      }
    }

    return NextResponse.json({ response: textResponse });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 },
    );
  }
}
