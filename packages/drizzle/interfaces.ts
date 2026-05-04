import { ModuleMetadata, Provider, Type } from '@nestjs/common';

export type DrizzleSchema = Record<string, unknown>;
export type DrizzleConnection<TClient = unknown> =
  | TClient
  | (() => TClient | Promise<TClient>);

export interface DrizzleModuleOptions<
  TClient = unknown,
  TSchema extends DrizzleSchema = DrizzleSchema,
> {
  /**
   * Standard Drizzle schema object. It is stored as-is and never transformed.
   */
  schema?: TSchema;

  /**
   * Existing Drizzle client or a factory that creates one.
   */
  connection: DrizzleConnection<TClient>;

  /**
   * Optional connection name for applications with multiple Drizzle clients.
   */
  connectionName?: string;

  /**
   * Whether to register this module globally.
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Optional shutdown hook for closing database drivers owned by this module.
   */
  shutdown?: (client: TClient) => void | Promise<void>;
}

export interface DrizzleModuleAsyncOptions<
  TClient = unknown,
  TSchema extends DrizzleSchema = DrizzleSchema,
> extends Pick<ModuleMetadata, 'imports'> {
  connectionName?: string;
  inject?: any[];
  extraProviders?: Provider[];
  isGlobal?: boolean;
  useFactory: (
    ...args: any[]
  ) =>
    | DrizzleModuleOptions<TClient, TSchema>
    | Promise<DrizzleModuleOptions<TClient, TSchema>>;
}

export interface DrizzleRepositoryOptions {
  connectionName?: string;
}

export interface DrizzleRepositoryMetadata {
  connectionName: string;
}

export type DrizzleRepositoryClass<TRepository = unknown> = Type<TRepository>;

export interface DrizzleTestModuleOptions<
  TClient = unknown,
  TSchema extends DrizzleSchema = DrizzleSchema,
> {
  client: TClient;
  schema?: TSchema;
  connectionName?: string;
  isGlobal?: boolean;
}
