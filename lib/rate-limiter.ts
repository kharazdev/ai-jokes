// lib/rate-limiter.ts

import { sql } from "@vercel/postgres";

/**
 * Checks if a specific API action can be performed.
 * It's allowed if it has never been called before, or if the last
 * successful call was more than 24 hours ago.
 *
 * @param actionName - A unique name for the action (e.g., 'generate_daily_joke').
 * @returns {Promise<boolean>} - True if the action is allowed, false otherwise.
 */
export async function canMakeApiCall(actionName: string): Promise<boolean> {
  try {
    const { rows } = await sql`
      SELECT last_successful_call FROM daily_api_limits
      WHERE action_name = ${actionName};
    `;

    // If there's no record, it means this action has never been run successfully.
    if (rows.length === 0) {
      return true;
    }

    const lastCallDate = new Date(rows[0].last_successful_call);
    const now = new Date();
    
    // Calculate the difference in milliseconds
    const timeDifference = now.getTime() - lastCallDate.getTime();
    
    // Convert 24 hours to milliseconds (24 * 60 * 60 * 1000)
    const twentyFourHoursInMillis = 86400000;

    // If the difference is greater than 24 hours, allow the call.
    return timeDifference > twentyFourHoursInMillis;

  } catch (error) {
    console.error("Error checking API call status:", error);
    // Fail safe: if we can't check the DB, block the call to be safe.
    return false;
  }
}

/**
 * Records a successful API call for a specific action by inserting or updating
 * its timestamp in the database.
 *
 * @param actionName - A unique name for the action (e.g., 'generate_daily_joke').
 */
export async function recordSuccessfulApiCall(actionName: string): Promise<void> {
  try {
    const now = new Date();
    // This is an "UPSERT" operation.
    // It will INSERT a new row if `action_name` doesn't exist.
    // If it does exist, it will UPDATE the `last_successful_call` timestamp.
    await sql`
      INSERT INTO daily_api_limits (action_name, last_successful_call)
      VALUES (${actionName}, ${now.toISOString()})
      ON CONFLICT (action_name)
      DO UPDATE SET last_successful_call = EXCLUDED.last_successful_call;
    `;
  } catch (error) {
    console.error("Error recording successful API call:", error);
    // Depending on your logic, you might want to handle this error more gracefully.
  }
}