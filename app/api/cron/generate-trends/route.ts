import { NextRequest, NextResponse } from "next/server";

// Ensure this route is always run dynamically and not cached
export const dynamic = 'force-dynamic';

/**
 * This is the secure endpoint triggered by a Vercel Cron Job.
 * Its sole purpose is to authenticate the request and then make an
 * internal POST request to the actual trend generation endpoint.
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate the request
  // The 'authorization' header is automatically sent by Vercel Cron Jobs
  // if you have the CRON_SECRET environment variable set.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // If the secret doesn't match, deny access
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Determine the base URL for the internal API call
  // This works for both production (Vercel) and local development.
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  try {
    // 3. Trigger the actual POST endpoint
    console.log(`Cron job triggered. Making internal POST request to ${baseUrl}/api/generate-trends`);
    const res = await fetch(`${baseUrl}/api/generate-trends`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 4. Handle the response from the POST endpoint
    if (!res.ok) {
      // If the POST request failed (e.g., rate limit hit, or an error occurred)
      const errorData = await res.json();
      console.error('Cron job failed: The POST endpoint returned an error.', { status: res.status, body: errorData });
      return NextResponse.json(
        { success: false, error: errorData.message || 'The POST endpoint returned a non-200 status.' }, 
        { status: res.status }
      );
    }

    // 5. If successful, log and return a success response
    const data = await res.json();
    console.log('Cron job successfully triggered the POST /api/generate-trends endpoint.');
    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error) {
    console.error('Cron job failed: There was a network error or an issue making the internal fetch request.', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message }, 
      { status: 500 }
    );
  }
}