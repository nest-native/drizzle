import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { CreateProjectDto } from './create-project.dto';
import { ProjectsService } from './projects.service';
import { RenameProjectDto } from './rename-project.dto';
import type { Project, ProjectAudit } from './projects.repository';

@Controller('projects')
@UseGuards(ApiKeyGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(): Promise<Project[]> {
    return this.projectsService.list();
  }

  @Get('audits')
  listAudits(): Promise<ProjectAudit[]> {
    return this.projectsService.listAudits();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Project> {
    return this.projectsService.findById(id);
  }

  @Post()
  create(@Body() body: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(body);
  }

  @Patch(':id')
  rename(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RenameProjectDto,
  ): Promise<Project> {
    return this.projectsService.rename(id, body.name);
  }

  @Post(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number): Promise<Project> {
    return this.projectsService.archive(id);
  }
}
