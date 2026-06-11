import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { AccountsRepository } from '../accounts/accounts.repository';
import { AccountsService } from '../accounts/accounts.service';
import { LedgerRepository } from '../ledger/ledger.repository';
import { LedgerService } from '../ledger/ledger.service';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

@Module({
  imports: [
    DrizzleModule.forFeature([
      AccountsRepository,
      LedgerRepository,
    ]),
  ],
  controllers: [TransfersController],
  providers: [AccountsService, LedgerService, TransfersService],
})
export class TransfersModule {}
