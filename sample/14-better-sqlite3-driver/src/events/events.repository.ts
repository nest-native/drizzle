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

  migrate(): void {
    this.db.run(sql`
      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        actor TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    this.db.delete(auditEvents).run();
  }

  list(): AuditEvent[] {
    return this.db
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.id))
      .all();
  }

  create(input: CreateAuditEvent): AuditEvent {
    const [event] = this.db
      .insert(auditEvents)
      .values({
        ...input,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .all();

    return event;
  }
}
