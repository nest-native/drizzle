import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Transactional } from '@nest-native/drizzle';
import { AccountsService } from '../accounts/accounts.service';
import { LedgerService } from '../ledger/ledger.service';
import type { DrizzleTransactionalAdapter } from '../transaction.types';

@Injectable()
export class TransfersService {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly ledgerService: LedgerService,
    private readonly txHost: TransactionHost<DrizzleTransactionalAdapter>,
  ) {}

  @Transactional()
  async commit(input: {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
  }): Promise<{ transactionActive: boolean }> {
    await this.accountsService.debit(input.fromAccountId, input.amount);
    await this.accountsService.credit(input.toAccountId, input.amount);
    await this.ledgerService.record({
      ...input,
      note: 'committed transfer',
    });

    return {
      transactionActive: this.txHost.isTransactionActive(),
    };
  }

  @Transactional()
  async rollback(input: {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
  }): Promise<void> {
    await this.accountsService.debit(input.fromAccountId, input.amount);
    await this.accountsService.credit(input.toAccountId, input.amount);
    await this.ledgerService.record({
      ...input,
      note: 'rolled back transfer',
    });

    throw new Error('rollback requested');
  }
}
