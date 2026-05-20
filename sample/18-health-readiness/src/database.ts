import Database from 'better-sqlite3';
import {
  drizzle,
  type BetterSQLite3Database,
} from 'drizzle-orm/better-sqlite3';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readinessMarkers, schema } from './schema';

export type AppDatabase = BetterSQLite3Database<typeof schema>;

export interface DatabaseHandle {
  db: AppDatabase;
  sqlite: Database.Database;
}

export function createDatabase(): DatabaseHandle {
  const path = join(
    tmpdir(),
    `nest-drizzle-native-sample-18-${process.pid}.db`,
  );

  if (existsSync(path)) {
    rmSync(path);
  }

  const sqlite = new Database(path);
  const db = drizzle(sqlite, { schema });

  sqlite.exec(`
    CREATE TABLE readiness_markers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  db.insert(readinessMarkers)
    .values({
      name: 'database-ready',
      createdAt: new Date().toISOString(),
    })
    .run();

  return { db, sqlite };
}
