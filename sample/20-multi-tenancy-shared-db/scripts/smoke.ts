import 'reflect-metadata';
import assert from 'node:assert/strict';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

interface ProjectResponse {
  id: number;
  tenantId: string;
  name: string;
  status: 'active' | 'archived';
}

interface AuditResponse {
  id: number;
  tenantId: string;
  projectId: number;
  event: string;
  occurredAt: string;
}

const ALICE_KEY = 'acme-alice-key';
const BOB_KEY = 'globex-bob-key';

async function smoke(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(0, '127.0.0.1');
  const baseUrl = await app.getUrl();

  try {
    await unauthenticatedRequestsFail(baseUrl);
    await unknownApiKeyFails(baseUrl);
    await listIsScopedByTenant(baseUrl);
    await createIgnoresAttackerSuppliedTenantId(baseUrl);
    await crossTenantFetchReturnsNotFound(baseUrl);
    await crossTenantRenameReturnsNotFound(baseUrl);
    await crossTenantArchiveReturnsNotFound(baseUrl);
    await archiveCommitsProjectAndAuditInOneTransaction(baseUrl);
    await renameSucceedsForOwnTenant(baseUrl);
  } finally {
    await app.close();
  }
}

async function unauthenticatedRequestsFail(baseUrl: string): Promise<void> {
  const response = await fetch(`${baseUrl}/projects`);
  assert.equal(response.status, 401);
}

async function unknownApiKeyFails(baseUrl: string): Promise<void> {
  const response = await fetch(`${baseUrl}/projects`, {
    headers: { 'x-api-key': 'definitely-not-real' },
  });
  assert.equal(response.status, 401);
}

async function listIsScopedByTenant(baseUrl: string): Promise<void> {
  const aliceProjects = await listProjects(baseUrl, ALICE_KEY);
  const bobProjects = await listProjects(baseUrl, BOB_KEY);

  assert.ok(aliceProjects.length > 0, 'Alice should see at least one project');
  assert.ok(bobProjects.length > 0, 'Bob should see at least one project');
  assert.ok(
    aliceProjects.every(project => project.tenantId === 'acme'),
    'Alice must only see acme projects',
  );
  assert.ok(
    bobProjects.every(project => project.tenantId === 'globex'),
    'Bob must only see globex projects',
  );

  const aliceIds = new Set(aliceProjects.map(project => project.id));
  const bobIds = new Set(bobProjects.map(project => project.id));
  for (const bobId of bobIds) {
    assert.equal(
      aliceIds.has(bobId),
      false,
      'Project IDs must not overlap between tenants in the visible view',
    );
  }
}

async function createIgnoresAttackerSuppliedTenantId(
  baseUrl: string,
): Promise<void> {
  const response = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ALICE_KEY,
    },
    body: JSON.stringify({
      name: 'Tenant-spoof attempt',
      tenantId: 'globex',
    }),
  });

  assert.equal(response.status, 400);
}

async function crossTenantFetchReturnsNotFound(baseUrl: string): Promise<void> {
  const bobProjects = await listProjects(baseUrl, BOB_KEY);
  const targetId = bobProjects[0]?.id;
  assert.ok(typeof targetId === 'number');

  const response = await fetch(`${baseUrl}/projects/${targetId}`, {
    headers: { 'x-api-key': ALICE_KEY },
  });

  assert.equal(
    response.status,
    404,
    'Cross-tenant fetch must be a 404, not 200, 403, or anything that leaks existence',
  );
}

async function crossTenantRenameReturnsNotFound(baseUrl: string): Promise<void> {
  const bobProjects = await listProjects(baseUrl, BOB_KEY);
  const targetId = bobProjects[0]?.id;
  assert.ok(typeof targetId === 'number');

  const response = await fetch(`${baseUrl}/projects/${targetId}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ALICE_KEY,
    },
    body: JSON.stringify({ name: 'Renamed by attacker' }),
  });

  assert.equal(response.status, 404);

  const stillBob = await fetchProject(baseUrl, BOB_KEY, targetId);
  assert.notEqual(stillBob.name, 'Renamed by attacker');
}

async function crossTenantArchiveReturnsNotFound(baseUrl: string): Promise<void> {
  const bobProjects = await listProjects(baseUrl, BOB_KEY);
  const targetId = bobProjects[0]?.id;
  assert.ok(typeof targetId === 'number');

  const response = await fetch(`${baseUrl}/projects/${targetId}/archive`, {
    method: 'POST',
    headers: { 'x-api-key': ALICE_KEY },
  });

  assert.equal(response.status, 404);

  const stillBob = await fetchProject(baseUrl, BOB_KEY, targetId);
  assert.equal(
    stillBob.status,
    'active',
    'Bob project must stay active when a different tenant attempts to archive it',
  );

  const aliceAudits = await listAudits(baseUrl, ALICE_KEY);
  assert.ok(
    aliceAudits.every(audit => audit.projectId !== targetId),
    'Alice must not have any audit row that references a project from a different tenant',
  );

  const bobAudits = await listAudits(baseUrl, BOB_KEY);
  assert.ok(
    bobAudits.every(audit => audit.projectId !== targetId || audit.event !== 'archived'),
    'No archive audit should exist for the targeted project after a rejected cross-tenant write',
  );
}

async function archiveCommitsProjectAndAuditInOneTransaction(
  baseUrl: string,
): Promise<void> {
  const created = await createProject(baseUrl, ALICE_KEY, 'Archive target');
  const archived = await archiveProject(baseUrl, ALICE_KEY, created.id);

  assert.equal(archived.status, 'archived');

  const refetched = await fetchProject(baseUrl, ALICE_KEY, created.id);
  assert.equal(refetched.status, 'archived');

  const audits = await listAudits(baseUrl, ALICE_KEY);
  const auditForProject = audits.find(audit => audit.projectId === created.id);
  assert.ok(auditForProject, 'Audit row must be written inside the same transaction');
  assert.equal(auditForProject.event, 'archived');
  assert.equal(auditForProject.tenantId, 'acme');
}

async function renameSucceedsForOwnTenant(baseUrl: string): Promise<void> {
  const created = await createProject(baseUrl, ALICE_KEY, 'Rename target');
  const renamed = await renameProject(baseUrl, ALICE_KEY, created.id, 'Rename target updated');

  assert.equal(renamed.name, 'Rename target updated');
  assert.equal(renamed.tenantId, 'acme');
}

async function listProjects(
  baseUrl: string,
  apiKey: string,
): Promise<ProjectResponse[]> {
  const response = await fetch(`${baseUrl}/projects`, {
    headers: { 'x-api-key': apiKey },
  });
  assert.equal(response.status, 200);
  return response.json() as Promise<ProjectResponse[]>;
}

async function fetchProject(
  baseUrl: string,
  apiKey: string,
  id: number,
): Promise<ProjectResponse> {
  const response = await fetch(`${baseUrl}/projects/${id}`, {
    headers: { 'x-api-key': apiKey },
  });
  assert.equal(response.status, 200);
  return response.json() as Promise<ProjectResponse>;
}

async function createProject(
  baseUrl: string,
  apiKey: string,
  name: string,
): Promise<ProjectResponse> {
  const response = await fetch(`${baseUrl}/projects`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ name }),
  });
  assert.equal(response.status, 201);
  return response.json() as Promise<ProjectResponse>;
}

async function renameProject(
  baseUrl: string,
  apiKey: string,
  id: number,
  name: string,
): Promise<ProjectResponse> {
  const response = await fetch(`${baseUrl}/projects/${id}`, {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ name }),
  });
  assert.equal(response.status, 200);
  return response.json() as Promise<ProjectResponse>;
}

async function archiveProject(
  baseUrl: string,
  apiKey: string,
  id: number,
): Promise<ProjectResponse> {
  const response = await fetch(`${baseUrl}/projects/${id}/archive`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
  });
  assert.equal(response.status, 201);
  return response.json() as Promise<ProjectResponse>;
}

async function listAudits(
  baseUrl: string,
  apiKey: string,
): Promise<AuditResponse[]> {
  const response = await fetch(`${baseUrl}/projects/audits`, {
    headers: { 'x-api-key': apiKey },
  });
  assert.equal(response.status, 200);
  return response.json() as Promise<AuditResponse[]>;
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
