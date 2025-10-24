// app/api/generate-jokes/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';
import { canMakeApiCall, recordSuccessfulApiCall } from '@/lib/rate-limiter';
import { toSql } from "pgvector/utils";
import { getEmbedding } from "@/lib/ai/embedding"; // <-- Corrected path alias

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  // --- (No changes to auth and rate limiting) ---
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  // ... (no changes to rate limit check) ...

  try {
    const actionName = 'generate_daily_jokes_for_all_characters';
    const isAllowed = await canMakeApiCall(actionName);
    if (!isAllowed) {
        // ... (no changes to this block) ...
        const { rows: cached } = await sql`SELECT content, character_name FROM jokes WHERE created_at >= CURRENT_DATE ORDER BY id ASC;`;
        const cachedJokes = cached.map((row: any) => ({ character: row.character_name, joke: row.content }));
        return NextResponse.json({ message: "The daily joke generation job has already run successfully today.", jokes: cachedJokes }, { status: 429 });
    }
    console.log(`Daily limit check passed for ${actionName}.`);

    let genericPrompt = '';
    try {
      const { rows: gpRows } = await sql`SELECT prompt_text FROM generic_prompts ORDER BY created_at DESC LIMIT 1;`;
      genericPrompt = gpRows[0]?.prompt_text ?? '';
    } catch (err) {
      console.warn('Could not fetch generic prompt (it may not be initialized).', err);
      genericPrompt = '';
    }

    // --- CRITICAL CHANGE HERE ---
    // We must select the 'id' so we can use it to save the memory.
    const { rows: characters } = await sql`SELECT id, name, prompt_persona FROM characters;`;

    if (characters.length === 0) {
      return NextResponse.json({ message: 'No characters found in the database.' }, { status: 404 });
    }

    const generatedJokes = [];
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    for (const character of characters) {
      console.log(`Generating joke for ${character.name}...`);
      const combinedPrompt = [genericPrompt, character.prompt_persona].filter(Boolean).join(' ');
      const prompt = `You are a comedian. Global instructions: "${combinedPrompt}". Please tell me a single, short joke based on that persona. Do not include any preamble like "Here's a joke:". Just return the joke text.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const jokeContent = response.text().trim();

      if (jokeContent) {
        generatedJokes.push({ character: character.name, joke: jokeContent });
        await sql`
          INSERT INTO jokes (content, character_name)
          VALUES (${jokeContent}, ${character.name});
        `;
        console.log(`-> Saved joke for ${character.name} to the database.`);

        // --- ADDED MEMORY LOGIC ---
        // Note: We don't return a response inside the loop, just log success/failure.
        try {
          console.log(`Creating embedding for joke: "${jokeContent}"`);
          const embedding = await getEmbedding(jokeContent);
          const embeddingSql = toSql(embedding);
    
          // Use 'character.id' which we fetched earlier
          console.log(`Saving memory for characterId: ${character.id}`);
          await sql`
                INSERT INTO memories (character_id, content, embedding)
                VALUES (${character.id}, ${jokeContent}, ${embeddingSql});
              `;
          console.log("✅ Memory saved successfully.");
        } catch (memoryError) {
          console.error(`⚠️ Failed to save memory for the new joke for character ${character.name}:`, memoryError);
        }

      } else {
        console.error(`Failed to generate joke for ${character.name}. Response was empty.`);
      }
      await delay(10000); // Respect AI API rate limits
    }

    await recordSuccessfulApiCall(actionName);
    console.log(`-> Logged successful completion for job: ${actionName}`);

    return NextResponse.json({
      message: `Successfully generated and stored ${generatedJokes.length} jokes.`,
      jokes: generatedJokes,
    });

  } catch (error) {
    console.error('An error occurred during joke generation:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}