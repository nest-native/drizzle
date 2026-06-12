import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { customers, orders } from '../schema';

export interface RevenueReportRow {
  segment: string;
  customerCount: number;
  orderCount: number;
  totalRevenue: number;
}

@DrizzleRepository()
export class ReportsRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        segment TEXT NOT NULL
      )
    `);
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        status TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await this.db.delete(orders);
    await this.db.delete(customers);
  }

  async seed(): Promise<void> {
    const createdCustomers = await this.db
      .insert(customers)
      .values([
        { name: 'Acme Corp', segment: 'enterprise' },
        { name: 'Roadrunner Supply', segment: 'smb' },
        { name: 'Globex', segment: 'enterprise' },
        { name: 'Side Project Studio', segment: 'indie' },
      ])
      .returning();

    const customerIds = Object.fromEntries(
      createdCustomers.map(customer => [customer.name, customer.id]),
    );

    await this.db.insert(orders).values([
      {
        customerId: customerIds['Acme Corp']!,
        status: 'paid',
        amount: 120,
        createdAt: '2026-01-05T10:00:00.000Z',
      },
      {
        customerId: customerIds['Acme Corp']!,
        status: 'pending',
        amount: 80,
        createdAt: '2026-01-06T10:00:00.000Z',
      },
      {
        customerId: customerIds['Acme Corp']!,
        status: 'paid',
        amount: 200,
        createdAt: '2026-01-07T10:00:00.000Z',
      },
      {
        customerId: customerIds['Roadrunner Supply']!,
        status: 'paid',
        amount: 75,
        createdAt: '2026-01-08T10:00:00.000Z',
      },
      {
        customerId: customerIds['Roadrunner Supply']!,
        status: 'paid',
        amount: 45,
        createdAt: '2026-01-09T10:00:00.000Z',
      },
      {
        customerId: customerIds.Globex!,
        status: 'paid',
        amount: 150,
        createdAt: '2026-01-10T10:00:00.000Z',
      },
      {
        customerId: customerIds['Side Project Studio']!,
        status: 'refunded',
        amount: 30,
        createdAt: '2026-01-11T10:00:00.000Z',
      },
      {
        customerId: customerIds['Side Project Studio']!,
        status: 'paid',
        amount: 20,
        createdAt: '2026-01-12T10:00:00.000Z',
      },
    ]);
  }

  async revenueBySegment(input: {
    minTotal: number;
    segment?: string;
  }): Promise<RevenueReportRow[]> {
    const segmentFilter = input.segment === undefined
      ? sql``
      : sql`AND c.segment = ${input.segment}`;

    return this.db.all<RevenueReportRow>(sql`
      SELECT
        c.segment AS segment,
        count(DISTINCT c.id) AS customerCount,
        count(o.id) AS orderCount,
        round(sum(o.amount), 2) AS totalRevenue
      FROM customers c
      INNER JOIN orders o ON o.customer_id = c.id
      WHERE o.status = 'paid'
      ${segmentFilter}
      GROUP BY c.segment
      HAVING sum(o.amount) >= ${input.minTotal}
      ORDER BY totalRevenue DESC
    `);
  }
}
