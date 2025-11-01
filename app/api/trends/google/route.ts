// File: app/api/trends/route.ts

import { NextResponse, NextRequest } from 'next/server';
import googleTrends from 'google-trends-api';

// ... (SimplifiedTrend interface is the same)
interface SimplifiedTrend {
  query: string;
  traffic: string;
}

export async function GET(request: NextRequest) {
  const country = 'US';
  console.log(`Fetching Google Trends for hardcoded country: ${country}`);

  let resultsString: string; // Define the variable outside the try block

  try {
    resultsString = await googleTrends.dailyTrends({
      geo: country,
    });

    const results = JSON.parse(resultsString);
    const trendingSearchesRaw = results.default.trendingSearchesDays[0]?.trendingSearches || [];

    const trends: SimplifiedTrend[] = trendingSearchesRaw.map((trend: any) => {
      return {
        query: trend.title.query,
        traffic: trend.formattedTraffic,
      };
    });

    return NextResponse.json({
      message: `Top ${trends.length} Google Trends for ${country}`,
      trends: trends,
    });

  } catch (error: any) {
    // --- THIS IS THE KEY DEBUGGING CHANGE ---
    console.error(`Failed to PARSE Google Trends data for ${country}.`);
    console.error("The error message was:", error.message);
    
    // Log the raw string that caused the JSON.parse to fail.
    // It will contain the HTML from Google's block page.
    // @ts-ignore - resultsString might not be assigned, which is fine for logging.
    console.log("Received payload that is NOT valid JSON:", resultsString);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch Google Trends data. The service may be temporarily unavailable or rate-limited.',
        details: 'Received a non-JSON response, likely an HTML block page from Google.'
      },
      { status: 503 } // 503 Service Unavailable is a more accurate status code
    );
  }
}