import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export const revalidate = 0;

// Default prompt value to use on init or if none exists
const DEFAULT_GENERIC_PROMPT = `You are a friendly, concise comedian. Keep replies short and humorous.`;

// Helper: ensure table exists and has at least one row
async function ensureGenericPromptTableExists() {
  await sql`
    CREATE TABLE IF NOT EXISTS generic_prompts (
      id SERIAL PRIMARY KEY,
      prompt_text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  const { rows } = await sql`SELECT id FROM generic_prompts LIMIT 1;`;
  if (rows.length === 0) {
    await sql`INSERT INTO generic_prompts (prompt_text) VALUES (${DEFAULT_GENERIC_PROMPT});`;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureGenericPromptTableExists();
    return NextResponse.json({ message: "Generic prompt table initialized." }, { status: 200 });
  } catch (error) {
    console.error("Failed to initialize generic_prompts table:", error);
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Try to read the latest prompt. If the table is missing, creation is handled in the catch block below.
    const { rows } = await sql`SELECT prompt_text FROM generic_prompts ORDER BY created_at DESC LIMIT 1;`;
    const prompt = rows[0]?.prompt_text ?? DEFAULT_GENERIC_PROMPT;
    return NextResponse.json({ prompt }, { status: 200 });
  } catch (error: any) {
    // If table is missing (Postgres error code 42P01) or message contains "does not exist", create and seed it.
    const msg = String(error?.message || "");
    const isMissingTable = error?.code === "42P01" || msg.includes('does not exist') || msg.includes('relation "generic_prompts" does not exist');
    if (isMissingTable) {
      try {
        await ensureGenericPromptTableExists();
        return NextResponse.json({ prompt: DEFAULT_GENERIC_PROMPT }, { status: 200 });
      } catch (err: any) {
        console.error("Failed to create generic_prompts table after missing-table error:", err);
        return NextResponse.json({ prompt: DEFAULT_GENERIC_PROMPT, error: String(err?.message ?? err) }, { status: 500 });
      }
    }
    console.error("Failed to fetch generic prompt:", error);
    return NextResponse.json({ prompt: DEFAULT_GENERIC_PROMPT, error: msg }, { status: 200 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Ensure table exists before attempting to insert
    await ensureGenericPromptTableExists();

    const body = await (async () => {
      try {
        return await request.json();
      } catch {
        return {};
      }
    })();

    const newPrompt = String(body?.prompt ?? "").trim();
    if (!newPrompt) {
      return NextResponse.json({ message: "prompt is required in body." }, { status: 400 });
    }

    // Insert new prompt (keeps history)
    await sql`INSERT INTO generic_prompts (prompt_text) VALUES (${newPrompt});`;

    return NextResponse.json({ message: "Generic prompt updated.", prompt: newPrompt }, { status: 200 });
  } catch (error) {
    console.error("Failed to update generic prompt:", error);
    return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  }
}
