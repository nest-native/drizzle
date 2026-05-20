import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HealthRepository } from './health.repository';

export interface LivenessResponse {
  status: 'ok';
}

export interface ReadinessResponse {
  status: 'ready';
  database: 'ok';
}

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  live(): LivenessResponse {
    return { status: 'ok' };
  }

  ready(): ReadinessResponse {
    if (!this.healthRepository.isDatabaseReady()) {
      throw new ServiceUnavailableException('Database readiness check failed.');
    }

    return {
      status: 'ready',
      database: 'ok',
    };
  }
}
