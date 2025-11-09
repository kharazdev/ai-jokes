// in lib/services/jokeGenerationService.ts

import { genAIPro } from "../ai/genAI";
import { JobAssignment } from "./orchestratorService";
import { Character } from "@/components/EditCharacterForm";

export interface JokeGenerationResult {
  characterId: number;
  jokeContent: string;
  // Note: selectedTopic from simple mode will be generated but not returned
  // to keep the function's return type consistent.
  selectedTopic?: string;
}

export async function generateJokesInBatch(
  jobPlan: JobAssignment[],
  characters: Character[],
  isSimpleMode: boolean
): Promise<JokeGenerationResult[]> {

  let assignmentsContext: string;
  let prompt: string;

  if (isSimpleMode) {
    console.log('isSimpleMode is true')
    // --- SIMPLE MODE ---
    // Context does NOT include an assigned topic.
    // It maps over all characters directly.
    assignmentsContext = characters.map(character => {
      // NOTE: Assumes your Character type includes a 'country' property.
      // If not, you may need to adjust this part.
      if (!character) return "";
      return `{
        "characterId": ${character.id},
        "characterName": "${character.name}",
        "persona": "${character.prompt_persona}",
       }`;
    }).filter(Boolean).join(',\n');
    console.log('isSimpleMode is false')

    // Prompt is a direct command, asking the AI to find a topic AND write the joke.
    prompt = `
      You are a comedy writer. For each comedian in the JSON roster below, select a single relevant topic based on their country and write one high-quality joke that perfectly fits their persona.

      **COMEDIAN ROSTER:**
      [
        ${assignmentsContext}
      ]

      **FINAL OUTPUT REQUIREMENTS:**
      Return your work as a single, valid JSON array and nothing else.
      Each object in the array must have exactly three keys: "characterId" (number), "selectedTopic" (string), and "jokeContent" (string).

      **EXAMPLE OUTPUT:**
      [
        {
          "characterId": 1,
          "selectedTopic": "Recent rise in grocery prices",
          "jokeContent": "The price of olive oil is so high, my salad dressing is now considered a long-term investment. I'm diversifying my portfolio with balsamic."
        }
      ]
    `;

  } else {
    // --- ADVANCED MODE (Original Logic) ---
    // Context includes the pre-assigned topic from the job plan.
    assignmentsContext = jobPlan.map(job => {
      const character = characters.find(c => c.id === job.characterId);
      if (!character) return "";
      
      return `{
        "characterId": ${character.id},
        "characterName": "${character.name}",
        "persona": "${character.prompt_persona}",
        "assignedTopic": "${job.assignedTopic.trend_name}"
      }`;
    }).filter(Boolean).join(',\n');

    // Prompt is the original, detailed, multi-step prompt.
    prompt = `
      You are an elite comedy writer and a meticulous editor, tasked with creating top-tier material for a team of comedians. Quality is your only metric. Do not rush. Think deeply.

      **YOUR METHODOLOGY FOR EACH ASSIGNMENT:**
      You will follow a strict, internal, multi-step process for each character:
      1.  **Step 1: Deep Analysis.** Read the character's persona and assigned topic. Ask yourself: What is the core comedic angle here? What is this character's unique point of view on this topic?
      2.  **Step 2: Draft.** Write a first draft of a joke. This is just the raw idea.
      3.  **Step 3: Brutal Self-Critique.** Review your draft. Is the punchline surprising? Is the premise clear? Does it sound exactly like something this specific character would say? Is it generic? If it's not excellent, it's not done.
      4.  **Step 4: Refine and Polish.** Rewrite the joke, sharpening the language and perfecting the punchline based on your critique. The final joke must be clever, original, and perfectly aligned with the character's persona.

      **ASSIGNMENTS LIST:**
      [
        ${assignmentsContext}
      ]

      **YOUR FINAL TASK:**
      After following your internal methodology for every single assignment, you will provide the final, polished jokes.
      You MUST return your complete work as a single, valid JSON array and nothing else. Do not show your analysis, drafts, or critiques. Your final output must contain ONLY the JSON.

      **REQUIRED JSON OUTPUT FORMAT:**
      [
        {
          "characterId": 1,
          "jokeContent": "The final, polished, high-quality joke that resulted from your deep thinking process."
        },
        {
          "characterId": 2,
          "jokeContent": "Another perfect joke that has been drafted, critiqued, and refined."
        }
      ]
    `;
  }
return [];
  // try {
  //   const result: any = await genAIPro.generateContent(prompt);
  //   const response = result.response;
  //   let text = response.text().trim();

  //   // Clean up potential markdown formatting from the response
  //   if (text.startsWith("```json")) {
  //     text = text.substring(7, text.length - 3).trim();
  //   } else if (text.startsWith("```")) {
  //     text = text.substring(3, text.length - 3).trim();
  //   }

  //   const jokes: JokeGenerationResult[] = JSON.parse(text);

  //   // Basic validation to ensure the response is in the expected format
  //   if (!Array.isArray(jokes) || jokes.some(j => !j.characterId || !j.jokeContent)) {
  //       throw new Error("AI returned a malformed JSON array for joke generation.");
  //   }
    
  //   // The function returns the parsed jokes, which will conform to the
  //   // JokeGenerationResult interface for both modes.
  //   return jokes;

  // } catch (error) {
  //   console.error(`[JOKE_GENERATION_BATCH] Failed to generate jokes (isSimpleMode: ${isSimpleMode}):`, error);
  //   return [];
  // }
}

export async function generateJokesInSimpleBatch(
   characters: Character[],
 ): Promise<JokeGenerationResult[]> {

  let assignmentsContext: string;
  let prompt: string;

     console.log('isSimpleMode is true')
    // --- SIMPLE MODE ---
    // Context does NOT include an assigned topic.
    // It maps over all characters directly.
    assignmentsContext = characters.map(character => {
      // NOTE: Assumes your Character type includes a 'country' property.
      // If not, you may need to adjust this part.
      if (!character) return "";
      return `{
        "characterId": ${character.id},
        "characterName": "${character.name}",
        "persona": "${character.prompt_persona}",
       }`;
    }).filter(Boolean).join(',\n');
    console.log('isSimpleMode is false')

    // Prompt is a direct command, asking the AI to find a topic AND write the joke.
    prompt = `
      You are a comedy writer. For each comedian in the JSON roster below, select a single relevant topic based on their country and write one high-quality joke that perfectly fits their persona.

      **COMEDIAN ROSTER:**
      [
        ${assignmentsContext}
      ]

      **FINAL OUTPUT REQUIREMENTS:**
      Return your work as a single, valid JSON array and nothing else.
      Each object in the array must have exactly three keys: "characterId" (number), "selectedTopic" (string), and "jokeContent" (string).

      **EXAMPLE OUTPUT:**
      [
        {
          "characterId": 1,
          "selectedTopic": "Recent rise in grocery prices",
          "jokeContent": "The price of olive oil is so high, my salad dressing is now considered a long-term investment. I'm diversifying my portfolio with balsamic."
        }
      ]
    `;

    
  try {
    const result: any = await genAIPro.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    // Clean up potential markdown formatting from the response
    if (text.startsWith("```json")) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith("```")) {
      text = text.substring(3, text.length - 3).trim();
    }

    const jokes: JokeGenerationResult[] = JSON.parse(text);

    // Basic validation to ensure the response is in the expected format
    if (!Array.isArray(jokes) || jokes.some(j => !j.characterId || !j.jokeContent)) {
        throw new Error("AI returned a malformed JSON array for joke generation.");
    }
    
    // The function returns the parsed jokes, which will conform to the
    // JokeGenerationResult interface for both modes.
    return jokes;

  } catch (error) {
    console.error(`[JOKE_GENERATION_BATCH] Failed to generate jokes (isSimpleMode: true):`, error);
    return [];
  }
}