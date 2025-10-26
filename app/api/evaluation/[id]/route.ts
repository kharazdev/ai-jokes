// app/api/evaluation/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
// Keep the import, but we won't call the function directly for now.
import { getEmbedding } from '@/lib/ai/embedding'; 
import { toSql } from 'pgvector/utils';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const jokeId = parseInt(params.id, 10);
    if (isNaN(jokeId)) {
      return NextResponse.json({ message: 'Invalid Joke ID' }, { status: 400 });
    }

    const { action, jokeContent, characterName } = await request.json();

    if (action === 'toggle_visibility') {
      await sql`
        UPDATE jokes
        SET is_visible = NOT is_visible
        WHERE id = ${jokeId};
      `;
      return NextResponse.json({ success: true, message: 'Visibility updated.' });

    } else if (action === 'add_to_memory') {
      const { rows: charRows } = await sql`SELECT id FROM characters WHERE name = ${characterName} LIMIT 1;`;
      if (charRows.length === 0) {
        return NextResponse.json({ message: 'Character not found.' }, { status: 404 });
      }
      const characterId = charRows[0].id;
      
      const { rows: existing } = await sql`SELECT id FROM memories WHERE character_id = ${characterId} AND content = ${jokeContent};`;
      if (existing.length > 0) {
        await sql`UPDATE jokes SET is_visible = true WHERE id = ${jokeId};`;
        return NextResponse.json({ success: true, message: 'Joke is already in memory and is now visible.' });
      }
      
      // --- START: EMBEDDING LOGIC ---

      // 1. REAL EMBEDDING GENERATION (COMMENTED OUT AS REQUESTED)
      // const embedding = await getEmbedding(jokeContent);

      // 2. PLACEHOLDER EMBEDDING (ACTIVE)
      // This creates a "dummy" vector to satisfy the database schema.
      // NOTE: 1536 is the dimension for OpenAI's `text-embedding-3-small` and `text-embedding-ada-002`.
      // If your database vector column has a different dimension, change this number.
      console.log("Using placeholder embedding for development.");
      const placeholderEmbedding = new Array(1536).fill(0); 
      
      // 3. Use the placeholder for the SQL query.
      const embeddingSql = toSql(placeholderEmbedding);
      
      // --- END: EMBEDDING LOGIC ---

      await sql`
        INSERT INTO memories (character_id, content, embedding, type)
        VALUES (${characterId}, ${jokeContent}, ${embeddingSql}, 'curated_generated_joke');
      `;
      
      await sql`
        UPDATE jokes
        SET is_visible = true
        WHERE id = ${jokeId};
      `;
      
      return NextResponse.json({ success: true, message: 'Joke added to memory with placeholder embedding.' });

    } else if (action === 'remove_from_memory') {
      const { rows: charRows } = await sql`SELECT id FROM characters WHERE name = ${characterName} LIMIT 1;`;
      if (charRows.length === 0) {
        return NextResponse.json({ message: 'Character not found.' }, { status: 404 });
      }
      const characterId = charRows[0].id;

      await sql`
        DELETE FROM memories
        WHERE character_id = ${characterId} AND content = ${jokeContent} AND type = 'curated_generated_joke';
      `;
      return NextResponse.json({ success: true, message: 'Joke removed from memory.' });

    } else {
      return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
    }
  } catch (error) {
    console.error(`Error in PATCH /api/evaluation/${params.id}:`, error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}