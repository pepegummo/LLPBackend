import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TicketsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getByTeam(teamId: string) {
    const { data, error } = await this.supabase.client
      .from('tickets')
      .select('*, ticket_messages(*)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(userId: string, body: {
    teamId: string;
    title: string;
    description: string;
    type: string;
  }) {
    if (!body.teamId || !body.title || !body.description || !body.type) {
      throw new BadRequestException('teamId, title, description, and type are required');
    }

    const { data, error } = await this.supabase.client
      .from('tickets')
      .insert({
        team_id: body.teamId,
        student_id: userId,
        title: body.title,
        description: body.description,
        type: body.type,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async updateStatus(id: string, status: string) {
    const { data, error } = await this.supabase.client
      .from('tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async addMessage(ticketId: string, userId: string, content: string) {
    const { data, error } = await this.supabase.client
      .from('ticket_messages')
      .insert({ ticket_id: ticketId, sender_id: userId, content })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    await this.supabase.client
      .from('tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return data;
  }
}
