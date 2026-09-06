import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PredictionEngineService } from '../../prediction-engine/prediction-engine.service';
import { EMPTY_SPORTS, findWiredSport } from '../../data-providers/thesportsdb/wired-sports';
import { findSport } from '../sport-catalog';
import { toCompetitionDto, toFootballCompetitionDto } from '../competition-dto';
import { loadOfficialStandings, strengthFromStanding, toStandingsPayload } from './standings';

@Injectable()
export class SportDeskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly predictions: PredictionEngineService,
  ) {}

  async overview(slug: string) {
    const catalog = findSport(slug);
    const sport = await this.prisma.sport.findUnique({ where: { slug } });
    const sportId = sport?.id;
    const [competitions, teams, matches] = sportId
      ? await Promise.all([
          this.prisma.competition.count({ where: { sportId } }),
          this.prisma.team.count({ where: { sportId } }),
          this.prisma.match.count({ where: { sportId } }),
        ])
      : [0, 0, 0];

    const empty = EMPTY_SPORTS.find((item) => item.slug === slug);
    const wired = findWiredSport(slug);
    const synced = catalog?.status === 'synced' || Boolean(wired) || slug === 'basketball' || slug === 'football';

    return {
      sport: sport ?? { slug, name: catalog?.name ?? slug, isActive: false },
      catalog: catalog ?? null,
      counts: { competitions, teams, matches },
      competitions: [] as unknown[],
      events: [] as unknown[],
      note: empty
        ? empty.reason
        : synced
          ? 'Nessun risultato sportivo inventato. I dati arrivano dai provider dopo la sincronizzazione.'
          : 'Sport predisposto. Nessun risultato, quota o classifica viene inventato in attesa di un provider ufficiale.',
    };
  }

  async competitions(slug: string) {
    const rows = await this.prisma.competition.findMany({
      where: { sport: { slug } },
      include: { seasons: true, leagues: true },
      orderBy: [{ country: 'asc' }, { name: 'asc' }],
    });
    return rows.map((row) => ({
      ...row,
      ...(slug === 'football' ? toFootballCompetitionDto(row) : toCompetitionDto(row)),
    }));
  }

  async events(slug: string) {
    return this.agenda(slug);
  }

  async matches(slug: string, competitionId?: string, includeEstimates = false) {
    const include = { homeTeam: true, awayTeam: true, competition: true, sport: true } as const;
    const now = new Date();
    const where = {
      sport: { slug },
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
      ? await this.estimatesFor([...recent, ...upcoming], slug)
      : new Map<string, ReturnType<PredictionEngineService['estimate']>>();
    return {
      recent: recent.map((match) => this.withEstimate(match, estimates.get(match.id))),
      upcoming: upcoming.map((match) => this.withEstimate(match, estimates.get(match.id))),
      access: { probabilities: includeEstimates },
    };
  }

  matchById(slug: string, id: string) {
    return this.prisma.match.findFirst({
      where: { id, sport: { slug } },
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

  teams(slug: string) {
    return this.prisma.team.findMany({
      where: { sport: { slug } },
      orderBy: { name: 'asc' },
    });
  }

  standings(slug: string, competitionId?: string) {
    return loadOfficialStandings(this.prisma, slug, competitionId);
  }

  async standingsView(slug: string, competitionId?: string) {
    const items = await this.standings(slug, competitionId);
    return toStandingsPayload(slug, competitionId, items);
  }

  private agenda(slug: string) {
    return this.matches(slug);
  }

  private async estimatesFor(
    matches: Array<{ id: string; homeTeamId: string; awayTeamId: string; seasonId: string | null }>,
    slug: string,
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
      const homeStrength = strengthFromStanding(slug, home);
      const awayStrength = strengthFromStanding(slug, away);
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
