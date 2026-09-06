import { Inject, Injectable, Logger } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FOOTBALL_DATA_PROVIDER } from '../../data-providers/data-providers.module';
import { FootballDataProvider } from '../../data-providers/interfaces/sports-data-provider';
import { ExternalCompetition } from '../../data-providers/interfaces/external-football';

@Injectable()
export class FootballSyncService {
  private readonly logger = new Logger(FootballSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(FOOTBALL_DATA_PROVIDER) private readonly provider: FootballDataProvider,
  ) {}

  async syncAll() {
    const ping = await this.provider.ping();
    if (!ping.ok) {
      throw new Error(`Provider ${this.provider.slug} non raggiungibile`);
    }

    const sport = await this.prisma.sport.upsert({
      where: { slug: 'football' },
      update: { isActive: true, name: 'Calcio' },
      create: { slug: 'football', name: 'Calcio', isActive: true },
    });

    const competitions = await this.provider.fetchCompetitions();
    let teams = 0;
    let matches = 0;
    let standings = 0;

    for (const competition of competitions) {
      try {
        const persisted = await this.upsertCompetition(sport.id, competition);
        teams += await this.upsertTeams(sport.id, competition);
        matches += await this.upsertMatches(sport.id, persisted.competitionId, persisted.seasonId, competition);
        standings += await this.upsertStandings(persisted.seasonId, competition);
      } catch (error) {
        this.logger.error(
          `Skip ${competition.name}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log(
      `Sync ${this.provider.slug}: competitions=${competitions.length} teams=${teams} matches=${matches} standings=${standings}`,
    );

    return {
      provider: this.provider.slug,
      source: this.provider.slug,
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
      update: { country: incoming.country, type: incoming.type ?? 'LEAGUE', externalId: incoming.externalId, isActive: true },
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

  private async upsertTeams(sportId: string, competition: ExternalCompetition) {
    const incoming = await this.provider.fetchTeams(competition);
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
  ) {
    const incoming = await this.provider.fetchMatches(competition);
    const teams = await this.prisma.team.findMany({
      where: { sportId, externalId: { not: null } },
      select: { id: true, externalId: true },
    });
    const teamByExternal = new Map(teams.map((team) => [team.externalId, team.id]));

    for (const match of incoming) {
      const homeTeamId = teamByExternal.get(match.homeTeamExternalId);
      const awayTeamId = teamByExternal.get(match.awayTeamExternalId);
      if (!homeTeamId || !awayTeamId) {
        this.logger.warn(`Skip match ${match.externalId}: squadra mancante`);
        continue;
      }

      const saved = await this.prisma.match.upsert({
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

      if (match.events.length) {
        await this.prisma.matchEvent.deleteMany({ where: { matchId: saved.id } });
        await this.prisma.matchEvent.createMany({
          data: match.events.map((event) => ({
            matchId: saved.id,
            type: event.type,
            minute: event.minute,
            payload: {
              playerName: event.playerName,
              teamExternalId: event.teamExternalId,
              source: this.provider.slug,
            },
          })),
        });
      }
    }

    return incoming.length;
  }

  private async upsertStandings(seasonId: string, competition: ExternalCompetition) {
    if (!this.provider.fetchStandings) {
      return 0;
    }
    const rows = await this.provider.fetchStandings(competition);
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
