// lib/ai/embedding.ts

import OpenAI from 'openai';

// This checks for the OpenAI API key in your .env.local file
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in your environment variables.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Converts a string of text into a vector embedding.
 * @param text The text to be embedded.
 * @returns A promise that resolves to an array of numbers (the vector embedding).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string.');
  }

  try {
    const response = await openai.embeddings.create({
      // The model 'text-embedding-3-small' is powerful, fast, and cost-effective.
      // Its output dimension is 1536, which MUST match your database schema.
      model: 'text-embedding-3-small',
      input: text.trim().replace(/\n/g, ' '), // Clean up the input text
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding) {
      throw new Error('Failed to retrieve embedding from OpenAI response.');
    }
    console.log('Generated embedding of length:', embedding.length);
    return embedding;

  } catch (error) {
    console.error('Error getting embedding from OpenAI:', error);
    // Re-throw a simpler error to the calling function
    throw new Error('Failed to generate embedding via OpenAI API.');
  }
}