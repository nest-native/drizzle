import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-drizzle-native';
import { ReportsController } from './reports.controller';
import { ReportsRepository } from './reports.repository';
import { ReportsService } from './reports.service';

@Module({
  imports: [DrizzleModule.forFeature([ReportsRepository])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
