import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';
import { canMakeApiCall, recordSuccessfulApiCall } from '@/lib/rate-limiter';
import { toSql } from "pgvector/utils";
import { getEmbedding } from "@/lib/ai/embedding";
import { retrieveMemories } from "@/lib/ai/memory";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Note: Vercel CRON jobs trigger this via a GET request, but the logic is a POST-like operation.
// We can use either GET or POST, but POST is semantically more correct for a creation task.
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret');

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const actionName = 'generate_daily_jokes_for_all_characters';
    const isAllowed = await canMakeApiCall(actionName);
    
    if (!isAllowed) {
      console.log(`[CRON] Daily limit reached. Job blocked.`);
      const { rows: cached } = await sql`SELECT content, character_name FROM jokes WHERE created_at >= CURRENT_DATE ORDER BY id ASC;`;
      const cachedJokes = cached.map((row: any) => ({ character: row.character_name, joke: row.content }));
      return NextResponse.json({ message: "The daily joke generation job has already run today.", jokes: cachedJokes }, { status: 429 });
    }
    console.log(`[CRON] Daily limit check passed. Starting job...`);

    // --- 1. FETCH ALL CHARACTERS WITH THEIR FULL PROFILES ---
    const { rows: characters } = await sql`SELECT id, name, bio, prompt_persona, prompt_topics FROM characters;`;

    if (characters.length === 0) {
      return NextResponse.json({ message: 'No characters found to generate jokes for.' }, { status: 404 });
    }

    const generatedJokes = [];
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // --- 2. LOOP THROUGH EACH CHARACTER AND APPLY RAG LOGIC ---
    for (const character of characters) {
      console.log(`\n--- [CRON] Generating joke for ${character.name} (ID: ${character.id}) ---`);
      
      // --- Dynamic Topic Selection ---
      let searchTopic: string;
      if (character.prompt_topics && character.prompt_topics.length > 0) {
        const randomIndex = Math.floor(Math.random() * character.prompt_topics.length);
        searchTopic = character.prompt_topics[randomIndex];
        console.log(`[RAG] Selected random topic: "${searchTopic}"`);
      } else {
        searchTopic = character.bio; // Fallback
      }

      // --- Retrieve Memories ---
      const relevantMemories = await retrieveMemories(character.id, searchTopic, 5); // Fetch 5 memories for a daily job
      const memoryContext = relevantMemories.map(mem => `- ${mem.content}`).join('\n');
      console.log(`[RAG] Found ${relevantMemories.length} relevant memories.`);
      
      // --- Augment Prompt ---
      const augmentedPrompt = `
        You are emulating the comedic archetype: ${character.name}.
        Your persona instructions are: "${character.prompt_persona}".
        Your goal is to generate a new, original joke that perfectly matches this specific style of humor for today's post.

        ---
        CONTEXT FROM YOUR MEMORY ARCHIVE:
        These are examples of your humor. Use them to understand your style and to AVOID REPEATING YOURSELF.
        ${memoryContext || "You have no relevant memories on this topic yet. Improvise based on your core persona."}
        ---
        
        Your task: Tell me a single, NEW joke in your established style about the topic: "${searchTopic}".
        The joke must be original. Just return the joke text itself.
      `;
      
      const result = await model.generateContent(augmentedPrompt);
      const response = result.response;
      const jokeContent = response.text().trim();

      if (jokeContent) {
        generatedJokes.push({ character: character.name, joke: jokeContent });
        
        // Save to public 'jokes' table
        await sql`INSERT INTO jokes (content, character_name) VALUES (${jokeContent}, ${character.name});`;
        console.log(`-> Saved joke for ${character.name} to 'jokes' table.`);

        // Save to private 'memories' table
        try {
          const embedding = await getEmbedding(jokeContent);
          const embeddingSql = toSql(embedding);
          await sql`INSERT INTO memories (character_id, content, embedding, type) VALUES (${character.id}, ${jokeContent}, ${embeddingSql}, 'generated_joke');`;
          console.log("   ✅ Memory saved successfully.");
        } catch (memoryError) {
          console.error(`   ⚠️ Failed to save memory for character ${character.name}:`, memoryError);
        }

      } else {
        console.error(`   ❌ Failed to generate joke for ${character.name}.`);
      }
      await delay(10000); // Respect potential AI API rate limits between characters
    }

    await recordSuccessfulApiCall(actionName);
    console.log(`\n[CRON] Logged successful completion for job: ${actionName}`);

    return NextResponse.json({
      message: `Successfully generated and stored ${generatedJokes.length} jokes.`,
      jokes: generatedJokes,
    });

  } catch (error) {
    console.error('[CRON] An error occurred during joke generation:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message }, { status: 500 });
  }
}