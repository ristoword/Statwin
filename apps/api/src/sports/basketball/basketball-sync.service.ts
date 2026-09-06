import { Inject, Injectable, Logger } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { BASKETBALL_DATA_PROVIDER } from '../../data-providers/data-providers.module';
import { BasketballDataProvider } from '../../data-providers/interfaces/sports-data-provider';
import { ExternalCompetition } from '../../data-providers/interfaces/external-football';
import { leagueShortcutFromExternalId, persistOfficialStandings } from '../generic/standings';

@Injectable()
export class BasketballSyncService {
  private readonly logger = new Logger(BasketballSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(BASKETBALL_DATA_PROVIDER) private readonly provider: BasketballDataProvider,
  ) {}

  async syncAll() {
    const ping = await this.provider.ping();
    if (!ping.ok) {
      throw new Error(`Provider ${this.provider.slug} non raggiungibile`);
    }

    const sport = await this.prisma.sport.upsert({
      where: { slug: 'basketball' },
      update: { isActive: true, name: 'Basket' },
      create: { slug: 'basketball', name: 'Basket', isActive: true },
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
        standings += await this.safeStandings(sport.id, persisted.seasonId, competition);
      } catch (error) {
        this.logger.error(`Skip ${competition.name}: ${error instanceof Error ? error.message : String(error)}`);
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
        this.logger.warn(`Skip match ${match.externalId}: squadra mancante`);
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

  async syncStandings() {
    const sport = await this.prisma.sport.findUnique({
      where: { slug: 'basketball' },
      include: { competitions: { include: { seasons: true, leagues: true } } },
    });
    if (!sport?.competitions.length) {
      return {
        provider: this.provider.slug,
        source: this.provider.slug,
        note: 'Nessuna competizione in archivio. Nessuna classifica inventata.',
        imported: { competitions: 0, teams: 0, matches: 0, standings: 0 },
      };
    }

    let standings = 0;
    for (const competition of sport.competitions) {
      const season = competition.seasons.find((item) => item.isCurrent) ?? competition.seasons[0];
      const shortcut =
        leagueShortcutFromExternalId(competition.externalId) ??
        leagueShortcutFromExternalId(competition.leagues[0]?.externalId);
      if (!season || !shortcut) continue;
      standings += await this.safeStandings(sport.id, season.id, {
        externalId: competition.externalId ?? `tsd-bsk:${shortcut}`,
        name: competition.name,
        country: competition.country ?? undefined,
        type: competition.type,
        shortcut,
        seasonName: season.name,
        seasonYear: Number(String(season.name).slice(0, 4)) || new Date().getUTCFullYear(),
      });
    }

    return {
      provider: this.provider.slug,
      source: this.provider.slug,
      note: 'Solo tabelle restituite dal provider. Nessuna classifica inventata.',
      imported: { competitions: sport.competitions.length, teams: 0, matches: 0, standings },
    };
  }

  private async safeStandings(sportId: string, seasonId: string, competition: ExternalCompetition) {
    try {
      return await this.upsertStandings(sportId, seasonId, competition);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Standings ${competition.name}: ${message}`);
      if (message.includes('429')) {
        await new Promise((resolve) => setTimeout(resolve, 15000));
        try {
          return await this.upsertStandings(sportId, seasonId, competition);
        } catch (retryError) {
          this.logger.error(
            `Standings retry ${competition.name}: ${retryError instanceof Error ? retryError.message : String(retryError)}`,
          );
        }
      }
      return 0;
    }
  }

  private async upsertStandings(sportId: string, seasonId: string, competition: ExternalCompetition) {
    if (!this.provider.fetchStandings) {
      return 0;
    }
    const rows = await this.provider.fetchStandings(competition);
    return persistOfficialStandings(this.prisma, { sportId, seasonId, rows });
  }
}
