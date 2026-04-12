import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class LinksService {
  constructor(private readonly supabase: SupabaseService) {}

  async getByTeam(teamId: string) {
    const { data, error } = await this.supabase.client
      .from('standalone_links')
      .select('*, link_tags(tag_id)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(userId: string, body: { teamId: string; label: string; url: string; tags?: string[] }) {
    if (!body.teamId || !body.label || !body.url) {
      throw new BadRequestException('teamId, label, and url are required');
    }

    const { data: link, error } = await this.supabase.client
      .from('standalone_links')
      .insert({ team_id: body.teamId, label: body.label, url: body.url, created_by: userId })
      .select()
      .single();

    if (error || !link) {
      throw new InternalServerErrorException(error?.message);
    }

    if (body.tags?.length) {
      await this.supabase.client.from('link_tags').insert(
        body.tags.map((tagId) => ({ link_id: link.id, tag_id: tagId })),
      );
    }

    return link;
  }

  async update(id: string, body: { label?: string; url?: string; tags?: string[] }) {
    const { data, error } = await this.supabase.client
      .from('standalone_links')
      .update({ label: body.label, url: body.url })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    if (body.tags !== undefined) {
      await this.supabase.client.from('link_tags').delete().eq('link_id', id);
      if (body.tags.length) {
        await this.supabase.client.from('link_tags').insert(
          body.tags.map((tagId) => ({ link_id: id, tag_id: tagId })),
        );
      }
    }

    return data;
  }

  async delete(id: string) {
    await this.supabase.client.from('standalone_links').delete().eq('id', id);
  }

  async getTagsByTeam(teamId: string) {
    const { data, error } = await this.supabase.client
      .from('tags')
      .select('*')
      .eq('team_id', teamId);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async createTag(teamId: string, name: string, color: string) {
    const { data, error } = await this.supabase.client
      .from('tags')
      .insert({ team_id: teamId, name, color })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
