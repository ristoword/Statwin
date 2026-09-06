import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { PrismaService } from '../database/prisma/prisma.service';
import { PredictionEngineService } from './prediction-engine.service';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PlanGuard } from '../common/guards/plan.guard';
import { RequiresPlan } from '../common/decorators/requires-plan.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AppPlan } from '../common/enums/roles.enum';
import { hasMinPlan } from '../subscriptions/plan-limits';

class EstimateDto {
  @IsNumber()
  homeStrength!: number;

  @IsNumber()
  awayStrength!: number;
}

@ApiTags('predictions')
@Controller({ path: 'predictions', version: '1' })
export class PredictionsController {
  constructor(
    private readonly engine: PredictionEngineService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  async list(@CurrentUser() user?: { plan?: string }) {
    const matches = await this.prisma.match.findMany({
      where: { sport: { slug: 'football' } },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        season: true,
        predictions: true,
        aiReports: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { kickoff: 'desc' },
      take: 30,
    });

    const items = await Promise.all(
      matches.map(async (match) => {
        const canProb = hasMinPlan(user?.plan, AppPlan.PREMIUM);
        const canAi = hasMinPlan(user?.plan, AppPlan.PRO);
        const stored = match.predictions.map((item) => ({
          market: item.market,
          selection: item.selection,
          probability: item.probability,
          disclaimer: item.disclaimer,
        }));
        const computed = canProb
          ? await this.estimateFromStandings(match.homeTeamId, match.awayTeamId, match.seasonId)
          : null;
        const report = canAi ? match.aiReports[0] : null;
        const content = report?.content as {
          analysis?: string;
          predictedResult?: { outcome?: string; scoreHome?: number; scoreAway?: number; confidence?: string; rationale?: string } | null;
        } | null;
        return {
          matchId: match.id,
          kickoff: match.kickoff,
          status: match.status,
          competition: match.competition?.name ?? null,
          home: match.homeTeam.name,
          away: match.awayTeam.name,
          probabilities: canProb
            ? stored.length > 0
              ? {
                  layer: 'PROBABILITY',
                  source: 'stored',
                  items: stored,
                  predictedScore: computed?.predictedScore ?? null,
                  overUnder: computed?.overUnder ?? null,
                  btts: computed?.btts ?? null,
                  impliedOddsDisclaimer: computed?.impliedOddsDisclaimer ?? null,
                }
              : computed
            : { layer: 'PROBABILITY', locked: true, requiredPlan: 'PREMIUM' },
          aiCommentary: report
            ? {
                layer: 'AI_ANALYSIS',
                id: report.id,
                excerpt: content?.analysis?.slice(0, 280) ?? null,
                predictedResult: content?.predictedResult ?? null,
                createdAt: report.createdAt,
              }
            : canAi
              ? null
              : { layer: 'AI_ANALYSIS', locked: true, requiredPlan: 'PRO' },
        };
      }),
    );

    const now = Date.now();
    const canProb = hasMinPlan(user?.plan, AppPlan.PREMIUM);
    return {
      layer: 'PROBABILITY',
      locked: !canProb,
      requiredPlan: canProb ? undefined : 'PREMIUM',
      access: {
        plan: user?.plan ?? 'FREE',
        probabilities: canProb,
        ai: hasMinPlan(user?.plan, AppPlan.PRO),
      },
      disclaimer:
        'Stime modellistiche, non certezze. Le quote sono implicite del modello, non di un bookmaker. 18+.',
      items,
      recent: items.filter((item) => new Date(item.kickoff).getTime() < now),
      upcoming: items.filter((item) => new Date(item.kickoff).getTime() >= now),
    };
  }

  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':matchId')
  async one(@Param('matchId') matchId: string, @CurrentUser() user?: { plan?: string }) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        predictions: true,
        aiReports: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!match) {
      throw new NotFoundException('Partita non trovata');
    }
    const canProb = hasMinPlan(user?.plan, AppPlan.PREMIUM);
    const canAi = hasMinPlan(user?.plan, AppPlan.PRO);
    const stored = match.predictions.map((item) => ({
      market: item.market,
      selection: item.selection,
      probability: item.probability,
      disclaimer: item.disclaimer,
    }));
    const computed = canProb
      ? await this.estimateFromStandings(match.homeTeamId, match.awayTeamId, match.seasonId)
      : null;
    const report = canAi ? match.aiReports[0] : null;
    const content = report?.content as {
      analysis?: string;
      favorable?: string[];
      unfavorable?: string[];
      predictedResult?: { outcome?: string; scoreHome?: number; scoreAway?: number; confidence?: string; rationale?: string } | null;
    } | null;
    return {
      layer: 'PROBABILITY',
      locked: !canProb,
      requiredPlan: canProb ? undefined : 'PREMIUM',
      matchId: match.id,
      home: match.homeTeam.name,
      away: match.awayTeam.name,
      competition: match.competition?.name ?? null,
      probabilities: canProb
        ? stored.length > 0
          ? {
              layer: 'PROBABILITY',
              source: 'stored',
              items: stored,
              predictedScore: computed?.predictedScore ?? null,
              overUnder: computed?.overUnder ?? null,
              btts: computed?.btts ?? null,
              impliedOddsDisclaimer: computed?.impliedOddsDisclaimer ?? null,
            }
          : computed
        : { layer: 'PROBABILITY', locked: true, requiredPlan: 'PREMIUM' },
      aiCommentary: report
        ? {
            layer: 'AI_ANALYSIS',
            id: report.id,
            analysis: content?.analysis ?? null,
            favorable: content?.favorable ?? [],
            unfavorable: content?.unfavorable ?? [],
            predictedResult: content?.predictedResult ?? null,
            createdAt: report.createdAt,
          }
        : canAi
          ? null
          : { layer: 'AI_ANALYSIS', locked: true, requiredPlan: 'PRO' },
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequiresPlan('PREMIUM')
  @Post('estimate')
  estimate(@Body() dto: EstimateDto) {
    return {
      layer: 'PROBABILITY',
      ...this.engine.estimate(dto),
    };
  }

  private async estimateFromStandings(homeTeamId: string, awayTeamId: string, seasonId: string | null) {
    if (!seasonId) return null;
    const [home, away] = await Promise.all([
      this.prisma.standing.findUnique({ where: { seasonId_teamId: { seasonId, teamId: homeTeamId } } }),
      this.prisma.standing.findUnique({ where: { seasonId_teamId: { seasonId, teamId: awayTeamId } } }),
    ]);
    if (!home || !away || home.played === 0 || away.played === 0) {
      return null;
    }
    return {
      layer: 'PROBABILITY',
      source: 'model',
      ...this.engine.estimate({
        homeStrength: home.points / (home.played * 3),
        awayStrength: away.points / (away.played * 3),
      }),
    };
  }
}
