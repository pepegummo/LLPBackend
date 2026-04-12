import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class WorkspacesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getAll(userId: string) {
    const { data: owned } = await this.supabase.client
      .from('workspaces')
      .select('*')
      .eq('owner_id', userId);

    const { data: adminOf } = await this.supabase.client
      .from('workspace_admins')
      .select('workspace_id')
      .eq('user_id', userId);

    const adminIds = (adminOf ?? []).map((r) => r.workspace_id);
    const { data: administered } = adminIds.length
      ? await this.supabase.client.from('workspaces').select('*').in('id', adminIds)
      : { data: [] };

    const all = [...(owned ?? []), ...(administered ?? [])];
    return Array.from(new Map(all.map((w) => [w.id, w])).values());
  }

  async create(userId: string, name: string) {
    if (!name) throw new BadRequestException('name is required');

    const { data, error } = await this.supabase.client
      .from('workspaces')
      .insert({ name, owner_id: userId })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.client
      .from('workspaces')
      .select('*, workspace_admins(user_id)')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Workspace not found');
    return data;
  }

  async update(id: string, userId: string, name: string) {
    const { data, error } = await this.supabase.client
      .from('workspaces')
      .update({ name })
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) throw new ForbiddenException('Not authorized or workspace not found');
    return data;
  }

  async addAdmin(workspaceId: string, requesterId: string, userId: string) {
    const { data: ws } = await this.supabase.client
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();

    if (!ws || ws.owner_id !== requesterId) {
      throw new ForbiddenException('Only the workspace owner can add admins');
    }

    const { error } = await this.supabase.client
      .from('workspace_admins')
      .insert({ workspace_id: workspaceId, user_id: userId });

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Admin added' };
  }

  async removeAdmin(workspaceId: string, requesterId: string, adminId: string) {
    const { data: ws } = await this.supabase.client
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();

    if (!ws || ws.owner_id !== requesterId) {
      throw new ForbiddenException('Only the workspace owner can remove admins');
    }

    const { error } = await this.supabase.client
      .from('workspace_admins')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', adminId);

    if (error) throw new InternalServerErrorException(error.message);
  }
}
