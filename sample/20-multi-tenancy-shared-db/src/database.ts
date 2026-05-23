import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { schema } from './schema';

export type AppDatabase = LibSQLDatabase<typeof schema> & {
  $client: Client;
};

export function createDatabase(label = 'default'): AppDatabase {
  const databaseFile = join(
    tmpdir(),
    `nest-drizzle-native-sample-20-${process.pid}-${label}-${randomUUID()}.db`,
  );
  const client = createClient({ url: `file:${databaseFile}` });
  return drizzle(client, { schema });
}
