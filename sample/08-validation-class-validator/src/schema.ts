import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  displayName: text('display_name').notNull(),
  plan: text('plan', {
    enum: ['free', 'team', 'enterprise'],
  }).notNull(),
  seats: integer('seats').notNull(),
  createdAt: text('created_at').notNull(),
});

export const schema = {
  customers,
};
