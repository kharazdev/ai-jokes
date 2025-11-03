// in lib/services/jokePersistenceService.ts

import { sql } from '@vercel/postgres';
// Assuming you have these helper functions
// import { getEmbedding } from '@/lib/embedding'; 
import { toSql } from 'pgvector/pg';

export async function saveNewJoke(characterId: number, characterName: string, jokeContent: string): Promise<void> {
  try {
    // 1. Save to the main historical 'jokes' table
    await sql`
      INSERT INTO jokes (content, character_name)
      VALUES (${jokeContent}, ${characterName});
    `;

    // 2. Save to the vector 'memories' table for RAG
    // const embedding = await getEmbedding(jokeContent);
    // const embeddingSql = toSql(embedding);
    // await sql`
    //   INSERT INTO memories (character_id, content, embedding, type)
    //   VALUES (${characterId}, ${jokeContent}, ${embeddingSql}, 'generated_joke');
    // `;
    console.log(`   -> ✅ Successfully saved new joke for ${characterName}.`);
  } catch (error) {
    console.error(`   -> ❌ Failed to save new joke for ${characterName}:`, error);
    // We log the error but don't throw it, so a single DB failure doesn't stop the whole job.
  }
}