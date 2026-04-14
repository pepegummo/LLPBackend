import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TeamsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getByProject(projectId: string) {
    const { data, error } = await this.supabase.client
      .from('teams')
      .select('*, team_members(user_id, role), team_invitations(user_id)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getMine(userId: string) {
    const { data: memberships } = await this.supabase.client
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    const teamIds = (memberships ?? []).map((m) => m.team_id);
    if (!teamIds.length) return [];

    const { data, error } = await this.supabase.client
      .from('teams')
      .select('*, team_members(user_id, role), team_invitations(user_id)')
      .in('id', teamIds);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(userId: string, projectId: string, workspaceId: string, name: string) {
    if (!projectId || !workspaceId || !name) {
      throw new BadRequestException('projectId, workspaceId, and name are required');
    }

    const { data: team, error } = await this.supabase.client
      .from('teams')
      .insert({ project_id: projectId, workspace_id: workspaceId, name })
      .select()
      .single();

    if (error || !team) {
      throw new InternalServerErrorException(error?.message ?? 'Failed to create team');
    }

    await this.supabase.client
      .from('team_members')
      .insert({ team_id: team.id, user_id: userId, role: 'team_leader' });

    const { data: fullTeam } = await this.supabase.client
      .from('teams')
      .select('*, team_members(user_id, role), team_invitations(user_id)')
      .eq('id', team.id)
      .single();

    return fullTeam ?? team;
  }

  async getById(id: string) {
    const { data, error } = await this.supabase.client
      .from('teams')
      .select('*, team_members(user_id, role), team_invitations(user_id)')
      .eq('id', id)
      .single();

    if (error) throw new NotFoundException('Team not found');
    return data;
  }

  async invite(teamId: string, userId: string) {
    const { error } = await this.supabase.client
      .from('team_invitations')
      .insert({ team_id: teamId, user_id: userId });

    if (error) throw new InternalServerErrorException(error.message);

    const { data: team } = await this.supabase.client
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single();

    await this.supabase.client.from('notifications').insert({
      user_id: userId,
      type: 'invitation',
      message: `คุณได้รับคำเชิญเข้าร่วมทีม ${team?.name ?? ''}`,
      meta: { teamId },
    });

    return { message: 'Invitation sent' };
  }

  async acceptInvite(teamId: string, userId: string) {
    await this.supabase.client
      .from('team_invitations')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    const { error } = await this.supabase.client
      .from('team_members')
      .insert({ team_id: teamId, user_id: userId, role: 'member' });

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Invitation accepted' };
  }

  async rejectInvite(teamId: string, userId: string) {
    const { error } = await this.supabase.client
      .from('team_invitations')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Invitation rejected' };
  }

  async updateMemberRole(teamId: string, memberId: string, role: string) {
    const { error } = await this.supabase.client
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', memberId);

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Role updated' };
  }

  async removeMember(teamId: string, memberId: string) {
    const { error } = await this.supabase.client
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', memberId);

    if (error) throw new InternalServerErrorException(error.message);
  }

  async inviteByEmail(teamId: string, email: string) {
    const { data: authData, error: authError } = await this.supabase.client.auth.admin.listUsers();
    if (authError) throw new InternalServerErrorException(authError.message);

    const authUser = (authData?.users ?? []).find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (!authUser) throw new NotFoundException('No user found with that email');

    return this.invite(teamId, authUser.id);
  }

  async createInviteLink(teamId: string, requesterId: string) {
    const { data, error } = await this.supabase.client
      .from('invite_links')
      .insert({ type: 'team', target_id: teamId, created_by: requesterId })
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
      .eq('type', 'team')
      .single();

    if (error || !link) throw new NotFoundException('Invalid or expired invite link');

    // Auto-add as member (skip invitation step)
    const { error: memberError } = await this.supabase.client
      .from('team_members')
      .insert({ team_id: link.target_id, user_id: userId, role: 'member' });

    if (memberError && !memberError.message.includes('duplicate')) {
      throw new InternalServerErrorException(memberError.message);
    }

    return { teamId: link.target_id };
  }

  async setDisplayName(teamId: string, userId: string, displayName?: string) {
    await this.supabase.client
      .from('team_display_names')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (displayName) {
      await this.supabase.client.from('team_display_names').insert({
        team_id: teamId,
        user_id: userId,
        display_name: displayName,
      });
    }

    return { message: 'Display name updated' };
  }
}
