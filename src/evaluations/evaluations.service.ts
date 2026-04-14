import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EvaluationsService {
  constructor(private readonly supabase: SupabaseService) {}

  async getByTeam(teamId: string) {
    const { data, error } = await this.supabase.client
      .from('evaluations')
      .select('*')
      .eq('team_id', teamId);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getMineByTeam(teamId: string, userId: string) {
    const { data, error } = await this.supabase.client
      .from('evaluations')
      .select('*')
      .eq('team_id', teamId)
      .eq('evaluator_id', userId);

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async upsert(userId: string, body: {
    teamId: string;
    evaluateeId: string;
    score: number;
    criteriaScores?: {
      contribution?: number;
      qualityOfWork?: number;
      responsibility?: number;
      communication?: number;
      teamwork?: number;
      effort?: number;
    };
    comment?: string;
  }) {
    if (!body.teamId || !body.evaluateeId || !body.score) {
      throw new BadRequestException('teamId, evaluateeId, and score are required');
    }

    const { data, error } = await this.supabase.client
      .from('evaluations')
      .upsert(
        {
          team_id: body.teamId,
          evaluator_id: userId,
          evaluatee_id: body.evaluateeId,
          score: body.score,
          contribution: body.criteriaScores?.contribution ?? null,
          quality_of_work: body.criteriaScores?.qualityOfWork ?? null,
          responsibility: body.criteriaScores?.responsibility ?? null,
          communication: body.criteriaScores?.communication ?? null,
          teamwork: body.criteriaScores?.teamwork ?? null,
          effort: body.criteriaScores?.effort ?? null,
          comment: body.comment,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'team_id,evaluator_id,evaluatee_id' },
      )
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async getRubric(workspaceId: string) {
    const { data, error } = await this.supabase.client
      .from('rubric_weights')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      return {
        enabled: false,
        contribution: 16.67,
        quality_of_work: 16.67,
        responsibility: 16.67,
        communication: 16.67,
        teamwork: 16.67,
        effort: 16.65,
      };
    }
    return data;
  }

  async upsertRubric(workspaceId: string, requesterId: string, body: {
    enabled?: boolean;
    contribution?: number;
    qualityOfWork?: number;
    responsibility?: number;
    communication?: number;
    teamwork?: number;
    effort?: number;
  }) {
    const { data: ws } = await this.supabase.client
      .from('workspaces')
      .select('owner_id')
      .eq('id', workspaceId)
      .single();

    if (!ws) throw new NotFoundException('Workspace not found');
    if (ws.owner_id !== requesterId) {
      throw new ForbiddenException('Only the workspace owner can manage rubric weights');
    }

    const { data, error } = await this.supabase.client
      .from('rubric_weights')
      .upsert(
        {
          workspace_id: workspaceId,
          enabled: body.enabled ?? true,
          contribution: body.contribution,
          quality_of_work: body.qualityOfWork,
          responsibility: body.responsibility,
          communication: body.communication,
          teamwork: body.teamwork,
          effort: body.effort,
        },
        { onConflict: 'workspace_id' },
      )
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
