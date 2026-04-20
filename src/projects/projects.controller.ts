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
import { CurrentUser } from '../common/current-user.decorator';
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
  create(@CurrentUser() userId: string, @Body() body: { workspaceId: string; name: string; description?: string }) {
    return this.projectsService.create(body.workspaceId, userId, body.name, body.description);
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

  @Post('projects/:id/admins')
  @HttpCode(HttpStatus.CREATED)
  addAdmin(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() body: { userId?: string; email?: string },
  ) {
    if (body.email) return this.projectsService.addAdminByEmail(id, userId, body.email);
    if (body.userId) return this.projectsService.addAdmin(id, userId, body.userId);
  }

  @Delete('projects/:id/admins/:adminId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAdmin(
    @Param('id') id: string,
    @Param('adminId') adminId: string,
    @CurrentUser() userId: string,
  ) {
    return this.projectsService.removeAdmin(id, userId, adminId);
  }

  @Post('projects/:id/invite-link')
  @HttpCode(HttpStatus.CREATED)
  createInviteLink(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.projectsService.createInviteLink(id, userId);
  }

  @Post('projects/accept-invite/:token')
  acceptInviteLink(@Param('token') token: string, @CurrentUser() userId: string) {
    return this.projectsService.acceptInviteLink(token, userId);
  }
}
