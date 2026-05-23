import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    apiKey: text('api_key').notNull(),
    displayName: text('display_name').notNull(),
  },
  table => ({
    apiKeyIndex: uniqueIndex('users_api_key_unique').on(table.apiKey),
  }),
);

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  name: text('name').notNull(),
  status: text('status', { enum: ['active', 'archived'] })
    .notNull()
    .default('active'),
});

export const projectAudits = sqliteTable('project_audits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id),
  projectId: integer('project_id').notNull(),
  event: text('event').notNull(),
  occurredAt: text('occurred_at').notNull(),
});

export const schema = { tenants, users, projects, projectAudits };
