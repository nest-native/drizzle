import { eq, sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { inventoryEvents, inventoryItems } from '../schema';

export interface InventoryEvent {
  id: number;
  sku: string;
  delta: number;
  reason: string;
}

export interface InventoryItem {
  sku: string;
  quantity: number;
}

@DrizzleRepository()
export class InventoryRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      create table if not exists inventory_items (
        sku text primary key,
        quantity integer not null
      )
    `);
    await this.db.run(sql`
      create table if not exists inventory_events (
        id integer primary key autoincrement,
        sku text not null,
        delta integer not null,
        reason text not null
      )
    `);
  }

  async seed(): Promise<void> {
    const existing = await this.findBySku('widget');

    if (existing) {
      return;
    }

    await this.db.insert(inventoryItems).values({
      sku: 'widget',
      quantity: 10,
    });
  }

  async findBySku(sku: string): Promise<InventoryItem | undefined> {
    const [item] = await this.db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.sku, sku));

    return item;
  }

  async listEvents(): Promise<InventoryEvent[]> {
    return this.db
      .select()
      .from(inventoryEvents)
      .orderBy(inventoryEvents.id);
  }

  async reserve(
    db: AppDatabase,
    input: { sku: string; quantity: number; reason: string },
  ): Promise<void> {
    await db
      .update(inventoryItems)
      .set({
        quantity: sql`${inventoryItems.quantity} - ${input.quantity}`,
      })
      .where(eq(inventoryItems.sku, input.sku));
    await db.insert(inventoryEvents).values({
      sku: input.sku,
      delta: -input.quantity,
      reason: input.reason,
    });
  }
}
