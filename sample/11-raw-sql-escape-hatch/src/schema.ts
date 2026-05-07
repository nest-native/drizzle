import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  segment: text('segment').notNull(),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  status: text('status').notNull(),
  amount: real('amount').notNull(),
  createdAt: text('created_at').notNull(),
});

export const schema = { customers, orders };
