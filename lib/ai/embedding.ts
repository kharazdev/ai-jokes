// lib/ai/embedding.ts

import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in your environment variables.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getEmbedding(text: string): Promise<number[]> {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string.');
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.trim().replace(/\n/g, ' '),
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      // This is a specific failure case
      throw new Error('API response did not contain an embedding.');
    }
    return embedding;

  } catch (error: any) {
    // --- THIS IS THE NEW, LOUDER ERROR HANDLING ---
    // If the error is from the OpenAI API, it will have a specific structure.
    // We will log the detailed error message to help us debug.
    console.error('--- OpenAI API Error ---');
    console.error(`Error creating embedding for text: "${text.substring(0, 50)}..."`);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Raw Error:', error);
    }
    console.error('--------------------------');
    
    // IMPORTANT: We re-throw the error to ensure the calling script (seeds.mjs) stops.
    throw new Error('Failed to generate embedding via OpenAI API.');
  }
}