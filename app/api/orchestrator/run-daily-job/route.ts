// api\orchestrator\run-daily-job\route.ts

import { runDailyAutonomousJob } from "@/lib/services/orchestratorService";
import { NextRequest, NextResponse } from "next/server";

/**
 * This endpoint serves as a secure trigger for a daily autonomous job.
 * It is designed to be called by a scheduler like Vercel Cron or GitHub Actions.
 */
export async function POST(request: NextRequest) {
  // AC-4: Securely access the secret key from environment variables.
  const secretKey = process.env.ORCHESTRATOR_SECRET_KEY;

  // Gracefully handle server misconfiguration if the secret key is not set.
  if (!secretKey) {
    console.error("CRITICAL: ORCHESTRATOR_SECRET_KEY is not set on the server.");
    return NextResponse.json({ error: "Internal Server Error: Missing configuration." }, { status: 500 });
  }

  // AC-3: Secure Access - Check the authorization token.
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${secretKey}`;
  console.log({authHeader, expectedToken})
  if (authHeader !== expectedToken) {
    // If the token is missing, invalid, or does not match, reject the request.
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Authorization Successful ---

  // AC-6: Initial Logging - Log to the console that the job has started.
  console.log("Daily autonomous job started successfully via orchestrator endpoint.");

  // TODO: Place your actual job logic here.
  // For example, you could call other internal APIs, update the database, etc.
  // runDailyTrendGeneration();
  // runDailyJokeGeneration();

    // The Receptionist's job is done. Hand off the actual work to the Manager.
  // We don't use 'await' here so the request can return immediately
  // while the job runs in the background.
  runDailyAutonomousJob(); 

  // AC-5: Success Response - Return a 202 Accepted status.
  return NextResponse.json(
    {
      status: "success",
      message: "Daily autonomous job started.",
    },
    { status: 202 }
  );
}

 