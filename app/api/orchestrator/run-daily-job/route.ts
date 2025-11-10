// api\orchestrator\run-daily-job\route.ts

import { runDailyAutonomousJob } from "@/lib/services/orchestratorService";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from 'crypto'; // Import Node.js crypto module

/**
 * This endpoint serves as a secure trigger for the smart autonomous job.
 */
export async function POST(request: NextRequest) {
  try {
    // AC-4: Securely access the secret key from environment variables.
    const secretKey = process.env.ORCHESTRATOR_SECRET_KEY;
    const { jobId, tenEach=false } = await request.json();
  const id = jobId || randomUUID();

    // Gracefully handle server misconfiguration if the secret key is not set.
    if (!secretKey) {
      console.error("CRITICAL: ORCHESTRATOR_SECRET_KEY is not set on the server.");
      return NextResponse.json({ error: "Internal Server Error: Missing configuration." }, { status: 500 });
    }

    // AC-3: Secure Access - Check the authorization token.
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${secretKey}`) {
      // If the token is missing, invalid, or does not match, reject the request.
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Authorization Successful ---

    console.log("Smart autonomous job started successfully via orchestrator endpoint.");

    // We don't use 'await' here so the request can return immediately
    // while the job runs in the background.
    // runDailyAutonomousJob(id);
     runDailyAutonomousJob({jobId: id, isTopCharacters: false, isSimpleMode: false, tenEach});

    // AC-5: Success Response - Return a 202 Accepted status.
    return NextResponse.json(
      {
        status: "success",
        message: "Smart autonomous job started.",
        jobId: id, // <-- Send this back to the frontend

      },
      { status: 202 }
    );

  } catch (error: any) {
    // --- THIS IS THE CRITICAL FIX ---
    // If anything goes wrong in the logic above, catch it here.
    console.error("[API_ERROR] Failed to start smart autonomous job:", error);
    
    // Return a proper JSON error response to the client.
    return NextResponse.json(
      { error: "Failed to start smart job due to a server-side error.", details: error.message }, 
      { status: 500 }
    );
  }
}