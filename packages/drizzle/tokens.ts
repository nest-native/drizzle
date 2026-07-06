import {
  DEFAULT_DRIZZLE_CONNECTION_NAME,
  DRIZZLE_CLIENT,
  DRIZZLE_CONNECTION_MANAGER,
  DRIZZLE_MODULE_OPTIONS,
  DRIZZLE_SCHEMA,
  DRIZZLE_TRANSACTION,
} from './constants';

export function normalizeDrizzleConnectionName(connectionName?: string): string {
  // A non-empty trimmed string is truthy and an empty one is falsy, so `||`
  // covers undefined, empty, and whitespace-only names in one step — an
  // explicit `.length > 0` check would be an unreachable (equivalent-mutant)
  // branch on top of that.
  return connectionName?.trim() || DEFAULT_DRIZZLE_CONNECTION_NAME;
}

export function getDrizzleClientToken(connectionName?: string): string {
  return buildDrizzleToken(DRIZZLE_CLIENT, connectionName);
}

export function getDrizzleConnectionManagerToken(connectionName?: string): string {
  return buildDrizzleToken(DRIZZLE_CONNECTION_MANAGER, connectionName);
}

export function getDrizzleOptionsToken(connectionName?: string): string {
  return buildDrizzleToken(DRIZZLE_MODULE_OPTIONS, connectionName);
}

export function getDrizzleSchemaToken(connectionName?: string): string {
  return buildDrizzleToken(DRIZZLE_SCHEMA, connectionName);
}

export function getDrizzleTransactionToken(connectionName?: string): string {
  return buildDrizzleToken(DRIZZLE_TRANSACTION, connectionName);
}

function buildDrizzleToken(prefix: string, connectionName?: string): string {
  const normalized = normalizeDrizzleConnectionName(connectionName);
  return normalized === DEFAULT_DRIZZLE_CONNECTION_NAME
    ? prefix
    : `${prefix}:${normalized}`;
}
