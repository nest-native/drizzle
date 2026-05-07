import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const supportTickets = sqliteTable('support_tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  requesterEmail: text('requester_email').notNull(),
  priority: text('priority', {
    enum: ['low', 'normal', 'urgent'],
  }).notNull(),
  estimatePoints: integer('estimate_points').notNull(),
  createdAt: text('created_at').notNull(),
});

export const schema = {
  supportTickets,
};
