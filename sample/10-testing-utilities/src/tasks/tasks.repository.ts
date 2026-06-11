import { Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { tasks } from '../schema';

export interface Task {
  id: number;
  title: string;
  status: 'open' | 'done';
}

@DrizzleRepository()
export class TasksRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `);
    await this.db.delete(tasks);
  }

  async create(title: string): Promise<Task> {
    const [task] = await this.db
      .insert(tasks)
      .values({
        title,
        status: 'open',
      })
      .returning();

    return task;
  }

  async listOpen(): Promise<Task[]> {
    return this.db
      .select()
      .from(tasks)
      .where(eq(tasks.status, 'open'))
      .orderBy(tasks.id);
  }
}
