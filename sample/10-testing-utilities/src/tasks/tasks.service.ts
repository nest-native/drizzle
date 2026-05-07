import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async createAndListTitles(title: string): Promise<string[]> {
    await this.tasksRepository.create(title);
    const tasks = await this.tasksRepository.listOpen();

    return tasks.map(task => task.title);
  }
}
