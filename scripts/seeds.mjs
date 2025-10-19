// This is a standalone script to seed your database.
// To run it, first install dotenv: npm install dotenv
// Then run this file: node scripts/seeds.mjs

import dotenv from 'dotenv';
import { db } from '@vercel/postgres';
import { characters } from '../lib/characters.ts';

dotenv.config({ path: '.env.local' });


async function seedCharacters(client) {
  try {
    // Create the "characters" table if it doesn't exist
    await client.sql`
      CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        avatar VARCHAR(255),
        bio TEXT,
        prompt_persona TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log(`Ensured "characters" table exists.`);

    // Insert data into the "characters" table
    console.log(`Seeding ${characters.length} characters into the database...`);
    for (const character of characters) {
      await client.sql`
        INSERT INTO characters (name, avatar, bio, prompt_persona)
        VALUES (${character.name}, ${character.avatar}, ${character.bio}, ${character.prompt_persona})
        ON CONFLICT (name) DO NOTHING;
      `;
    }
    console.log(`✅ Seeding complete. ${characters.length} characters are now in the database.`);

  } catch (error) {
    console.error('Error seeding characters:', error);
    throw error;
  }
}

async function main() {
  const client = await db.connect();
  try {
    await seedCharacters(client);
  } finally {
    // Ensure the client is always released back to the pool
    await client.end();
  }
}

// Execute the main function and catch any top-level errors
main().catch((err) => {
  console.error(
    'An unhandled error occurred while seeding the database:',
    err,
  );
});