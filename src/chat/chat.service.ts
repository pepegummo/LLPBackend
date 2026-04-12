import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatService {
  constructor(private readonly supabase: SupabaseService) {}

  async getChannelsByTeam(teamId: string) {
    const { data, error } = await this.supabase.client
      .from('chat_channels')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async createChannel(teamId: string, name: string, userId: string) {
    const { data, error } = await this.supabase.client
      .from('chat_channels')
      .insert({ team_id: teamId, name, created_by: userId })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getMessages(channelId: string, limit: number, before?: string) {
    let query = this.supabase.client
      .from('chat_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []).reverse();
  }

  async sendMessage(userId: string, body: {
    channelId: string;
    teamId: string;
    content: string;
    mentions?: string[];
  }) {
    if (!body.channelId || !body.teamId || !body.content) {
      throw new BadRequestException('channelId, teamId, and content are required');
    }

    const { data, error } = await this.supabase.client
      .from('chat_messages')
      .insert({
        channel_id: body.channelId,
        team_id: body.teamId,
        sender_id: userId,
        content: body.content,
        mentions: body.mentions ?? [],
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    if (body.mentions?.length) {
      const { data: sender } = await this.supabase.client
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single();

      await this.supabase.client.from('notifications').insert(
        body.mentions.map((uid) => ({
          user_id: uid,
          type: 'mention',
          message: `${sender?.name ?? 'Someone'} mentioned you in a chat`,
          meta: { channelId: body.channelId, teamId: body.teamId },
        })),
      );
    }

    return data;
  }

  async renameChannel(channelId: string, name: string) {
    const { data, error } = await this.supabase.client
      .from('chat_channels')
      .update({ name })
      .eq('id', channelId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async deleteChannel(channelId: string) {
    await this.supabase.client
      .from('chat_messages')
      .delete()
      .eq('channel_id', channelId);

    await this.supabase.client
      .from('chat_channels')
      .delete()
      .eq('id', channelId);
  }

  async deleteMessage(messageId: string) {
    await this.supabase.client
      .from('chat_messages')
      .delete()
      .eq('id', messageId);
  }
}
