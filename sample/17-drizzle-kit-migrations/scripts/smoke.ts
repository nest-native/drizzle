import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

interface ProjectResponse {
  id: number;
  slug: string;
  name: string;
  createdAt: string;
}

interface ReleaseResponse {
  id: number;
  projectId: number;
  version: string;
  notes: string;
  createdAt: string;
}

async function smoke(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    assert.deepEqual(await listProjects(baseUrl), []);

    const project = await createProject(baseUrl, {
      slug: 'nest-native-drizzle',
      name: 'Nest Drizzle Native',
    });

    assert.equal(project.slug, 'nest-native-drizzle');

    const release = await createRelease(baseUrl, project.slug, {
      version: '0.2.1',
      notes: 'Production-ready migration sample',
    });

    assert.equal(release.projectId, project.id);
    assert.equal(release.version, '0.2.1');

    const releases = await listReleases(baseUrl, project.slug);
    assert.equal(releases.length, 1);
    assert.equal(releases[0]?.id, release.id);
  } finally {
    await app.close();
  }
}

async function listProjects(baseUrl: string): Promise<ProjectResponse[]> {
  const response = await fetch(`${baseUrl}/projects`);
  assert.equal(response.status, 200);
  return response.json() as Promise<ProjectResponse[]>;
}

async function createProject(
  baseUrl: string,
  body: { slug: string; name: string },
): Promise<ProjectResponse> {
  const response = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  assert.equal(response.status, 201);
  return response.json() as Promise<ProjectResponse>;
}

async function listReleases(
  baseUrl: string,
  projectSlug: string,
): Promise<ReleaseResponse[]> {
  const response = await fetch(`${baseUrl}/projects/${projectSlug}/releases`);
  assert.equal(response.status, 200);
  return response.json() as Promise<ReleaseResponse[]>;
}

async function createRelease(
  baseUrl: string,
  projectSlug: string,
  body: { version: string; notes: string },
): Promise<ReleaseResponse> {
  const response = await fetch(`${baseUrl}/projects/${projectSlug}/releases`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  assert.equal(response.status, 201);
  return response.json() as Promise<ReleaseResponse>;
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
