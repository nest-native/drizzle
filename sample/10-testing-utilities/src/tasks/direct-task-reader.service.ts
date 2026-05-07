import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from 'nest-drizzle-native';

export type DirectTaskClient = Record<PropertyKey, unknown> & {
  query: {
    tasks: {
      findMany: () => Promise<Array<{ title: string }>>;
    };
  };
};

@Injectable()
export class DirectTaskReaderService {
  constructor(@InjectDrizzle() private readonly db: DirectTaskClient) {}

  async listTitles(): Promise<string[]> {
    const tasks = await this.db.query.tasks.findMany();
    return tasks.map(task => task.title);
  }
}
