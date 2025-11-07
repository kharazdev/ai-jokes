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