import { Controller, Get, Query } from '@nestjs/common';
import {
  ReportsService,
  type RevenueReportQuery,
} from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('revenue')
  revenueBySegment(@Query() query: RevenueReportQuery) {
    return this.reportsService.revenueBySegment(query);
  }
}
