import { Injectable } from '@nestjs/common';
import { desc, sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { supportTickets } from '../schema';
import type { CreateTicketInput } from './ticket.validation';

export interface Ticket {
  id: number;
  title: string;
  requesterEmail: string;
  priority: 'low' | 'normal' | 'urgent';
  estimatePoints: number;
  createdAt: string;
}

@DrizzleRepository()
export class TicketsRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        requester_email TEXT NOT NULL,
        priority TEXT NOT NULL,
        estimate_points INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await this.db.delete(supportTickets);
  }

  async list(): Promise<Ticket[]> {
    return this.db
      .select()
      .from(supportTickets)
      .orderBy(desc(supportTickets.id));
  }

  async create(input: CreateTicketInput): Promise<Ticket> {
    const [ticket] = await this.db
      .insert(supportTickets)
      .values({
        ...input,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return ticket;
  }
}
