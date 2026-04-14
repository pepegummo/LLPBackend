import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  getAll(@CurrentUser() userId: string) {
    return this.workspacesService.getAll(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() userId: string, @Body() body: { name: string }) {
    return this.workspacesService.create(userId, body.name);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.workspacesService.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() body: { name: string },
  ) {
    return this.workspacesService.update(id, userId, body.name);
  }

  @Post(':id/admins')
  @HttpCode(HttpStatus.CREATED)
  addAdmin(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() body: { userId: string },
  ) {
    return this.workspacesService.addAdmin(id, userId, body.userId);
  }

  @Delete(':id/admins/:adminId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeAdmin(
    @Param('id') id: string,
    @Param('adminId') adminId: string,
    @CurrentUser() userId: string,
  ) {
    return this.workspacesService.removeAdmin(id, userId, adminId);
  }

  @Post(':id/admins/by-email')
  @HttpCode(HttpStatus.CREATED)
  addAdminByEmail(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() body: { email: string },
  ) {
    return this.workspacesService.addAdminByEmail(id, userId, body.email);
  }

  @Post(':id/invite-link')
  @HttpCode(HttpStatus.CREATED)
  createInviteLink(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.workspacesService.createInviteLink(id, userId);
  }

  @Post('accept-invite/:token')
  acceptInviteLink(@Param('token') token: string, @CurrentUser() userId: string) {
    return this.workspacesService.acceptInviteLink(token, userId);
  }
}
