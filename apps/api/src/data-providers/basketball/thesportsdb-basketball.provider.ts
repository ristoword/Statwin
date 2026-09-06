import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchStatus } from '@prisma/client';
import { BasketballDataProvider } from '../interfaces/sports-data-provider';
import {
  ExternalCompetition,
  ExternalMatch,
  ExternalStanding,
  ExternalTeam,
} from '../interfaces/external-football';
import { tsdSeasonCandidates } from '../thesportsdb/tsd-client';

type TsdTeam = {
  idTeam: string;
  strTeam: string;
  strTeamShort?: string;
  strTeamBadge?: string;
  strCountry?: string;
};

type TsdEvent = {
  idEvent: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | number | null;
  intAwayScore?: string | number | null;
  dateEvent?: string;
  strTime?: string;
  strTimestamp?: string;
  strStatus?: string;
  strVenue?: string;
};

type TsdTableRow = {
  idTeam: string;
  strTeam?: string;
  intRank?: string | number;
  intPlayed?: string | number;
  intWin?: string | number;
  intWon?: string | number;
  intDraw?: string | number;
  intLoss?: string | number;
  intLost?: string | number;
  intGoalsFor?: string | number;
  intGoalsAgainst?: string | number;
  intPoints?: string | number;
};

const LEAGUES: Record<string, { name: string; country: string }> = {
  '4387': { name: 'NBA', country: 'USA' },
  '4546': { name: 'EuroLeague', country: 'Europe' },
};

@Injectable()
export class TheSportsDbBasketballProvider implements BasketballDataProvider {
  readonly slug = 'thesportsdb-basketball';
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly season: string;
  private readonly leagueIds: string[];

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('basketball.theSportsDbBaseUrl') ?? 'https://www.thesportsdb.com/api/v1/json'
    ).replace(/\/$/, '');
    this.apiKey = config.get<string>('basketball.theSportsDbKey') ?? '3';
    this.season = config.get<string>('basketball.theSportsDbSeason') ?? '2025-2026';
    this.leagueIds = (config.get<string>('basketball.theSportsDbLeagues') ?? '4387,4546')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async ping() {
    const res = await fetch(`${this.baseUrl}/${this.apiKey}/lookupleague.php?id=4387`);
    return { ok: res.ok, provider: this.slug };
  }

  async fetchCompetitions(): Promise<ExternalCompetition[]> {
    const year = Number(this.season.slice(0, 4));
    return this.leagueIds.map((id) => ({
      externalId: `tsd-bsk:${id}`,
      name: LEAGUES[id]?.name ?? `Basket ${id}`,
      country: LEAGUES[id]?.country ?? 'International',
      type: 'LEAGUE',
      shortcut: id,
      seasonYear: year,
      seasonName: this.season,
    }));
  }

  async fetchTeams(competition: ExternalCompetition): Promise<ExternalTeam[]> {
    const payload = await this.getJson<{ teams?: TsdTeam[] }>(`/lookup_all_teams.php?id=${competition.shortcut}`);
    const teams = payload.teams ?? [];
    if (teams.length) {
      return teams.map((team) => this.mapTeam(team, competition.country));
    }

    const eventsPayload = await this.getJson<{ events?: TsdEvent[] }>(
      `/eventsseason.php?id=${competition.shortcut}&s=${encodeURIComponent(this.season)}`,
    );
    const unique = new Map<string, ExternalTeam>();
    for (const event of eventsPayload.events ?? []) {
      if (event.idHomeTeam && event.strHomeTeam) {
        unique.set(`tsd-bsk:team:${event.idHomeTeam}`, {
          externalId: `tsd-bsk:team:${event.idHomeTeam}`,
          name: event.strHomeTeam,
          country: competition.country,
        });
      }
      if (event.idAwayTeam && event.strAwayTeam) {
        unique.set(`tsd-bsk:team:${event.idAwayTeam}`, {
          externalId: `tsd-bsk:team:${event.idAwayTeam}`,
          name: event.strAwayTeam,
          country: competition.country,
        });
      }
    }
    return [...unique.values()];
  }

  async fetchMatches(competition: ExternalCompetition): Promise<ExternalMatch[]> {
    const payload = await this.getJson<{ events?: TsdEvent[] }>(
      `/eventsseason.php?id=${competition.shortcut}&s=${encodeURIComponent(this.season)}`,
    );
    return (payload.events ?? []).map((event) => this.mapMatch(event, competition));
  }

  async fetchStandings(competition: ExternalCompetition): Promise<ExternalStanding[]> {
    const seasons = tsdSeasonCandidates(competition.seasonName, this.season);
    for (const season of seasons) {
      const payload = await this.getJson<{ table?: TsdTableRow[] | null }>(
        `/lookuptable.php?l=${competition.shortcut}&s=${encodeURIComponent(season)}`,
      );
      const rows = payload.table ?? [];
      if (!rows.length) continue;
      return rows.map((row, index) => ({
        teamExternalId: `tsd-bsk:team:${row.idTeam}`,
        teamName: row.strTeam?.trim() || undefined,
        position: num(row.intRank) || index + 1,
        played: num(row.intPlayed),
        won: num(row.intWin ?? row.intWon),
        drawn: num(row.intDraw),
        lost: num(row.intLoss ?? row.intLost),
        goalsFor: num(row.intGoalsFor),
        goalsAgainst: num(row.intGoalsAgainst),
        points: num(row.intPoints),
      }));
    }
    return [];
  }

  private mapTeam(team: TsdTeam, country?: string): ExternalTeam {
    return {
      externalId: `tsd-bsk:team:${team.idTeam}`,
      name: team.strTeam,
      shortName: team.strTeamShort || undefined,
      logo: team.strTeamBadge || undefined,
      country: team.strCountry || country,
    };
  }

  private mapMatch(event: TsdEvent, competition: ExternalCompetition): ExternalMatch {
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
      externalId: `tsd-bsk:match:${event.idEvent}`,
      competitionExternalId: competition.externalId,
      seasonName: competition.seasonName,
      homeTeamExternalId: event.idHomeTeam
        ? `tsd-bsk:team:${event.idHomeTeam}`
        : `tsd-bsk:team-name:${slug(event.strHomeTeam)}`,
      awayTeamExternalId: event.idAwayTeam
        ? `tsd-bsk:team:${event.idAwayTeam}`
        : `tsd-bsk:team-name:${slug(event.strAwayTeam)}`,
      homeTeamName: event.strHomeTeam,
      awayTeamName: event.strAwayTeam,
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

  private async getJson<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}/${this.apiKey}${path.startsWith('/') ? path : `/${path}`}`;
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const waitMs = attempt === 1 ? 700 : 2500 * attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.status === 404) return {} as T;
      if (res.ok) {
        const text = await res.text();
        if (!text.trim() || text.includes('error code:')) {
          lastError = new Error(`TheSportsDB basketball ${path} empty body`);
          continue;
        }
        try {
          return JSON.parse(text) as T;
        } catch {
          lastError = new Error(`TheSportsDB basketball ${path} invalid JSON`);
          continue;
        }
      }
      lastError = new Error(`TheSportsDB basketball ${path} failed: ${res.status}`);
      if (res.status !== 429 && res.status < 500) break;
    }
    throw lastError ?? new Error(`TheSportsDB basketball ${path} failed`);
  }
}

function num(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function slug(value?: string): string {
  return (value ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
