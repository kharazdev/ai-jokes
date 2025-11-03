// in lib/services/orchestratorService.ts

import { Character, getAllActiveCharacters } from './characterService';
import { canMakeWeeklyCall } from '@/lib/rate-limiter';
import { getLatestCachedTrends, triggerTrendGeneration, CountryTrend } from './trendService';
import { selectTopicsInBatch } from './aiStrategyService';
import { generateJokesInBatch } from './jokeGenerationService';
import { saveNewJoke } from './jokePersistenceService'; // Assuming you have this service

// --- Exported Type Definitions for other services to use ---
export interface JobAssignment {
  characterId: number;
  assignedTopic: CountryTrend;
}

export async function runDailyAutonomousJob() {
  console.log("--- Starting Daily Autonomous Job ---");

  try {
    // Step 1: Resiliency Check - Trigger trend generation if needed
    console.log("Step 1: Checking if trend regeneration is needed...");
    const isGenerationAllowed = await canMakeWeeklyCall('generate_daily_trends');
    if (isGenerationAllowed) {
      console.warn("Permission granted! Triggering a new weekly trend generation job in the background.");
      await triggerTrendGeneration();
    } else {
      console.log("Permission denied. Trend data is fresh enough.");
    }

    // Step 2: Fetch Character Roster
    console.log("\nStep 2: Fetching the team roster...");
    const characters = await getAllActiveCharacters();
    if (characters.length === 0) {
      console.warn("No active characters found. Job finished.");
      return;
    }
    console.log(`Successfully fetched ${characters.length} active characters.`);

    // Step 3: Read Cached Trend Report
    console.log("\nStep 3: Reading latest trends report from the database...");
    const allTrends = await getLatestCachedTrends();
    if (!allTrends) {
      console.warn("No cached trends report found. Cannot assign topics. Job finished for today.");
      return;
    }
    console.log(`Successfully loaded trends report for ${Object.keys(allTrends).length} countries.`);

    // Step 4: Create Job Plan (Batch Topic Selection)
    console.log("\nStep 4: Running the assignment meeting to select topics (batch mode)...");
    const charactersWithCountries = characters.filter(c => c.country && allTrends[c.country]);
    const assignments = await selectTopicsInBatch(charactersWithCountries, allTrends);
    if (assignments.length === 0) {
      console.error("AI failed to generate a topic plan. Aborting.");
      return;
    }
    const jobPlan: JobAssignment[] = assignments.map(assignment => {
        const character = characters.find(c => c.id === assignment.characterId)!;
        const trendObject = allTrends[character.country!]?.find(t => t.trend_name === assignment.assignedTopicName);
        return {
            characterId: assignment.characterId,
            assignedTopic: trendObject || { trend_name: assignment.assignedTopicName, description: "" }
        };
    });
    console.log("\n✅ Daily Job Plan Created for", jobPlan.length, "characters.");

    // Step 5: Execute Job Plan (Batch Joke Generation)
    console.log("\nStep 5: Executing the daily job plan to generate jokes (batch mode)...");
    const generatedJokes = await generateJokesInBatch(jobPlan, characters);
    if (generatedJokes.length === 0) {
      console.error("AI failed to generate any jokes. Aborting persistence step.");
      return;
    }
    console.log(`Successfully generated ${generatedJokes.length} new jokes.`);

    // Step 6: Persist New Content
    console.log("\nStep 6: Saving new jokes to the database...");
    let successCount = 0;
    for (const result of generatedJokes) {
      const character = characters.find(c => c.id === result.characterId);
      if (character) {
          await saveNewJoke(character.id, character.name, result.jokeContent);
          successCount++;
      }
    }

    console.log(`\n🎉 Daily job execution complete. Successfully generated and saved ${successCount} out of ${jobPlan.length} potential jokes.`);

  } catch (error) {
    console.error("!!! CRITICAL ERROR in Daily Autonomous Job:", error);
  } finally {
    console.log("--- Daily Autonomous Job Finished ---");
  }
}