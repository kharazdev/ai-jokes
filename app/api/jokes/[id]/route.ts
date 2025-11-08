import { NextResponse, NextRequest } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 0;

type JokeRow = {
  id: number;
  content: string;
  character_name: string;
  created_at: string;
};

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    // Support context.params possibly being a Promise (Next internals may wrap it)
    let idRaw = context?.params?.id;
    if (idRaw && typeof (idRaw as any).then === 'function') {
      idRaw = await idRaw;
    }

    const jokeId = parseInt(String(idRaw), 10);
    if (isNaN(jokeId)) {
      return NextResponse.json({ message: 'Invalid joke id.' }, { status: 400 });
    }

    const { rows } = await sql<JokeRow>`
      SELECT *
      FROM jokes
      WHERE id = ${jokeId};
    `;

    if (rows.length === 0) {
      return NextResponse.json({ message: `Joke with ID ${jokeId} not found.` }, { status: 404 });
    }

    return NextResponse.json({ joke: rows[0] }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch joke by id:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: any
) {
  try {
    // Support context.params possibly being a Promise (Next internals may wrap it)
    let idRaw = context?.params?.id;
    if (idRaw && typeof (idRaw as any).then === 'function') {
      idRaw = await idRaw;
    }

    const jokeId = parseInt(String(idRaw), 10);
    if (isNaN(jokeId)) {
      return NextResponse.json({ message: 'Invalid joke id.' }, { status: 400 });
    }

    const body = await (async () => {
      try {
        return await request.json();
      } catch {
        return {};
      }
    })();

    const content = body?.content;
    if (!content || String(content).trim() === '') {
      return NextResponse.json({ message: 'Joke content cannot be empty.' }, { status: 400 });
    }

    // Update the joke
    await sql`
      UPDATE jokes
      SET content = ${content}
      WHERE id = ${jokeId};
    `;

    // Fetch updated row to confirm and return it
    const { rows } = await sql<JokeRow>`
      SELECT id, content, character_name, created_at
      FROM jokes
      WHERE id = ${jokeId};
    `;

    if (rows.length === 0) {
      return NextResponse.json({ message: `Joke with ID ${jokeId} not found after update.` }, { status: 404 });
    }

    return NextResponse.json({ message: 'Joke updated successfully.', joke: rows[0] }, { status: 200 });
  } catch (error) {
    console.error('API Error updating joke:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
