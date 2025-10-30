// app/api/training-jokes/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: 'Joke ID must be a number' }, { status: 400 });
    }

    // --- CORRECTED QUERY ---
    // This query also renames the columns to match the frontend's expectations.
    const { rows } = await sql`
      SELECT 
        id, 
        archetype_name AS character_name, 
        native_text AS native_text, 
        english_translation AS english_content, 
        created_at
      FROM training_data
      WHERE id = ${id};
    `;

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: `Training joke with ID ${id} not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, joke: rows[0] });

  } catch (error) {
    console.error(`Failed to fetch training joke ${params.id}:`, error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}