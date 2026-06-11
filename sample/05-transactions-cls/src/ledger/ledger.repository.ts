import { sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { ledgerEntries } from '../schema';

export interface LedgerEntry {
  id: number;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  note: string;
}

@DrizzleRepository()
export class LedgerRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      create table if not exists ledger_entries (
        id integer primary key autoincrement,
        from_account_id integer not null,
        to_account_id integer not null,
        amount integer not null,
        note text not null
      )
    `);
  }

  async record(
    db: AppDatabase,
    input: {
      fromAccountId: number;
      toAccountId: number;
      amount: number;
      note: string;
    },
  ): Promise<LedgerEntry> {
    const [created] = await db
      .insert(ledgerEntries)
      .values(input)
      .returning();

    return created;
  }

  async list(): Promise<LedgerEntry[]> {
    return this.db.select().from(ledgerEntries).orderBy(ledgerEntries.id);
  }
}
