// File: _test-joke-batch.ts
// Purpose: Unit tests the batch joke generation AI service.
// How to run: npx tsx _test-joke-batch.ts

import 'dotenv/config'; // Loads environment variables from .env.local
import { generateJokesInBatch } from "./lib/services/jokeGenerationService"; // Adjust path if needed
import { Character } from "./lib/services/characterService";
import { JobAssignment } from "./lib/services/orchestratorService";

// --- 1. Create Mock Data (Simulates inputs from the database and the topic selection step) ---
const mockCharacters: Character[] = [
  { id: 1, name: "Grumpy Old Man", prompt_persona: "A comedian who complains about modern technology, young people, and everything new.", country: "USA" },
  { id: 2, name: "Witty Tech Bro", prompt_persona: "A comedian who is obsessed with startups, crypto, and Silicon Valley culture. Uses a lot of buzzwords.", country: "USA" },
  { id: 3, name: "Philosophical Poet", prompt_persona: "A comedian who tells jokes in the form of deep, introspective poems about everyday life.", country: "Egypt" },
];

const mockJobPlan: JobAssignment[] = [
    { characterId: 1, assignedTopic: { trend_name: "New Foldable Smartphone Launch", description: "" } },
    { characterId: 2, assignedTopic: { trend_name: "New Foldable Smartphone Launch", description: "" } },
    { characterId: 3, assignedTopic: { trend_name: "Discovery at Giza Pyramids", description: "" } },
];

// --- 2. Define the Asynchronous Test Function ---
async function runTest() {
  console.log("🧪 Starting AI BATCH JOKE GENERATION test...");
  console.log("-----------------------------------------");
  console.log("Mock Job Plan:", mockJobPlan.map(j => `${j.characterId} -> ${j.assignedTopic.trend_name}`));
  console.log("-----------------------------------------");

  try {
    const generatedJokes = await generateJokesInBatch(mockJobPlan, mockCharacters);

    console.log("✅ AI Response Parsed Successfully!");
    console.log("📝 Generated Jokes:");
    console.log(JSON.stringify(generatedJokes, null, 2));

    // --- 3. Assertions (Verify the output) ---
    console.assert(Array.isArray(generatedJokes), "Test FAILED: Response is not an array.");
    console.assert(generatedJokes.length === mockJobPlan.length, `Test FAILED: Expected ${mockJobPlan.length} jokes, but got ${generatedJokes.length}.`);
    console.assert(generatedJokes.every(j => j.characterId && j.jokeContent && j.jokeContent.length > 5), "Test FAILED: A joke object is missing required keys or the content is too short.");

    console.log("\n🎉 All basic joke generation tests passed!");

  } catch (error) {
    console.error("❌ Test FAILED during joke generation execution:", error);
  }
}

// --- 4. Execute the test ---
runTest();