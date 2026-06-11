import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { createDatabase, type AppDatabase } from './database';
import { MembersModule } from './members/members.module';
import { schema } from './schema';

@Module({
  imports: [
    DrizzleModule.forRoot<AppDatabase>({
      schema,
      connection: createDatabase(),
      shutdown: database => database.$client.close(),
    }),
    MembersModule,
  ],
})
export class AppModule {}
