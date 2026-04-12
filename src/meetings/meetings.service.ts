import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MeetingsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getByTeam(teamId: string) {
    const { data, error } = await this.supabase.client
      .from('meetings')
      .select('*, meeting_attendees(user_id), meeting_notifications(*)')
      .eq('team_id', teamId)
      .order('datetime', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(userId: string, body: {
    teamId: string;
    topic: string;
    description?: string;
    link?: string;
    datetime: string;
    attendeeIds?: string[];
    notificationSettings?: { minutesBefore: number; label: string }[];
  }) {
    if (!body.teamId || !body.topic || !body.datetime) {
      throw new BadRequestException('teamId, topic, and datetime are required');
    }

    const { data: meeting, error } = await this.supabase.client
      .from('meetings')
      .insert({
        team_id: body.teamId,
        topic: body.topic,
        description: body.description,
        link: body.link,
        datetime: body.datetime,
        created_by: userId,
      })
      .select()
      .single();

    if (error || !meeting) {
      throw new InternalServerErrorException(error?.message);
    }

    if (body.attendeeIds?.length) {
      await this.supabase.client.from('meeting_attendees').insert(
        body.attendeeIds.map((uid) => ({ meeting_id: meeting.id, user_id: uid })),
      );
    }

    if (body.notificationSettings?.length) {
      await this.supabase.client.from('meeting_notifications').insert(
        body.notificationSettings.map((ns) => ({
          meeting_id: meeting.id,
          minutes_before: ns.minutesBefore,
          label: ns.label,
        })),
      );
    }

    return meeting;
  }

  async update(id: string, body: {
    topic?: string;
    description?: string;
    link?: string;
    datetime?: string;
    attendeeIds?: string[];
  }) {
    const updates: Record<string, unknown> = {};
    if (body.topic !== undefined) updates.topic = body.topic;
    if (body.description !== undefined) updates.description = body.description;
    if (body.link !== undefined) updates.link = body.link;
    if (body.datetime !== undefined) updates.datetime = body.datetime;

    const { data, error } = await this.supabase.client
      .from('meetings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    if (body.attendeeIds !== undefined) {
      await this.supabase.client.from('meeting_attendees').delete().eq('meeting_id', id);
      if (body.attendeeIds.length) {
        await this.supabase.client.from('meeting_attendees').insert(
          body.attendeeIds.map((uid) => ({ meeting_id: id, user_id: uid })),
        );
      }
    }

    return data;
  }

  async delete(id: string) {
    await this.supabase.client.from('meetings').delete().eq('id', id);
  }
}
