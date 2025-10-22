import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';
import { canMakeApiCall, recordSuccessfulApiCall } from '@/lib/rate-limiter';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(request: Request) {
  // --- Step 1: Authentication and Parameter Checks ---
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get('cron_secret');
  const forceRefresh = searchParams.get('force') === 'true';

  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // +++ ADDED +++ Step 2: Check the Daily Rate Limit for this entire job
    const actionName = 'generate_daily_jokes_for_all_characters';
    const isAllowed = await canMakeApiCall(actionName);
    const { rows: cached } = await sql`
      SELECT content, character_name FROM jokes 
      WHERE created_at >= CURRENT_DATE 
      ORDER BY id ASC;
    `;

    const cachedJokes = cached.map((row: any) => ({ character: row.character_name, joke: row.content }));
    if (!isAllowed) {
      console.log(`Daily limit reached for action: ${actionName}. Job blocked.`);
      return NextResponse.json(
        { message: "The daily joke generation job has already run successfully today.", jokes: cachedJokes },
        { status: 429 } // 429 Too Many Requests
      );
    }
    console.log(`Daily limit check passed for ${actionName}.`);

    // --- Step 3: Fetch Generic Prompt and Characters ---
    // Fetch generic prompt (fallback to string if table doesn't exist or empty)
    let genericPrompt = '';
    try {
      const { rows: gpRows } = await sql`SELECT prompt_text FROM generic_prompts ORDER BY created_at DESC LIMIT 1;`;
      genericPrompt = gpRows[0]?.prompt_text ?? '';
    } catch (err) {
      // table might not exist yet; leave genericPrompt empty
      console.warn('Could not fetch generic prompt (it may not be initialized).', err);
      genericPrompt = '';
    }

    // Fetch characters from the database to ensure consistency
    const { rows: characters } = await sql`SELECT name, prompt_persona FROM characters;`;

    if (characters.length === 0) {
      return NextResponse.json({ message: 'No characters found in the database.' }, { status: 404 });
    }

    const generatedJokes = [];
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); // gemini-pro is often sufficient

    // --- Step 4: Generate New Jokes ---
    for (const character of characters) {
      console.log(`Generating joke for ${character.name}...`);
      const combinedPrompt = [genericPrompt, character.prompt_persona].filter(Boolean).join(' ');
      const prompt = `You are a comedian. Global instructions: "${combinedPrompt}". Please tell me a single, short joke based on that persona. Do not include any preamble like "Here's a joke:". Just return the joke text.`;

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
      await delay(10000); // 10-second delay to respect potential AI API rate limits
    }

    // +++ ADDED +++ Step 5: Record the successful completion of the job
    // This is only called if the entire loop finishes without throwing an error.
    await recordSuccessfulApiCall(actionName);
    console.log(`-> Logged successful completion for job: ${actionName}`);

    return NextResponse.json({
      message: `Successfully generated and stored ${generatedJokes.length} jokes.`,
      jokes: generatedJokes,
    });

  } catch (error) {
    console.error('An error occurred during joke generation:', error);
    // We DO NOT record the API call if there was an error, allowing it to be retried.
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}