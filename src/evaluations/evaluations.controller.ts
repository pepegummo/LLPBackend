import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../common/current-user.decorator';
import { EvaluationsService } from './evaluations.service';

@Controller()
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get('teams/:teamId/evaluations')
  getByTeam(@Param('teamId') teamId: string) {
    return this.evaluationsService.getByTeam(teamId);
  }

  @Get('teams/:teamId/evaluations/my')
  getMine(@Param('teamId') teamId: string, @CurrentUser() userId: string) {
    return this.evaluationsService.getMineByTeam(teamId, userId);
  }

  @Post('evaluations')
  @HttpCode(HttpStatus.CREATED)
  upsert(
    @CurrentUser() userId: string,
    @Body()
    body: {
      teamId: string;
      evaluateeId: string;
      score: number;
      criteriaScores?: Record<string, number>;
      comment?: string;
    },
  ) {
    return this.evaluationsService.upsert(userId, body);
  }

  @Get('teams/:teamId/rubric')
  getRubric(@Param('teamId') teamId: string) {
    return this.evaluationsService.getRubric(teamId);
  }

  @Put('teams/:teamId/rubric')
  upsertRubric(
    @Param('teamId') teamId: string,
    @Body()
    body: {
      contribution?: number;
      qualityOfWork?: number;
      responsibility?: number;
      communication?: number;
      teamwork?: number;
      effort?: number;
    },
  ) {
    return this.evaluationsService.upsertRubric(teamId, body);
  }
}
