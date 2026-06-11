import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { AnalyticsRepository } from '../analytics/analytics.repository';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  imports: [
    DrizzleModule.forFeature([
      ProductsRepository,
      AnalyticsRepository,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
