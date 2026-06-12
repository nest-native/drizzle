import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { analyticsSchema } from './analytics.schema';
import { appSchema } from './app.schema';

export const ANALYTICS_CONNECTION = 'analytics';

export type AppDatabase = LibSQLDatabase<typeof appSchema> & {
  $client: Client;
};

export type AnalyticsDatabase = LibSQLDatabase<typeof analyticsSchema> & {
  $client: Client;
};

export function createAppDatabase(): AppDatabase {
  const client = createClient({
    url: `file:${databaseFile('app')}`,
  });
  return drizzle(client, { schema: appSchema });
}

export function createAnalyticsDatabase(): AnalyticsDatabase {
  const client = createClient({
    url: `file:${databaseFile('analytics')}`,
  });
  return drizzle(client, { schema: analyticsSchema });
}

function databaseFile(name: string): string {
  return join(
    tmpdir(),
    `nest-native-drizzle-sample-04-${name}-${process.pid}.db`,
  );
}
