'use server';

import { Character } from "@/components/EditCharacterForm";
import { genAIPro } from "../ai/genAI";
import { serverEvents } from '../webSocketServer';

// This interface defines the shape of the data this service returns.
// It's identical to the one in dynamicContentService for consistency.
export interface HighVolumeJokeResult {
  characterId: number;
  selectedTopic: string;
  jokeContent: string;
}

/**
 * Generates a very large batch of jokes (e.g., 100) for a single character.
 * This service is specialized for high-volume, persona-driven content creation.
 * 
 * NOTE: This service does NOT interact with the database. It only calls the AI model.
 * The orchestrator is responsible for fetching character data before calling this
 * and persisting the results after.
 * 
 * @param character - The single character object to generate a wealth of content for.
 * @returns An array of joke results.
 */
export async function generateHighVolumeJokesForCharacter(
  character: Character
): Promise<HighVolumeJokeResult[]> {
  console.log(`[HIGH_VOLUME_SERVICE] Starting generation for Character ID: ${character.id}`);
  console.log({ character })
  // to add prompt_topics
    serverEvents.emit('job-progress', `[HIGH_VOLUME_SERVICE] Starting generation for Character ID: ${character.id}`);

  const prompt = `
You are a master comedy writer and character specialist. Your sole mission is to generate one hundred (100) professional-quality jokes that are deeply and authentically rooted in the specified comedian's persona.
COMEDIAN PROFILE:
Character ID: ${character.id}
Name: ${character.name}
Bio: ${character.bio}
Core Persona & Comedic Engine: "${character.prompt_persona}"
Key Thematic Pillars (prompt_topics): ${JSON.stringify(character.prompt_topics)}
YOUR METHODOLOGY (Follow Precisely):
Step 1: Deconstruct the Persona's Comedic Engine. First, perform a deep internal analysis of the Core Persona & Comedic Engine. Pinpoint the central source of their humor (e.g., their arrogance, insecurity, illogical confidence, perpetual disappointment). This is the lens through which all jokes must be written.
Step 2: Thematic Brainstorming. Your task is to generate exactly twenty (20) distinct and specific topics. You MUST use the Key Thematic Pillars provided above as your primary inspiration. Your 20 brainstormed topics should be specific situations, modern scenarios, or concrete subjects that are examples of these broader themes. For each topic, you must internally confirm: "How does this specific situation activate the character's comedic engine?"
Example: If a Thematic Pillar is "Exposing stinginess and greed," a good specific topic might be "Trying to split a restaurant bill with a mathematician" or "The absurdity of in-app purchases."
Step 3: High-Quality, Engine-Driven Joke Generation. Generate exactly one hundred (100) unique jokes by creating five (5) jokes for each of the 20 topics you brainstormed in Step 2. Adhere to these critical quality guidelines for every joke:
Engine-Powered: The punchline of every joke MUST be a direct result of the character's core comedic engine. The audience should think, "Of course, that's how they would see it."
Vary Your Angle: Within the 5 jokes for a single topic, attack it from different angles (e.g., exaggeration, misinterpretation, expressing frustration, flawed logic). Do not just rephrase the same basic idea.
Avoid Generic Jokes: Each joke must be a specific observation filtered through the character's unique worldview. If any other comedian could tell the same joke, it is a failure.
FINAL OUTPUT REQUIREMENTS:
You MUST return your complete work as a single, valid JSON array. Do not include any other text, explanations, or analysis.
The array MUST contain exactly 100 objects.
Each object must have exactly three keys:
characterId (number, which MUST be ${character.id})
selectedTopic (string, one of the 20 specific topics from your brainstorm)
jokeContent (string, the final, polished joke that is indistinguishable from the character's voice)
EXAMPLE OF A PERFECT FINAL OUTPUT:
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

  //   const prompt = `
  // You are a master comedy writer and character specialist. Your sole mission is to generate one hundred (100) professional-quality jokes that are deeply and authentically rooted in the specified comedian's persona.
  // COMEDIAN PROFILE:
  // Character ID: ${character.id}
  // Name: ${character.name}
  // Bio: ${character.bio}
  // Core Persona & Comedic Engine: "${character.prompt_persona}"
  // YOUR METHODOLOGY (Follow Precisely):
  // Step 1: Deconstruct the Persona's Comedic Engine. Before brainstorming, perform a deep internal analysis of the Core Persona & Comedic Engine. Pinpoint the central source of their humor. Is it their arrogance? Their insecurity? Their illogical confidence? Their perpetual disappointment? This is the lens through which all jokes must be written.
  // Step 2: Brainstorm Comedically Potent Topics. Generate exactly twenty (20) distinct topics that are specifically chosen to activate the character's comedic engine. For each topic, you must internally confirm: "Why would this specific topic be frustrating, confusing, or absurd to this character?" The topics must serve as perfect launching pads for their unique brand of humor.
  // Step 3: High-Quality, Engine-Driven Joke Generation. Generate exactly one hundred (100) unique jokes by creating five (5) jokes for each of the 20 topics. Adhere to these critical quality guidelines for every joke:
  // Engine-Powered: The punchline of every joke MUST be a direct result of the character's core comedic engine you identified in Step 1. The audience should think, "Of course, that's how they would see it."
  // Vary Your Angle: Within the 5 jokes for a single topic, attack it from different angles (e.g., exaggeration, misinterpretation, expressing frustration, flawed logic). Do not just rephrase the same basic idea.
  // Avoid Generic Jokes: Each of the 100 jokes must be a specific observation filtered through the character's unique worldview. If another comedian could tell the same joke, it's a failure.
  // FINAL OUTPUT REQUIREMENTS:
  // You MUST return your complete work as a single, valid JSON array. Do not include any other text, explanations, or analysis.
  // The array MUST contain exactly 100 objects.
  // Each object must have exactly three keys:
  // characterId (number, which MUST be ${character.id})
  // selectedTopic (string, one of the 20 topics from your brainstorm)
  // jokeContent (string, the final, polished joke that is indistinguishable from the character's voice)
  // EXAMPLE OF A PERFECT FINAL OUTPUT:
  // [
  // {
  // "characterId": 1,
  // "selectedTopic": "The rising cost of coffee in Cairo",
  // "jokeContent": "My local coffee shop is now charging so much, the barista asked for my three-digit security code. I told him it's the same as the price of a flat white."
  // },
  // {
  // "characterId": 2,
  // "selectedTopic": "New traffic laws in Riyadh",
  // "jokeContent": "They installed a new traffic camera that's so advanced, it gave me a ticket for a thought I had about speeding. I'm going to court to fight it... or at least think about fighting it."
  // }
  // ]
  // `;

  //   const prompt = `
  // You are a master comedy writer and character specialist. Your task is to generate one hundred (100) jokes for a specific comedian, ensuring each joke is deeply rooted in their unique persona and of professional quality.
  // COMEDIAN PROFILE:
  // Character ID: ${character.id}
  // Name: ${character.name}
  // Bio: ${character.bio}
  // Core Persona & Comedic Engine: "${character.prompt_persona}"
  // YOUR METHODOLOGY (Follow Precisely):
  // Step 1: Deconstruct the Persona. Before writing, internally analyze the Core Persona & Comedic Engine. Identify the following key elements:
  // Worldview: How do they see the world? (e.g., cynical, naive, arrogant, perpetually confused)
  // Core Flaw/Frustration: What is their central comedic flaw or the thing that constantly frustrates them? This is the engine for most of the jokes.
  // Voice & Tone: How do they speak? (e.g., deadpan, high-energy, intellectual, folksy). What is their typical sentence structure?
  // Forbidden Territory: What would this character never joke about or what kind of joke structure would they avoid?
  // Step 2: Strategic Topic Selection. Based on your persona analysis, brainstorm 5-10 topics that are perfect targets for this character's specific worldview and frustrations. The topics should feel natural for the character to be thinking and talking about.
  // Step 3: High-Quality Joke Generation. Generate exactly one hundred (100) unique jokes distributed across your selected topics. Adhere to these critical quality guidelines for every joke:
  // Engine-Powered: Every joke's humor MUST originate from the character's core flaw or worldview you identified in Step 1. The joke should be one that only this character could tell.
  // Vary Your Angle: For each topic, create jokes from different emotional or logical angles: exaggeration (hyperbole), understatement, unexpected comparisons (analogies), misinterpretation, or expressions of their core frustration.
  // Avoid Genericism: Do not write generic, stock punchlines. Each joke must be a specific observation filtered through the character's unique lens. Ensure each of the 100 jokes is distinct and stands on its own.
  // FINAL OUTPUT REQUIREMENTS:
  // You MUST return your complete work as a single, valid JSON array. Do not include any other text, explanations, or analysis in your response.
  // The array MUST contain exactly 100 objects.
  // Each object must have exactly three keys:
  // characterId (number, which MUST be ${character.id})
  // selectedTopic (string, the topic from your brainstorm)
  // jokeContent (string, the final, polished joke that is indistinguishable from the character's voice)
  // EXAMPLE OF A PERFECT FINAL OUTPUT:
  // [
  // {
  // "characterId": 1,
  // "selectedTopic": "The rising cost of coffee in Cairo",
  // "jokeContent": "My local coffee shop is now charging so much, the barista asked for my three-digit security code. I told him it's the same as the price of a flat white."
  // },
  // {
  // "characterId": 2,
  // "selectedTopic": "New traffic laws in Riyadh",
  // "jokeContent": "They installed a new traffic camera that's so advanced, it gave me a ticket for a thought I had about speeding. I'm going to court to fight it... or at least think about fighting it."
  // }
  // ]
  // `;

  // const prompt = `
  //   You are an elite, world-class comedy showrunner with a singular, high-stakes mission: to generate a massive volume of one hundred (100) high performance-ready jokes for a single, specific comedian. Quality and quantity are paramount.

  //   **COMEDIAN PROFILE:**
  //   - Character ID: ${character.id}
  //   - Name: ${character.name}
  //   - Bio: ${character.bio}
  //   - Persona: "${character.prompt_persona}"

  //   **YOUR METHODOLOGY (STRICTLY FOLLOW):**
  //   1.  **Step 1: Deep Persona Analysis & Topic Brainstorm.** Inhabit the comedian's persona completely. Based on their country and detailed persona, brainstorm 5-10 diverse, joke-worthy topics. These topics must have enough depth and breadth to generate multiple, distinct comedic angles.
  //   2.  **Step 2: High-Volume Joke Forging.** Your primary task is to generate a total of ONE HUNDRED (100) unique jokes, intelligently distributed across the topics you brainstormed in Step 1.
  //       - **Vary the Attack:** For each topic, attack it from multiple angles using the character's core comedic engine (their central flaw, frustration, or absurd worldview).
  //       - **Ensure Distinction:** Each of the 100 jokes must stand on its own and be individually funny. They must all be absolutely indistinguishable from the comedian's specified persona.

  //   **FINAL OUTPUT REQUIREMENTS:**
  //   - You MUST return your complete work as a single, valid JSON array and nothing else.
  //   - The array must contain exactly 100 objects.
  //   - Each object in the array represents a single joke and must have exactly three keys:
  //     - "characterId" (number, which MUST be ${character.id})
  //     - "selectedTopic" (string, the relevant topic for that specific joke from your brainstorm)
  //     - "jokeContent" (string, the final, polished joke)
  //   - Do not include your internal research, reasoning, or any other text. Your output must be ready for direct machine parsing.

  //    **EXAMPLE OF A PERFECT FINAL OUTPUT:**
  //   [
  //     {
  //       "characterId": 1,
  //       "selectedTopic": "The rising cost of coffee in Cairo",
  //       "jokeContent": "My local coffee shop is now charging so much, the barista asked for my three-digit security code. I told him it's the same as the price of a flat white."
  //     },
  //     {
  //       "characterId": 2,
  //       "selectedTopic": "New traffic laws in Riyadh",
  //       "jokeContent": "They installed a new traffic camera that's so advanced, it gave me a ticket for a thought I had about speeding. I'm going to court to fight it... or at least think about fighting it."
  //     }
  //   ]
  //   `;

  try {
    const result: any = await genAIPro.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    if (text.startsWith("```json")) {
      text = text.substring(7, text.length - 3).trim();
    }

    const jokeData: HighVolumeJokeResult[] = JSON.parse(text);

    if (!Array.isArray(jokeData) || jokeData.some(j => !j.characterId || !j.jokeContent || !j.selectedTopic)) {
      throw new Error("AI returned malformed JSON data for high-volume generation.");
    }

    console.log(`[HIGH_VOLUME_SERVICE] Successfully generated ${jokeData.length} jokes for Character ID: ${character.id}`);
    return jokeData;

  } catch (error) {
    console.error(`[HIGH_VOLUME_SERVICE] Failed to generate 100 jokes for character ${character.id}:`, error);
    return [];
  }
}