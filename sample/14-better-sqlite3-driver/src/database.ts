import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { schema } from './schema';

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export interface DatabaseHandle {
  db: AppDatabase;
  sqlite: Database.Database;
}

export function createDatabase(): DatabaseHandle {
  const sqlite = new Database(
    join(tmpdir(), `nest-native-drizzle-sample-14-${process.pid}.db`),
  );
  const db = drizzle(sqlite, { schema });

  return { db, sqlite };
}
