// in lib/services/characterService.ts

import { Character } from '@/components/EditCharacterForm';
import { sql } from '@vercel/postgres';
// ... (Your Character interface)

/**
 * Fetches active characters from the database.
 * NOTE: Currently hardcoded to fetch only 2 for testing purposes.
 */
export async function getAllActiveCharacters(): Promise<Character[]> {
  try {
    const { rows } = await sql<Character>`
      SELECT id, name, prompt_persona, country
      FROM characters 
      WHERE is_active = true
      -- TODO: REMOVE THIS LIMIT BEFORE DEPLOYING TO PRODUCTION
      --  LIMIT 2; 
    `;
    return rows;
  } catch (error) {
    console.error("[CHARACTER_SERVICE] Failed to fetch characters:", error);
    throw new Error("Could not fetch character roster from the database.");
  }
}

/**
 * Fetches all active characters belonging to a specific category.
 * @param categoryId The ID of the category to filter by.
 */
export async function getActiveCharactersByCategory(categoryId: number): Promise<Character[]> {
  try {
    // Note: This assumes you have a 'category_id' column in your 'characters' table.
    const { rows } = await sql<Character>`
      SELECT id, name, prompt_persona, country
      FROM characters 
      WHERE is_active = true AND category_id = ${categoryId}; 
    `;
    return rows;
  } catch (error) {
    console.error(`[CHARACTER_SERVICE] Failed to fetch characters for category ${categoryId}:`, error);
    throw new Error("Could not fetch character roster from the database.");
  }
}


/**
 * Fetches the top 10 active characters from the dedicated API endpoint.
 * @returns {Promise<Character[]>} A promise that resolves to an array of top character objects.
 */
export async function getTopCharacters(): Promise<Character[]> {
  try {
    // Using a fully qualified URL is important for server-side fetching.
    // Consider using an environment variable for your base URL.
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/characters/top`); 

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const characters: Character[] = await response.json();
    return characters;
  } catch (error) {
    console.error('[SERVICE_ERROR] Failed to fetch top characters:', error);
    return []; // Return an empty array to prevent the job from crashing.
  }
}



/**
 * Fetches a single character by their unique ID from the database.
 * @param characterId The ID of the character to fetch.
 * @returns A promise that resolves to the character object or null if not found.
 */
export async function getCharacterById(characterId: number): Promise<Character | null> {
  try {
    const { rows } = await sql<Character>`
      SELECT id, name, prompt_persona, country, prompt_topics
      FROM characters 
      WHERE id = ${characterId}
      LIMIT 1;
    `;

    // The query returns an array; if a character is found, it will be the first element.
    // If not found, the array will be empty, and `rows[0]` will be undefined, so we return null.
    return rows[0] || null;

  } catch (error) {
    console.error(`[CHARACTER_SERVICE] Failed to fetch character with ID ${characterId}:`, error);
    // Return null on error to prevent the calling service from crashing.
    return null;
  }
}