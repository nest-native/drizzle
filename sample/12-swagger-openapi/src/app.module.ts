import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-drizzle-native';
import { createDatabase, type AppDatabase } from './database';
import { ProjectsModule } from './projects/projects.module';
import { schema } from './schema';

@Module({
  imports: [
    DrizzleModule.forRoot<AppDatabase>({
      schema,
      connection: createDatabase(),
      shutdown: database => database.$client.close(),
    }),
    ProjectsModule,
  ],
})
export class AppModule {}
