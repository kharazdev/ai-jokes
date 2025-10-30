// drizzle.config.js

import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from your .env file');
}

/** @type { import("drizzle-kit").Config } */
export default {
  schema: './lib/db/schema.ts', // Your schema file is still a .ts file
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
};