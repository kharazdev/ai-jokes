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

// --- ADD THIS PATCH HANDLER ---
export async function PATCH(request: Request, context?: any) {
  try {
    // Try to get id from route params (if present), query string, or request body
    const paramId = context?.params?.id;
    const urlId = (typeof request?.url === 'string') ? new URL(request.url).searchParams.get('id') : null;

    // Parse body safely (catch JSON errors)
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const idRaw = paramId ?? urlId ?? body.id;
    if (!idRaw) {
      return NextResponse.json(
        { message: 'Character id is required. Provide it in the route, ?id= query, or request body.' },
        { status: 400 }
      );
    }

    const characterId = parseInt(String(idRaw), 10);
    if (isNaN(characterId)) {
      return NextResponse.json(
        { message: 'Invalid character id. It must be a number.' },
        { status: 400 }
      );
    }

    // Get updatable fields from the body
    const { name, avatar, bio, prompt_persona } = body;

    // Basic validation
    if (!name || !avatar || !bio || !prompt_persona) {
      return NextResponse.json(
        { message: 'All fields (name, avatar, bio, prompt_persona) are required.' },
        { status: 400 } // Bad Request
      );
    }

    // Update the character in the database
    await sql`
      UPDATE characters
      SET 
        name = ${name}, 
        avatar = ${avatar}, 
        bio = ${bio},
        prompt_persona = ${prompt_persona}
      WHERE id = ${characterId};
    `;

    return NextResponse.json({ message: 'Character updated successfully.' }, { status: 200 });
  } catch (error) {
    console.error('API Error updating character:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
