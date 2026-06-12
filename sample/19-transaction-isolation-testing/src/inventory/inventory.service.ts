import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Transactional } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import type { DrizzleTransactionalAdapter } from '../transaction.types';
import {
  InventoryRepository,
  type InventoryEvent,
  type InventoryItem,
} from './inventory.repository';

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly txHost: TransactionHost<DrizzleTransactionalAdapter>,
  ) {}

  async prepare(): Promise<void> {
    await this.inventoryRepository.migrate();
    await this.inventoryRepository.seed();
  }

  findWidget(): Promise<InventoryItem | undefined> {
    return this.inventoryRepository.findBySku('widget');
  }

  listEvents(): Promise<InventoryEvent[]> {
    return this.inventoryRepository.listEvents();
  }

  isTransactionActive(): boolean {
    return this.txHost.isTransactionActive();
  }

  @Transactional()
  async reserveWidget(quantity: number): Promise<{ transactionActive: boolean }> {
    await this.inventoryRepository.reserve(this.txHost.tx as AppDatabase, {
      sku: 'widget',
      quantity,
      reason: 'committed reservation',
    });

    return {
      transactionActive: this.txHost.isTransactionActive(),
    };
  }

  @Transactional()
  async reserveWidgetAndFail(quantity: number): Promise<void> {
    await this.inventoryRepository.reserve(this.txHost.tx as AppDatabase, {
      sku: 'widget',
      quantity,
      reason: 'rolled back reservation',
    });

    throw new Error('forced rollback');
  }
}
