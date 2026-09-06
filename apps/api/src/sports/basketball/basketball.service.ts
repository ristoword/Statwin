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
    const include = { homeTeam: true, awayTeam: true, competition: true, sport: true } as const;
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
      access: { probabilities: includeEstimates },
    };
  }

  matchById(id: string) {
    return this.prisma.match.findFirst({
      where: { id, sport: { slug: 'basketball' } },
      include: {
        sport: true,
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
    return this.desk.standings('basketball', competitionId);
  }

  standingsView(competitionId?: string) {
    return this.desk.standingsView('basketball', competitionId);
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
      if (!home || !away) continue;
      const homeStrength = home.played ? home.won / home.played : null;
      const awayStrength = away.played ? away.won / away.played : null;
      if (homeStrength == null || awayStrength == null) continue;
      result.set(match.id, this.predictions.estimate({ homeStrength, awayStrength }));
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
