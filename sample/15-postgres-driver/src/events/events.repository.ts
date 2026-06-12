import { Injectable } from '@nestjs/common';
import { desc, sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { auditEvents } from '../schema';

export interface AuditEvent {
  id: number;
  action: string;
  actor: string;
  createdAt: string;
}

export interface CreateAuditEvent {
  action: string;
  actor: string;
}

@Injectable()
@DrizzleRepository()
export class EventsRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async migrate(): Promise<void> {
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS sample_15_audit_events (
        id SERIAL PRIMARY KEY,
        action VARCHAR(120) NOT NULL,
        actor VARCHAR(80) NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    await this.db.delete(auditEvents);
  }

  list(): Promise<AuditEvent[]> {
    return this.db
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.id));
  }

  async create(input: CreateAuditEvent): Promise<AuditEvent> {
    const [event] = await this.db
      .insert(auditEvents)
      .values({
        ...input,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return event;
  }
}
