import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { createDatabase } from './database';
import { EventsModule } from './events/events.module';
import { schema } from './schema';

const database = createDatabase();

@Module({
  imports: [
    DrizzleModule.forRoot({
      schema,
      // `withReplicas` returns a regular Drizzle client, so it drops straight
      // into `connection`. The module stores it as-is and never constructs or
      // rewires clients, so read/write routing stays fully app-owned.
      connection: database.db,
      shutdown: () => {
        database.primarySqlite.close();
        database.replicaSqlite.close();
      },
    }),
    EventsModule,
  ],
})
export class AppModule {}
