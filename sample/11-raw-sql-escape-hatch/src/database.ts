import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { schema } from './schema';

export type AppDatabase = LibSQLDatabase<typeof schema> & {
  $client: Client;
};

export function createDatabase(): AppDatabase {
  const client = createClient({
    url: `file:${join(
      tmpdir(),
      `nest-drizzle-native-sample-11-${process.pid}.db`,
    )}`,
  });
  return drizzle(client, { schema });
}
