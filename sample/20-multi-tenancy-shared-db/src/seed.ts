import { sql } from 'drizzle-orm';
import type { AppDatabase } from './database';
import { projects, tenants, users } from './schema';

export interface SeedFixture {
  tenants: { id: string; name: string }[];
  users: { id: string; tenantId: string; apiKey: string; displayName: string }[];
  projects: { tenantId: string; name: string }[];
}

export const seedFixture: SeedFixture = {
  tenants: [
    { id: 'acme', name: 'Acme Inc.' },
    { id: 'globex', name: 'Globex Corporation' },
  ],
  users: [
    {
      id: 'user-alice',
      tenantId: 'acme',
      apiKey: 'acme-alice-key',
      displayName: 'Alice (Acme)',
    },
    {
      id: 'user-bob',
      tenantId: 'globex',
      apiKey: 'globex-bob-key',
      displayName: 'Bob (Globex)',
    },
  ],
  projects: [
    { tenantId: 'acme', name: 'Acme website redesign' },
    { tenantId: 'globex', name: 'Globex pricing rollout' },
  ],
};

export async function migrate(db: AppDatabase): Promise<void> {
  await db.run(sql`
    create table if not exists tenants (
      id text primary key,
      name text not null
    )
  `);
  await db.run(sql`
    create table if not exists users (
      id text primary key,
      tenant_id text not null references tenants(id),
      api_key text not null,
      display_name text not null
    )
  `);
  await db.run(sql`
    create unique index if not exists users_api_key_unique on users(api_key)
  `);
  await db.run(sql`
    create table if not exists projects (
      id integer primary key autoincrement,
      tenant_id text not null references tenants(id),
      name text not null,
      status text not null default 'active'
    )
  `);
  await db.run(sql`
    create table if not exists project_audits (
      id integer primary key autoincrement,
      tenant_id text not null references tenants(id),
      project_id integer not null,
      event text not null,
      occurred_at text not null
    )
  `);
}

export async function seed(db: AppDatabase): Promise<void> {
  await db.insert(tenants).values(seedFixture.tenants);
  await db.insert(users).values(seedFixture.users);
  await db.insert(projects).values(seedFixture.projects);
}
