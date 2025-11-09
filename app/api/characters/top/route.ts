// File: app\api\characters\top\route.ts

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 0; // Don't cache this route

/**
 * Handles GET requests to fetch top characters..
 * Example: /api/characters/top
 */
export async function GET(
) {

  try {
    // Select the columns that are safe and necessary for the front-end.
    const { rows: characters } = await sql`
      SELECT
    tc.rank,
    c.id,
    c.name,
    c.bio,
    c.prompt_persona
FROM
    topCharacters AS tc
JOIN
    characters AS c ON tc.character_id = c.id
ORDER BY
    tc.rank ASC;
    `;

    // If no characters are found 
    if (characters.length === 0) {
      return NextResponse.json(
        { message: `No characters found` },
        { status: 404 }
      );
    }

    return NextResponse.json(characters, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch characters :', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}