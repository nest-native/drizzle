import { Body, Controller, Get, Post, UsePipes } from '@nestjs/common';
import {
  createTicketSchema,
  type CreateTicketInput,
} from './ticket.validation';
import { TicketsService } from './tickets.service';
import { ZodValidationPipe } from '../zod-validation.pipe';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  list() {
    return this.ticketsService.list();
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createTicketSchema))
  create(@Body() body: CreateTicketInput) {
    return this.ticketsService.create(body);
  }
}
