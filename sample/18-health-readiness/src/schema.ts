import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const readinessMarkers = sqliteTable('readiness_markers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull(),
});

export const schema = { readinessMarkers };
