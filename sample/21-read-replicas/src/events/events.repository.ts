import { Injectable } from '@nestjs/common';
import { desc } from 'drizzle-orm';
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

  /**
   * Routed read: `withReplicas` sends `select` to a replica.
   */
  list(): AuditEvent[] {
    return this.db
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.id))
      .all();
  }

  /**
   * Explicit primary read: `$primary` bypasses replica routing. Use this for
   * read-your-own-write flows where replication lag is not acceptable.
   */
  listFromPrimary(): AuditEvent[] {
    return this.db.$primary
      .select()
      .from(auditEvents)
      .orderBy(desc(auditEvents.id))
      .all();
  }

  /**
   * Routed write: `withReplicas` sends `insert` (and `update`, `delete`,
   * `transaction`) to the primary.
   */
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
