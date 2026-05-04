import { Injectable } from '@nestjs/common';
import {
  DRIZZLE_REPOSITORY_METADATA,
} from '../constants';
import {
  DrizzleRepositoryMetadata,
  DrizzleRepositoryOptions,
} from '../interfaces';
import { normalizeDrizzleConnectionName } from '../tokens';

export function DrizzleRepository(
  options?: string | DrizzleRepositoryOptions,
): ClassDecorator {
  return target => {
    const repositoryOptions = normalizeRepositoryOptions(options);
    Injectable()(target);
    Reflect.defineMetadata(
      DRIZZLE_REPOSITORY_METADATA,
      repositoryOptions,
      target,
    );
  };
}

export function getDrizzleRepositoryMetadata(
  target: object,
): DrizzleRepositoryMetadata | undefined {
  return Reflect.getMetadata(DRIZZLE_REPOSITORY_METADATA, target);
}

function normalizeRepositoryOptions(
  options?: string | DrizzleRepositoryOptions,
): DrizzleRepositoryMetadata {
  const connectionName = typeof options === 'string'
    ? options
    : options?.connectionName;

  return {
    connectionName: normalizeDrizzleConnectionName(connectionName),
  };
}
