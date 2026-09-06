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
import { DEFAULT_TSD_LEAGUES, EUROPEAN_TSD_LEAGUES, inferFootballCountry, mergeLeagueIds } from './european-leagues';

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
  intRank?: string | number;
  intPlayed?: string | number;
  intWin?: string | number;
  intDraw?: string | number;
  intLoss?: string | number;
  intGoalsFor?: string | number;
  intGoalsAgainst?: string | number;
  intPoints?: string | number;
};

@Injectable()
export class TheSportsDbProvider implements FootballDataProvider {
  readonly slug = 'thesportsdb';
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly season: string;
  private readonly leagueIds: string[];

  constructor(config: ConfigService) {
    this.baseUrl = (config.get<string>('football.theSportsDbBaseUrl') ?? 'https://www.thesportsdb.com/api/v1/json').replace(/\/$/, '');
    this.apiKey = config.get<string>('football.theSportsDbKey') ?? '3';
    this.season = config.get<string>('football.theSportsDbSeason') ?? '2026-2027';
    this.leagueIds = mergeLeagueIds(config.get<string>('football.theSportsDbLeagues'), DEFAULT_TSD_LEAGUES);
  }

  async ping() {
    const res = await fetch(`${this.baseUrl}/${this.apiKey}/lookupleague.php?id=4328`);
    return { ok: res.ok, provider: this.slug };
  }

  async fetchCompetitions(): Promise<ExternalCompetition[]> {
    const year = Number(this.season.slice(0, 4));
    const competitions: ExternalCompetition[] = [];
    for (const id of this.leagueIds) {
      const known = EUROPEAN_TSD_LEAGUES[id];
      let name = known?.name ?? `Campionato ${id}`;
      let country = known?.country;
      const type = known?.type ?? 'LEAGUE';
      if (!known) {
        try {
          const payload = await this.getJson<{ leagues?: Array<{ strLeague?: string; strCountry?: string }> }>(
            `/lookupleague.php?id=${id}`,
          );
          const league = payload.leagues?.[0];
          if (league?.strLeague) name = league.strLeague;
          if (league?.strCountry?.trim()) country = league.strCountry.trim();
        } catch {
          /* keep catalog / name fallback */
        }
      }
      competitions.push({
        externalId: `tsd:${id}`,
        name,
        country: inferFootballCountry(name, country, `tsd:${id}`) ?? 'Europe',
        type,
        shortcut: id,
        seasonYear: year,
        seasonName: this.season,
      });
    }
    return competitions;
  }

  async fetchTeams(competition: ExternalCompetition): Promise<ExternalTeam[]> {
    const payload = await this.getJson<{ teams?: TsdTeam[] }>(`/lookup_all_teams.php?id=${competition.shortcut}`);
    const teams = payload.teams ?? [];
    if (teams.length) {
      return teams.map((team) => this.mapTeam(team));
    }

    const eventsPayload = await this.getJson<{ events?: TsdEvent[] }>(
      `/eventsseason.php?id=${competition.shortcut}&s=${encodeURIComponent(this.season)}`,
    );
    const unique = new Map<string, ExternalTeam>();
    for (const event of eventsPayload.events ?? []) {
      if (event.idHomeTeam && event.strHomeTeam) {
        unique.set(`tsd:team:${event.idHomeTeam}`, {
          externalId: `tsd:team:${event.idHomeTeam}`,
          name: event.strHomeTeam,
          country: competition.country,
        });
      }
      if (event.idAwayTeam && event.strAwayTeam) {
        unique.set(`tsd:team:${event.idAwayTeam}`, {
          externalId: `tsd:team:${event.idAwayTeam}`,
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
    const payload = await this.getJson<{ table?: TsdTableRow[] }>(
      `/lookuptable.php?l=${competition.shortcut}&s=${encodeURIComponent(this.season)}`,
    );
    return (payload.table ?? []).map((row, index) => ({
      teamExternalId: `tsd:team:${row.idTeam}`,
      position: num(row.intRank) || index + 1,
      played: num(row.intPlayed),
      won: num(row.intWin),
      drawn: num(row.intDraw),
      lost: num(row.intLoss),
      goalsFor: num(row.intGoalsFor),
      goalsAgainst: num(row.intGoalsAgainst),
      points: num(row.intPoints),
    }));
  }

  private mapTeam(team: TsdTeam): ExternalTeam {
    return {
      externalId: `tsd:team:${team.idTeam}`,
      name: team.strTeam,
      shortName: team.strTeamShort || undefined,
      logo: team.strTeamBadge || undefined,
      country: team.strCountry || undefined,
    };
  }

  private mapMatch(event: TsdEvent, competition: ExternalCompetition): ExternalMatch {
    const homeScore = event.intHomeScore === null || event.intHomeScore === undefined || event.intHomeScore === ''
      ? null
      : num(event.intHomeScore);
    const awayScore = event.intAwayScore === null || event.intAwayScore === undefined || event.intAwayScore === ''
      ? null
      : num(event.intAwayScore);
    const statusText = (event.strStatus ?? '').toLowerCase();
    const finished =
      (statusText.includes('finish') || statusText === 'ft' || statusText === 'match finished') &&
      homeScore !== null &&
      awayScore !== null;
    const live = statusText.includes('live') || statusText === 'in play';

    return {
      externalId: `tsd:match:${event.idEvent}`,
      competitionExternalId: competition.externalId,
      seasonName: competition.seasonName,
      homeTeamExternalId: event.idHomeTeam ? `tsd:team:${event.idHomeTeam}` : `tsd:team-name:${slug(event.strHomeTeam)}`,
      awayTeamExternalId: event.idAwayTeam ? `tsd:team:${event.idAwayTeam}` : `tsd:team-name:${slug(event.strAwayTeam)}`,
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
    const time = event.strTime && event.strTime !== '00:00:00' ? event.strTime : '15:00:00';
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
        if (!text.trim()) {
          lastError = new Error(`TheSportsDB ${path} empty body`);
          continue;
        }
        try {
          return JSON.parse(text) as T;
        } catch {
          lastError = new Error(`TheSportsDB ${path} invalid JSON`);
          continue;
        }
      }
      lastError = new Error(`TheSportsDB ${path} failed: ${res.status}`);
      if (res.status !== 429 && res.status < 500) break;
    }
    throw lastError ?? new Error(`TheSportsDB ${path} failed`);
  }
}

function num(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function slug(value?: string): string {
  return (value ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
