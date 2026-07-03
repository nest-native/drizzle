import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';

@Module({
  imports: [DrizzleModule.forFeature([EventsRepository])],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
