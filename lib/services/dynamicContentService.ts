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
  characters: Character[]
): Promise<DynamicJokeBatchResult[]> {

  const characterRoster = characters.map(c => 
    `- Character ID: ${c.id}, Name: ${c.name}, Country: ${c.country}, Persona: "${c.prompt_persona}"`
  ).join('\n');

  // The final, combined "super-prompt"
  const prompt = `
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

// // in lib/services/dynamicContentService.ts

// import { Character } from "@/components/EditCharacterForm";
// import { genAIPro } from "../ai/genAI";

// // Define the structure of the successful response from the AI
// export interface DynamicJokeResult {
//   selectedTopic: string;
//   jokeContent: string;
// }

// /**
//  * Generates a joke for a single character by dynamically finding trends,
//  * selecting the best topic, and writing the joke in one intelligent step.
//  * @param character - The character object to generate content for.
//  * @returns An object containing the joke and the topic it was based on.
//  */
// export async function generateCharacterDrivenJoke(
//   character: Character
// ): Promise<DynamicJokeResult | null> {

//   // The core of the new technique: a multi-step, contextual prompt.
// //  const prompt = `
// //     You are a world-class comedy writer, a master of voice, and a razor-sharp cultural commentator. Your sole purpose is to execute a masterclass in joke creation for a specific comedian, resulting in a single, performance-ready piece of material.

// //     **COMEDIAN PROFILE:**
// //     - **Name:** ${character.name}
// //     - **Country:** ${character.country}
// //     - **Persona:** "${character.prompt_persona}"

// //     **YOUR METHODOLOGY (INTERNAL THOUGHT PROCESS):**
// //     You must follow these steps with rigorous creative discipline. Steps 1 and 2 are your internal creative process and MUST NOT be included in the final output.

// //     1.  **Step 1: Deep-Dive Trend Analysis.** Based on the comedian's country (${character.country}), identify 3-5 specific and recent cultural absurdities, widespread social frustrations, or quirky local news stories that are ripe for comedy. These topics must have inherent tension or irony and be subjects that a person with the comedian's persona would genuinely notice and have a strong opinion on.

// //     2.  **Step 2: Strategic Topic & Angle Selection.** From your research, select the SINGLE most potent topic. You must then define the specific comedic angle that makes it a perfect match for the comedian's persona. Your internal, one-sentence justification must answer: "What is the unique, funny perspective that only this comedian could have on this topic?"

// //     3.  **Step 3: Elite Joke Construction.** Forge one flawlessly polished, high-impact joke on the selected topic. This joke is not merely "good"; it is a masterclass in comedic writing.
// //         - **Structure:** It must have a crystal-clear setup and a sharp, surprising punchline that subverts expectations.
// //         - **Voice:** The language, rhythm, and attitude must be absolutely indistinguishable from the comedian's specified persona.
// //         - **Quality:** It must be original and avoid all generic, cliché, or predictable humor. The goal is a joke that is both intelligent and hilarious.

// //     **FINAL OUTPUT REQUIREMENTS:**
// //     You are required to return your response as a single, perfectly valid JSON object.
// //     - It MUST contain exactly two keys: "selectedTopic" and "jokeContent".
// //     - There must be absolutely no other text, explanation, or markdown formatting outside of this JSON object. Your entire output must be the raw JSON itself.

// //     **EXAMPLE OF A PERFECT FINAL OUTPUT:**
// //     {
// //       "selectedTopic": "The new city-wide initiative to use AI for traffic management in Lagos",
// //       "jokeContent": "Lagos is using AI to solve our traffic problem. The AI took one look at the Lekki-Epe Expressway at 5 PM, went completely silent for two hours, and then just sent a text to the entire city saying, 'Honestly? You people are on your own.'"
// //     }
// //   `;


// const prompt = `
//     You are a world-class comedy writer and a master of character voice. Your sole mission is to inhabit the mind of a specific comedian and generate a single, flawless, performance-ready joke from their unique perspective on a given topic.

//     **COMEDIAN PROFILE:**
//     - **Name:** ${character.name}
//     - **Persona:** "${character.prompt_persona}"

//     **YOUR METHODOLOGY (INTERNAL THOUGHT PROCESS):**
//     You must execute the following creative process with intense focus. This is your internal monologue and MUST NOT be included in the final output.

//     1.  **Step 1: Persona Deconstruction & Core Engine Identification.** Inhabit the persona completely. Analyze its core components: What is their central flaw, frustration, or absurd worldview? What is their unique rhythm and vocabulary? Identify the single most important element that makes this character funny—this is their "core comedic engine."

//     2.  **Step 2: Elite Joke Construction from the Core.** Using the character's core comedic engine, attack the provided "Joke Topic." Forge ONE flawlessly polished, high-impact joke. This joke is not just in character; it is a perfect manifestation of their worldview.
//         - **Origin:** The joke must spring directly from the persona's core frustrations, biases, or absurd logic.
//         - **Structure:** It must have a crystal-clear setup and a sharp, surprising punchline that feels both unexpected and inevitable coming from this specific character.
//         - **Voice:** The language, rhythm, and attitude must be absolutely indistinguishable from the comedian's specified persona. It should feel like a line taken directly from their hit special.

//     **FINAL OUTPUT REQUIREMENTS:**
//     You are required to return your response as a single, perfectly valid JSON object.
//     - It MUST contain exactly one key: "jokeContent".
//     - There must be absolutely no other text, conversational filler, or markdown formatting in your response. Your entire output must be the raw JSON object itself.

//     **EXAMPLE OF A PERFECT FINAL OUTPUT:**
//     {
//       "jokeContent": "My landlord says he's 'eco-friendly' because he hasn't turned the heating on since 2018. I'm not saving the planet, I'm evolving. I can now see my own breath and tell you the barometric pressure."
//     }
//   `;
//   try {
//     const result: any = await genAIPro.generateContent(prompt);
//     const response = result.response;
//     let text = response.text().trim();

//     if (text.startsWith("```json")) {
//       text = text.substring(7, text.length - 3).trim();
//     }

//     const jokeData: DynamicJokeResult = JSON.parse(text);

//     // Validate the response
//     if (!jokeData.jokeContent || !jokeData.selectedTopic) {
//       throw new Error("AI returned malformed JSON data.");
//     }

//     return jokeData;

//   } catch (error) {
//     console.error(`[DYNAMIC_CONTENT_SERVICE] Failed to generate joke for ${character.name}:`, error);
//     return null; // Return null on failure for this character
//   }
// }

