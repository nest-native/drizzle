import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// drizzle-orm v1 folds the Drizzle-Zod integration into the core package as
// the `drizzle-orm/zod` subpath (zod becomes an optional peer of drizzle-orm);
// the standalone `drizzle-zod` package stays on the 0.x line. This spec backs
// the support-policy claim for that path: it skips on 0.x base lanes (the
// subpath does not exist there) and runs on the v1 RC canary lane.
type ZodProbeSchema = {
  safeParse: (value: unknown) => { success: boolean };
};
type DrizzleOrmZod = {
  createSelectSchema: (table: unknown) => ZodProbeSchema;
  createInsertSchema: (table: unknown) => ZodProbeSchema;
};

function loadDrizzleOrmZod(): DrizzleOrmZod | undefined {
  try {
    // Feature detection: a static import would fail module resolution on 0.x.
    return require('drizzle-orm/zod') as DrizzleOrmZod;
  } catch {
    return undefined;
  }
}

const drizzleOrmZod = loadDrizzleOrmZod();

const users = sqliteTable('zod_probe_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

describe('drizzle-orm/zod (v1 built-in Drizzle-Zod)', () => {
  it(
    'derives select/insert schemas that validate rows',
    {
      skip: drizzleOrmZod
        ? false
        : 'drizzle-orm/zod ships on the v1 line only (runs on the RC canary)',
    },
    () => {
      assert.ok(drizzleOrmZod);
      const select = drizzleOrmZod.createSelectSchema(users);
      const insert = drizzleOrmZod.createInsertSchema(users);

      assert.equal(select.safeParse({ id: 1, name: 'Ada' }).success, true);
      assert.equal(select.safeParse({ id: 'x', name: 42 }).success, false);
      assert.equal(insert.safeParse({ name: 'Grace' }).success, true);
    },
  );
});
