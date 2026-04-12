import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('workspaces/:wsId/projects')
  getByWorkspace(@Param('wsId') wsId: string) {
    return this.projectsService.getByWorkspace(wsId);
  }

  @Post('projects')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: { workspaceId: string; name: string; description?: string }) {
    return this.projectsService.create(body.workspaceId, body.name, body.description);
  }

  @Get('projects/:id')
  getById(@Param('id') id: string) {
    return this.projectsService.getById(id);
  }

  @Patch('projects/:id')
  update(@Param('id') id: string, @Body() body: { name?: string; description?: string }) {
    return this.projectsService.update(id, body.name, body.description);
  }

  @Delete('projects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }
}
