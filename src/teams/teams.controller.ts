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
  Put,
} from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { TeamsService } from './teams.service';

@Controller()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('projects/:projectId/teams')
  getByProject(@Param('projectId') projectId: string) {
    return this.teamsService.getByProject(projectId);
  }

  @Get('teams/mine')
  getMine(@CurrentUser() userId: string) {
    return this.teamsService.getMine(userId);
  }

  @Post('teams')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() userId: string,
    @Body() body: { projectId: string; workspaceId: string; name: string },
  ) {
    return this.teamsService.create(userId, body.projectId, body.workspaceId, body.name);
  }

  @Get('teams/:id')
  getById(@Param('id') id: string) {
    return this.teamsService.getById(id);
  }

  @Post('teams/:id/invite')
  @HttpCode(HttpStatus.CREATED)
  invite(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.teamsService.invite(id, body.userId);
  }

  @Post('teams/:id/invite/accept')
  acceptInvite(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.teamsService.acceptInvite(id, userId);
  }

  @Post('teams/:id/invite/reject')
  rejectInvite(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.teamsService.rejectInvite(id, userId);
  }

  @Patch('teams/:id/members/:userId/role')
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') memberId: string,
    @Body() body: { role: string },
  ) {
    return this.teamsService.updateMemberRole(id, memberId, body.role);
  }

  @Delete('teams/:id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(@Param('id') id: string, @Param('userId') memberId: string) {
    return this.teamsService.removeMember(id, memberId);
  }

  @Put('teams/:id/display-name')
  setDisplayName(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() body: { displayName?: string },
  ) {
    return this.teamsService.setDisplayName(id, userId, body.displayName);
  }
}
