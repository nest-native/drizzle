import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  TicketsRepository,
  type Ticket,
} from './tickets.repository';
import type { CreateTicketInput } from './ticket.validation';

@Injectable()
export class TicketsService implements OnModuleInit {
  constructor(private readonly ticketsRepository: TicketsRepository) {}

  async onModuleInit(): Promise<void> {
    await this.ticketsRepository.migrate();
  }

  list(): Promise<Ticket[]> {
    return this.ticketsRepository.list();
  }

  create(input: CreateTicketInput): Promise<Ticket> {
    return this.ticketsRepository.create(input);
  }
}
