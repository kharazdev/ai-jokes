// scripts/generate-embeddings.mjs
import dotenv from 'dotenv';
import { db } from '@vercel/postgres';
import { toSql } from 'pgvector/utils';

/**
 * SEED SCRIPT 2: GENERATE EMBEDDINGS (FINAL VERSION)
 * -----------------------------------
 * This script handles the slow, API-intensive task of generating embeddings.
 * It is efficient, safe to re-run, and resilient to individual API errors.
 * 
 * 1. Fetches all rows from `memories` where `embedding` is NULL.
 * 2. Loops through each one, calls the OpenAI API to get the vector.
 * 3. Updates the row with the new embedding.
 */

// --- Dynamic Import for OpenAI Embedding Service ---
let getEmbedding;
async function initializeEmbeddingService() {
  try {
    // Make sure the path to your embedding service is correct
    const embeddingModule = await import('../lib/ai/embedding.ts');
    getEmbedding = embeddingModule.getEmbedding;
    if (typeof getEmbedding !== 'function') {
      throw new Error("The 'getEmbedding' function was not found in the imported module.");
    }
    console.log("✅ Embedding service loaded successfully.");
  } catch (e) {
    console.error("❌ CRITICAL ERROR: Failed to load the embedding service.", e);
    process.exit(1);
  }
}

// --- Main Embedding Generation Logic ---
async function generateEmbeddings(client) {
  try {
    console.log('Fetching memories that are missing embeddings...');
    const { rows: memoriesToProcess } = await client.sql`
      SELECT id, content FROM memories WHERE embedding IS NULL;
    `;

    if (memoriesToProcess.length === 0) {
      console.log('✅ No missing embeddings found. All memories are up to date.');
      return;
    }

    console.log(`Found ${memoriesToProcess.length} memories to process.`);

    for (let i = 0; i < memoriesToProcess.length; i++) {
      const memory = memoriesToProcess[i];
      const progress = `[${i + 1}/${memoriesToProcess.length}]`;

      // This try/catch ensures that one failed API call doesn't stop the whole script
      try {
        console.log(`${progress} Generating embedding for memory ID ${memory.id}: "${memory.content.substring(0, 40)}..."`);
        
        const embeddingVector = await getEmbedding(memory.content);
        
        await client.sql`
          UPDATE memories
          SET embedding = ${toSql(embeddingVector)}
          WHERE id = ${memory.id};
        `;
      } catch (error) {
        console.error(`\n❌ Failed to process memory ID ${memory.id}. Error:`, error.message);
        console.log("   Skipping this memory and continuing with the next one.\n");
      }
    }
    console.log(`\nSuccessfully processed ${memoriesToProcess.length} memories.`);

  } catch (error) {
    console.error('❌ An error occurred during the embedding generation process:', error);
    throw error;
  }
}

// --- Main Execution Block ---
async function main() {
  console.log("Starting embedding generation process...");
  dotenv.config({ path: '.env.local' });
  if (!process.env.DATABASE_URL || !process.env.OPENAI_API_KEY) {
    console.error("❌ CRITICAL ERROR: DATABASE_URL or OPENAI_API_KEY is missing from .env.local");
    process.exit(1);
  }
  
  await initializeEmbeddingService();
  const client = await db.connect();

  try {
    await generateEmbeddings(client);
  } finally {
    await client.end();
    console.log("\n✅ Embedding generation process complete!");
  }
}

main().catch((err) => {
  console.error('\n❌ An unhandled error occurred and the script has stopped:', err);
});