import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PredictionEngineService } from '../../prediction-engine/prediction-engine.service';
import { toFootballCompetitionDto } from '../competition-dto';
import { loadOfficialStandings, strengthFromStanding, toStandingsPayload } from '../generic/standings';
import { DESK_RECENT_LIMIT, DESK_UPCOMING_LIMIT, matchSearchWhere } from '../match-agenda.query';

@Injectable()
export class FootballService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly predictions: PredictionEngineService,
  ) {}

  async overview() {
    const sport = await this.prisma.sport.findUnique({ where: { slug: 'football' } });
    const [competitions, teams, matches] = await Promise.all([
      this.prisma.competition.count({ where: { sportId: sport?.id } }),
      this.prisma.team.count({ where: { sportId: sport?.id } }),
      this.prisma.match.count({ where: { sportId: sport?.id } }),
    ]);
    return {
      sport: sport ?? { slug: 'football', name: 'Calcio', isActive: true },
      counts: { competitions, teams, matches },
      note: 'Nessun risultato sportivo inventato. I dati arrivano dai provider dopo la sincronizzazione.',
    };
  }

  async matches(competitionId?: string, includeEstimates = false, q?: string) {
    const include = { homeTeam: true, awayTeam: true, competition: true, sport: true } as const;
    const now = new Date();
    const where = {
      sport: { slug: 'football' },
      ...(competitionId ? { competitionId } : {}),
      ...matchSearchWhere(q),
    };
    const [upcoming, recent] = await Promise.all([
      this.prisma.match.findMany({
        where: { ...where, kickoff: { gte: now } },
        include,
        orderBy: { kickoff: 'asc' },
        take: DESK_UPCOMING_LIMIT,
      }),
      this.prisma.match.findMany({
        where: { ...where, kickoff: { lt: now } },
        include,
        orderBy: { kickoff: 'desc' },
        take: DESK_RECENT_LIMIT,
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
    return this.prisma.match.findUnique({
      where: { id },
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
      where: { sport: { slug: 'football' } },
      orderBy: { name: 'asc' },
    });
  }

  async competitions() {
    const rows = await this.prisma.competition.findMany({
      where: { sport: { slug: 'football' } },
      include: { seasons: true, leagues: true },
      orderBy: [{ country: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => ({ ...row, ...toFootballCompetitionDto(row) }));
  }

  standings(competitionId?: string) {
    return loadOfficialStandings(this.prisma, 'football', competitionId);
  }

  async standingsView(competitionId?: string) {
    const items = await this.standings(competitionId);
    return toStandingsPayload('football', competitionId, items);
  }

  private async estimatesFor(matches: Array<{ id: string; homeTeamId: string; awayTeamId: string; seasonId: string | null }>) {
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
      const homeStrength = strengthFromStanding('football', home);
      const awayStrength = strengthFromStanding('football', away);
      if (homeStrength == null || awayStrength == null) continue;
      result.set(match.id, this.predictions.estimate({ homeStrength, awayStrength }));
    }
    return result;
  }

  private withEstimate<T extends { id: string }>(match: T, estimate?: ReturnType<PredictionEngineService['estimate']>) {
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
