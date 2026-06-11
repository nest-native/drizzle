import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { createDatabase } from './database';
import { ProjectsModule } from './projects/projects.module';
import { schema } from './schema';

const database = createDatabase();

@Module({
  imports: [
    DrizzleModule.forRoot({
      schema,
      connection: database.db,
      shutdown: () => database.sqlite.close(),
    }),
    ProjectsModule,
  ],
})
export class AppModule {}
