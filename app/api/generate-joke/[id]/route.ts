// File: app/api/generate-joke/[id]/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { characters } from '@/lib/characters'; // Your character definitions
import { sql } from '@vercel/postgres';

 


// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
 
// The GET function for our dynamic route
export async function GET(
  request: Request,
  // { params }: { params: {id: string} }
) {
  // The 'params' object contains the dynamic parts of the URL.
  // In this case, it's the 'id' from '/api/generate-joke/[id]'
  const  id   = '1';

  // --- Step 1: Validate the incoming ID ---
  const characterId = parseInt(id, 10); // Convert the ID string to a number

  // Check if the ID is not a number, or if it's out of bounds for our characters array
  if (isNaN(characterId) || characterId < 0 || characterId >= characters.length) {
    return NextResponse.json(
      { message: `Character with ID '${id}' does not exist. Please use an ID from 0 to ${characters.length - 1}.` },
      { status: 404 } // 404 Not Found is an appropriate status code
    );
  }

  // --- Step 2: Get the selected character ---
  const character = characters[characterId];

  try {
    console.log(`Generating a single joke for: ${character.name}`);

    // --- Step 3: Generate the joke using the AI ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); // Using gemini-pro is fine for this

    // We create a specific prompt using the character's persona
    const prompt = `You are a comedian. Your persona is: "${character.prompt_persona}". Please tell me a single, short joke based on that persona. Do not include any preamble like "Here's a joke:". Just return the joke text.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const jokeContent = response.text().trim();

    // Handle cases where the AI might return an empty response
    if (!jokeContent) {
      console.error(`Failed to generate joke for ${character.name}. Response was empty.`);
      return NextResponse.json(
        { message: 'AI failed to generate a joke.' },
        { status: 500 }
      );
    }
    
    // --- Step 4 (Optional but Recommended): Store the generated joke in the database ---
    await sql`
      INSERT INTO jokes (content, character_name)
      VALUES (${jokeContent}, ${character.name});
    `;
    console.log(`-> Saved single joke for ${character.name} to the database.`);


    // --- Step 5: Return the successful response ---
    return NextResponse.json({
      message: `Successfully generated a joke for ${character.name}.`,
      character: character.name,
      avatar: character.avatar,
      joke: jokeContent,
    });

  } catch (error) {
    console.error(`An error occurred during single joke generation for ${character.name}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}