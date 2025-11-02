import { sql } from "@vercel/postgres";

/**
 * CORE RATE-LIMITING LOGIC (Internal Function)
 * ---------------------------------------------
 * This is the base function that checks if an action is allowed based on a
 * dynamic time limit in days. It is not exported directly, but used by the
 * more specific functions below.
 *
 * @param actionName - A unique name for the action.
 * @param limitInDays - The number of days that must pass before the action is allowed again.
 * @returns {Promise<boolean>} - True if the action is allowed, false otherwise.
 */
async function checkApiLimit(actionName: string, limitInDays: number): Promise<boolean> {
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
    
    const timeDifference = now.getTime() - lastCallDate.getTime();
    
    // Dynamically calculate the limit in milliseconds based on the provided number of days.
    const limitInMillis = limitInDays * 24 * 60 * 60 * 1000;

    // If the time difference is greater than the limit, allow the call.
    return timeDifference > limitInMillis;

  } catch (error) {
    console.error(`Error checking API call status for '${actionName}':`, error);
    // Fail safe: if we can't check the DB, block the call to be safe.
    return false;
  }
}

// --- EXPORTED HELPER FUNCTIONS ---

/**
 * Checks if a specific API action can be performed based on a DAILY (1-day) limit.
 * @param actionName - A unique name for the action (e.g., 'generate_daily_trends').
 */
export async function canMakeDailyCall(actionName: string): Promise<boolean> {
  return checkApiLimit(actionName, 1);
}

/**
 * Checks if a specific API action can be performed based on a WEEKLY (7-day) limit.
 * @param actionName - A unique name for the action (e.g., 'generate_weekly_summary').
 */
export async function canMakeWeeklyCall(actionName: string): Promise<boolean> {
  return checkApiLimit(actionName, 7);
}

/**
 * Records a successful API call for a specific action.
 * This function does not need to be changed, as it simply records a timestamp
 * for a given action name, regardless of the limit duration.
 *
 * @param actionName - The unique name of the action that was successful.
 */
export async function recordSuccessfulApiCall(actionName: string): Promise<void> {
  try {
    const now = new Date();
    // This "UPSERT" operation works perfectly for any action name.
    await sql`
      INSERT INTO daily_api_limits (action_name, last_successful_call)
      VALUES (${actionName}, ${now.toISOString()})
      ON CONFLICT (action_name)
      DO UPDATE SET last_successful_call = EXCLUDED.last_successful_call;
    `;
  } catch (error) {
    console.error(`Error recording successful API call for '${actionName}':`, error);
  }
}