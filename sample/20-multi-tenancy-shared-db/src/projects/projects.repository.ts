import { and, desc, eq } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { projectAudits, projects } from '../schema';

export interface Project {
  id: number;
  tenantId: string;
  name: string;
  status: 'active' | 'archived';
}

export interface ProjectAudit {
  id: number;
  tenantId: string;
  projectId: number;
  event: string;
  occurredAt: string;
}

@DrizzleRepository()
export class ProjectsRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  list(tenantId: string): Promise<Project[]> {
    return this.db
      .select()
      .from(projects)
      .where(eq(projects.tenantId, tenantId))
      .orderBy(desc(projects.id));
  }

  async findById(tenantId: string, id: number): Promise<Project | undefined> {
    const [project] = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.tenantId, tenantId), eq(projects.id, id)))
      .limit(1);

    return project;
  }

  async create(tenantId: string, input: { name: string }): Promise<Project> {
    const [created] = await this.db
      .insert(projects)
      .values({
        tenantId,
        name: input.name,
      })
      .returning();

    return created;
  }

  async rename(
    db: AppDatabase,
    tenantId: string,
    id: number,
    name: string,
  ): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ name })
      .where(and(eq(projects.tenantId, tenantId), eq(projects.id, id)))
      .returning();

    return updated;
  }

  async archive(
    db: AppDatabase,
    tenantId: string,
    id: number,
  ): Promise<Project | undefined> {
    const [updated] = await db
      .update(projects)
      .set({ status: 'archived' })
      .where(and(eq(projects.tenantId, tenantId), eq(projects.id, id)))
      .returning();

    return updated;
  }

  async recordAudit(
    db: AppDatabase,
    input: {
      tenantId: string;
      projectId: number;
      event: string;
      occurredAt: string;
    },
  ): Promise<void> {
    await db.insert(projectAudits).values(input);
  }

  listAudits(tenantId: string): Promise<ProjectAudit[]> {
    return this.db
      .select()
      .from(projectAudits)
      .where(eq(projectAudits.tenantId, tenantId))
      .orderBy(desc(projectAudits.id));
  }
}
