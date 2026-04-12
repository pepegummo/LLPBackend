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
import { LinksService } from './links.service';

@Controller()
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get('teams/:teamId/links')
  getByTeam(@Param('teamId') teamId: string) {
    return this.linksService.getByTeam(teamId);
  }

  @Post('links')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() userId: string,
    @Body() body: { teamId: string; label: string; url: string; tags?: string[] },
  ) {
    return this.linksService.create(userId, body);
  }

  @Patch('links/:id')
  update(
    @Param('id') id: string,
    @Body() body: { label?: string; url?: string; tags?: string[] },
  ) {
    return this.linksService.update(id, body);
  }

  @Delete('links/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.linksService.delete(id);
  }

  @Get('teams/:teamId/tags')
  getTagsByTeam(@Param('teamId') teamId: string) {
    return this.linksService.getTagsByTeam(teamId);
  }

  @Post('tags')
  @HttpCode(HttpStatus.CREATED)
  createTag(@Body() body: { teamId: string; name: string; color: string }) {
    return this.linksService.createTag(body.teamId, body.name, body.color);
  }
}
