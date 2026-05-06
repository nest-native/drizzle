import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-drizzle-native';
import { InventoryController } from './inventory.controller';
import { InventoryRepository } from './inventory.repository';
import { InventoryService } from './inventory.service';

@Module({
  imports: [DrizzleModule.forFeature([InventoryRepository])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
