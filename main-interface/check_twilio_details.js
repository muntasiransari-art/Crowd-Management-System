import { readFileSync } from "fs";
import twilio from "twilio";

let envVars = {};
try {
  const envContent = readFileSync(".env.local", "utf-8");
  envContent.split("\n").forEach(line => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      envVars[parts[0].trim()] = parts.slice(1).join("=").trim();
    }
  });
} catch (e) {}

const client = twilio(envVars.TWILIO_ACCOUNT_SID, envVars.TWILIO_AUTH_TOKEN);

async function testDetails() {
  console.log("Checking Account Details...");
  try {
    const acc = await client.api.v2010.accounts(envVars.TWILIO_ACCOUNT_SID).fetch();
    console.log("Account Name:", acc.friendlyName);
    console.log("Account Type:", acc.type);
    console.log("Account Status:", acc.status);
  } catch (err) {
    console.error("Account Fetch Error:", err.message);
  }

  // Test simple short text SMS
  try {
    const msg = await client.messages.create({
      body: "Emergency SOS Alert. Location: https://maps.google.com/?q=19.076,72.877",
      to: envVars.ORGANIZER_PHONE_NUMBER,
      from: envVars.TWILIO_PHONE_NUMBER
    });
    console.log("✅ Simple SMS Success! SID:", msg.sid);
  } catch (err) {
    console.error("Simple SMS Error:", err.message, "Code:", err.code);
  }
}

testDetails();
