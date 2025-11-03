// File: _test-full-system.ts
// Purpose: Simulates a full, end-to-end run of the entire autonomous job.
// How to run: npx tsx _test-full-system.ts

import 'dotenv/config'; // Crucial for loading all environment variables
import { runDailyAutonomousJob } from "./lib/services/orchestratorService"; // Adjust path if needed

async function runFullSystemTest() {
  console.log("🚀 KICKING OFF FULL SYSTEM TEST 🚀");
  console.log("   This will connect to your real database and make real AI calls.");
  console.log("   Watch the logs below for the step-by-step process.");
  console.log("===================================================================");
  
  // Call the single function that runs everything
  await runDailyAutonomousJob();

  console.log("===================================================================");
  console.log("✅ Full system test finished. Please verify the database for new jokes.");
}

// Execute the test
runFullSystemTest();