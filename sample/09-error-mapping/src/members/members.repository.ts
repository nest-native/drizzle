import { Injectable } from '@nestjs/common';
import { desc, sql } from 'drizzle-orm';
import {
  DrizzleRepository,
  InjectDrizzle,
  mapDrizzleError,
} from 'nest-drizzle-native';
import type { AppDatabase } from '../database';
import { members } from '../schema';

export interface Member {
  id: number;
  email: string;
  displayName: string;
  createdAt: string;
}

@DrizzleRepository()
export class MembersRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await this.db.delete(members);
  }

  async list(): Promise<Member[]> {
    return this.db
      .select()
      .from(members)
      .orderBy(desc(members.id));
  }

  async create(input: {
    email: string;
    displayName: string;
  }): Promise<Member> {
    try {
      const [member] = await this.db
        .insert(members)
        .values({
          ...input,
          createdAt: new Date().toISOString(),
        })
        .returning();

      return member;
    } catch (error) {
      throw mapDrizzleError(error, {
        uniqueMessage: 'A member with this email already exists.',
      });
    }
  }

  async createWithMissingEmail(): Promise<void> {
    try {
      await this.db.run(sql`
        INSERT INTO members (display_name, created_at)
        VALUES ('Missing Email', ${new Date().toISOString()})
      `);
    } catch (error) {
      throw mapDrizzleError(error, {
        notNullMessage: 'Member email is required.',
      });
    }
  }
}
