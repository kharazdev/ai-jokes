// File: app/api/jokes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// This ensures we always fetch the latest data and don't cache the API response.
export const dynamic = 'force-dynamic';

const JOKES_PER_PAGE = 10; // Set how many jokes you want per page

// --- UPDATED GET FUNCTION ---
export async function GET(request: NextRequest) {
  try {
    // 1. Read the 'page' number from the URL query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * JOKES_PER_PAGE;

    // 2. Fetch only the jokes for the requested page
    const { rows: jokes } = await sql`
      SELECT id, content, character_name, created_at, is_visible, rate 
      FROM jokes
      WHERE is_visible = TRUE
      ORDER BY created_at DESC
      LIMIT ${JOKES_PER_PAGE}
      OFFSET ${offset};
    `;

    // 3. Get the total count of jokes to calculate total pages
    const { rows: countRows } = await sql`
      SELECT COUNT(*) FROM jokes WHERE is_visible = TRUE;
    `;
    const totalJokes = parseInt(countRows[0].count, 10);
    const totalPages = Math.ceil(totalJokes / JOKES_PER_PAGE);

    // 4. Return the data in the format your frontend expects
    return NextResponse.json({
      success: true,
      jokes,
      pagination: { currentPage: page, totalPages },
    });

  } catch (error) {
    console.error('Failed to fetch jokes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}


// --- YOUR EXISTING PATCH FUNCTION (UNCHANGED) ---
// Note: This PATCH function seems designed for a dynamic route like /api/jokes/[id].
// It will not work as expected in this file (/api/jokes/route.ts) because `params.params` will be undefined.
export async function PATCH(
  request:any,
  params: any
) {
  try {
    const { id } = params.params; 
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { message: 'Joke content cannot be empty.' },
        { status: 400 }
      );
    }

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