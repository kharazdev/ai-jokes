// in lib/services/aiStrategyService.ts

import { genAIPro } from "../ai/genAI";
import { AllTrendsData, CountryTrend } from "./trendService";
import { Character } from "@/components/EditCharacterForm";



// This is the structure we will ask the AI to return
export interface TopicAssignment {
  characterId: number;
  assignedTopicName: string;
}

/**
 * Uses a single LLM call to select the best topic for an entire list of characters.
 * @param characters - The full list of character objects.
 * @param allTrends - The object containing trends for all relevant countries.
 * @returns An array of topic assignments.
 */
export async function selectTopicsInBatch(
  characters: Character[],
  allTrends: AllTrendsData
): Promise<TopicAssignment[]> {
  // 1. Prepare the input data for the prompt
  const characterProfiles = characters
    .map(c => `- Character ID ${c.id}: ${c.name}, Persona: "${c.prompt_persona}", Country: ${c.country}`)
    .join('\n');

  const trendsByCountry = JSON.stringify(allTrends, null, 2);

  // 2. Construct the single, powerful batch prompt
  const prompt = `
    You are a strategic comedy manager. Your task is to create a full content plan for your entire team of comedians.

    **YOUR TEAM ROSTER:**
    ${characterProfiles}

    **TODAY'S TRENDS REPORT (by country):**
    ${trendsByCountry}

    **YOUR INSTRUCTIONS:**
    1.  For each character in the roster, analyze their unique persona and country.
    2.  Look at the trends report for their specific country.
    3.  Choose the SINGLE best trend for that character. The trend should be the one that would be the most hilarious or fitting for their specific style.
    4.  You MUST return your complete plan as a single, valid JSON array and nothing else. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json.

    **REQUIRED JSON OUTPUT FORMAT:**
    The output must be an array of objects. Each object must have exactly two keys:
    - "characterId": The integer ID of the character.
    - "assignedTopicName": The string value of the "trend_name" you selected for them.

    Here is a perfect example of the required output format:
    [
      {
        "characterId": 1,
        "assignedTopicName": "الانتقال السياسي وجهود الحكومة الجديدة"
      },
      {
        "characterId": 2,
        "assignedTopicName": "أسعار الذهب تسجل رقماً قياسياً"
      }
    ]
  `;

  // 3. Make the single API call
  try {
    const result: any = await genAIPro.generateContent(prompt);

    const response = result.response;
    let text = response.text().trim(); // <-- Make this 'let' instead of 'const'

    // 4. Clean the response to remove Markdown wrappers
    //    This is the NEW, CRITICAL step.
    if (text.startsWith("```json")) {
      text = text.substring(7, text.length - 3).trim(); // Remove ```json at the start and ``` at the end
    } else if (text.startsWith("```")) {
      text = text.substring(3, text.length - 3).trim(); // Handle just the backticks
    }

    // 5. Parse and validate the CLEANED JSON response
    const assignments: TopicAssignment[] = JSON.parse(text);

    // Basic validation to ensure we got back what we expected
    if (!Array.isArray(assignments) || assignments.some(a => !a.characterId || !a.assignedTopicName)) {
      throw new Error("AI returned malformed JSON data after cleaning.");
    }

    return assignments;
  } catch (error) {
    console.error("[AI_STRATEGY_BATCH] Failed to select topics in batch:", error);
    // Return an empty array on failure so the orchestrator doesn't crash
    return [];
  }
}