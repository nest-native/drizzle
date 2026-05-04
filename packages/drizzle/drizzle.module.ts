import { DynamicModule, Module, Provider } from '@nestjs/common';
import { DrizzleConnectionManager } from './client/drizzle-connection.manager';
import { resolveDrizzleConnection } from './client/connection.util';
import {
  DrizzleModuleAsyncOptions,
  DrizzleModuleOptions,
  DrizzleRepositoryClass,
} from './interfaces';
import {
  getDrizzleClientToken,
  getDrizzleConnectionManagerToken,
  getDrizzleOptionsToken,
  getDrizzleSchemaToken,
} from './tokens';

@Module({})
export class DrizzleModule {
  static forRoot<TClient = unknown>(
    options: DrizzleModuleOptions<TClient>,
  ): DynamicModule {
    const connectionName = options.connectionName;
    const providers = createConnectionProviders(connectionName);

    return {
      module: DrizzleModule,
      global: options.isGlobal ?? true,
      providers: [
        {
          provide: getDrizzleOptionsToken(connectionName),
          useValue: options,
        },
        ...providers,
      ],
      exports: [
        getDrizzleClientToken(connectionName),
        getDrizzleSchemaToken(connectionName),
      ],
    };
  }

  static forRootAsync<TClient = unknown>(
    options: DrizzleModuleAsyncOptions<TClient>,
  ): DynamicModule {
    const connectionName = options.connectionName;
    const providers = createConnectionProviders(connectionName);

    return {
      module: DrizzleModule,
      global: options.isGlobal ?? true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: getDrizzleOptionsToken(connectionName),
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        ...(options.extraProviders ?? []),
        ...providers,
      ],
      exports: [
        getDrizzleClientToken(connectionName),
        getDrizzleSchemaToken(connectionName),
      ],
    };
  }

  static forFeature(
    repositories: DrizzleRepositoryClass[] = [],
  ): DynamicModule {
    return {
      module: DrizzleModule,
      providers: [...repositories],
      exports: [...repositories],
    };
  }
}

function createConnectionProviders(connectionName?: string): Provider[] {
  const optionsToken = getDrizzleOptionsToken(connectionName);
  const managerToken = getDrizzleConnectionManagerToken(connectionName);
  const clientToken = getDrizzleClientToken(connectionName);
  const schemaToken = getDrizzleSchemaToken(connectionName);

  return [
    {
      provide: managerToken,
      useFactory: async (options: DrizzleModuleOptions) => {
        const client = await resolveDrizzleConnection(options.connection);
        return new DrizzleConnectionManager(client, options.shutdown);
      },
      inject: [optionsToken],
    },
    {
      provide: clientToken,
      useFactory: (manager: DrizzleConnectionManager) => manager.getClient(),
      inject: [managerToken],
    },
    {
      provide: schemaToken,
      useFactory: (options: DrizzleModuleOptions) => options.schema,
      inject: [optionsToken],
    },
  ];
}
