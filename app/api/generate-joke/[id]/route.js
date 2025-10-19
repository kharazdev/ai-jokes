// File: app/api/generate-joke/[id]/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';
import { canMakeApiCall, recordSuccessfulApiCall } from '@/lib/rate-limiter';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// The GET function for our dynamic route
export async function GET(request, params) {
  // --- CORRECTED --- We get the id directly from params
  const { id } = params.params;

  // --- Step 1: Validate the incoming ID ---
  const characterId = parseInt(id, 10);

  if (isNaN(characterId)) {
    return NextResponse.json(
      { message: `Invalid ID format: '${id}'. ID must be a number.` },
      { status: 400 } // 400 Bad Request
    );
  }
  
  try {
    // --- MOVED UP --- Step 2: Fetch the character from the database FIRST.
    // This is crucial because we need the 'character' object for all possible paths.
    const { rows } = await sql`
      SELECT id, name, avatar, prompt_persona 
      FROM characters 
      WHERE id = ${characterId};
    `;

    // Check if the character exists. If not, we can't proceed.
    if (rows.length === 0) {
      return NextResponse.json(
        { message: `Character with ID '${id}' does not exist.` },
        { status: 404 } // 404 Not Found
      );
    }
    const character = rows[0];

    // --- Step 3: Now that we have the character, check the rate limit ---
    const actionName = `generate_joke_for_character_${characterId}`;
    const isAllowed = await canMakeApiCall(actionName);
    
    if (!isAllowed) {
      console.log(`Daily limit reached for character ID ${characterId}. Call blocked.`);
      
      // --- NOW SAFE --- This query is now safe because 'character.name' is defined.
      const { rows: todayJokeRows } = await sql`
        SELECT content FROM jokes
        WHERE character_name = ${character.name} AND created_at >= CURRENT_DATE
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      const lastJokeToday = todayJokeRows[0]?.content || "No joke found for today.";

      return NextResponse.json(
        { 
          message: `You can only generate one joke per day for ${character.name}. Here is the one from today.`,
          character: character.name,
          avatar: character.avatar,
          joke: lastJokeToday,
        },
        { status: 429 } // 429 Too Many Requests
      );
    }

    // --- Step 4: If allowed, generate the new joke ---
    console.log(`Generating a single joke for: ${character.name}`);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const prompt = `You are a comedian. Your persona is: "${character.prompt_persona}". Please tell me a single, short joke based on that persona. Do not include any preamble like "Here's a joke:". Just return the joke text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const jokeContent = response.text().trim();

    if (!jokeContent) {
      return NextResponse.json({ message: 'AI failed to generate a joke.' }, { status: 500 });
    }
    
    // --- Step 5: Store the new joke and record the success ---
    await sql`
      INSERT INTO jokes (content, character_name)
      VALUES (${jokeContent}, ${character.name});
    `;
    console.log(`-> Saved single joke for ${character.name} to the database.`);
    
    await recordSuccessfulApiCall(actionName);
    console.log(`-> Logged successful generation for character ID ${characterId}.`);

    // --- Step 6: Return the successful response ---
    return NextResponse.json({
      message: `Successfully generated a new joke for ${character.name}.`,
      character: character.name,
      avatar: character.avatar,
      joke: jokeContent,
    });

  } catch (error) {
    console.error(`An error occurred during single joke generation for ID ${id}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}