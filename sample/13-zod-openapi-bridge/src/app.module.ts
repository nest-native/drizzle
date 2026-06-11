import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { createDatabase, type AppDatabase } from './database';
import { schema } from './schema';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    DrizzleModule.forRoot<AppDatabase>({
      schema,
      connection: createDatabase(),
      shutdown: database => database.$client.close(),
    }),
    TicketsModule,
  ],
})
export class AppModule {}
