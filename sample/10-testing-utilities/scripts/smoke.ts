import 'reflect-metadata';
import assert from 'node:assert/strict';
import { Test } from '@nestjs/testing';
import {
  createDrizzleMockClient,
  createDrizzleRepositoryMock,
  DrizzleTestModule,
} from 'nest-drizzle-native';
import { createDatabase } from '../src/database';
import { schema } from '../src/schema';
import {
  DirectTaskReaderService,
  type DirectTaskClient,
} from '../src/tasks/direct-task-reader.service';
import {
  TasksRepository,
  type Task,
} from '../src/tasks/tasks.repository';
import { TasksService } from '../src/tasks/tasks.service';

async function smoke(): Promise<void> {
  await realDatabaseIntegrationTest();
  await repositoryMockUnitTest();
  await directClientMockUnitTest();
}

async function realDatabaseIntegrationTest(): Promise<void> {
  const db = createDatabase();
  const moduleRef = await Test.createTestingModule({
    imports: [
      DrizzleTestModule.forRoot({
        client: db,
        schema,
      }),
      DrizzleTestModule.forFeature([TasksRepository]),
    ],
    providers: [TasksService],
  }).compile();

  try {
    const repository = moduleRef.get(TasksRepository);
    const service = moduleRef.get(TasksService);

    await repository.migrate();

    assert.deepEqual(await service.createAndListTitles('Prove real SQL'), [
      'Prove real SQL',
    ]);
  } finally {
    await moduleRef.close();
    await db.$client.close();
  }
}

async function repositoryMockUnitTest(): Promise<void> {
  const createdTasks: string[] = [];
  const repository = createDrizzleRepositoryMock({
    create: async (title: string): Promise<Task> => {
      createdTasks.push(title);
      return {
        id: 1,
        title,
        status: 'open',
      };
    },
    listOpen: async (): Promise<Task[]> => createdTasks.map((title, index) => ({
      id: index + 1,
      title,
      status: 'open',
    })),
  });

  const moduleRef = await Test.createTestingModule({
    providers: [
      TasksService,
      {
        provide: TasksRepository,
        useValue: repository,
      },
    ],
  }).compile();

  try {
    const service = moduleRef.get(TasksService);

    assert.deepEqual(await service.createAndListTitles('Mock collaboration'), [
      'Mock collaboration',
    ]);
  } finally {
    await moduleRef.close();
  }
}

async function directClientMockUnitTest(): Promise<void> {
  const db = createDrizzleMockClient<DirectTaskClient>({
    query: {
      tasks: {
        findMany: async () => [
          {
            title: 'Mock direct client',
          },
        ],
      },
    },
  });

  const moduleRef = await Test.createTestingModule({
    imports: [
      DrizzleTestModule.forRoot({
        client: db,
      }),
    ],
    providers: [DirectTaskReaderService],
  }).compile();

  try {
    const service = moduleRef.get(DirectTaskReaderService);

    assert.deepEqual(await service.listTitles(), ['Mock direct client']);
  } finally {
    await moduleRef.close();
  }
}

void smoke().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
