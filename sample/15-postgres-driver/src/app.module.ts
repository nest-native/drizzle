import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-drizzle-native';
import { createDatabase } from './database';
import { EventsModule } from './events/events.module';
import { schema } from './schema';

const database = createDatabase();

@Module({
  imports: [
    DrizzleModule.forRoot({
      schema,
      connection: database.db,
      shutdown: () => database.pool.end(),
    }),
    EventsModule,
  ],
})
export class AppModule {}
