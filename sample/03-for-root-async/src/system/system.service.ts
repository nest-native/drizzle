import { Injectable, OnModuleInit } from '@nestjs/common';
import { count, sql } from 'drizzle-orm';
import { InjectDrizzle } from '@nest-native/drizzle';
import { DatabaseConfigService } from '../config/database-config.service';
import type { AppDatabase } from '../config/database.factory';
import { systemEvents } from '../schema';

@Injectable()
export class SystemService implements OnModuleInit {
  constructor(
    @InjectDrizzle() private readonly db: AppDatabase,
    private readonly config: DatabaseConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.db.run(sql`
      create table if not exists system_events (
        id integer primary key autoincrement,
        message text not null,
        source text not null
      )
    `);
  }

  async status(): Promise<{ events: number; source: string }> {
    const [row] = await this.db.select({ total: count() }).from(systemEvents);
    return {
      events: row?.total ?? 0,
      source: this.config.source,
    };
  }

  async record(message: string): Promise<{ id: number; message: string }> {
    const [created] = await this.db
      .insert(systemEvents)
      .values({
        message,
        source: this.config.source,
      })
      .returning({
        id: systemEvents.id,
        message: systemEvents.message,
      });

    return created;
  }
}
