import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-drizzle-native';
import { HealthController } from './health.controller';
import { HealthRepository } from './health.repository';
import { HealthService } from './health.service';

@Module({
  imports: [DrizzleModule.forFeature([HealthRepository])],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
