// File: app/api/charachter/[id]/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { characters } from '@/lib/characters'; // We need this to map the ID to a character name

export async function GET(
  request,
  params
) {
  try {
    const { id } = params.params;

    // --- Step 1: Validate the incoming ID ---
    const characterId = parseInt(id, 10);

    // Check if the ID is not a number or is out of bounds for our characters array.
    if (isNaN(characterId) || characterId < 0 || characterId >= characters.length) {
      return NextResponse.json(
        { message: `Invalid character ID '${id}'. Please use an ID from 0 to ${characters.length - 1}.` },
        { status: 404 } // 404 Not Found
      );
    }

    // --- Step 2: Get the character's name from the ID ---
    const character = characters[characterId];
    const characterName = character.name;

    // --- Step 3: Query the database for the most recent joke from that character ---
    const { rows } = await sql`
      SELECT id, content, character_name, created_at
      FROM jokes
      WHERE character_name = ${characterName}
      ORDER BY created_at DESC
    `;

    // --- Step 4: Handle the case where no joke is found for this character ---
    if (rows.length === 0) {
      return NextResponse.json(
        { message: `No joke found in the database for character: ${characterName}` },
        { status: 404 } // 404 Not Found
      );
    }

    const joke = rows;

    // --- Step 5: Return the successful response ---
    return NextResponse.json({ joke }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch joke by character ID:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error?.message },
      { status: 500 }
    );
  }
}