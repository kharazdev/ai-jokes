// app/api/categories/route.ts

import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// This is a special function in Next.js that runs only on the server.
export async function GET() {
  try {
    // This SQL query is safe because it only runs on the server.
    const { rows } = await sql`SELECT id, label, label_arabic FROM categories ORDER BY label;`;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}