import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AiEngineService } from './ai-engine.service';
import { SchedulerTokenGuard } from './scheduler.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { PlanGuard } from '../common/guards/plan.guard';
import { RequiresPlan } from '../common/decorators/requires-plan.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppPlan } from '../common/enums/roles.enum';
import { hasMinPlan } from '../subscriptions/plan-limits';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.constants';
import { requestMeta } from '../audit/request-meta';
import type { Request } from 'express';

class AnalyzeDto {
  @IsOptional()
  @IsString()
  matchId?: string;

  @IsOptional()
  @IsString()
  eventId?: string;

  @IsOptional()
  @IsString()
  sport?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

@ApiTags('ai')
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(
    private readonly ai: AiEngineService,
    private readonly audit: AuditService,
  ) {}

  @Get('status')
  status() {
    return this.ai.status();
  }

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('reports')
  reports(@CurrentUser() user?: { plan?: string }) {
    if (!hasMinPlan(user?.plan, AppPlan.PRO)) {
      return {
        layer: 'AI_ANALYSIS',
        locked: true,
        requiredPlan: 'PRO',
        count: 0,
        items: [],
        disclaimer: 'I report ANALISI AI sono riservati al piano Pro. 18+. Nessuna vincita promessa.',
      };
    }
    return this.ai.listReports();
  }

  @Get('archive')
  archive() {
    return this.ai.listArchive();
  }

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('matches/:id')
  matchLayers(@Param('id') id: string, @CurrentUser() user?: { plan?: string }) {
    return this.ai.layers(id, user?.plan ?? 'FREE');
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequiresPlan('PRO')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('analyze')
  async analyze(
    @Body() dto: AnalyzeDto,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
  ) {
    const result = await this.ai.analyzeRequest({
      matchId: dto.matchId,
      eventId: dto.eventId,
      sport: dto.sport,
      context: dto.context,
      force: dto.force,
    });
    await this.audit.record({
      action: AuditAction.FEATURE_AI_ANALYZE,
      userId: user.id,
      actorId: user.id,
      metadata: { matchId: dto.matchId, eventId: dto.eventId, sport: dto.sport },
      ...requestMeta(req),
    });
    return result;
  }

  @Post('jobs/run')
  @UseGuards(SchedulerTokenGuard)
  runJob() {
    return this.ai.generateDueReports({ limit: 8 });
  }
}
