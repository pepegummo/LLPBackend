import { Controller, Get, Param, Patch } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getAll(@CurrentUser() userId: string) {
    return this.notificationsService.getAll(userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() userId: string) {
    return this.notificationsService.markRead(id, userId);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() userId: string) {
    return this.notificationsService.markAllRead(userId);
  }
}
