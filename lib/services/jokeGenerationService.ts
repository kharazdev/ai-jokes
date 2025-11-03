// in lib/services/jokeGenerationService.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Character } from "./characterService";
import { JobAssignment } from "./orchestratorService"; // This type will be exported from the orchestrator

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCnaTof2kkgrmHfy3lKVJzJpKplHc9-NIg");


// The structure for the data returned by the AI
export interface JokeGenerationResult {
  characterId: number;
  jokeContent: string;
}

/**
 * Generates jokes for an entire job plan in a single batch API call.
 * This is highly efficient for generating content for many characters at once.
 *
 * @param jobPlan - The array of character and topic assignments.
 * @param characters - The full array of character objects for persona context.
 * @returns An array of objects, each containing a characterId and the generated joke.
 */
export async function generateJokesInBatch(
  jobPlan: JobAssignment[],
  characters: Character[]
): Promise<JokeGenerationResult[]> {

  // Step 1: Create a detailed context block for each assignment.
  // This transforms our internal data into a format the AI can easily understand.
  const assignmentsContext = jobPlan.map(job => {
    // Find the full character profile for the current job assignment
    const character = characters.find(c => c.id === job.characterId);
    // If for some reason the character isn't found, skip this entry
    if (!character) return "";
    
    // Return a clean JSON-like string for each assignment
    return `{
      "characterId": ${character.id},
      "characterName": "${character.name}",
      "persona": "${character.prompt_persona}",
      "assignedTopic": "${job.assignedTopic.trend_name}"
    }`;
  }).filter(Boolean).join(',\n'); // filter(Boolean) removes any empty strings

  // Step 2: Construct the single, powerful batch prompt.
  const prompt = `
    You are a master comedian writing jokes for a diverse team of performers.
    Your task is to generate one original joke for each assignment in the provided JSON array of assignments.

    **ASSIGNMENTS LIST:**
    [
      ${assignmentsContext}
    ]

    **YOUR INSTRUCTIONS:**
    1.  For each assignment, carefully read the character's unique persona and their assigned topic.
    2.  Generate a single, new, original joke that perfectly matches their specific style of humor and is directly about their assigned topic.
    3.  You MUST return your complete work as a single, valid JSON array and nothing else. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json.

    **REQUIRED JSON OUTPUT FORMAT:**
    The output must be an array of objects. Each object must have exactly two keys:
    - "characterId": The integer ID of the character.
    - "jokeContent": The string containing the generated joke text.

    Here is a perfect example of the required output format:
    [
      {
        "characterId": 1,
        "jokeContent": "Why do these new phones fold? So they can look twice as disappointed in you when you drop them."
      },
      {
        "characterId": 2,
        "jokeContent": "This new foldable isn't a feature, it's a pivot. We're disrupting the pocket dimension."
      }
    ]
  `;

  // Step 3: Make the single API call and process the response.
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result: any = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    // Clean the response to remove potential Markdown wrappers
    if (text.startsWith("```json")) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith("```")) {
      text = text.substring(3, text.length - 3).trim();
    }

    const jokes: JokeGenerationResult[] = JSON.parse(text);

    // Final validation
    if (!Array.isArray(jokes) || jokes.some(j => !j.characterId || !j.jokeContent)) {
        throw new Error("AI returned a malformed JSON array for joke generation.");
    }
    
    return jokes;

  } catch (error) {
    console.error("[JOKE_GENERATION_BATCH] Failed to generate jokes in batch:", error);
    return []; // Return an empty array on failure to prevent crashing the orchestrator
  }
}