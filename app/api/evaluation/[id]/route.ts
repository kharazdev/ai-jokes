// app/api/evaluation/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
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
            // This query flips the boolean value of is_visible
            await sql`
        UPDATE jokes
        SET is_visible = NOT is_visible
        WHERE id = ${jokeId};
      `;
            return NextResponse.json({ success: true, message: 'Visibility updated.' });

        } else if (action === 'add_to_memory') {
            // First, find the character's ID from their name
            const { rows: charRows } = await sql`SELECT id FROM characters WHERE name = ${characterName} LIMIT 1;`;
            if (charRows.length === 0) {
                return NextResponse.json({ message: 'Character not found.' }, { status: 404 });
            }
            const characterId = charRows[0].id;

            // Check if this memory already exists to prevent duplicates
            const { rows: existing } = await sql`SELECT id FROM memories WHERE character_id = ${characterId} AND content = ${jokeContent};`;
            if (existing.length > 0) {
                return NextResponse.json({ success: true, message: 'Joke is already in memory.' });
            }

            //   const embedding = await getEmbedding(jokeContent);
            //   const embeddingSql = toSql(embedding);
            const embeddingSql = undefined;
            await sql`
        INSERT INTO memories (character_id, content, embedding, type)
        VALUES (${characterId}, ${jokeContent}, ${embeddingSql}, 'curated_generated_joke');
      `;
            return NextResponse.json({ success: true, message: 'Joke added to memory.' });

        } else {
            return NextResponse.json({ message: 'Invalid action.' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}