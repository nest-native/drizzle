import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateProjectDto } from './create-project.dto';
import { ProjectDto } from './project.dto';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService implements OnModuleInit {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async onModuleInit(): Promise<void> {
    await this.projectsRepository.migrate();
    await this.projectsRepository.create({
      name: 'Document the supported OpenAPI path',
      status: 'active',
    });
  }

  list(): Promise<ProjectDto[]> {
    return this.projectsRepository.list();
  }

  create(input: CreateProjectDto): Promise<ProjectDto> {
    return this.projectsRepository.create(input);
  }
}
