// app/api/test-memory/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { toSql } from 'pgvector/utils';
import { retrieveMemories } from '@/lib/ai/memory'; // <-- IMPORT OUR NEW SERVICE
import { NextRequest } from 'next/server';

// Helper function to create a dummy vector.
function createFakeVector(): number[] {
  const vector = new Array(1536).fill(0);
  vector[0] = 1; // A simple, non-zero vector
  return vector;
}

export async function POST() {
  console.log('Running memory test using @vercel/postgres...');

  try {
    // --- PART 1: WRITE a memory to the database ---
    const testContent = `This is a test memory created at ${new Date().toISOString()}`;
    const testVector = createFakeVector();
    // The toSql() function formats the array correctly for the raw SQL query
    const testVectorSql = toSql(testVector); 
    const characterIdToTest = 1; // <--- IMPORTANT: REPLACE 1 WITH A REAL CHARACTER ID FROM YOUR DB

    // Note: We use placeholders ($1, $2, $3) for safety against SQL injection
    const { rows: [insertedMemory] } = await sql`
      INSERT INTO memories (character_id, content, embedding)
      VALUES (${characterIdToTest}, ${testContent}, ${testVectorSql})
      RETURNING *;
    `;

    if (!insertedMemory) {
      throw new Error('Failed to insert memory into the database.');
    }
    console.log('✅ Memory inserted successfully:', insertedMemory);

    // --- PART 2: READ the memory back using a vector search ---
    // This proves that pgvector and the index are working.
    const queryVectorSql = toSql(testVector);

    // The '<=>' is the cosine distance operator from pgvector.
    // We are finding the memory closest to our query vector.
    const { rows: [retrievedMemory] } = await sql`
      SELECT * FROM memories
      ORDER BY embedding <=> ${queryVectorSql}
      LIMIT 1;
    `;

    if (!retrievedMemory) {
      throw new Error('Failed to retrieve any memory using vector search.');
    }
    console.log('✅ Memory retrieved successfully via vector search:', retrievedMemory);

    // --- PART 3: VERIFY the result ---
    const isTestSuccessful = insertedMemory.id === retrievedMemory.id;
    
    return NextResponse.json({
      success: true,
      isTestSuccessful,
      message: isTestSuccessful ? 'SUCCESS: The memory was written and read back correctly!' : 'FAILURE: The retrieved memory does not match the inserted one.',
      insertedMemory,
      retrievedMemory,
    });

  } catch (error) {
    console.error('❌ Memory test failed:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// --- NEW GET HANDLER ---
// This function will run when you visit http://localhost:3000/api/test-memory in your browser.
// export async function GET() {
//   console.log('Fetching all memories from the database...');
//   try {
//     const { rows: memories } = await sql`
//       SELECT * FROM memories
//       ORDER BY created_at DESC;
//     `;
    
//     return NextResponse.json({
//       success: true,
//       count: memories.length,
//       memories: memories, // Returns all memories found
//     });

//   } catch (error) {
//     console.error('❌ Failed to fetch memories:', error);
//     return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
//   }
// }

    
export async function GET(request: NextRequest) {
  // Get the search parameters from the URL
  const searchParams = request.nextUrl.searchParams;
  const topic = searchParams.get('topic');
  const characterIdParam = searchParams.get('characterId');

  if (!topic || !characterIdParam) {
    return NextResponse.json({ 
      success: false, 
      message: "Please provide 'topic' and 'characterId' as URL query parameters." 
    }, { status: 400 });
  }

  const characterId = parseInt(characterIdParam, 10);
  if (isNaN(characterId)) {
    return NextResponse.json({ success: false, message: "characterId must be a number." }, { status: 400 });
  }

  console.log(`Testing memory retrieval for character ${characterId} with topic: "${topic}"`);
  
  try {
    const relevantMemories = await retrieveMemories(characterId, topic, 5); // Get top 5
    
    return NextResponse.json({
      success: true,
      topic: topic,
      characterId: characterId,
      retrievedCount: relevantMemories.length,
      memories: relevantMemories,
    });

  } catch (error) {
    console.error('❌ Failed to test memory retrieval:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}