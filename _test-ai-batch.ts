// File: _test-ai-batch.ts
// Purpose: Unit tests the batch topic selection AI service.
// How to run: npx tsx _test-ai-batch.ts

import 'dotenv/config'; // Loads environment variables from .env.local
import { selectTopicsInBatch } from "./lib/services/aiStrategyService"; // Adjust path if needed
import { Character } from "./lib/services/characterService";
import { AllTrendsData } from "./lib/services/trendService";

// --- 1. Create Mock Data (Simulates inputs from the database and trend service) ---
const mockCharacters: Character[] = [
  { id: 1, name: "Grumpy Old Man", prompt_persona: "A comedian who complains about modern technology, young people, and everything new.", country: "USA" },
  { id: 2, name: "Witty Tech Bro", prompt_persona: "A comedian who is obsessed with startups, crypto, and Silicon Valley culture. Uses a lot of buzzwords.", country: "USA" },
  { id: 3, name: "Philosophical Poet", prompt_persona: "A comedian who tells jokes in the form of deep, introspective poems about everyday life.", country: "Egypt" },
];

const mockTrends: AllTrendsData = {
  "USA": [
    { trend_name: "New Foldable Smartphone Launch", description: "A major tech company launched its new foldable phone today." },
    { trend_name: "Viral TikTok Dance Challenge", description: "A new dance is taking over social media." },
  ],
  "Egypt": [
    { trend_name: "Discovery at Giza Pyramids", description: "Archaeologists announced a new discovery." },
    { trend_name: "Cairo International Book Fair", description: "The annual book fair is attracting large crowds." },
  ]
};

// --- 2. Define the Asynchronous Test Function ---
async function runTest() {
  console.log("🧪 Starting AI batch TOPIC SELECTION test...");
  console.log("-----------------------------------------");
  console.log("Mock Characters:", mockCharacters.map(c => c.name));
  console.log("Mock Trends:", mockTrends);
  console.log("-----------------------------------------");

  try {
    const assignments = await selectTopicsInBatch(mockCharacters, mockTrends);

    console.log("✅ AI Response Parsed Successfully!");
    console.log("📝 Generated Job Plan:");
    console.log(JSON.stringify(assignments, null, 2));

    // --- 3. Assertions (Verify the output) ---
    console.assert(Array.isArray(assignments), "Test FAILED: Response is not an array.");
    console.assert(assignments.length === mockCharacters.length, `Test FAILED: Expected ${mockCharacters.length} assignments, but got ${assignments.length}.`);
    console.assert(assignments.every(a => a.characterId && a.assignedTopicName), "Test FAILED: An assignment object is missing required keys.");

    console.log("\n🎉 All basic topic selection tests passed!");

  } catch (error) {
    console.error("❌ Test FAILED during topic selection execution:", error);
  }
}

// --- 4. Execute the test ---
runTest();