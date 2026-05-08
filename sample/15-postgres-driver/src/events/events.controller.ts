import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  type AuditEvent,
  type CreateAuditEvent,
} from './events.repository';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(): Promise<AuditEvent[]> {
    return this.eventsService.list();
  }

  @Post()
  create(@Body() body: CreateAuditEvent): Promise<AuditEvent> {
    return this.eventsService.create(body);
  }
}
