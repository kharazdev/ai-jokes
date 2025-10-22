import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';

export const revalidate = 0;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest, context: any) {
  try {
    // Ensure we await params if Next wraps them in a Promise
    let params = context?.params;
    if (params && typeof (params as any).then === 'function') {
      params = await params;
    }
    const idRaw = params?.id;
    const characterId = parseInt(String(idRaw), 10);
    if (isNaN(characterId)) {
      return NextResponse.json(
        { message: `Invalid ID format: '${idRaw}'. ID must be a number.` },
        { status: 400 }
      );
    }

    const { rows } = await sql`SELECT id, name, avatar, prompt_persona FROM characters WHERE id = ${characterId};`;
    if (rows.length === 0) {
      return NextResponse.json({ message: `Character with ID '${characterId}' does not exist.` }, { status: 404 });
    }
    const character = rows[0];

    // Fetch generic prompt if available (non-fatal)
    let genericPrompt = '';
    try {
      const { rows: gpRows } = await sql`SELECT prompt_text FROM generic_prompts ORDER BY created_at DESC LIMIT 1;`;
      genericPrompt = gpRows[0]?.prompt_text ?? '';
    } catch (err) {
      genericPrompt = '';
    }

    const combinedPrompt = [genericPrompt, character.prompt_persona].filter(Boolean).join(' ');
    const prompt = `You are a comedian. Global instructions: "${combinedPrompt}". Please tell me a single, short joke based on that persona. Do not include any preamble like "Here's a joke:". Just return the joke text.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Call AI and handle service errors (like 503) gracefully
    let result: any;
    try {
      result = await model.generateContent(prompt);
    } catch (aiError: any) {
      console.error('Error generating joke (no-limit):', aiError);

      // Try to extract status if provided by client library, otherwise default to 503
      const status = aiError?.status || aiError?.response?.status || 503;
      const message = aiError?.message || 'AI service error';
      return NextResponse.json(
        { message: 'AI service error while generating joke.', error: message },
        { status }
      );
    }

    const response = result?.response;
    const textValue = typeof response?.text === 'function' ? response.text() : response?.text ?? '';
    const jokeContent = String(textValue).trim();

    if (!jokeContent) {
      return NextResponse.json({ message: 'AI failed to generate a joke.' }, { status: 500 });
    }

    const { rows: insertRows } = await sql`
      INSERT INTO jokes (content, character_name)
      VALUES (${jokeContent}, ${character.name})
      RETURNING id, content;
    `;

    const created = insertRows[0];
    return NextResponse.json({ message: `Generated joke for ${character.name}.`, joke: created }, { status: 201 });
  } catch (error: any) {
    console.error('Unexpected error in generate-joke no-limit route:', error);
    return NextResponse.json({ message: 'Internal Server Error', error: String(error?.message || error) }, { status: 500 });
  }
}
