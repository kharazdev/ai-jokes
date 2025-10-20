// File: app/api/jokes/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: Request) {
  try {
    // Query the database to get all jokes, ordered by the newest first.
    const { rows } = await sql`
      SELECT id, content, character_name, created_at 
      FROM jokes 
      ORDER BY created_at DESC;
    `;

    // If no jokes are found, it's good practice to return an empty array.
    if (rows.length === 0) {
      return NextResponse.json(
        { message: 'No jokes found in the database.', jokes: [] },
        { status: 200 }
      );
    }
    
    // Return the list of jokes.
    return NextResponse.json({ jokes: rows }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch jokes:', error);
    // Return an error response if something goes wrong.
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request:any,
  params: any
) {
  try {
    const { id } = params.params;
    // Get the new joke content from the request body
    const { content } = await request.json();

    // Validate the input
    if (!content) {
      return NextResponse.json(
        { message: 'Joke content cannot be empty.' },
        { status: 400 } // Bad Request
      );
    }

    // Update the joke in the database
    await sql`
      UPDATE jokes
      SET content = ${content}
      WHERE id = ${id};
    `;

    return NextResponse.json({ message: 'Joke updated successfully.' }, { status: 200 });
  } catch (error) {
    console.error('API Error updating joke:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}