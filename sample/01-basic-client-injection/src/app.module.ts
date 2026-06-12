import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { createDatabase, type AppDatabase } from './database';
import { NotesController } from './notes/notes.controller';
import { NotesService } from './notes/notes.service';
import { schema } from './schema';

@Module({
  imports: [
    DrizzleModule.forRoot<AppDatabase>({
      schema,
      connection: createDatabase(),
      shutdown: database => database.$client.close(),
    }),
  ],
  controllers: [NotesController],
  providers: [NotesService],
})
export class AppModule {}
