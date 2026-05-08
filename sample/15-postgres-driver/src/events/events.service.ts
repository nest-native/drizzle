import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  type AuditEvent,
  type CreateAuditEvent,
  EventsRepository,
} from './events.repository';

@Injectable()
export class EventsService implements OnModuleInit {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async onModuleInit(): Promise<void> {
    await this.eventsRepository.migrate();
  }

  list(): Promise<AuditEvent[]> {
    return this.eventsRepository.list();
  }

  create(input: CreateAuditEvent): Promise<AuditEvent> {
    return this.eventsRepository.create(input);
  }
}
