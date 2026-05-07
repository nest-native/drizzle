import { Injectable, OnModuleInit } from '@nestjs/common';
import { ReportsRepository, type RevenueReportRow } from './reports.repository';

export interface RevenueReportQuery {
  minTotal?: string;
  segment?: string;
}

@Injectable()
export class ReportsService implements OnModuleInit {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  async onModuleInit(): Promise<void> {
    await this.reportsRepository.migrate();
    await this.reportsRepository.seed();
  }

  revenueBySegment(query: RevenueReportQuery): Promise<RevenueReportRow[]> {
    return this.reportsRepository.revenueBySegment({
      minTotal: parseMinimumTotal(query.minTotal),
      segment: parseSegment(query.segment),
    });
  }
}

function parseMinimumTotal(value: string | undefined): number {
  if (value === undefined) {
    return 0;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseSegment(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed === '' ? undefined : trimmed;
}
