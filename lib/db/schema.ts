// /lib/db/schema.ts

import { pgTable, serial, text, timestamp, uuid, integer, real, varchar } from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';

// =======================================================
//  1. DEFINE YOUR CHARACTERS TABLE SCHEMA
// =======================================================
// Even if you created this table before, define its schema here
// so Drizzle knows about it.
export const characters = pgTable('characters', {
  // Assuming your 'id' is a number that auto-increments
  id: serial('id').primaryKey(), 
  
  name: text('name').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  prompt_persona: text('prompt_persona').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});


// =======================================================
//  2. DEFINE YOUR MEMORIES TABLE SCHEMA (IN THE SAME FILE)
// =======================================================

// Define the custom vector type for Drizzle
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)';
  },
});

export const memories = pgTable('memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // THIS IS THE CRITICAL LINE:
  // Because 'characters' is defined just above, TypeScript knows
  // it refers to the Drizzle table object, not an array.
  characterId: integer('character_id').references(() => characters.id, { onDelete: 'cascade' }).notNull(),
  
  content: text('content').notNull(),
  embedding: vector('embedding'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  importance: real('importance'),
  type: varchar('type', { length: 50 }),
});