import { desc, sql } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import { analyticsEvents } from '../analytics.schema';
import {
  ANALYTICS_CONNECTION,
  type AnalyticsDatabase,
} from '../database';

export interface AnalyticsEvent {
  id: number;
  eventName: string;
  subject: string;
}

@DrizzleRepository(ANALYTICS_CONNECTION)
export class AnalyticsRepository {
  constructor(
    @InjectDrizzle(ANALYTICS_CONNECTION)
    private readonly db: AnalyticsDatabase,
  ) {}

  async migrate(): Promise<void> {
    await this.db.run(sql`
      create table if not exists analytics_events (
        id integer primary key autoincrement,
        event_name text not null,
        subject text not null
      )
    `);
  }

  async record(input: {
    eventName: string;
    subject: string;
  }): Promise<AnalyticsEvent> {
    const [created] = await this.db
      .insert(analyticsEvents)
      .values(input)
      .returning();

    return created;
  }

  async list(): Promise<AnalyticsEvent[]> {
    return this.db
      .select()
      .from(analyticsEvents)
      .orderBy(desc(analyticsEvents.id));
  }
}
