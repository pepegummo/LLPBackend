import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

const TASK_SELECT = `
  *,
  task_assignees(user_id),
  task_attachments(*),
  task_tags(tag_id),
  subtasks(*, subtask_assignees(user_id))
`;

@Injectable()
export class TasksService {
  constructor(private readonly supabase: SupabaseService) {}

  async getByTeam(teamId: string) {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .select(TASK_SELECT)
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(userId: string, body: {
    teamId: string;
    title: string;
    description?: string;
    status?: string;
    assigneeIds?: string[];
    dueDate?: string;
    startDate?: string;
    manHours?: number;
    tags?: string[];
  }) {
    if (!body.teamId || !body.title) {
      throw new BadRequestException('teamId and title are required');
    }

    const { data: task, error } = await this.supabase.client
      .from('tasks')
      .insert({
        team_id: body.teamId,
        title: body.title,
        description: body.description,
        status: body.status ?? 'todo',
        due_date: body.dueDate ?? null,
        start_date: body.startDate ?? null,
        man_hours: body.manHours ?? null,
      })
      .select()
      .single();

    if (error || !task) {
      throw new InternalServerErrorException(error?.message ?? 'Failed to create task');
    }

    if (body.assigneeIds?.length) {
      await this.supabase.client.from('task_assignees').insert(
        body.assigneeIds.map((uid) => ({ task_id: task.id, user_id: uid })),
      );
    }

    if (body.tags?.length) {
      await this.supabase.client.from('task_tags').insert(
        body.tags.map((tagId) => ({ task_id: task.id, tag_id: tagId })),
      );
    }

    await this.supabase.client.from('activity_logs').insert({
      task_id: task.id,
      task_title: body.title,
      team_id: body.teamId,
      user_id: userId,
      action: 'created task',
    });

    if (body.assigneeIds?.length) {
      await this.supabase.client.from('notifications').insert(
        body.assigneeIds.map((uid) => ({
          user_id: uid,
          type: 'task_assigned',
          message: `คุณได้รับมอบหมายงาน: ${body.title}`,
          meta: { teamId: body.teamId, taskId: task.id },
        })),
      );
    }

    return task;
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .select(TASK_SELECT)
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Task not found');
    return data;
  }

  async update(id: string, userId: string, body: {
    title?: string;
    description?: string;
    status?: string;
    dueDate?: string;
    startDate?: string;
    manHours?: number;
    assigneeIds?: string[];
    tags?: string[];
  }) {
    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.status !== undefined) updates.status = body.status;
    if (body.dueDate !== undefined) updates.due_date = body.dueDate;
    if (body.startDate !== undefined) updates.start_date = body.startDate;
    if (body.manHours !== undefined) updates.man_hours = body.manHours;

    let task: Record<string, unknown>;
    if (Object.keys(updates).length > 0) {
      const { data, error } = await this.supabase.client
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new InternalServerErrorException(error.message);
      task = data;
    } else {
      const { data, error } = await this.supabase.client
        .from('tasks')
        .select()
        .eq('id', id)
        .single();
      if (error) throw new InternalServerErrorException(error.message);
      task = data;
    }

    if (body.assigneeIds !== undefined) {
      await this.supabase.client.from('task_assignees').delete().eq('task_id', id);
      if (body.assigneeIds.length) {
        await this.supabase.client.from('task_assignees').insert(
          body.assigneeIds.map((uid) => ({ task_id: id, user_id: uid })),
        );
      }
    }

    if (body.tags !== undefined) {
      await this.supabase.client.from('task_tags').delete().eq('task_id', id);
      if (body.tags.length) {
        await this.supabase.client.from('task_tags').insert(
          body.tags.map((tagId) => ({ task_id: id, tag_id: tagId })),
        );
      }
    }

    await this.supabase.client.from('activity_logs').insert({
      task_id: id,
      task_title: task.title,
      team_id: task.team_id,
      user_id: userId,
      action: `updated task${body.status ? ` → ${body.status}` : ''}`,
    });

    // Re-fetch with full joins so frontend gets complete task data
    const { data: fullTask, error: fullError } = await this.supabase.client
      .from('tasks')
      .select(TASK_SELECT)
      .eq('id', id)
      .single();

    if (fullError) throw new InternalServerErrorException(fullError.message);
    return fullTask;
  }

  async delete(id: string) {
    const { error } = await this.supabase.client.from('tasks').delete().eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
  }

  async addAttachment(taskId: string, label: string, url: string) {
    const { data, error } = await this.supabase.client
      .from('task_attachments')
      .insert({ task_id: taskId, label, url })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async deleteAttachment(attachmentId: string) {
    await this.supabase.client.from('task_attachments').delete().eq('id', attachmentId);
  }

  async createSubtask(taskId: string, title: string, manHours?: number, assigneeIds?: string[]) {
    const { data: subtask, error } = await this.supabase.client
      .from('subtasks')
      .insert({ task_id: taskId, title, man_hours: manHours ?? null })
      .select()
      .single();

    if (error || !subtask) {
      throw new InternalServerErrorException(error?.message);
    }

    if (assigneeIds?.length) {
      await this.supabase.client.from('subtask_assignees').insert(
        assigneeIds.map((uid) => ({ subtask_id: subtask.id, user_id: uid })),
      );
    }

    return subtask;
  }

  async updateSubtask(subtaskId: string, body: { completed?: boolean; title?: string; manHours?: number }) {
    const updates: Record<string, unknown> = {};
    if (body.completed !== undefined) updates.completed = body.completed;
    if (body.title !== undefined) updates.title = body.title;
    if (body.manHours !== undefined) updates.man_hours = body.manHours;

    const { data, error } = await this.supabase.client
      .from('subtasks')
      .update(updates)
      .eq('id', subtaskId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async deleteSubtask(subtaskId: string) {
    await this.supabase.client.from('subtasks').delete().eq('id', subtaskId);
  }
}
