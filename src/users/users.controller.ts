import { Body, Controller, Get, Param, Patch, Put, Query } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() userId: string,
    @Body() body: { name?: string; firstName?: string; lastName?: string; bio?: string },
  ) {
    return this.usersService.updateMe(userId, body);
  }

  @Put('me/contacts')
  updateContacts(
    @CurrentUser() userId: string,
    @Body() body: { contacts: { type: string; value: string }[] },
  ) {
    return this.usersService.updateContacts(userId, body.contacts);
  }

  @Get('search')
  searchByEmail(@Query('email') email: string) {
    return this.usersService.searchByEmail(email);
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }
}
