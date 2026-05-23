import { Injectable, NotFoundException } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Transactional } from '@nest-native/drizzle';
import { TenantContext } from '../auth/tenant.context';
import type { AppDatabase } from '../database';
import type { DrizzleTransactionalAdapter } from '../transaction.types';
import {
  ProjectsRepository,
  type Project,
  type ProjectAudit,
} from './projects.repository';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly tenantContext: TenantContext,
    private readonly txHost: TransactionHost<DrizzleTransactionalAdapter>,
  ) {}

  list(): Promise<Project[]> {
    return this.projectsRepository.list(this.tenantContext.tenantId);
  }

  async findById(id: number): Promise<Project> {
    const project = await this.projectsRepository.findById(
      this.tenantContext.tenantId,
      id,
    );

    if (!project) {
      throw new NotFoundException();
    }

    return project;
  }

  create(input: { name: string }): Promise<Project> {
    return this.projectsRepository.create(this.tenantContext.tenantId, input);
  }

  async rename(id: number, name: string): Promise<Project> {
    const renamed = await this.projectsRepository.rename(
      this.txHost.tx as AppDatabase,
      this.tenantContext.tenantId,
      id,
      name,
    );

    if (!renamed) {
      throw new NotFoundException();
    }

    return renamed;
  }

  @Transactional()
  async archive(id: number): Promise<Project> {
    const tenantId = this.tenantContext.tenantId;
    const db = this.txHost.tx as AppDatabase;

    const archived = await this.projectsRepository.archive(db, tenantId, id);

    if (!archived) {
      throw new NotFoundException();
    }

    await this.projectsRepository.recordAudit(db, {
      tenantId,
      projectId: archived.id,
      event: 'archived',
      occurredAt: new Date().toISOString(),
    });

    return archived;
  }

  listAudits(): Promise<ProjectAudit[]> {
    return this.projectsRepository.listAudits(this.tenantContext.tenantId);
  }
}
