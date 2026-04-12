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
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { ChatService } from './chat.service';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('teams/:teamId/chat/channels')
  getChannelsByTeam(@Param('teamId') teamId: string) {
    return this.chatService.getChannelsByTeam(teamId);
  }

  @Post('chat/channels')
  @HttpCode(HttpStatus.CREATED)
  createChannel(
    @CurrentUser() userId: string,
    @Body() body: { teamId: string; name: string },
  ) {
    return this.chatService.createChannel(body.teamId, body.name, userId);
  }

  @Get('chat/channels/:channelId/messages')
  getMessages(
    @Param('channelId') channelId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.chatService.getMessages(channelId, parseInt(limit ?? '50') || 50, before);
  }

  @Patch('chat/channels/:channelId')
  renameChannel(
    @Param('channelId') channelId: string,
    @Body() body: { name: string },
  ) {
    return this.chatService.renameChannel(channelId, body.name);
  }

  @Delete('chat/channels/:channelId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteChannel(@Param('channelId') channelId: string) {
    return this.chatService.deleteChannel(channelId);
  }

  @Post('chat/messages')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @CurrentUser() userId: string,
    @Body() body: { channelId: string; teamId: string; content: string; mentions?: string[] },
  ) {
    return this.chatService.sendMessage(userId, body);
  }

  @Delete('chat/messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMessage(@Param('messageId') messageId: string) {
    return this.chatService.deleteMessage(messageId);
  }
}
