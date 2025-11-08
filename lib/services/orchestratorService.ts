// in lib/services/orchestratorService.ts

import { getAllActiveCharacters, getActiveCharactersByCategory } from './characterService';
import { canMakeWeeklyCall } from '@/lib/rate-limiter';
import { getLatestCachedTrends, triggerTrendGeneration, CountryTrend } from './trendService';
import { selectTopicsInBatch } from './aiStrategyService';
import { generateJokesInBatch } from './jokeGenerationService';
import { saveNewJoke } from './jokePersistenceService';
import { generateCharacterDrivenJokesInBatch } from './dynamicContentService'; // Import the new smart batch function

// --- Exported Type Definitions ---
export interface JobAssignment {
  characterId: number;
  assignedTopic: CountryTrend;
}


// --- TECHNIQUE 1: Original Batch Job (Fast, relies on pre-cached trends) ---

export async function runDailyAutonomousJob() {
  console.log("--- Starting Daily Autonomous Job (Cached Trends) ---");
  // This function remains unchanged and represents your first technique.
  try {
    console.log("Step 1: Checking if trend regeneration is needed...");
    const isGenerationAllowed = await canMakeWeeklyCall('generate_daily_trends');
    if (isGenerationAllowed) {
      console.warn("Permission granted! Triggering a new weekly trend generation job in the background.");
      await triggerTrendGeneration();
    } else {
      console.log("Permission denied. Trend data is fresh enough.");
    }

    console.log("\nStep 2: Fetching the team roster...");
    const characters = await getAllActiveCharacters();
    if (characters.length === 0) {
      console.warn("No active characters found. Job finished.");
      return;
    }
    console.log(`Successfully fetched ${characters.length} active characters.`);

    console.log("\nStep 3: Reading latest trends report from the database...");
    const allTrends = await getLatestCachedTrends();
    if (!allTrends) {
      console.warn("No cached trends report found. Cannot assign topics. Job finished for today.");
      return;
    }
    console.log(`Successfully loaded trends report for ${Object.keys(allTrends).length} countries.`);

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

    console.log("\nStep 5: Executing the daily job plan to generate jokes (batch mode)...");
    const generatedJokes = await generateJokesInBatch(jobPlan, characters);
    if (generatedJokes.length === 0) {
      console.error("AI failed to generate any jokes. Aborting persistence step.");
      return;
    }
    console.log(`Successfully generated ${generatedJokes.length} new jokes.`);

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


// --- TECHNIQUE 2: Smart, Context-Aware Job (Efficient single-call batch mode) ---
const ADULT_JOKES_CATEGORY_ID = 6;

export async function runSmartAutonomousJob(categoryId: number = ADULT_JOKES_CATEGORY_ID) {
  console.log("--- Starting Smart Autonomous Job (Dynamic Batch Mode) ---");
 
  try {
    // Step 1: Fetch a specific roster of characters
    console.log(`\nStep 1: Fetching characters from category ${categoryId}...`);
    const characters = await getActiveCharactersByCategory(categoryId);
    
    if (characters.length === 0) {
      console.warn(`No active characters found for category ${categoryId}. Job finished.`);
      return;
    }
    console.log(`Successfully fetched ${characters.length} characters.`);

    // Step 2: Generate all content in a single, powerful API call
    console.log("\nStep 2: Generating dynamic content for all characters in a single batch call...");
    const results = await generateCharacterDrivenJokesInBatch(characters);

    if (results.length === 0) {
        console.error("AI failed to generate any content in batch mode. Aborting job.");
        return;
    }
    console.log(`Successfully generated content for ${results.length} characters.`);

    // Step 3: Persist all the new content
    console.log("\nStep 3: Saving new jokes to the database...");
    let successCount = 0;
    for (const result of results) {
      const character = characters.find(c => c.id === result.characterId);
      if (character) {
          console.log(`   -> Saving joke for ${character.name} (Topic: ${result.selectedTopic})`);
          await saveNewJoke(character.id, character.name, result.jokeContent);
          successCount++;
      }
    }

    console.log(`\n🎉 Smart job execution complete. Successfully generated and saved ${successCount} out of ${characters.length} potential jokes.`);

  } catch (error) {
    console.error("!!! CRITICAL ERROR in Smart Autonomous Job:", error);
  } finally {
    console.log("--- Smart Autonomous Job Finished ---");
  }
}

// // in lib/services/orchestratorService.ts

// import { getActiveCharactersByCategory, getAllActiveCharacters } from './characterService';
// import { canMakeWeeklyCall } from '@/lib/rate-limiter';
// import { getLatestCachedTrends, triggerTrendGeneration, CountryTrend } from './trendService';
// import { selectTopicsInBatch } from './aiStrategyService';
// import { generateJokesInBatch } from './jokeGenerationService';
// import { saveNewJoke } from './jokePersistenceService'; // Assuming you have this service
// import { generateCharacterDrivenJoke } from './dynamicContentService';

// // --- Exported Type Definitions for other services to use ---
// export interface JobAssignment {
//   characterId: number;
//   assignedTopic: CountryTrend;
// }

// export async function runDailyAutonomousJob() {
//   console.log("--- Starting Daily Autonomous Job ---");

//   try {
//     // Step 1: Resiliency Check - Trigger trend generation if needed
//     console.log("Step 1: Checking if trend regeneration is needed...");
//     const isGenerationAllowed = await canMakeWeeklyCall('generate_daily_trends');
//     if (isGenerationAllowed) {
//       console.warn("Permission granted! Triggering a new weekly trend generation job in the background.");
//       await triggerTrendGeneration();
//     } else {
//       console.log("Permission denied. Trend data is fresh enough.");
//     }

//     // Step 2: Fetch Character Roster
//     console.log("\nStep 2: Fetching the team roster...");
//     const characters = await getAllActiveCharacters();
//     if (characters.length === 0) {
//       console.warn("No active characters found. Job finished.");
//       return;
//     }
//     console.log(`Successfully fetched ${characters.length} active characters.`);

//     // Step 3: Read Cached Trend Report
//     console.log("\nStep 3: Reading latest trends report from the database...");
//     const allTrends = await getLatestCachedTrends();
//     if (!allTrends) {
//       console.warn("No cached trends report found. Cannot assign topics. Job finished for today.");
//       return;
//     }
//     console.log(`Successfully loaded trends report for ${Object.keys(allTrends).length} countries.`);

//     // Step 4: Create Job Plan (Batch Topic Selection)
//     console.log("\nStep 4: Running the assignment meeting to select topics (batch mode)...");
//     const charactersWithCountries = characters.filter(c => c.country && allTrends[c.country]);
//     const assignments = await selectTopicsInBatch(charactersWithCountries, allTrends);
//     if (assignments.length === 0) {
//       console.error("AI failed to generate a topic plan. Aborting.");
//       return;
//     }
//     const jobPlan: JobAssignment[] = assignments.map(assignment => {
//         const character = characters.find(c => c.id === assignment.characterId)!;
//         const trendObject = allTrends[character.country!]?.find(t => t.trend_name === assignment.assignedTopicName);
//         return {
//             characterId: assignment.characterId,
//             assignedTopic: trendObject || { trend_name: assignment.assignedTopicName, description: "" }
//         };
//     });
//     console.log("\n✅ Daily Job Plan Created for", jobPlan.length, "characters.");

//     // Step 5: Execute Job Plan (Batch Joke Generation)
//     console.log("\nStep 5: Executing the daily job plan to generate jokes (batch mode)...");
//     const generatedJokes = await generateJokesInBatch(jobPlan, characters);
//     if (generatedJokes.length === 0) {
//       console.error("AI failed to generate any jokes. Aborting persistence step.");
//       return;
//     }
//     console.log(`Successfully generated ${generatedJokes.length} new jokes.`);

//     // Step 6: Persist New Content
//     console.log("\nStep 6: Saving new jokes to the database...");
//     let successCount = 0;
//     for (const result of generatedJokes) {
//       const character = characters.find(c => c.id === result.characterId);
//       if (character) {
//           await saveNewJoke(character.id, character.name, result.jokeContent);
//           successCount++;
//       }
//     }

//     console.log(`\n🎉 Daily job execution complete. Successfully generated and saved ${successCount} out of ${jobPlan.length} potential jokes.`);

//   } catch (error) {
//     console.error("!!! CRITICAL ERROR in Daily Autonomous Job:", error);
//   } finally {
//     console.log("--- Daily Autonomous Job Finished ---");
//   }
// }

// export async function runSmartAutonomousJob() {
//   console.log("--- Starting Smart Autonomous Job (Context-Aware) ---");
//   const categoryId = 6;

//   try {
//     // Step 1: Fetch a specific roster of characters
//     console.log(`\nStep 1: Fetching characters from category ${categoryId}...`);
//     const characters = await getActiveCharactersByCategory(categoryId);
    
//     if (characters.length === 0) {
//       console.warn(`No active characters found for category ${categoryId}. Job finished.`);
//       return;
//     }
//     console.log(`Successfully fetched ${characters.length} characters.`);

//     // Step 2: Process each character individually
//     console.log("\nStep 2: Beginning dynamic content generation for each character...");
//     let successCount = 0;
//     for (const character of characters) {
//       console.log(`\n--- Processing: ${character.name} in ${character.country} ---`);
      
//       // Use a try/catch for each character so that one failure doesn't stop the whole process
//       try {
//         // Step 2a: Call the dynamic generation service
//         const result = await generateCharacterDrivenJoke(character);

//         if (result) {
//           console.log(`   -> [AI] Selected Topic: "${result.selectedTopic}"`);
//           console.log(`   -> [AI] Generated Joke: "${result.jokeContent}"`);

//           // Step 2b: Persist the new content
//           await saveNewJoke(character.id, character.name, result.jokeContent);
//           successCount++;
//         } else {
//           console.error(`   -> ❌ AI failed to generate content for ${character.name}.`);
//         }
//       } catch (error) {
//         console.error(`   -> ❌ CRITICAL ERROR while processing ${character.name}:`, error);
//       }
//     }

//     console.log(`\n🎉 Smart job execution complete. Successfully generated and saved ${successCount} out of ${characters.length} potential jokes.`);

//   } catch (error) {
//     console.error("!!! CRITICAL ERROR in Smart Autonomous Job:", error);
//   } finally {
//     console.log("--- Smart Autonomous Job Finished ---");
//   }
// }