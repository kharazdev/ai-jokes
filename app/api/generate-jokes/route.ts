import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { characters } from '@/lib/characters';
import { sql } from '@vercel/postgres';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret');

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // --- MODIFIED: Fetch full joke data to check for cache ---
    const { rows } = await sql`
      SELECT content, character_name FROM jokes 
      WHERE created_at >= CURRENT_DATE 
      ORDER BY id ASC 
      LIMIT 5;
    `;

    // --- MODIFIED: If jokes exist, return them directly ---
    if (rows.length > 4) {
      console.log('CACHE HIT: Jokes for today already exist. Returning from database.');
      const cachedJokes = rows.map(row => ({
        character: row.character_name,
        joke: row.content,
      }));
      return NextResponse.json({
        message: 'Jokes for today have already been generated. Returning from cache.',
        jokes: cachedJokes,
      });
    }

    // If we reach here, it's a CACHE MISS. We generate new jokes.
    console.log('CACHE MISS: Generating new jokes from Google AI...');
    const generatedJokes = [];
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    for (const character of characters) {
      console.log(`Generating joke for ${character.name}...`);
      const prompt = `...`; // your prompt
      const result = await model.generateContent(prompt);
      const response = result.response;
      const jokeContent = response.text().trim();

      if (jokeContent) {
        generatedJokes.push({ character: character.name, joke: jokeContent });
        await sql`
          INSERT INTO jokes (content, character_name)
          VALUES (${jokeContent}, ${character.name});
        `;
        console.log(`-> Saved joke for ${character.name} to the database.`);
      } else {
        console.error(`Failed to generate joke for ${character.name}. Response was empty.`);
      }
      await delay(1000);
    }

    return NextResponse.json({
      message: 'Successfully generated and stored 5 jokes.',
      jokes: generatedJokes,
    });

  } catch (error) {
    console.error('An error occurred during joke generation:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}