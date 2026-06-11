import { Injectable } from '@nestjs/common';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { readinessMarkers } from '../schema';

@Injectable()
@DrizzleRepository()
export class HealthRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  isDatabaseReady(): boolean {
    const marker = this.db
      .select({ id: readinessMarkers.id })
      .from(readinessMarkers)
      .limit(1)
      .get();

    return marker !== undefined;
  }
}
