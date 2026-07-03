import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  type AuditEvent,
  type CreateAuditEvent,
} from './events.repository';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Served from the replica (routed read).
   */
  @Get()
  list(): AuditEvent[] {
    return this.eventsService.list();
  }

  /**
   * Served from the primary via the `$primary` escape hatch.
   */
  @Get('primary')
  listFromPrimary(): AuditEvent[] {
    return this.eventsService.listFromPrimary();
  }

  /**
   * Written to the primary (routed write).
   */
  @Post()
  create(@Body() body: CreateAuditEvent): AuditEvent {
    return this.eventsService.create(body);
  }
}
