import { desc, eq, sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { products } from '../schema';

export interface Product {
  id: number;
  name: string;
  price: number;
  active: boolean;
}

@DrizzleRepository()
export class ProductsRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      create table if not exists products (
        id integer primary key autoincrement,
        name text not null,
        price real not null,
        active integer not null default 1
      )
    `);
  }

  async list(): Promise<Product[]> {
    return this.db.select().from(products).orderBy(desc(products.id));
  }

  async create(input: { name: string; price: number }): Promise<Product> {
    const [created] = await this.db
      .insert(products)
      .values(input)
      .returning();

    return created;
  }

  async rename(id: number, name: string): Promise<Product | undefined> {
    const [updated] = await this.db
      .update(products)
      .set({ name })
      .where(eq(products.id, id))
      .returning();

    return updated;
  }

  async deactivate(id: number): Promise<Product | undefined> {
    const [updated] = await this.db
      .update(products)
      .set({ active: false })
      .where(eq(products.id, id))
      .returning();

    return updated;
  }
}
