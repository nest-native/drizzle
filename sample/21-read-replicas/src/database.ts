import Database from 'better-sqlite3';
import {
  drizzle,
  type BetterSQLite3Database,
} from 'drizzle-orm/better-sqlite3';
import {
  withReplicas,
  type SQLiteWithReplicas,
} from 'drizzle-orm/sqlite-core';
import { copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { schema } from './schema';

type EventsDatabase = BetterSQLite3Database<typeof schema>;

/**
 * The routed client type. `withReplicas` returns the primary client plus
 * `$primary` and `$replicas` escape hatches, so repositories keep the full
 * Drizzle API surface.
 */
export type AppDatabase = SQLiteWithReplicas<EventsDatabase>;

export const primaryDatabasePath = join(
  tmpdir(),
  `nest-native-drizzle-sample-21-primary-${process.pid}.db`,
);

export const replicaDatabasePath = join(
  tmpdir(),
  `nest-native-drizzle-sample-21-replica-${process.pid}.db`,
);

export interface DatabaseHandle {
  db: AppDatabase;
  primarySqlite: Database.Database;
  replicaSqlite: Database.Database;
}

const CREATE_AUDIT_EVENTS = `
  CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;

/**
 * Builds a primary database file plus a replica file that is a point-in-time
 * copy of the primary. In production the replica would be a real read replica
 * kept in sync by the database; here the copy is taken exactly once, so the
 * replica stays frozen ("replication lag forever"). That staleness is what
 * makes read/write routing observable: rows written after the copy exist only
 * in the primary file.
 *
 * Schema setup runs against the raw driver handles before the routed client
 * exists. That mirrors production, where DDL reaches replicas through
 * replication, not through the application's read/write-splitting client
 * (DDL through the routed client would only reach the primary).
 */
export function createDatabase(): DatabaseHandle {
  rmSync(primaryDatabasePath, { force: true });
  rmSync(replicaDatabasePath, { force: true });

  // 1. Bootstrap the primary with the schema and one pre-replication row.
  const bootstrap = new Database(primaryDatabasePath);
  bootstrap.exec(CREATE_AUDIT_EVENTS);
  bootstrap
    .prepare(
      'INSERT INTO audit_events (action, actor, created_at) VALUES (?, ?, ?)',
    )
    .run('replica.snapshot.captured', 'replication-simulator', new Date().toISOString());
  bootstrap.close();

  // 2. "Replicate": snapshot the primary file into the replica file.
  copyFileSync(primaryDatabasePath, replicaDatabasePath);

  // 3. Open both files and wrap them in one routed Drizzle client.
  const primarySqlite = new Database(primaryDatabasePath);
  const replicaSqlite = new Database(replicaDatabasePath);

  const primary = drizzle(primarySqlite, { schema });
  const replica = drizzle(replicaSqlite, { schema });

  const db = withReplicas(primary, [replica]);

  return { db, primarySqlite, replicaSqlite };
}
