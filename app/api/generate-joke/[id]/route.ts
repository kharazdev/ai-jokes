import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql } from "@vercel/postgres";
import { canMakeApiCall, recordSuccessfulApiCall } from "@/lib/rate-limiter";
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

    // --- 3. CHECK RATE LIMIT (No change to this logic) ---
    const actionName = `generate_joke_for_character_${characterId}`;
    const isAllowed = await canMakeApiCall(actionName);

    if (!isAllowed) {
      const { rows: todayRows } = await sql`SELECT content FROM jokes WHERE character_name = ${character.name} AND created_at >= CURRENT_DATE ORDER BY created_at DESC LIMIT 1;`;
      const lastJokeToday = todayRows[0]?.content || "No joke found for today.";
      return NextResponse.json({ message: `You can only generate one joke per day for ${character.name}. Here is the one from today.`, character: character.name, avatar: character.avatar, joke: lastJokeToday }, { status: 429 });
    }

    // --- 4. DYNAMIC TOPIC SELECTION ---
    let searchTopic: string;
    if (topic) {
      searchTopic = topic;
    } else if (character.prompt_topics && character.prompt_topics.length > 0) {
      const randomIndex = Math.floor(Math.random() * character.prompt_topics.length);
      searchTopic = character.prompt_topics[randomIndex];
      console.log(`[RAG] No user topic provided. Selected random topic for character: "${searchTopic}"`);
    } else {
      searchTopic = character.bio; // Fallback
    }

    // --- 5. RETRIEVE RELEVANT MEMORIES (The "R" in RAG) ---
    console.log(`[RAG] Retrieving memories for topic: "${searchTopic}"`);
    const relevantMemories = await retrieveMemories(characterId, searchTopic, 4); // Fetch 4 relevant memories
    const memoryContext = relevantMemories.map(mem => `- ${mem.content}`).join('\n');
    console.log(`[RAG] Found context:\n${memoryContext}`);
    
    // --- 6. AUGMENT THE PROMPT (The "A" in RAG) ---
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

    // --- 7. GENERATE THE JOKE (The "G" in RAG) ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result: any = await model.generateContent(augmentedPrompt);
    const response = result.response;
    const jokeContent = response.text().trim();

    if (!jokeContent) {
      return NextResponse.json({ message: "AI failed to generate a joke." }, { status: 500 });
    }

    // --- 8. SAVE AND RECORD ---
    await sql`INSERT INTO jokes (content, character_name) VALUES (${jokeContent}, ${character.name});`;
    await recordSuccessfulApiCall(actionName);

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

    // --- 9. SEND THE FINAL RESPONSE ---
    return NextResponse.json(
      {
        message: `Successfully generated a new joke for ${character.name}.`,
        character: character.name,
        avatar: character.avatar,
        joke: jokeContent,
      },
      { status: 200 },
    );
    
  } catch (error) {
    console.error("An error occurred during single joke generation:", error);
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  }
}