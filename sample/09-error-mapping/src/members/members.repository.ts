import { Injectable } from '@nestjs/common';
import { desc, sql } from 'drizzle-orm';
import {
  DrizzleRepository,
  InjectDrizzle,
  describeDrizzleError,
  mapDrizzleError,
} from '@nest-native/drizzle';
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

  /**
   * The other half of the story: when a 409 is not enough and you need to say
   * WHICH constraint fired — building a field-level response, or logging the
   * constraint name. `describeDrizzleError` hands you the driver's own report
   * flattened, so you do not re-parse `error.cause` yourself.
   *
   * Note what it does NOT do: it never guesses a column from the constraint
   * name. `pg` does not report the column, so `violation.column` stays
   * undefined there — a wrong field name in a validation response is worse
   * than no field name.
   */
  async describeInsertFailure(input: {
    email: string;
    displayName: string;
  }): Promise<ReturnType<typeof describeDrizzleError>> {
    try {
      await this.create(input);
      return undefined;
    } catch {
      // create() already mapped it; re-run the raw insert to inspect the
      // driver error itself.
    }

    try {
      await this.db.insert(members).values({
        ...input,
        createdAt: new Date().toISOString(),
      });
      return undefined;
    } catch (error) {
      return describeDrizzleError(error);
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
