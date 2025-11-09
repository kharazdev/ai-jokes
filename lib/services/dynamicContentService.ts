// in lib/services/dynamicContentService.ts

import { Character } from "@/components/EditCharacterForm";
import { genAIPro } from "../ai/genAI";

// Define the structure for each object in the final JSON array
export interface DynamicJokeBatchResult {
  characterId: number;
  selectedTopic: string;
  jokeContent: string;
}

/**
 * Generates jokes for a batch of characters in a single API call.
 * This is the most advanced technique, combining dynamic trend analysis with a
 * deep, persona-driven joke construction methodology for each character.
 * @param characters - An array of character objects.
 * @returns An array of joke results.
 */
export async function generateCharacterDrivenJokesInBatch(
  characters: Character[],
  isSimpleMode: boolean
): Promise<DynamicJokeBatchResult[]> {

  const characterRoster = characters.map(c =>
    `- Character ID: ${c.id}, Name: ${c.name}, Country: ${c.country}, Persona: "${c.prompt_persona}"`
  ).join('\n');

  // The final, combined "super-prompt"
  let prompt = '';
  if (isSimpleMode) {
    console.log('isSimpleMode is true')
    prompt = `
    Generate a unique, performance-ready joke for each comedian provided in the JSON array below. For each comedian, identify a relevant current topic based on their country and create a joke that perfectly matches their specific comedic persona.

**COMEDIANS:**
${characterRoster}

**REQUIRED OUTPUT:**
Return a single, valid JSON array where each object contains:
- "characterId" (number)
- "selectedTopic" (string)
- "jokeContent" (string)

**EXAMPLE OUTPUT:**
[
  {
    "characterId": 1,
    "selectedTopic": "The rising cost of coffee in Cairo",
    "jokeContent": "My local coffee shop is now charging so much, the barista asked for my three-digit security code. I told him it's the same as the price of a flat white."
  }
]
  `;
  } else {
    console.log('isSimpleMode is false')
    prompt = `
    You are an elite, world-class comedy showrunner. Your sole mission is to generate a flawless, performance-ready joke for every single comedian on your roster, ensuring each joke is a perfect manifestation of their unique comedic voice.

    **COMEDIAN ROSTER:**
    ${characterRoster}

    **YOUR METHODOLOGY (TO BE EXECUTED FOR EACH COMEDIAN INDIVIDUALLY):**
    You must follow this comprehensive, multi-step creative process for each comedian in the roster.

    1.  **Step 1: Dynamic Trend Research.** Based on the comedian's specific country, perform a quick internal search for 3-5 current, joke-worthy trending topics.

    2.  **Step 2: Persona-Driven Topic Selection.** Analyze the comedian's unique persona. From your research, select the SINGLE best "Joke Topic" that will best allow their specific comedic voice to shine.

    3.  **Step 3: Elite Joke Construction.** Now, using the Joke Topic you just selected, you will execute the following deep creative process with intense focus. This is your internal monologue.
        - **a. Persona Deconstruction & Core Engine Identification:** Inhabit the comedian's persona completely. Analyze its core components: What is their central flaw, frustration, or absurd worldview? Identify the single most important element that makes this character funny—this is their "core comedic engine."
        - **b. Joke Forging from the Core:** Using the character's core comedic engine, attack the selected Joke Topic. Forge ONE flawlessly polished, high-impact joke. The joke must spring directly from the persona's core frustrations or absurd logic. It must have a crystal-clear setup and a sharp, surprising punchline. The language, rhythm, and attitude must be absolutely indistinguishable from the comedian's specified persona.

    **FINAL OUTPUT REQUIREMENTS:**
    After completing this entire methodology for ALL comedians, you MUST return your complete work as a single, valid JSON array and nothing else.
    - Each object in the array must correspond to a comedian from the roster.
    - Each object must have exactly three keys: "characterId" (number), "selectedTopic" (string, the topic you chose in Step 2), and "jokeContent" (string, the final joke from Step 3).
    - Do not show your internal research, reasoning, persona deconstruction, or any other text. Your output must be ready for direct machine parsing.

    **EXAMPLE OF A PERFECT FINAL OUTPUT:**
    [
      {
        "characterId": 1,
        "selectedTopic": "The rising cost of coffee in Cairo",
        "jokeContent": "My local coffee shop is now charging so much, the barista asked for my three-digit security code. I told him it's the same as the price of a flat white."
      },
      {
        "characterId": 2,
        "selectedTopic": "New traffic laws in Riyadh",
        "jokeContent": "They installed a new traffic camera that's so advanced, it gave me a ticket for a thought I had about speeding. I'm going to court to fight it... or at least think about fighting it."
      }
    ]
  `;
  }

  try {
    const result: any = await genAIPro.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    if (text.startsWith("```json")) {
      text = text.substring(7, text.length - 3).trim();
    }

    const jokeData: DynamicJokeBatchResult[] = JSON.parse(text);

    if (!Array.isArray(jokeData) || jokeData.some(j => !j.characterId || !j.jokeContent || !j.selectedTopic)) {
      throw new Error("AI returned malformed JSON array.");
    }

    return jokeData;

  } catch (error) {
    console.error(`[DYNAMIC_CONTENT_SERVICE] Failed to generate jokes in batch:`, error);
    return []; // Return an empty array on failure to prevent orchestrator crash
  }
} 