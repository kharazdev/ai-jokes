// File: app/api/generate-joke/[id]/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';
// --- REMOVED --- We no longer need the hardcoded characters file.
// import { characters } from '@/lib/characters';

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// The GET function for our dynamic route
export async function GET(
  request,
  params
) {
  // --- MODIFIED --- We get the id from the 'params' object, not hardcoded.
  const { id } = params.params;

  // --- Step 1: Validate the incoming ID ---
  const characterId = parseInt(id, 10);

  // Check if the ID is not a valid number.
  if (isNaN(characterId)) {
    return NextResponse.json(
      { message: `Invalid ID format: '${id}'. ID must be a number.` },
      { status: 400 } // 400 Bad Request
    );
  }

  try {
    // +++ ADDED +++ Step 2: Fetch the specific character from the database.
    // We select all the fields needed for the prompt and the final response.
    const { rows } = await sql`
      SELECT id, name, avatar, prompt_persona 
      FROM characters 
      WHERE id = ${characterId};
    `;

    // --- MODIFIED --- New validation: Check if the character exists in the database.
    if (rows.length === 0) {
      return NextResponse.json(
        { message: `Character with ID '${id}' does not exist.` },
        { status: 404 } // 404 Not Found
      );
    }

    // The character is the first (and only) result from our query.
    const character = rows[0];

    console.log(`Generating a single joke for: ${character.name}`);

    // --- Step 3: Generate the joke using the AI --- (No changes needed here)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const prompt = `You are a comedian. Your persona is: "${character.prompt_persona}". Please tell me a single, short joke based on that persona. Do not include any preamble like "Here's a joke:". Just return the joke text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const jokeContent = response.text().trim();

    if (!jokeContent) {
      console.error(`Failed to generate joke for ${character.name}. Response was empty.`);
      return NextResponse.json(
        { message: 'AI failed to generate a joke.' },
        { status: 500 }
      );
    }
    
    // --- Step 4: Store the generated joke in the database --- (No changes needed here)
    await sql`
      INSERT INTO jokes (content, character_name)
      VALUES (${jokeContent}, ${character.name});
    `;
    console.log(`-> Saved single joke for ${character.name} to the database.`);

    // --- Step 5: Return the successful response --- (No changes needed here)
    return NextResponse.json({
      message: `Successfully generated a joke for ${character.name}.`,
      character: character.name,
      avatar: character.avatar,
      joke: jokeContent,
    });

  } catch (error) {
    console.error(`An error occurred during single joke generation for ID ${id}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error?.message },
      { status: 500 }
    );
  }
}