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
import { MeetingsService } from './meetings.service';

@Controller()
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get('teams/:teamId/meetings')
  getByTeam(@Param('teamId') teamId: string) {
    return this.meetingsService.getByTeam(teamId);
  }

  @Post('meetings')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() userId: string,
    @Body()
    body: {
      teamId: string;
      topic: string;
      description?: string;
      link?: string;
      datetime: string;
      attendeeIds?: string[];
      notificationSettings?: { minutesBefore: number; label: string }[];
    },
  ) {
    return this.meetingsService.create(userId, body);
  }

  @Patch('meetings/:id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      topic?: string;
      description?: string;
      link?: string;
      datetime?: string;
      attendeeIds?: string[];
    },
  ) {
    return this.meetingsService.update(id, body);
  }

  @Delete('meetings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.meetingsService.delete(id);
  }
}
