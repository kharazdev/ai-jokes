// File: /app/api/generate-trends/route.ts

 import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
 
export const revalidate = 0;

 

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching the latest daily trends from the database.");

    // Query the database for the most recently created trends record
    const { rows } = await sql`
      SELECT trends_json FROM daily_trends 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;

    // If a record was found, return the trends data
    if (rows.length > 0) {
      return NextResponse.json(rows[0].trends_json, { status: 200 });
    } else {
      // If no records exist, it means the POST has never been run successfully
      return NextResponse.json(
        { message: "No trends have been generated yet. Please trigger the POST endpoint first." }, 
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Failed to fetch trends:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message }, 
      { status: 500 }
    );
  }
}
 