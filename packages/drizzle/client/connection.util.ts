import { DrizzleConnection } from '../interfaces';

export async function resolveDrizzleConnection<TClient>(
  connection: DrizzleConnection<TClient>,
): Promise<TClient> {
  if (typeof connection === 'function') {
    return await (connection as () => TClient | Promise<TClient>)();
  }

  return connection;
}
