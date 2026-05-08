import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { schema } from './schema';

export type AppDatabase = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  db: AppDatabase;
  pool: {
    end: () => Promise<void>;
  };
}

export function createDatabase(): DatabaseHandle {
  const connectionString = process.env.NEST_DRIZZLE_NATIVE_POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      'NEST_DRIZZLE_NATIVE_POSTGRES_URL is required for the PostgreSQL sample.',
    );
  }

  const { Pool } = require('pg') as {
    Pool: new (options: { connectionString: string }) => {
      end: () => Promise<void>;
    };
  };
  const pool = new Pool({ connectionString });
  const db = drizzle(pool as never, { schema });

  return { db, pool };
}
