// File: app/api/characters/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 0; // Don't cache this route, always fetch fresh data

export async function GET() {
  try {
    // Select the columns that are safe and necessary for the front-end.
    // We EXCLUDE `prompt_persona` as it's a secret prompt for the AI.
    const { rows: characters } = await sql`
      SELECT id, name, avatar, bio 
      FROM characters 
      ORDER BY id ASC;
    `;

    return NextResponse.json({ characters }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch characters:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}