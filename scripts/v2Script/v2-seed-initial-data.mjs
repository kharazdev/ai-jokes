// scripts/seed-initial-data.mjs
import dotenv from 'dotenv';
import { db } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';

/**
 * SEED SCRIPT 1: INITIAL DATA (INSERT-ONLY LOGIC)
 * ---------------------------------
 * This script is now insert-only and will not update existing rows.
 * It is safe to run multiple times.
 *
 * 1. For each character in the JSON files, it checks if a character with that name already exists.
 *    a. If it exists, it is SKIPPED to protect existing data.
 *    b. If it does not exist, it is inserted.
 * 2. For each joke, it checks the `memories` and `training_data` tables. If the joke is new, it's inserted.
 *    If it already exists, it is skipped.
 */
async function seedDatabase(client) {
  try {
    const dataDir = path.join(process.cwd(), 'scripts', 'v2Script', 'v2-seed-data');
    const dataFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));

    if (dataFiles.length === 0) {
      console.warn(`⚠️ No JSON seed files found in ${dataDir}. Exiting.`);
      return;
    }

    console.log(`Found ${dataFiles.length} archetype files to process.`);
    let totalCharactersProcessed = 0;

    for (const fileName of dataFiles) {
      const dataPath = path.join(dataDir, fileName);
      console.log(`\n--- Processing file: ${fileName} ---`);
      
      const fileContents = fs.readFileSync(dataPath, 'utf8');
      const { comedic_archetypes } = JSON.parse(fileContents);
      
      if (!comedic_archetypes || !Array.isArray(comedic_archetypes) || comedic_archetypes.length === 0) {
        console.warn(`   - WARNING: No 'comedic_archetypes' found in ${fileName}. Skipping.`);
        continue;
      }

      for (const archetype of comedic_archetypes) {
        totalCharactersProcessed++;
        
        if (!archetype?.core_persona_style?.description || !archetype.archetype_name) {
            console.error(`   - ❌ ERROR: Invalid archetype object in ${fileName}. Skipping.`, archetype);
            continue;
        }

        const { core_persona_style, classic_jokes_and_stories: seed_jokes } = archetype;
        console.log(`   - [${totalCharactersProcessed}] Processing character: ${archetype.archetype_name}...`);

        // --- MODIFIED LOGIC: CHECK FIRST, THEN INSERT ---
        let character;

        // 1. Check if the character already exists
        const { rows: [existingCharacter] } = await client.sql`
          SELECT id, name FROM characters WHERE name = ${archetype.archetype_name};
        `;

        if (existingCharacter) {
          // 2a. If character exists, use its data and do not update
          character = existingCharacter;
          console.log(`     - Character "${character.name}" (ID: ${character.id}) already exists. Skipping creation.`);
        } else {
          // 2b. If character does not exist, insert it as a new row
          const personaString = `Description: ${core_persona_style.description}\nAttitude: ${core_persona_style.attitude}\nHumor Style: ${core_persona_style.humor_style}\nVoice and Vocabulary: ${core_persona_style.voice_and_vocabulary}`;
          
          const { rows: [newCharacter] } = await client.sql`
            INSERT INTO characters (name, avatar, bio, prompt_persona, prompt_topics, country, is_active, category_id)
            VALUES (
              ${archetype.archetype_name}, 
              ${archetype.avatar || '❓'}, 
              ${core_persona_style.description}, 
              ${personaString}, 
              ${archetype.key_comedic_topics}, 
              'Lebanon', -- Hardcoded to 'Lebanon'
              TRUE,
              6          -- Hardcoded to 6
            )
            RETURNING id, name;
          `;
          character = newCharacter;
          console.log(`     ✅ New character "${character.name}" (ID: ${character.id}) created.`);
        }

        const characterId = character.id;
        if (!seed_jokes || seed_jokes.length === 0) {
          console.log(`     - No seed jokes for this character.`);
          continue;
        }
        
        console.log(`     - Found ${seed_jokes.length} seed jokes to process...`);
        let newMemoriesCount = 0;
        let newTrainingDataCount = 0;

        for (const joke of seed_jokes) {
          const jokeContent = joke.english_translation;
          
          // --- LOGIC FOR 'memories' TABLE (already insert-only) ---
          const { rows: existingMemory } = await client.sql`
            SELECT id FROM memories WHERE character_id = ${characterId} AND content = ${jokeContent} AND type = 'seed_joke';
          `;
          if (existingMemory.length === 0) {
            await client.sql`
              INSERT INTO memories (character_id, content, type)
              VALUES (${characterId}, ${jokeContent}, 'seed_joke');
            `;
            newMemoriesCount++;
          }
          
          // --- LOGIC FOR 'training_data' TABLE (already insert-only) ---
          const { rows: existingTrainingData } = await client.sql`
            SELECT id FROM training_data WHERE english_translation = ${jokeContent} AND archetype_name = ${archetype.archetype_name};
          `;
          if (existingTrainingData.length === 0) {
            await client.sql`
              INSERT INTO training_data (archetype_name, culture, native_text, english_translation, source_file)
              VALUES (${archetype.archetype_name}, ${archetype.culture}, ${joke.native_language}, ${jokeContent}, ${fileName});
            `;
            newTrainingDataCount++;
          }
        }

        if (newMemoriesCount > 0) {
          console.log(`     ✅ Saved ${newMemoriesCount} new records to the 'memories' table.`);
        } else {
          console.log(`     - All 'memories' records for this character were already in the database.`);
        }
        
        if (newTrainingDataCount > 0) {
            console.log(`     ✅ Saved ${newTrainingDataCount} new records to the 'training_data' table.`);
        } else {
            console.log(`     - All 'training_data' records for this character were already in the database.`);
        }
      }
    }
  } catch (error) {
    console.error('❌ An error occurred during the initial seeding process:', error);
    throw error;
  }
}

async function main() {
  console.log("Starting initial data seeding (insert-only)...");
  dotenv.config({ path: '.env.local' });
  if (!process.env.DATABASE_URL) {
    console.error("❌ CRITICAL ERROR: DATABASE_URL is missing from .env.local");
    process.exit(1);
  }
  
  const client = await db.connect();
  try {
    await seedDatabase(client);
  } finally {
    await client.end();
    console.log("\n✅ Initial data seeding complete!");
  }
}

main().catch((err) => {
  console.error('\n❌ An unhandled error occurred and the script has stopped:', err);
});