import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core';

export const auditEvents = pgTable('sample_15_audit_events', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 120 }).notNull(),
  actor: varchar('actor', { length: 80 }).notNull(),
  createdAt: text('created_at').notNull(),
});

export const schema = { auditEvents };
