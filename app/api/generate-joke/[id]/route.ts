import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';
import { canMakeApiCall, recordSuccessfulApiCall } from '@/lib/rate-limiter';

export const revalidate = 0;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest, context: any) {
  try {
    let idRaw = context?.params?.id;
    if (idRaw && typeof (idRaw as any).then === 'function') idRaw = await idRaw;
    const characterId = parseInt(String(idRaw), 10);
    if (isNaN(characterId)) return NextResponse.json({ message: `Invalid ID format: '${idRaw}'. ID must be a number.` }, { status: 400 });

    const { rows } = await sql`SELECT id, name, avatar, prompt_persona FROM characters WHERE id = ${characterId};`;
    if (rows.length === 0) return NextResponse.json({ message: `Character with ID '${characterId}' does not exist.` }, { status: 404 });
    const character = rows[0];

    // Fetch generic prompt if available
    let genericPrompt = '';
    try {
      const { rows: gpRows } = await sql`SELECT prompt_text FROM generic_prompts ORDER BY created_at DESC LIMIT 1;`;
      genericPrompt = gpRows[0]?.prompt_text ?? '';
    } catch (err) {
      console.warn('Could not fetch generic prompt (it may not be initialized).', err);
      genericPrompt = '';
    }

    const actionName = `generate_joke_for_character_${characterId}`;
    const isAllowed = await canMakeApiCall(actionName);

    if (!isAllowed) {
      const { rows: todayRows } = await sql`
        SELECT content FROM jokes
        WHERE character_name = ${character.name} AND created_at >= CURRENT_DATE
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      const lastJokeToday = todayRows[0]?.content || 'No joke found for today.';
      return NextResponse.json({ message: `You can only generate one joke per day for ${character.name}. Here is the one from today.`, character: character.name, avatar: character.avatar, joke: lastJokeToday }, { status: 429 });
    }

    const combinedPrompt = [genericPrompt, character.prompt_persona].filter(Boolean).join(' ');
    const prompt = `You are a comedian. Global instructions: "${combinedPrompt}". Please tell me a single, short joke based on that persona. Do not include any preamble like "Here's a joke:". Just return the joke text.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result: any = await model.generateContent(prompt);
    const response = result.response;
    const jokeContent = response.text().trim();

    if (!jokeContent) return NextResponse.json({ message: 'AI failed to generate a joke.' }, { status: 500 });

    await sql`INSERT INTO jokes (content, character_name) VALUES (${jokeContent}, ${character.name});`;
    await recordSuccessfulApiCall(actionName);

    return NextResponse.json({ message: `Successfully generated a new joke for ${character.name}.`, character: character.name, avatar: character.avatar, joke: jokeContent }, { status: 200 });
  } catch (error) {
    console.error('An error occurred during single joke generation:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: (error as Error).message }, { status: 500 });
  }
}
