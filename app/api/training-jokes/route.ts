// app/api/training-jokes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

const JOKES_PER_PAGE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * JOKES_PER_PAGE;

    // --- CORRECTED QUERY ---
    // This query now selects your actual column names and renames them
    // using 'AS' to match what the frontend component expects.
    const { rows: jokes } = await sql`
      SELECT 
        id, 
        archetype_name AS character_name, 
        native_text AS native_text, 
        english_translation AS english_content, 
        created_at
      FROM training_data
      ORDER BY id ASC -- Ordering by ID is more stable for pagination
      LIMIT ${JOKES_PER_PAGE}
      OFFSET ${offset};
    `;

    const { rows: countRows } = await sql`
      SELECT COUNT(*) FROM training_data;
    `;
    const totalJokes = parseInt(countRows[0].count, 10);
    const totalPages = Math.ceil(totalJokes / JOKES_PER_PAGE);

    return NextResponse.json({
      success: true,
      jokes,
      pagination: { currentPage: page, totalPages, totalJokes },
    });
  } catch (error) {
    console.error('Failed to fetch training jokes:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}