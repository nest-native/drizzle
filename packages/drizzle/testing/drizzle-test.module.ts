import { DynamicModule, Module } from '@nestjs/common';
import { DrizzleModule } from '../drizzle.module';
import {
  DrizzleRepositoryClass,
  DrizzleTestModuleOptions,
} from '../interfaces';

@Module({})
export class DrizzleTestModule {
  static forRoot<TClient = unknown>(
    options: DrizzleTestModuleOptions<TClient>,
  ): DynamicModule {
    return DrizzleModule.forRoot({
      connection: options.client,
      connectionName: options.connectionName,
      isGlobal: options.isGlobal,
      schema: options.schema,
    });
  }

  static forFeature(
    repositories: DrizzleRepositoryClass[] = [],
  ): DynamicModule {
    return DrizzleModule.forFeature(repositories);
  }
}
