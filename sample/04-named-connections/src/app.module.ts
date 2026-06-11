import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { analyticsSchema } from './analytics.schema';
import { appSchema } from './app.schema';
import {
  ANALYTICS_CONNECTION,
  type AnalyticsDatabase,
  type AppDatabase,
  createAnalyticsDatabase,
  createAppDatabase,
} from './database';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    DrizzleModule.forRoot<AppDatabase>({
      schema: appSchema,
      connection: createAppDatabase(),
      shutdown: database => database.$client.close(),
    }),
    DrizzleModule.forRoot<AnalyticsDatabase>({
      connectionName: ANALYTICS_CONNECTION,
      schema: analyticsSchema,
      connection: createAnalyticsDatabase(),
      shutdown: database => database.$client.close(),
    }),
    ProductsModule,
  ],
})
export class AppModule {}
