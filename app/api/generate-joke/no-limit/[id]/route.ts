// app/api/generate-joke/no-limit/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql } from "@vercel/postgres";
// import { toSql } from "pgvector/utils";
// import { getEmbedding } from "@/lib/ai/embedding";
import { retrieveMemories } from "@/lib/ai/memory";

export const revalidate = 0;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * [SUPERIOR METHOD] Fetches and formats trends for a specific country directly from the database.
 * This is more efficient than a local fetch() call.
 * @param {string | null} countryName - The name of the country to find trends for.
 * @returns {Promise<string[]>} A promise that resolves to an array of formatted trend strings.
 */
async function getCountryTrends(countryName: string | null): Promise<string[]> {
  if (!countryName) {
    console.log("[TRENDS_DB] No country specified for character, skipping trends fetch.");
    return [];
  }

  try {
    // 1. Fetch the most recent, complete trends JSON object from the database
    const { rows } = await sql`
      SELECT trends_json FROM daily_trends 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;

    // 2. Handle the case where no trends have been generated yet
    if (rows.length === 0) {
      console.log("[TRENDS_DB] No trends data found in the database.");
      return [];
    }

    const allTrends = rows[0].trends_json; // This is the JSON object with all countries

    // 3. Perform a case-insensitive search for the requested country key
    const countryKey = Object.keys(allTrends).find(
      key => key.toLowerCase() === countryName.toLowerCase()
    );

    if (countryKey && Array.isArray(allTrends[countryKey])) {
      // 4. If the country is found, format its trends into strings
      const countryTrendsData: { trend_name: string; description: string }[] = allTrends[countryKey];
      return countryTrendsData.map(trend => `${trend.trend_name}: ${trend.description}`);
    } else {
      // 5. If the country key doesn't exist, log it and return empty
      console.log(`[TRENDS_DB] Trends for the country '${countryName}' were not found in the latest trends data.`);
      return [];
    }
  } catch (error) {
    console.error(`[TRENDS_DB] Failed to fetch and process trends from database for ${countryName}:`, error);
    return [];
  }
}


export async function POST(request: NextRequest, context: any) {
  try {
    // --- 1. PARSE CHARACTER ID AND GET TOPIC FROM REQUEST ---
    let idRaw = context?.params?.id;
    if (idRaw && typeof (idRaw as any).then === "function") idRaw = await idRaw;
    const characterId = parseInt(String(idRaw), 10);
    if (isNaN(characterId)) {
      return NextResponse.json({ message: `Invalid ID format: '${idRaw}'. ID must be a number.` }, { status: 400 });
    }

    let topic: string | undefined;
    try {
        const body = await request.json();
        topic = body.topic;
    } catch (e) {
        // No body provided, topic remains undefined.
    }

    // --- 2. FETCH THE CHARACTER'S FULL PROFILE ---
    const { rows } = await sql`
      SELECT id, name, avatar, bio, prompt_persona, prompt_topics, country
      FROM characters WHERE id = ${characterId};
    `;
    if (rows.length === 0) {
      return NextResponse.json({ message: `Character with ID '${characterId}' does not exist.` }, { status: 404 });
    }
    const character = rows[0];

    // --- (RATE LIMITING BLOCK IS INTENTIONALLY REMOVED FOR THIS ROUTE) ---

    // --- 3. DYNAMIC TOPIC SELECTION ---
    let searchTopic: string;
    if (topic) {
      searchTopic = topic;
    } else if (character.prompt_topics && character.prompt_topics.length > 0) {
      const randomIndex = Math.floor(Math.random() * character.prompt_topics.length);
      searchTopic = character.prompt_topics[randomIndex];
      console.log(`[RAG] No user topic provided. Selected random topic for character: "${searchTopic}"`);
    } else {
      searchTopic = character.bio;
    }

 const trends = await getCountryTrends(character.country);
    const trendsContext = trends.length > 0
      ? trends.map(trend => `- ${trend}`).join('\n')
      : "No specific trends available right now.";
    console.log(`[trends] Found trends:\n${trendsContext}`);

    // --- 4. RETRIEVE RELEVANT MEMORIES (The "R" in RAG) ---
    console.log(`[RAG] Retrieving memories for topic: "${searchTopic}"`);
    const relevantMemories = await retrieveMemories(characterId, searchTopic, 4);
    const memoryContext = relevantMemories.map(mem => `- ${mem.content}`).join('\n');
    console.log(`[RAG] Found context:\n${memoryContext}`);
    
    // --- 5. AUGMENT THE PROMPT (The "A" in RAG) ---
    const augmentedPrompt = `
      You are emulating the comedic archetype: ${character.name}.
      Your persona instructions are: "${character.prompt_persona}".
      Your goal is to generate a new, original joke that perfectly matches this specific style of humor.

      ---
      CONTEXT FROM YOUR MEMORY ARCHIVE:
      These are examples of your humor. Use them to understand the style, tone, and subject matter. DO NOT REPEAT THEM.
      ${memoryContext || "You have no relevant memories on this topic yet. Improvise based on your core persona."}
      ---

            ---
      CURRENT TRENDS IN ${character.country || 'your area'}:
      To make your joke more relevant and timely, you can optionally use these trending topics for inspiration.
      ${trendsContext}
      ---
      
      Your task: Tell me a single, NEW joke in your established style about the topic: "${searchTopic}".
      The joke must be original. Just return the joke text itself, with no extra conversational text.
    `;

    // --- 6. GENERATE THE JOKE (The "G" in RAG) ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result: any = await model.generateContent(augmentedPrompt);
    const response = result.response;
    const jokeContent = response.text().trim();

    if (!jokeContent) {
      return NextResponse.json({ message: "AI failed to generate a joke." }, { status: 500 });
    }

    // --- 7. SAVE AND RESPOND ---
    // We still save to the 'jokes' table for a historical log.
    const { rows: insertRows } = await sql`
      INSERT INTO jokes (content, character_name)
      VALUES (${jokeContent}, ${character.name})
      RETURNING id, content;
    `;
    const createdJoke = insertRows[0];

    // Save the new joke to the memory table as a 'generated_joke'
    // try {
    //   const embedding = await getEmbedding(jokeContent);
    //   const embeddingSql = toSql(embedding);
    //   await sql`
    //         INSERT INTO memories (character_id, content, embedding, type)
    //         VALUES (${characterId}, ${jokeContent}, ${embeddingSql}, 'generated_joke');
    //       `;
    //   console.log("✅ New joke saved as 'generated_joke' memory.");
    // } catch (memoryError) {
    //   console.error("⚠️ Failed to save memory for the new joke:", memoryError);
    // }

    return NextResponse.json({ message: `Generated joke for ${character.name}.`, joke: createdJoke, trendsContext }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in generate-joke no-limit route:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: String(error?.message || error) }, { status: 500 });
  }
}