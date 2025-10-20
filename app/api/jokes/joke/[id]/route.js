// File: app/api/jokes/[id]/route.ts

import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// --- REMOVED --- We no longer need the hardcoded characters file at all.
// import { characters } from '@/lib/characters';

export const revalidate = 0; // Don't cache this route

export async function GET(request, params) {
  try {
    const { id } = params.params;

    // --- Step 1: Validate the incoming ID ---
    // The ID should be the joke's unique ID from the database.
    const jokeId = parseInt(id, 10);
    // Check if the ID is not a valid number.
    if (isNaN(jokeId)) {
      return NextResponse.json(
        { message: `Invalid ID format: '${id}'. ID must be a number.` },
        { status: 400 }, // 400 Bad Request
      );
    }

    // --- Step 2: Query the database for the specific joke by its own ID ---
    const { rows } = await sql`
      SELECT id, content, character_name, created_at
      FROM jokes
      WHERE id = ${jokeId};
    `;

    // --- Step 3: Handle the case where no joke with that ID is found ---
    if (rows.length === 0) {
      return NextResponse.json(
        { message: `No joke found in the database with ID: ${jokeId}` },
        { status: 404 }, // 404 Not Found is appropriate
      );
    }

    // --- Step 4: Return the successful response ---
    // rows[0] contains the single joke object we found.
    const joke = rows[0];
    return NextResponse.json({ joke }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch joke by its ID:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error?.message },
      { status: 500 },
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    // Correctly get the 'id' from the params object
    const { id } = params;
    
    // Get the new joke content from the request body
    const { content } = await request.json();

    // --- Step 1: Validate the input ---
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Joke content cannot be empty.' },
        { status: 400 } // Bad Request
      );
    }

    const jokeId = parseInt(id, 10);
    if (isNaN(jokeId)) {
        return NextResponse.json({ message: 'Invalid joke ID.' }, { status: 400 });
    }

    // --- Step 2: Update the joke in the database ---
    const result = await sql`
      UPDATE jokes
      SET content = ${content}
      WHERE id = ${jokeId};
    `;

    // It's good practice to check if a row was actually updated.
    // If not, it means the joke ID didn't exist.
    if (result.rowCount === 0) {
        return NextResponse.json({ message: `Joke with ID ${jokeId} not found.` }, { status: 404 });
    }

    // --- Step 3: Return a success response ---
    return NextResponse.json({ message: 'Joke updated successfully.' }, { status: 200 });

  } catch (error) {
    console.error('API Error updating joke:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}