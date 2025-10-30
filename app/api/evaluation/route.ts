// app/api/evaluation/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// Add this line to opt out of caching and ensure fresh data is always fetched.
export const dynamic = 'force-dynamic';

const JOKES_PER_PAGE = 15;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * JOKES_PER_PAGE;

    // This is a more advanced query. It fetches jokes and checks if a corresponding memory exists.
    const { rows: jokes } = await sql`
      SELECT 
        j.id, 
        j.content, 
        j.character_name,
        j.created_at,
        j.is_visible,
        -- Check if a memory with the same content for this character exists
        EXISTS (
          SELECT 1 FROM memories m
          JOIN characters c ON m.character_id = c.id
          WHERE c.name = j.character_name AND m.content = j.content AND m.type = 'curated_generated_joke'
        ) as is_in_memory
      FROM jokes j
      ORDER BY j.created_at DESC
      LIMIT ${JOKES_PER_PAGE}
      OFFSET ${offset};
    `;

    const { rows: countRows } = await sql`SELECT COUNT(*) FROM jokes;`;
    const totalJokes = parseInt(countRows[0].count, 10);
    const totalPages = Math.ceil(totalJokes / JOKES_PER_PAGE);

    return NextResponse.json({
      success: true,
      jokes,
      pagination: { currentPage: page, totalPages, totalJokes },
    });

  } catch (error) {
    console.error('Error fetching evaluation jokes:', error); // Good practice to log errors
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}