import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { schema } from './schema';

export type AppDatabase = LibSQLDatabase<typeof schema> & {
  $client: Client;
};

export function createDatabase(): AppDatabase {
  const databaseFile = join(
    tmpdir(),
    `nest-native-drizzle-sample-02-${process.pid}.db`,
  );
  const client = createClient({ url: `file:${databaseFile}` });
  return drizzle(client, { schema });
}
