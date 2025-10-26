// lib/ai/memory.ts

import { sql } from '@vercel/postgres';
import { toSql } from 'pgvector/utils';
import { getEmbedding } from './embedding'; // Import our existing embedding service

// Define a simple type for the returned memory object for clarity.
export interface RetrievedMemory {
  content: string;
  // We can add similarity score later if needed.
}

/**
 * Retrieves the most relevant memories for a character based on a topic.
 * 
 * @param characterId The ID of the character whose memory we are searching.
 * @param topic A string representing the user's query or the subject of the new joke.
 * @param limit The maximum number of memories to retrieve.
 * @returns A promise that resolves to an array of relevant memories.
 */
export async function retrieveMemories(
  characterId: number,
  topic: string,
  limit: number = 3 // Default to retrieving the top 3 memories
): Promise<RetrievedMemory[]> {
  try {
    // 1. Convert the search topic into a vector.
    console.log(`[Memory] Creating embedding for topic: "${topic}"`);
    const topicEmbedding = await getEmbedding(topic);
    const topicEmbeddingSql = toSql(topicEmbedding);

    // 2. Perform the vector similarity search in the database.
    console.log(`[Memory] Searching for top ${limit} memories for characterId: ${characterId}`);
    
    // The '<=>' operator calculates the cosine distance between the topic vector and the stored embeddings.
    // A smaller distance means the memory is more relevant.
    const { rows } = await sql`
      SELECT content
      FROM memories
      WHERE character_id = ${characterId}
      ORDER BY embedding <=> ${topicEmbeddingSql}
      LIMIT ${limit};
    `;

    console.log(`[Memory] Found ${rows.length} relevant memories.`);
    
    // The rows will be of type { content: string }, which matches our RetrievedMemory interface.
    return rows as RetrievedMemory[];

  } catch (error) {
    console.error('[Memory] Error retrieving memories:', error);
    // In case of an error, return an empty array to prevent the entire joke generation from failing.
    // The AI will simply generate a joke without the extra context.
    return []; 
  }
}