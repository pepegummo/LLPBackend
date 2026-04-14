import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getByWorkspace(wsId: string) {
    const { data, error } = await this.supabase.client
      .from('projects')
      .select('*, project_admins(user_id)')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(workspaceId: string, name: string, description?: string) {
    if (!workspaceId || !name) {
      throw new BadRequestException('workspaceId and name are required');
    }

    const { data, error } = await this.supabase.client
      .from('projects')
      .insert({ workspace_id: workspaceId, name, description })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Project not found');
    return data;
  }

  async update(id: string, name?: string, description?: string) {
    const { data, error } = await this.supabase.client
      .from('projects')
      .update({ name, description })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase.client.from('projects').delete().eq('id', id);
    if (error) throw new InternalServerErrorException(error.message);
  }

  async addAdmin(projectId: string, requesterId: string, userId: string) {
    // Check requester is workspace owner/admin or project admin
    const { data: proj } = await this.supabase.client
      .from('projects')
      .select('workspace_id')
      .eq('id', projectId)
      .single();
    if (!proj) throw new NotFoundException('Project not found');

    const { data: ws } = await this.supabase.client
      .from('workspaces')
      .select('owner_id')
      .eq('id', proj.workspace_id)
      .single();

    const { data: wsAdmin } = await this.supabase.client
      .from('workspace_admins')
      .select('user_id')
      .eq('workspace_id', proj.workspace_id)
      .eq('user_id', requesterId)
      .maybeSingle();

    const isWsOwner = ws?.owner_id === requesterId;
    const isWsAdmin = !!wsAdmin;

    const { data: projAdmin } = await this.supabase.client
      .from('project_admins')
      .select('user_id')
      .eq('project_id', projectId)
      .eq('user_id', requesterId)
      .maybeSingle();

    if (!isWsOwner && !isWsAdmin && !projAdmin) {
      throw new ForbiddenException('Not authorized to manage project admins');
    }

    const { error } = await this.supabase.client
      .from('project_admins')
      .insert({ project_id: projectId, user_id: userId });

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Project admin added' };
  }

  async addAdminByEmail(projectId: string, requesterId: string, email: string) {
    const { data: authData, error: authError } = await this.supabase.client.auth.admin.listUsers();
    if (authError) throw new InternalServerErrorException(authError.message);

    const authUser = (authData?.users ?? []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!authUser) throw new NotFoundException('No user found with that email');

    return this.addAdmin(projectId, requesterId, authUser.id);
  }

  async removeAdmin(projectId: string, requesterId: string, userId: string) {
    const { data: proj } = await this.supabase.client
      .from('projects')
      .select('workspace_id')
      .eq('id', projectId)
      .single();
    if (!proj) throw new NotFoundException('Project not found');

    const { data: ws } = await this.supabase.client
      .from('workspaces')
      .select('owner_id')
      .eq('id', proj.workspace_id)
      .single();

    if (ws?.owner_id !== requesterId) {
      throw new ForbiddenException('Only workspace owner can remove project admins');
    }

    const { error } = await this.supabase.client
      .from('project_admins')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException(error.message);
  }

  async createInviteLink(projectId: string, requesterId: string) {
    const { data, error } = await this.supabase.client
      .from('invite_links')
      .insert({ type: 'project', target_id: projectId, created_by: requesterId })
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
      .eq('type', 'project')
      .single();

    if (error || !link) throw new NotFoundException('Invalid or expired invite link');

    const { error: insertError } = await this.supabase.client
      .from('project_admins')
      .insert({ project_id: link.target_id, user_id: userId });

    if (insertError && !insertError.message.includes('duplicate')) {
      throw new InternalServerErrorException(insertError.message);
    }

    return { projectId: link.target_id };
  }
}
