import { desc, sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import { products } from '../app.schema';
import type { AppDatabase } from '../database';

export interface Product {
  id: number;
  sku: string;
  name: string;
}

@DrizzleRepository()
export class ProductsRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      create table if not exists products (
        id integer primary key autoincrement,
        sku text not null,
        name text not null
      )
    `);
  }

  async create(input: { sku: string; name: string }): Promise<Product> {
    const [created] = await this.db.insert(products).values(input).returning();
    return created;
  }

  async list(): Promise<Product[]> {
    return this.db.select().from(products).orderBy(desc(products.id));
  }
}
