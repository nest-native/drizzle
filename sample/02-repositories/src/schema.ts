import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: real('price').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

export const schema = { products };
