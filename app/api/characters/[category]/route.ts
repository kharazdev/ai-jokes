// File: app/api/characters/[category]/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const revalidate = 0; // Don't cache this route

/**
 * Handles GET requests to fetch characters by a specific category.
 * The category is passed as a dynamic segment in the URL.
 * Example: /api/characters/heroes
 */
export async function GET(
  request: Request,
  { params }: { params: { category: string } }
) {
  // 1. Get the category ID string from the `params` object.
  const categoryIdString = params.category;

  // 2. Convert the string to a number and validate it.
  const categoryId = parseInt(categoryIdString, 10);

  if (isNaN(categoryId)) {
    return NextResponse.json(
      { message: 'Invalid Category ID. The ID in the URL must be a number.' },
      { status: 400 } // Bad Request
    );
  }

  try {
    // We need to join the `characters` table with a `categories` table
    // to filter by the category's name.
    // This query assumes you have a `categories` table with `id` and `name` columns.
    const { rows: characters } = await sql`
      SELECT  id, name, bio, prompt_topics, category_id
      FROM 
        characters
      WHERE 
        category_id = ${categoryId}
    `;

    // If no characters are found for that category, return an empty array.
    if (characters.length === 0) {
      return NextResponse.json(
        { message: `No characters found for category: ${categoryIdString}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ characters }, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch characters by category:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    );
  }
}