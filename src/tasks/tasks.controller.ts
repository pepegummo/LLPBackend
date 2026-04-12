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
import { TasksService } from './tasks.service';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('teams/:teamId/tasks')
  getByTeam(@Param('teamId') teamId: string) {
    return this.tasksService.getByTeam(teamId);
  }

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() userId: string,
    @Body()
    body: {
      teamId: string;
      title: string;
      description?: string;
      status?: string;
      assigneeIds?: string[];
      dueDate?: string;
      startDate?: string;
      manHours?: number;
      tags?: string[];
    },
  ) {
    return this.tasksService.create(userId, body);
  }

  @Get('tasks/:id')
  getById(@Param('id') id: string) {
    return this.tasksService.getById(id);
  }

  @Patch('tasks/:id')
  update(
    @Param('id') id: string,
    @CurrentUser() userId: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      status?: string;
      dueDate?: string;
      startDate?: string;
      manHours?: number;
      assigneeIds?: string[];
      tags?: string[];
    },
  ) {
    return this.tasksService.update(id, userId, body);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.tasksService.delete(id);
  }

  @Post('tasks/:id/attachments')
  @HttpCode(HttpStatus.CREATED)
  addAttachment(@Param('id') id: string, @Body() body: { label: string; url: string }) {
    return this.tasksService.addAttachment(id, body.label, body.url);
  }

  @Delete('tasks/:id/attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAttachment(@Param('attachmentId') attachmentId: string) {
    return this.tasksService.deleteAttachment(attachmentId);
  }

  @Post('tasks/:id/subtasks')
  @HttpCode(HttpStatus.CREATED)
  createSubtask(
    @Param('id') id: string,
    @Body() body: { title: string; manHours?: number; assigneeIds?: string[] },
  ) {
    return this.tasksService.createSubtask(id, body.title, body.manHours, body.assigneeIds);
  }

  @Patch('tasks/:id/subtasks/:subtaskId')
  updateSubtask(
    @Param('subtaskId') subtaskId: string,
    @Body() body: { completed?: boolean; title?: string; manHours?: number },
  ) {
    return this.tasksService.updateSubtask(subtaskId, body);
  }

  @Delete('tasks/:id/subtasks/:subtaskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSubtask(@Param('subtaskId') subtaskId: string) {
    return this.tasksService.deleteSubtask(subtaskId);
  }
}
