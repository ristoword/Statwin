import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchStatus } from '@prisma/client';
import { FootballDataProvider } from '../interfaces/sports-data-provider';
import {
  ExternalCompetition,
  ExternalMatch,
  ExternalStanding,
  ExternalTeam,
} from '../interfaces/external-football';
import { findWiredSport, type WiredSportSpec } from './wired-sports';
import {
  lookupTsdTable,
  mapTsdTableRow,
  num,
  slugify,
  TheSportsDbClient,
  tsdSeasonCandidates,
  type TsdEvent,
  type TsdLeague,
  type TsdTeam,
} from './tsd-client';

@Injectable()
export class TheSportsDbSportFactory {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly leagues: Record<string, string>;
  private readonly seasons: Record<string, string>;

  constructor(config: ConfigService) {
    this.baseUrl = (config.get<string>('sportsSync.theSportsDbBaseUrl') ?? 'https://www.thesportsdb.com/api/v1/json').replace(
      /\/$/,
      '',
    );
    this.apiKey = config.get<string>('sportsSync.theSportsDbKey') ?? '3';
    this.leagues = config.get<Record<string, string>>('sportsSync.leagues') ?? {};
    this.seasons = config.get<Record<string, string>>('sportsSync.seasons') ?? {};
  }

  create(slug: string): FootballDataProvider | null {
    const spec = findWiredSport(slug);
    if (!spec) return null;
    const leagueIds = (this.leagues[slug] ?? spec.defaultLeagues)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const season = this.seasons[slug] ?? spec.defaultSeason;
    return new TheSportsDbSportProvider(spec, leagueIds, season, new TheSportsDbClient(this.baseUrl, this.apiKey, spec.prefix));
  }
}

export class TheSportsDbSportProvider implements FootballDataProvider {
  readonly slug: string;
  private readonly leagueCache = new Map<string, TsdLeague | null>();

  constructor(
    private readonly spec: WiredSportSpec,
    private readonly leagueIds: string[],
    private readonly configuredSeason: string,
    private readonly client: TheSportsDbClient,
  ) {
    this.slug = `thesportsdb-${spec.slug}`;
  }

  async ping() {
    const res = await this.client.ping(this.spec.pingLeagueId);
    return { ok: res.ok, provider: this.slug };
  }

  async fetchCompetitions(): Promise<ExternalCompetition[]> {
    const competitions: ExternalCompetition[] = [];
    for (const id of this.leagueIds) {
      const league = await this.leagueInfo(id);
      if (!league?.strLeague) {
        continue;
      }
      const seasonName = this.configuredSeason || league.strCurrentSeason || this.spec.defaultSeason;
      const year = Number(String(seasonName).slice(0, 4));
      competitions.push({
        externalId: `${this.spec.prefix}:${id}`,
        name: league.strLeague,
        country: league.strCountry?.trim() || undefined,
        type: 'LEAGUE',
        shortcut: id,
        seasonYear: Number.isFinite(year) ? year : new Date().getUTCFullYear(),
        seasonName,
      });
    }
    return competitions;
  }

  async fetchTeams(competition: ExternalCompetition): Promise<ExternalTeam[]> {
    const payload = await this.client.getJson<{ teams?: TsdTeam[] }>(`/lookup_all_teams.php?id=${competition.shortcut}`);
    const teams = payload.teams ?? [];
    if (teams.length) {
      return teams.map((team) => this.mapTeam(team, competition.country));
    }

    const eventsPayload = await this.client.getJson<{ events?: TsdEvent[] }>(
      `/eventsseason.php?id=${competition.shortcut}&s=${encodeURIComponent(competition.seasonName)}`,
    );
    const unique = new Map<string, ExternalTeam>();
    for (const event of eventsPayload.events ?? []) {
      this.collectEventTeam(unique, event.idHomeTeam, event.strHomeTeam, competition);
      this.collectEventTeam(unique, event.idAwayTeam, event.strAwayTeam, competition);
      if (!event.strHomeTeam && !event.strAwayTeam && event.strEvent) {
        const eventId = `${this.spec.prefix}:event:${slugify(event.strEvent)}`;
        unique.set(eventId, {
          externalId: eventId,
          name: event.strEvent,
          country: competition.country,
        });
      }
    }
    return [...unique.values()];
  }

  async fetchMatches(competition: ExternalCompetition): Promise<ExternalMatch[]> {
    const payload = await this.client.getJson<{ events?: TsdEvent[] }>(
      `/eventsseason.php?id=${competition.shortcut}&s=${encodeURIComponent(competition.seasonName)}`,
    );
    return (payload.events ?? [])
      .map((event) => this.mapMatch(event, competition))
      .filter((match): match is ExternalMatch => Boolean(match));
  }

  async fetchStandings(competition: ExternalCompetition): Promise<ExternalStanding[]> {
    const league = await this.leagueInfo(competition.shortcut);
    const seasons = tsdSeasonCandidates(competition.seasonName, this.configuredSeason, league?.strCurrentSeason);
    const rows = await lookupTsdTable(this.client, competition.shortcut, seasons);
    return rows.map((row, index) => mapTsdTableRow(row, this.spec.prefix, index));
  }

  private async leagueInfo(id: string): Promise<TsdLeague | null> {
    if (this.leagueCache.has(id)) {
      return this.leagueCache.get(id) ?? null;
    }
    const league = await this.client.lookupLeague(id);
    this.leagueCache.set(id, league);
    return league;
  }

  private collectEventTeam(
    unique: Map<string, ExternalTeam>,
    id: string | undefined,
    name: string | undefined,
    competition: ExternalCompetition,
  ) {
    if (id && name) {
      unique.set(`${this.spec.prefix}:team:${id}`, {
        externalId: `${this.spec.prefix}:team:${id}`,
        name,
        country: competition.country,
      });
      return;
    }
    if (name) {
      const externalId = `${this.spec.prefix}:team-name:${slugify(name)}`;
      unique.set(externalId, { externalId, name, country: competition.country });
    }
  }

  private mapTeam(team: TsdTeam, country?: string): ExternalTeam {
    return {
      externalId: `${this.spec.prefix}:team:${team.idTeam}`,
      name: team.strTeam,
      shortName: team.strTeamShort || undefined,
      logo: team.strTeamBadge || undefined,
      country: team.strCountry || country,
    };
  }

  private mapMatch(event: TsdEvent, competition: ExternalCompetition): ExternalMatch | null {
    const homeName = event.strHomeTeam || event.strEvent || event.strEventAlternate;
    const awayName = event.strAwayTeam || (event.strHomeTeam ? event.strEvent : competition.name);
    if (!homeName || !awayName) {
      return null;
    }

    const homeScore =
      event.intHomeScore === null || event.intHomeScore === undefined || event.intHomeScore === ''
        ? null
        : num(event.intHomeScore);
    const awayScore =
      event.intAwayScore === null || event.intAwayScore === undefined || event.intAwayScore === ''
        ? null
        : num(event.intAwayScore);
    const statusText = (event.strStatus ?? '').toLowerCase();
    const finished =
      (statusText.includes('finish') || statusText === 'ft' || statusText === 'match finished') &&
      homeScore !== null &&
      awayScore !== null;
    const live = statusText.includes('live') || statusText === 'in play';

    return {
      externalId: `${this.spec.prefix}:match:${event.idEvent}`,
      competitionExternalId: competition.externalId,
      seasonName: competition.seasonName,
      homeTeamExternalId: event.idHomeTeam
        ? `${this.spec.prefix}:team:${event.idHomeTeam}`
        : `${this.spec.prefix}:team-name:${slugify(homeName)}`,
      awayTeamExternalId: event.idAwayTeam
        ? `${this.spec.prefix}:team:${event.idAwayTeam}`
        : `${this.spec.prefix}:team-name:${slugify(awayName)}`,
      homeTeamName: homeName,
      awayTeamName: awayName,
      kickoff: this.parseKickoff(event),
      status: finished ? MatchStatus.FINISHED : live ? MatchStatus.LIVE : MatchStatus.SCHEDULED,
      homeScore: finished ? homeScore : null,
      awayScore: finished ? awayScore : null,
      venue: event.strVenue || undefined,
      events: [],
    };
  }

  private parseKickoff(event: TsdEvent): Date {
    if (event.strTimestamp) {
      const parsed = new Date(event.strTimestamp);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    const time = event.strTime && event.strTime !== '00:00:00' ? event.strTime : '00:00:00';
    const parsed = new Date(`${event.dateEvent ?? ''}T${time}Z`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
}
