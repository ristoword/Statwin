import { Injectable, Logger } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FootballDataProvider } from '../../data-providers/interfaces/sports-data-provider';
import { ExternalCompetition } from '../../data-providers/interfaces/external-football';
import { TheSportsDbSportFactory } from '../../data-providers/thesportsdb/thesportsdb-sport.provider';
import { EMPTY_SPORTS, findWiredSport } from '../../data-providers/thesportsdb/wired-sports';
import { findSport } from '../sport-catalog';

export type SportSyncResult = {
  sport: string;
  provider: string;
  source: string;
  note: string;
  imported: {
    competitions: number;
    teams: number;
    matches: number;
    standings: number;
  };
  error?: string;
};

@Injectable()
export class SportSyncService {
  private readonly logger = new Logger(SportSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly factory: TheSportsDbSportFactory,
  ) {}

  async syncSport(slug: string): Promise<SportSyncResult> {
    const empty = EMPTY_SPORTS.find((item) => item.slug === slug);
    if (empty) {
      return {
        sport: slug,
        provider: 'none',
        source: 'none',
        note: empty.reason,
        imported: { competitions: 0, teams: 0, matches: 0, standings: 0 },
      };
    }

    const spec = findWiredSport(slug);
    const catalog = findSport(slug);
    const provider = this.factory.create(slug);
    if (!spec || !provider) {
      return {
        sport: slug,
        provider: 'none',
        source: 'none',
        note: 'Nessun provider legale collegato per questo sport. Archivio vuoto.',
        imported: { competitions: 0, teams: 0, matches: 0, standings: 0 },
      };
    }

    try {
      return await this.syncWith(slug, catalog?.name ?? spec.name, provider);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sync ${slug} failed: ${message}`);
      return {
        sport: slug,
        provider: provider.slug,
        source: provider.slug,
        note: message.includes('429')
          ? 'TheSportsDB ha risposto 429 (rate limit). Riprova più tardi. Nessun risultato inventato.'
          : `Sync interrotto: ${message}. Nessun risultato inventato.`,
        imported: { competitions: 0, teams: 0, matches: 0, standings: 0 },
        error: message,
      };
    }
  }

  async syncWith(slug: string, name: string, provider: FootballDataProvider): Promise<SportSyncResult> {
    const ping = await provider.ping();
    if (!ping.ok) {
      throw new Error(`Provider ${provider.slug} non raggiungibile`);
    }

    const sport = await this.prisma.sport.upsert({
      where: { slug },
      update: { isActive: true, name },
      create: { slug, name, isActive: true },
    });

    const competitions = await provider.fetchCompetitions();
    let teams = 0;
    let matches = 0;
    let standings = 0;

    for (const competition of competitions) {
      try {
        const persisted = await this.upsertCompetition(sport.id, competition);
        teams += await this.upsertTeams(sport.id, competition, provider);
        matches += await this.upsertMatches(sport.id, persisted.competitionId, persisted.seasonId, competition, provider);
        standings += await this.upsertStandings(persisted.seasonId, competition, provider);
      } catch (error) {
        this.logger.error(`Skip ${slug}/${competition.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.logger.log(
      `Sync ${provider.slug}: competitions=${competitions.length} teams=${teams} matches=${matches} standings=${standings}`,
    );

    return {
      sport: slug,
      provider: provider.slug,
      source: provider.slug,
      note: 'Solo dati restituiti dal provider. Nessun risultato inventato.',
      imported: {
        competitions: competitions.length,
        teams,
        matches,
        standings,
      },
    };
  }

  private async upsertCompetition(sportId: string, incoming: ExternalCompetition) {
    const competition = await this.prisma.competition.upsert({
      where: { sportId_name: { sportId, name: incoming.name } },
      update: {
        country: incoming.country,
        type: incoming.type ?? 'LEAGUE',
        externalId: incoming.externalId,
        isActive: true,
      },
      create: {
        sportId,
        name: incoming.name,
        country: incoming.country,
        type: incoming.type ?? 'LEAGUE',
        externalId: incoming.externalId,
        isActive: true,
      },
    });

    const league = await this.prisma.league.findFirst({
      where: { competitionId: competition.id, name: incoming.name },
    });
    if (!league) {
      await this.prisma.league.create({
        data: {
          competitionId: competition.id,
          name: incoming.name,
          country: incoming.country,
          externalId: incoming.externalId,
        },
      });
    }

    await this.prisma.season.updateMany({
      where: { competitionId: competition.id, isCurrent: true, NOT: { name: incoming.seasonName } },
      data: { isCurrent: false },
    });

    const season = await this.prisma.season.upsert({
      where: { competitionId_name: { competitionId: competition.id, name: incoming.seasonName } },
      update: { isCurrent: true },
      create: {
        competitionId: competition.id,
        name: incoming.seasonName,
        isCurrent: true,
      },
    });

    return { competitionId: competition.id, seasonId: season.id };
  }

  private async upsertTeams(sportId: string, competition: ExternalCompetition, provider: FootballDataProvider) {
    const incoming = await provider.fetchTeams(competition);
    for (const team of incoming) {
      await this.prisma.team.upsert({
        where: { externalId: team.externalId },
        update: {
          name: team.name,
          shortName: team.shortName,
          logo: team.logo,
          country: team.country,
        },
        create: {
          sportId,
          externalId: team.externalId,
          name: team.name,
          shortName: team.shortName,
          logo: team.logo,
          country: team.country,
        },
      });
    }
    return incoming.length;
  }

  private async upsertMatches(
    sportId: string,
    competitionId: string,
    seasonId: string,
    competition: ExternalCompetition,
    provider: FootballDataProvider,
  ) {
    const incoming = await provider.fetchMatches(competition);
    const teams = await this.prisma.team.findMany({
      where: { sportId, externalId: { not: null } },
      select: { id: true, externalId: true },
    });
    const teamByExternal = new Map(teams.map((team) => [team.externalId, team.id]));

    for (const match of incoming) {
      const homeTeamId = await this.ensureTeam(
        sportId,
        match.homeTeamExternalId,
        match.homeTeamName,
        competition.country,
        teamByExternal,
      );
      const awayTeamId = await this.ensureTeam(
        sportId,
        match.awayTeamExternalId,
        match.awayTeamName,
        competition.country,
        teamByExternal,
      );
      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`Skip match ${match.externalId}: partecipante mancante`);
        continue;
      }

      await this.prisma.match.upsert({
        where: { externalId: match.externalId },
        update: {
          competitionId,
          seasonId,
          homeTeamId,
          awayTeamId,
          kickoff: match.kickoff,
          status: match.status,
          venue: match.venue,
          homeScore: match.status === MatchStatus.FINISHED ? match.homeScore : null,
          awayScore: match.status === MatchStatus.FINISHED ? match.awayScore : null,
        },
        create: {
          sportId,
          competitionId,
          seasonId,
          homeTeamId,
          awayTeamId,
          externalId: match.externalId,
          kickoff: match.kickoff,
          status: match.status,
          venue: match.venue,
          homeScore: match.status === MatchStatus.FINISHED ? match.homeScore : null,
          awayScore: match.status === MatchStatus.FINISHED ? match.awayScore : null,
        },
      });
    }

    return incoming.length;
  }

  private async ensureTeam(
    sportId: string,
    externalId: string,
    name: string | undefined,
    country: string | undefined,
    cache: Map<string | null, string>,
  ): Promise<string | undefined> {
    const existing = cache.get(externalId);
    if (existing) return existing;
    if (!name) return undefined;
    const team = await this.prisma.team.upsert({
      where: { externalId },
      update: { name },
      create: { sportId, externalId, name, country },
    });
    cache.set(externalId, team.id);
    return team.id;
  }

  private async upsertStandings(
    seasonId: string,
    competition: ExternalCompetition,
    provider: FootballDataProvider,
  ) {
    if (!provider.fetchStandings) {
      return 0;
    }
    const rows = await provider.fetchStandings(competition);
    for (const row of rows) {
      const team = await this.prisma.team.findUnique({ where: { externalId: row.teamExternalId } });
      if (!team) continue;
      await this.prisma.standing.upsert({
        where: { seasonId_teamId: { seasonId, teamId: team.id } },
        update: {
          position: row.position,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          points: row.points,
        },
        create: {
          seasonId,
          teamId: team.id,
          position: row.position,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          points: row.points,
        },
      });
    }
    return rows.length;
  }
}
