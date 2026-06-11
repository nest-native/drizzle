import { Injectable, OnModuleInit } from '@nestjs/common';
import { desc, sql } from 'drizzle-orm';
import { InjectDrizzle } from '@nest-native/drizzle';
import { notes } from '../schema';
import type { AppDatabase } from '../database';

export interface Note {
  id: number;
  title: string;
  createdAt: string;
}

@Injectable()
export class NotesService implements OnModuleInit {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async onModuleInit(): Promise<void> {
    await this.db.run(sql`
      create table if not exists notes (
        id integer primary key autoincrement,
        title text not null,
        created_at text not null
      )
    `);
  }

  async list(): Promise<Note[]> {
    return this.db.select().from(notes).orderBy(desc(notes.id));
  }

  async create(title: string): Promise<Note> {
    const createdAt = new Date().toISOString();
    const [created] = await this.db
      .insert(notes)
      .values({ title, createdAt })
      .returning();

    return created;
  }
}
