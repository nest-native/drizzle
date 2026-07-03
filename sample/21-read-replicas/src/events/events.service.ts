import { Injectable } from '@nestjs/common';
import {
  type AuditEvent,
  type CreateAuditEvent,
  EventsRepository,
} from './events.repository';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  list(): AuditEvent[] {
    return this.eventsRepository.list();
  }

  listFromPrimary(): AuditEvent[] {
    return this.eventsRepository.listFromPrimary();
  }

  create(input: CreateAuditEvent): AuditEvent {
    return this.eventsRepository.create(input);
  }
}
