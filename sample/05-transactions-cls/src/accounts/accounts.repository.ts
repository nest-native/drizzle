import { eq, sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { accounts } from '../schema';

export interface Account {
  id: number;
  name: string;
  balance: number;
}

@DrizzleRepository()
export class AccountsRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      create table if not exists accounts (
        id integer primary key autoincrement,
        name text not null,
        balance integer not null
      )
    `);
  }

  async createSeedAccounts(): Promise<void> {
    const existing = await this.list(this.db);

    if (existing.length > 0) {
      return;
    }

    await this.db.insert(accounts).values([
      { id: 1, name: 'Checking', balance: 100 },
      { id: 2, name: 'Savings', balance: 25 },
    ]);
  }

  async list(db: AppDatabase = this.db): Promise<Account[]> {
    return db.select().from(accounts).orderBy(accounts.id);
  }

  async adjustBalance(
    db: AppDatabase,
    id: number,
    delta: number,
  ): Promise<Account> {
    const [updated] = await db
      .update(accounts)
      .set({
        balance: sql`${accounts.balance} + ${delta}`,
      })
      .where(eq(accounts.id, id))
      .returning();

    return updated;
  }
}
