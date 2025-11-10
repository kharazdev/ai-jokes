// app/api/rate-joke/route.ts
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Parse the request body to get the jokeId and rating
    const { jokeId, rating } = await request.json();

    // 2. Basic validation to ensure the data is correct
    if (!jokeId || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid input provided.' }, { status: 400 });
    }

    // 3. Update the database
    // The sql template literal automatically sanitizes inputs to prevent SQL injection
    await sql`
      UPDATE jokes
      SET rate = ${rating}
      WHERE id = ${jokeId};
    `;

    // 4. Return a success response
    return NextResponse.json({ message: 'Rating updated successfully' }, { status: 200 });

  } catch (error) {
    // 5. Handle any potential errors
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to update rating.' }, { status: 500 });
  }
}