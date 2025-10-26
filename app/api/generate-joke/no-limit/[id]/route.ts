// app/api/generate-joke/no-limit/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql } from "@vercel/postgres";
import { toSql } from "pgvector/utils";
import { getEmbedding } from "@/lib/ai/embedding";
import { retrieveMemories } from "@/lib/ai/memory";

export const revalidate = 0;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
      SELECT id, name, avatar, bio, prompt_persona, prompt_topics 
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
    try {
      const embedding = await getEmbedding(jokeContent);
      const embeddingSql = toSql(embedding);
      await sql`
            INSERT INTO memories (character_id, content, embedding, type)
            VALUES (${characterId}, ${jokeContent}, ${embeddingSql}, 'generated_joke');
          `;
      console.log("✅ New joke saved as 'generated_joke' memory.");
    } catch (memoryError) {
      console.error("⚠️ Failed to save memory for the new joke:", memoryError);
    }

    return NextResponse.json({ message: `Generated joke for ${character.name}.`, joke: createdJoke }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in generate-joke no-limit route:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: String(error?.message || error) }, { status: 500 });
  }
}