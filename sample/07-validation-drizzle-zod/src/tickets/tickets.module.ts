import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { TicketsController } from './tickets.controller';
import { TicketsRepository } from './tickets.repository';
import { TicketsService } from './tickets.service';

@Module({
  imports: [DrizzleModule.forFeature([TicketsRepository])],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
