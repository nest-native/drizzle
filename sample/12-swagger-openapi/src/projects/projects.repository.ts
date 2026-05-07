import { Injectable } from '@nestjs/common';
import { desc, sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from 'nest-drizzle-native';
import type { AppDatabase } from '../database';
import { projects } from '../schema';

export interface Project {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

@DrizzleRepository()
export class ProjectsRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await this.db.delete(projects);
  }

  async list(): Promise<Project[]> {
    return this.db
      .select()
      .from(projects)
      .orderBy(desc(projects.id));
  }

  async create(input: {
    name: string;
    status: string;
  }): Promise<Project> {
    const [project] = await this.db
      .insert(projects)
      .values({
        ...input,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return project;
  }
}
