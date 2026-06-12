import { Module } from '@nestjs/common';
import { rm } from 'node:fs/promises';
import { DrizzleModule } from '@nest-native/drizzle';
import { createDatabase, type AppDatabase } from './config/database.factory';
import { DatabaseConfigModule } from './config/database-config.module';
import { DatabaseConfigService } from './config/database-config.service';
import { DatabaseLifecycleTracker } from './config/database-lifecycle.tracker';
import { schema } from './schema';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    DatabaseConfigModule,
    DrizzleModule.forRootAsync<AppDatabase>({
      imports: [DatabaseConfigModule],
      inject: [DatabaseConfigService, DatabaseLifecycleTracker],
      useFactory: async (
        config: DatabaseConfigService,
        tracker: DatabaseLifecycleTracker,
      ) => ({
        schema,
        connection: await createDatabase(config, tracker),
        shutdown: async database => {
          await database.$client.close();
          await rm(config.databaseFile, { force: true });
          tracker.recordShutdown();
        },
      }),
    }),
    SystemModule,
  ],
})
export class AppModule {}
