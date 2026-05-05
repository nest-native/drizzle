import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-drizzle-native';
import { ProductsController } from './products.controller';
import { ProductsRepository } from './products.repository';
import { ProductsService } from './products.service';

@Module({
  imports: [DrizzleModule.forFeature([ProductsRepository])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
