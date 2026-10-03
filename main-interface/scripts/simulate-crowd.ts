/**
 * Crowd Simulation Script
 *
 * Continuously simulates realistic crowd data for venue zones.
 * Run with: bun run simulate:crowd
 *
 * Features:
 * - Time-based patterns (morning ramp, peak hours, evening decline)
 * - Zone-specific modifiers (main areas busier than side areas)
 * - Random fluctuations for realism
 * - Configurable update interval
 */

import mongoose from "mongoose";
import Venue from "../src/models/venue.model";

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const UPDATE_INTERVAL_MS = 4000; // 4 seconds for dynamic real-time updates

if (!MONGODB_URI) {
  console.error(
    "❌ Please define the MONGODB_URI environment variable inside .env.local",
  );
  process.exit(1);
}

// Simulation configuration
const SIMULATION_CONFIG = {
  fluctuationRange: 0.15, // ±15%
  zoneModifiers: {
    main: 1.2,
    queue: 1.1,
    prasad: 0.9,
    exit: 0.7,
    default: 1.0,
  } as Record<string, number>,
};

/**
 * Get crowd multiplier based on current hour
 */
function getTimeBasedMultiplier(hour: number): number {
  if (hour < 6) return 0.05;
  if (hour < 9) return 0.2 + (hour - 6) * 0.1;
  if (hour < 12) return 0.5 + (hour - 9) * 0.1;
  if (hour < 15) return 0.8 + Math.random() * 0.15;
  if (hour < 18) return 0.7 - (hour - 15) * 0.1;
  if (hour < 21) return 0.4 - (hour - 18) * 0.1;
  return 0.05;
}

/**
 * Get zone modifier based on zone name
 */
function getZoneModifier(zoneName: string): number {
  const lowerName = zoneName.toLowerCase();
  if (
    lowerName.includes("main") ||
    lowerName.includes("sanctum") ||
    lowerName.includes("garbha")
  ) {
    return SIMULATION_CONFIG.zoneModifiers.main;
  }
  if (lowerName.includes("queue") || lowerName.includes("line")) {
    return SIMULATION_CONFIG.zoneModifiers.queue;
  }
  if (lowerName.includes("prasad") || lowerName.includes("food")) {
    return SIMULATION_CONFIG.zoneModifiers.prasad;
  }
  if (lowerName.includes("exit") || lowerName.includes("parking")) {
    return SIMULATION_CONFIG.zoneModifiers.exit;
  }
  return SIMULATION_CONFIG.zoneModifiers.default;
}

/**
 * Generate random fluctuation
 */
function getRandomFluctuation(): number {
  const range = SIMULATION_CONFIG.fluctuationRange;
  return 1 + (Math.random() * 2 - 1) * range;
}

/**
 * Run one simulation cycle
 */
async function simulateCycle(): Promise<void> {
  const now = new Date();
  const hour = now.getHours();
  const timeMultiplier = getTimeBasedMultiplier(hour);

  console.log(
    `\n⏰ [${now.toLocaleTimeString()}] Hour: ${hour}, Base multiplier: ${Math.round(timeMultiplier * 100)}%`,
  );

  const venues = await Venue.find({ isActive: true });

  if (venues.length === 0) {
    console.log("⚠️  No active venues found");
    return;
  }

  for (const venue of venues) {
    console.log(`\n🛕 ${venue.name}:`);

    for (let i = 0; i < venue.zones.length; i++) {
      const zone = venue.zones[i];
      const oldCount = zone.currentCount;

      const baseCount = zone.capacity * timeMultiplier;
      const zoneModifier = getZoneModifier(zone.name);
      const fluctuation = getRandomFluctuation();
      let newCount = Math.round(baseCount * zoneModifier * fluctuation);
      newCount = Math.max(0, Math.min(newCount, zone.capacity));

      venue.zones[i].currentCount = newCount;

      const percentage = Math.round((newCount / zone.capacity) * 100);
      const status =
        percentage >= 90
          ? "🔴 CRITICAL"
          : percentage >= 70
            ? "🟠 HIGH"
            : percentage >= 50
              ? "🟡 MEDIUM"
              : "🟢 LOW";

      console.log(
        `   ${zone.name}: ${oldCount} → ${newCount}/${zone.capacity} (${percentage}%) ${status}`,
      );
    }

    await venue.save();
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log("🚀 Starting Crowd Simulation...");
  console.log(`📊 Update interval: ${UPDATE_INTERVAL_MS / 1000} seconds`);
  console.log("━".repeat(50));

  // Connect to MongoDB
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }

  // Run initial simulation
  await simulateCycle();

  // Schedule continuous updates
  console.log("\n🔄 Running continuous simulation (Ctrl+C to stop)...");

  const interval = setInterval(async () => {
    try {
      await simulateCycle();
    } catch (error) {
      console.error("❌ Simulation error:", error);
    }
  }, UPDATE_INTERVAL_MS);

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n🛑 Stopping simulation...");
    clearInterval(interval);
    await mongoose.disconnect();
    console.log("👋 Goodbye!");
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
