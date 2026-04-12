import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { TicketsService } from './tickets.service';

@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('teams/:teamId/tickets')
  getByTeam(@Param('teamId') teamId: string) {
    return this.ticketsService.getByTeam(teamId);
  }

  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() userId: string,
    @Body() body: { teamId: string; title: string; description: string; type: string },
  ) {
    return this.ticketsService.create(userId, body);
  }

  @Patch('tickets/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.ticketsService.updateStatus(id, body.status);
  }

  @Post('tickets/:id/messages')
  @HttpCode(HttpStatus.CREATED)
  addMessage(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body() body: { content: string },
  ) {
    return this.ticketsService.addMessage(id, userId, body.content);
  }
}
