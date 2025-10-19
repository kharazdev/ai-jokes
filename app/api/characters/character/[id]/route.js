// File: app/api/characters/[id]/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 0; // Don't cache this route

export async function GET(
  request,
  params  
) {
  try {
    const { id } = params.params;

    // Validate that the ID is a number
    const characterId = parseInt(id, 10);
    if (isNaN(characterId)) {
      return NextResponse.json(
        { message: `Invalid ID format. ID must be a number.` },
        { status: 400 } // 400 Bad Request
      );
    }

    // Fetch the specific character from the database
    // Again, we exclude the secret prompt_persona
    const { rows } = await sql`
      SELECT id, name, avatar, bio 
      FROM characters 
      WHERE id = ${characterId};
    `;

    // Handle the case where no character with that ID exists
    if (rows.length === 0) {
      return NextResponse.json(
        { message: `Character with ID '${id}' not found.` },
        { status: 404 } // 404 Not Found
      );
    }

    const character = rows[0];
    return NextResponse.json({ character }, { status: 200 });

  } catch (error) {
    console.error(`Failed to fetch character with ID ${params.id}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}