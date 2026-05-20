import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-drizzle-native';
import { createDatabase } from './database';
import { HealthModule } from './health/health.module';
import { schema } from './schema';

const database = createDatabase();

@Module({
  imports: [
    DrizzleModule.forRoot({
      schema,
      connection: database.db,
      shutdown: () => database.sqlite.close(),
    }),
    HealthModule,
  ],
})
export class AppModule {}
