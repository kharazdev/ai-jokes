// in lib/services/trendService.ts

import { sql } from '@vercel/postgres';

// --- Type Definitions ---
export interface CountryTrend {
  trend_name: string;
  description: string;
}
export interface AllTrendsData {
  [countryName: string]: CountryTrend[];
}

/**
 * Fetches the most recent, complete trends JSON object directly from the database.
 */
export async function getLatestCachedTrends(): Promise<AllTrendsData | null> {
  try {
    const { rows } = await sql`
      SELECT trends_json FROM daily_trends 
      ORDER BY created_at DESC 
      LIMIT 1;
    `;

    if (rows.length > 0) {
      return rows[0].trends_json as AllTrendsData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("[TREND_SERVICE] Failed to fetch cached trends from DB:", error);
    throw new Error("Could not fetch cached trends.");
  }
}

/**
 * Sends a non-blocking POST request to the trend generation endpoint.
 * This is a "fire-and-forget" call.
 */
export async function triggerTrendGeneration(): Promise<void> {
  console.log("[TRIGGER] Sending request to generate new trends...");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const generationUrl = `${baseUrl}/api/generate-trends`;

  // We don't await the fetch call to avoid blocking the daily orchestrator.
  // The rate-limiter on the endpoint itself will handle the logic.
  fetch(generationUrl, { method: 'POST' }).catch(error => {
    console.error("[TRIGGER] Failed to send trend generation request:", error);
  });
}