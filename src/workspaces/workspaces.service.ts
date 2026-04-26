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
      .select('*, workspace_admins(user_id)')
      .eq('owner_id', userId);

    const { data: adminOf } = await this.supabase.client
      .from('workspace_admins')
      .select('workspace_id')
      .eq('user_id', userId);

    const adminIds = (adminOf ?? []).map((r) => r.workspace_id);
    const { data: administered } = adminIds.length
      ? await this.supabase.client
          .from('workspaces')
          .select('*, workspace_admins(user_id)')
          .in('id', adminIds)
      : { data: [] };

    // Workspaces where user is a team member
    const { data: memberTeams } = await this.supabase.client
      .from('team_members')
      .select('teams(workspace_id)')
      .eq('user_id', userId);

    const memberWsIds = (memberTeams ?? [])
      .map((r: any) => r.teams?.workspace_id)
      .filter(Boolean);

    const { data: memberOf } = memberWsIds.length
      ? await this.supabase.client
          .from('workspaces')
          .select('*, workspace_admins(user_id)')
          .in('id', memberWsIds)
      : { data: [] };

    const all = [...(owned ?? []), ...(administered ?? []), ...(memberOf ?? [])];
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

    if (error && !error.message.includes('duplicate')) {
      throw new InternalServerErrorException(error.message);
    }
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

  async addAdminByEmail(workspaceId: string, requesterId: string, email: string) {
    const { data: ws } = await this.supabase.client
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();

    if (!ws || ws.owner_id !== requesterId) {
      throw new ForbiddenException('Only the workspace owner can add admins');
    }

    const { data: authData, error: authError } = await this.supabase.client.auth.admin.listUsers();
    if (authError) throw new InternalServerErrorException(authError.message);

    const authUser = (authData?.users ?? []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!authUser) throw new NotFoundException('No user found with that email');

    const { error } = await this.supabase.client
      .from('workspace_admins')
      .insert({ workspace_id: workspaceId, user_id: authUser.id });

    if (error && !error.message.includes('duplicate')) {
      throw new InternalServerErrorException(error.message);
    }
    return { message: 'Admin added', userId: authUser.id };
  }

  async createInviteLink(workspaceId: string, requesterId: string) {
    const { data: ws } = await this.supabase.client
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();

    if (!ws || ws.owner_id !== requesterId) {
      throw new ForbiddenException('Only the workspace owner can create invite links');
    }

    const { data, error } = await this.supabase.client
      .from('invite_links')
      .insert({ type: 'workspace', target_id: workspaceId, created_by: requesterId })
      .select('id')
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return { token: data.id };
  }

  async acceptInviteLink(token: string, userId: string) {
    const { data: link, error } = await this.supabase.client
      .from('invite_links')
      .select('*')
      .eq('id', token)
      .eq('type', 'workspace')
      .single();

    if (error || !link) throw new NotFoundException('Invalid or expired invite link');

    const { error: insertError } = await this.supabase.client
      .from('workspace_admins')
      .insert({ workspace_id: link.target_id, user_id: userId });

    // Ignore duplicate key error (user already admin)
    if (insertError && !insertError.message.includes('duplicate')) {
      throw new InternalServerErrorException(insertError.message);
    }

    return { workspaceId: link.target_id };
  }
}
