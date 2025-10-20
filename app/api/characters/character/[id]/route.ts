import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 0;

export async function GET(request: NextRequest, context: any) {
  try {
    // Support context.params possibly being a Promise (Next internals may wrap it)
    let idRaw = context?.params?.id;
    if (idRaw && typeof (idRaw as any).then === 'function') {
      idRaw = await idRaw;
    }

    const characterId = parseInt(String(idRaw), 10);
    if (isNaN(characterId)) {
      return NextResponse.json(
        { message: 'Invalid ID format. ID must be a number.' },
        { status: 400 }
      );
    }

    const { rows } = await sql`
      SELECT id, name, avatar, bio
      FROM characters
      WHERE id = ${characterId};
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { message: `Character with ID '${characterId}' not found.` },
        { status: 404 }
      );
    }

    const character = rows[0];
    return NextResponse.json({ character }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch character:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}
