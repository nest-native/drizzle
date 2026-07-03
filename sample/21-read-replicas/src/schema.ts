import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const auditEvents = sqliteTable('audit_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  actor: text('actor').notNull(),
  createdAt: text('created_at').notNull(),
});

export const schema = { auditEvents };
