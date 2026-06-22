import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { createOpenApiDocument } from '../src/openapi';

interface ProjectResponse {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

async function smoke(): Promise<void> {
  // The HTTP driver is supplied explicitly via `ExpressAdapter` instead of
  // `NestFactory`'s default-driver auto-discovery. Auto-discovery resolves
  // `@nestjs/platform-express` relative to `@nestjs/core`, so it only succeeds
  // when both are hoisted together; constructing the adapter here resolves it
  // from this sample's own declared dependency, independent of workspace
  // hoisting.
  const app = await NestFactory.create(AppModule, new ExpressAdapter(), {
    abortOnError: false,
    logger: false,
  });
  const document = createOpenApiDocument(app);

  SwaggerModule.setup('docs', app, document);
  assertOpenApiDocument(document);

  await app.listen(0, '127.0.0.1');

  try {
    const baseUrl = await app.getUrl();
    const beforeCreate = await listProjects(baseUrl);

    assert.equal(beforeCreate.length, 1);
    assert.equal(
      beforeCreate[0]?.name,
      'Document the supported OpenAPI path',
    );

    const created = await createProject(baseUrl, {
      name: 'Ship Swagger sample',
      status: 'completed',
    });

    assert.equal(created.status, 201);
    assert.equal((await created.json() as ProjectResponse).status, 'completed');

    const afterCreate = await listProjects(baseUrl);
    assert.equal(afterCreate.length, 2);
  } finally {
    await app.close();
  }
}

function assertOpenApiDocument(document: {
  openapi: string;
  paths: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
}): void {
  assert.equal(document.openapi, '3.0.0');
  assert.ok(document.paths['/projects']);
  assert.ok(document.components?.schemas?.CreateProjectDto);
  assert.ok(document.components?.schemas?.ProjectDto);
}

async function listProjects(baseUrl: string): Promise<ProjectResponse[]> {
  const response = await fetch(`${baseUrl}/projects`);
  assert.equal(response.status, 200);
  return response.json() as Promise<ProjectResponse[]>;
}

async function createProject(
  baseUrl: string,
  body: { name: string; status: string },
): Promise<Response> {
  return fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
