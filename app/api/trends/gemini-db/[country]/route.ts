import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

// Ensure this route is always processed dynamically
export const dynamic = 'force-dynamic';

/**
 * Handles GET requests to fetch trends for a single, specific country.
 * The country name is extracted from the URL.
 * Example: /api/trends/Egypt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { country: string } }
) {
  // 1. Get and decode the country name from the URL parameter
  const countryName = decodeURIComponent(params.country);

  if (!countryName) {
    return NextResponse.json({ message: "Country name is required." }, { status: 400 });
  }

  try {
    // 2. Fetch the most recent, complete trends JSON object from the database
    const { rows } = await sql`
      SELECT trends_json FROM daily_trends 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;

    // 3. Handle the case where no trends have been generated yet
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "No trends data has been generated yet." },
        { status: 404 }
      );
    }

    const allTrends = rows[0].trends_json;

    // 4. Perform a case-insensitive search for the requested country key
    // This allows '/api/trends/egypt' to match the key "Egypt"
    const countryKey = Object.keys(allTrends).find(
      key => key.toLowerCase() === countryName.toLowerCase()
    );

    if (countryKey) {
      // 5. If the country is found, return its specific trends array
      const countryTrends = allTrends[countryKey];
      return NextResponse.json(countryTrends, { status: 200 });
    } else {
      // 6. If the country key doesn't exist in our data, return a 404
      return NextResponse.json(
        { message: `Trends for the country '${countryName}' were not found.` },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error(`Failed to fetch trends for ${countryName}:`, error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}