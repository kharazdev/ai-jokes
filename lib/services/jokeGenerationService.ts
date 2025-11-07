// in lib/services/jokeGenerationService.ts

import { genAIPro } from "../ai/genAI";
import { JobAssignment } from "./orchestratorService";
import { Character } from "@/components/EditCharacterForm";


export interface JokeGenerationResult {
  characterId: number;
  jokeContent: string;
}

export async function generateJokesInBatch(
  jobPlan: JobAssignment[],
  characters: Character[]
): Promise<JokeGenerationResult[]> {

  const assignmentsContext = jobPlan.map(job => {
    const character = characters.find(c => c.id === job.characterId);
    if (!character) return "";
    
    return `{
      "characterId": ${character.id},
      "characterName": "${character.name}",
      "persona": "${character.prompt_persona}",
      "assignedTopic": "${job.assignedTopic.trend_name}"
    }`;
  }).filter(Boolean).join(',\n');

  // --- NEW, HIGH-QUALITY PROMPT ---
  const prompt = `
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

  try {
    const result: any = await genAIPro.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    if (text.startsWith("```json")) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith("```")) {
      text = text.substring(3, text.length - 3).trim();
    }

    const jokes: JokeGenerationResult[] = JSON.parse(text);

    if (!Array.isArray(jokes) || jokes.some(j => !j.characterId || !j.jokeContent)) {
        throw new Error("AI returned a malformed JSON array for joke generation.");
    }
    
    return jokes;

  } catch (error) {
    console.error("[JOKE_GENERATION_BATCH] Failed to generate jokes in batch:", error);
    return [];
  }
}