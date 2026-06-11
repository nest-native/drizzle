import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DrizzleRepository, InjectDrizzle } from '@nest-native/drizzle';
import type { AppDatabase } from '../database';
import { projects, releaseEvents } from '../schema';

export interface Project {
  id: number;
  slug: string;
  name: string;
  createdAt: string;
}

export interface ReleaseEvent {
  id: number;
  projectId: number;
  version: string;
  notes: string;
  createdAt: string;
}

@Injectable()
@DrizzleRepository()
export class ProjectsRepository {
  constructor(@InjectDrizzle() private readonly db: AppDatabase) {}

  listProjects(): Project[] {
    return this.db.select().from(projects).orderBy(desc(projects.id)).all();
  }

  createProject(input: { slug: string; name: string }): Project {
    const [project] = this.db
      .insert(projects)
      .values({
        ...input,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .all();

    return project;
  }

  createRelease(input: {
    projectSlug: string;
    version: string;
    notes: string;
  }): ReleaseEvent {
    const project = this.db
      .select()
      .from(projects)
      .where(eq(projects.slug, input.projectSlug))
      .get();

    if (!project) {
      throw new Error(`Project ${input.projectSlug} was not found.`);
    }

    const [release] = this.db
      .insert(releaseEvents)
      .values({
        projectId: project.id,
        version: input.version,
        notes: input.notes,
        createdAt: new Date().toISOString(),
      })
      .returning()
      .all();

    return release;
  }

  listReleases(projectSlug: string): ReleaseEvent[] {
    return this.db
      .select({
        id: releaseEvents.id,
        projectId: releaseEvents.projectId,
        version: releaseEvents.version,
        notes: releaseEvents.notes,
        createdAt: releaseEvents.createdAt,
      })
      .from(releaseEvents)
      .innerJoin(projects, eq(projects.id, releaseEvents.projectId))
      .where(eq(projects.slug, projectSlug))
      .orderBy(desc(releaseEvents.id))
      .all();
  }
}
