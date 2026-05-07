import { Injectable } from '@nestjs/common';
import { desc, sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from 'nest-drizzle-native';
import type { AppDatabase } from '../database';
import { customers } from '../schema';
import type { CreateCustomerDto } from './create-customer.dto';

export interface Customer {
  id: number;
  email: string;
  displayName: string;
  plan: 'free' | 'team' | 'enterprise';
  seats: number;
  createdAt: string;
}

@DrizzleRepository()
export class CustomersRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        plan TEXT NOT NULL,
        seats INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await this.db.delete(customers);
  }

  async list(): Promise<Customer[]> {
    return this.db
      .select()
      .from(customers)
      .orderBy(desc(customers.id));
  }

  async create(input: CreateCustomerDto): Promise<Customer> {
    const [customer] = await this.db
      .insert(customers)
      .values({
        ...input,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return customer;
  }
}
