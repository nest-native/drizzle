import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from './database';
import { migrate, seed } from './seed';

@Injectable()
export class StartupSeeder implements OnApplicationBootstrap {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  async onApplicationBootstrap(): Promise<void> {
    await migrate(this.db);
    await seed(this.db);
  }
}
