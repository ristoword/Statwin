import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { PrismaService } from '../database/prisma/prisma.service';
import { PredictionEngineService } from './prediction-engine.service';

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

  @Get()
  async list() {
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
        const stored = match.predictions.map((item) => ({
          market: item.market,
          selection: item.selection,
          probability: item.probability,
          disclaimer: item.disclaimer,
        }));
        const computed =
          stored.length === 0 ? await this.estimateFromStandings(match.homeTeamId, match.awayTeamId, match.seasonId) : null;
        const report = match.aiReports[0];
        const content = report?.content as { analysis?: string } | null;
        return {
          matchId: match.id,
          kickoff: match.kickoff,
          status: match.status,
          competition: match.competition?.name ?? null,
          home: match.homeTeam.name,
          away: match.awayTeam.name,
          probabilities: stored.length > 0 ? { layer: 'PROBABILITY', source: 'stored', items: stored } : computed,
          aiCommentary: report
            ? {
                layer: 'AI_ANALYSIS',
                id: report.id,
                excerpt: content?.analysis?.slice(0, 280) ?? null,
                createdAt: report.createdAt,
              }
            : null,
        };
      }),
    );

    return {
      layer: 'PROBABILITY',
      disclaimer: 'Stime modellistiche, non certezze. Non costituiscono consiglio di scommessa. 18+.',
      items,
    };
  }

  @Get(':matchId')
  async one(@Param('matchId') matchId: string) {
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
    const stored = match.predictions.map((item) => ({
      market: item.market,
      selection: item.selection,
      probability: item.probability,
      disclaimer: item.disclaimer,
    }));
    const computed =
      stored.length === 0 ? await this.estimateFromStandings(match.homeTeamId, match.awayTeamId, match.seasonId) : null;
    const report = match.aiReports[0];
    const content = report?.content as { analysis?: string; favorable?: string[]; unfavorable?: string[] } | null;
    return {
      layer: 'PROBABILITY',
      matchId: match.id,
      home: match.homeTeam.name,
      away: match.awayTeam.name,
      competition: match.competition?.name ?? null,
      probabilities: stored.length > 0 ? { layer: 'PROBABILITY', source: 'stored', items: stored } : computed,
      aiCommentary: report
        ? {
            layer: 'AI_ANALYSIS',
            id: report.id,
            analysis: content?.analysis ?? null,
            favorable: content?.favorable ?? [],
            unfavorable: content?.unfavorable ?? [],
            createdAt: report.createdAt,
          }
        : null,
    };
  }

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
