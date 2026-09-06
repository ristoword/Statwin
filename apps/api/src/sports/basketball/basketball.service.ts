import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PredictionEngineService } from '../../prediction-engine/prediction-engine.service';
import { SportDeskService } from '../generic/sport-desk.service';

@Injectable()
export class BasketballService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly predictions: PredictionEngineService,
    private readonly desk: SportDeskService,
  ) {}

  overview() {
    return this.desk.overview('basketball');
  }

  competitions() {
    return this.desk.competitions('basketball');
  }

  events() {
    return this.desk.events('basketball');
  }

  async matches(competitionId?: string, includeEstimates = false) {
    const include = { homeTeam: true, awayTeam: true, competition: true } as const;
    const now = new Date();
    const where = {
      sport: { slug: 'basketball' },
      ...(competitionId ? { competitionId } : {}),
    };
    const [upcoming, recent] = await Promise.all([
      this.prisma.match.findMany({
        where: { ...where, kickoff: { gte: now } },
        include,
        orderBy: { kickoff: 'asc' },
        take: 20,
      }),
      this.prisma.match.findMany({
        where: { ...where, kickoff: { lt: now } },
        include,
        orderBy: { kickoff: 'desc' },
        take: 20,
      }),
    ]);
    const estimates = includeEstimates
      ? await this.estimatesFor([...recent, ...upcoming])
      : new Map<string, ReturnType<PredictionEngineService['estimate']>>();
    return {
      recent: recent.map((match) => this.withEstimate(match, estimates.get(match.id))),
      upcoming: upcoming.map((match) => this.withEstimate(match, estimates.get(match.id))),
    };
  }

  matchById(id: string) {
    return this.prisma.match.findFirst({
      where: { id, sport: { slug: 'basketball' } },
      include: {
        homeTeam: true,
        awayTeam: true,
        competition: true,
        season: true,
        events: true,
        lineups: { include: { player: true, team: true } },
        odds: { include: { bookmaker: true, market: true } },
        predictions: true,
        aiReports: true,
      },
    });
  }

  teams() {
    return this.prisma.team.findMany({
      where: { sport: { slug: 'basketball' } },
      orderBy: { name: 'asc' },
    });
  }

  standings(competitionId?: string) {
    return this.prisma.standing.findMany({
      where: {
        season: {
          isCurrent: true,
          competition: {
            sport: { slug: 'basketball' },
            ...(competitionId ? { id: competitionId } : {}),
          },
        },
      },
      include: { team: true, season: { include: { competition: true } } },
      orderBy: { position: 'asc' },
    });
  }

  private async estimatesFor(
    matches: Array<{ id: string; homeTeamId: string; awayTeamId: string; seasonId: string | null }>,
  ) {
    const result = new Map<string, ReturnType<PredictionEngineService['estimate']>>();
    const seasonIds = [...new Set(matches.map((item) => item.seasonId).filter((id): id is string => Boolean(id)))];
    if (seasonIds.length === 0) return result;
    const standings = await this.prisma.standing.findMany({
      where: { seasonId: { in: seasonIds } },
    });
    const byKey = new Map(standings.map((row) => [`${row.seasonId}:${row.teamId}`, row]));
    for (const match of matches) {
      if (!match.seasonId) continue;
      const home = byKey.get(`${match.seasonId}:${match.homeTeamId}`);
      const away = byKey.get(`${match.seasonId}:${match.awayTeamId}`);
      if (!home || !away || home.played === 0 || away.played === 0) continue;
      result.set(
        match.id,
        this.predictions.estimate({
          homeStrength: home.points / (home.played * 3),
          awayStrength: away.points / (away.played * 3),
        }),
      );
    }
    return result;
  }

  private withEstimate<T extends { id: string }>(
    match: T,
    estimate?: ReturnType<PredictionEngineService['estimate']>,
  ) {
    return {
      ...match,
      estimate: estimate
        ? {
            layer: 'PROBABILITY',
            predictedScore: estimate.predictedScore,
            outcomes: estimate.outcomes,
            overUnder: estimate.overUnder,
            btts: estimate.btts,
            impliedOddsDisclaimer: estimate.impliedOddsDisclaimer,
          }
        : null,
    };
  }
}
