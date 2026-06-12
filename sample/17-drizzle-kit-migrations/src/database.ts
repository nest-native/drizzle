import Database from 'better-sqlite3';
import {
  drizzle,
  type BetterSQLite3Database,
} from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { schema } from './schema';

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export interface DatabaseHandle {
  db: AppDatabase;
  sqlite: Database.Database;
}

export function createDatabase(): DatabaseHandle {
  const path = join(
    tmpdir(),
    `nest-native-drizzle-sample-17-${process.pid}.db`,
  );

  if (existsSync(path)) {
    rmSync(path);
  }

  const sqlite = new Database(path);
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: join(__dirname, '..', 'drizzle') });

  return { db, sqlite };
}
