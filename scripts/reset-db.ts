// scripts/reset-db.ts

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv'; // 1. Import dotenv

// 2. Explicitly load from .env.local, just like your other script
dotenv.config({ path: '.env.local' });

// 3. Keep the check to ensure it loaded correctly
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from .env.local');
}

// The rest of the script is the same
const neonSql = neon(process.env.DATABASE_URL);
const db = drizzle(neonSql);

async function main() {
  console.log('🔥 WARNING: This script will delete ALL data from the following tables:');
  console.log('   - jokes');
  // console.log('   - memories');
  console.log('   - characters');
  
  for (let i = 5; i > 0; i--) {
    console.log(`   Operation will begin in ${i}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  try {
    console.log('\n🗑️  Deleting all data...');
  
    await db.execute(sql`
      TRUNCATE TABLE jokes, characters RESTART IDENTITY CASCADE;
    `);

    // await db.execute(sql`
    //   TRUNCATE TABLE jokes, memories, characters RESTART IDENTITY CASCADE;
    // `);
    
    console.log('✅ Database reset successfully!');
  } catch (error) {
    console.error('❌ An error occurred during database reset:', error);
    process.exit(1);
  }
}

main();