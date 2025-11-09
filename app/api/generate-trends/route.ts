// File: /app/api/generate-trends/route.ts

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { canMakeWeeklyCall, recordSuccessfulApiCall } from "@/lib/rate-limiter";
import { getTrendsPrompt } from "./helper"; // Your helper file
import { genAIPro } from "@/lib/ai/genAI";

export const revalidate = 0;

export async function POST(req: NextRequest) {
  const actionName = "generate_daily_trends";
  const isAllowed = await canMakeWeeklyCall(actionName);

  if (!isAllowed) {
    // ... (This part remains the same)
    console.log("Rate limit active. Serving latest from cache.");
    const { rows } = await sql`
      SELECT trends_json FROM daily_trends ORDER BY created_at DESC LIMIT 1;
    `;
    if (rows.length > 0) {
      return NextResponse.json(rows[0].trends_json, { status: 429, statusText: "Too Many Requests" });
    } else {
      return NextResponse.json({ message: "Rate limit active and no cached trends are available." }, { status: 429 });
    }
  }

  console.log("Rate limit passed. Generating new trends.");
 return []
  // try {

  //   // Call the prompt function without arguments
  //   const prompt = getTrendsPrompt();

  //   const result = await genAIPro.generateContent(prompt);
  //   const response = await result.response;
  //   const text = response.text();

  //   const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
  //   const trends = JSON.parse(cleanText);

  //   // Save the new trends to our cache table
  //   await sql`
  //     INSERT INTO daily_trends (trends_json) VALUES (${JSON.stringify(trends)});
  //   `;

  //   // Record the successful API call
  //   await recordSuccessfulApiCall(actionName);
    
  //   console.log("Successfully generated and saved new trends.");

  //   return NextResponse.json(trends, { status: 200 });

  // } catch (error) {
  //   console.error("An error occurred during trend generation:", error);
  //   return NextResponse.json({ message: "Internal Server Error", error: (error as Error).message }, { status: 500 });
  // }
}

 

