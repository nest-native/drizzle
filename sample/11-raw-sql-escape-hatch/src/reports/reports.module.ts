import { Module } from '@nestjs/common';
import { DrizzleModule } from '@nest-native/drizzle';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({
  imports: [DrizzleModule.forFeature([ReportsRepository])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
