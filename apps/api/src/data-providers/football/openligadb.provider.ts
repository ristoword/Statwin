import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MatchStatus } from '@prisma/client';
import { FootballDataProvider } from '../interfaces/sports-data-provider';
import {
  ExternalCompetition,
  ExternalMatch,
  ExternalMatchEvent,
  ExternalStanding,
  ExternalTeam,
} from '../interfaces/external-football';
import { DEFAULT_OPENLIGA_LEAGUES, OPENLIGA_COMPETITIONS } from './european-leagues';

type OldbTeam = {
  teamId: number;
  teamName: string;
  shortName?: string;
  teamIconUrl?: string;
};

type OldbResult = {
  resultTypeKind?: string;
  resultName?: string;
  pointsTeam1: number;
  pointsTeam2: number;
};

type OldbGoal = {
  matchMinute?: number;
  goalGetterName?: string;
  scoringTeamId?: number;
};

type OldbMatch = {
  matchID: number;
  matchDateTimeUTC?: string;
  matchDateTime?: string;
  matchIsFinished: boolean;
  team1: OldbTeam;
  team2: OldbTeam;
  matchResults?: OldbResult[];
  goals?: OldbGoal[];
  location?: { locationStadium?: string };
};

type OldbTableRow = {
  teamInfoId: number;
  points: number;
  opponentGoals: number;
  goals: number;
  matches: number;
  won: number;
  lost: number;
  draw: number;
};

type OldbLeague = {
  leagueShortcut?: string;
  leagueName?: string;
};

@Injectable()
export class OpenLigaDbProvider implements FootballDataProvider {
  readonly slug = 'openligadb';
  private readonly baseUrl: string;
  private readonly seasonYear: number;
  private readonly shortcuts: string[];

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('football.openLigaDbBaseUrl') ?? 'https://api.openligadb.de';
    this.seasonYear = Number(config.get<string>('football.seasonYear') ?? new Date().getFullYear());
    this.shortcuts = (config.get<string>('football.leagues') ?? DEFAULT_OPENLIGA_LEAGUES)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async ping() {
    const res = await fetch(`${this.baseUrl}/getavailableleagues`);
    return { ok: res.ok, provider: this.slug };
  }

  async fetchCompetitions(): Promise<ExternalCompetition[]> {
    let available: OldbLeague[] = [];
    try {
      available = await this.getJson<OldbLeague[]>('/getavailableleagues');
    } catch {
      available = [];
    }
    return this.shortcuts
      .map((shortcut) => {
        const known = OPENLIGA_COMPETITIONS[shortcut];
        const live = available.find(
          (item) => item.leagueShortcut?.toLowerCase() === shortcut.toLowerCase(),
        );
        if (!known && !live) return null;
        return {
          externalId: `oldb:${shortcut}`,
          name: known?.name ?? live?.leagueName ?? shortcut,
          country: known?.country ?? 'Germany',
          type: known?.type ?? 'LEAGUE',
          shortcut,
          seasonYear: this.seasonYear,
          seasonName: `${this.seasonYear}/${this.seasonYear + 1}`,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  async fetchTeams(competition: ExternalCompetition): Promise<ExternalTeam[]> {
    const teams = await this.getJson<OldbTeam[]>(
      `/getavailableteams/${competition.shortcut}/${competition.seasonYear}`,
    );
    return teams.map((team) => this.mapTeam(team, competition.country));
  }

  async fetchMatches(competition: ExternalCompetition): Promise<ExternalMatch[]> {
    let matches = await this.getJson<OldbMatch[]>(
      `/getmatchdata/${competition.shortcut}/${competition.seasonYear}`,
    );
    if (!matches.length) {
      matches = await this.getJson<OldbMatch[]>(`/getmatchdata/${competition.shortcut}`);
    }
    return matches.map((match) => this.mapMatch(match, competition));
  }

  async fetchStandings(competition: ExternalCompetition): Promise<ExternalStanding[]> {
    const rows = await this.getJson<OldbTableRow[]>(
      `/getbltable/${competition.shortcut}/${competition.seasonYear}`,
    );
    return rows.map((row, index) => ({
      teamExternalId: `oldb:team:${row.teamInfoId}`,
      position: index + 1,
      played: row.matches,
      won: row.won,
      drawn: row.draw,
      lost: row.lost,
      goalsFor: row.goals,
      goalsAgainst: row.opponentGoals,
      points: row.points,
    }));
  }

  private mapTeam(team: OldbTeam, country?: string): ExternalTeam {
    return {
      externalId: `oldb:team:${team.teamId}`,
      name: team.teamName,
      shortName: team.shortName,
      logo: team.teamIconUrl,
      country,
    };
  }

  private mapMatch(match: OldbMatch, competition: ExternalCompetition): ExternalMatch {
    const ft = match.matchResults?.find(
      (result) => result.resultTypeKind === 'After90Minutes' || result.resultName === 'Endergebnis',
    );
    const finished = match.matchIsFinished === true && ft !== undefined;
    return {
      externalId: `oldb:match:${match.matchID}`,
      competitionExternalId: competition.externalId,
      seasonName: competition.seasonName,
      homeTeamExternalId: `oldb:team:${match.team1.teamId}`,
      awayTeamExternalId: `oldb:team:${match.team2.teamId}`,
      kickoff: new Date(match.matchDateTimeUTC ?? match.matchDateTime ?? Date.now()),
      status: finished ? MatchStatus.FINISHED : MatchStatus.SCHEDULED,
      homeScore: finished ? ft.pointsTeam1 : null,
      awayScore: finished ? ft.pointsTeam2 : null,
      venue: match.location?.locationStadium,
      events: finished ? this.mapGoals(match.goals ?? []) : [],
    };
  }

  private mapGoals(goals: OldbGoal[]): ExternalMatchEvent[] {
    return goals.map((goal) => ({
      type: 'GOAL',
      minute: goal.matchMinute,
      playerName: goal.goalGetterName,
      teamExternalId: goal.scoringTeamId ? `oldb:team:${goal.scoringTeamId}` : undefined,
    }));
  }

  private async getJson<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`OpenLigaDB ${path} failed: ${res.status}`);
    }
    return (await res.json()) as T;
  }
}
