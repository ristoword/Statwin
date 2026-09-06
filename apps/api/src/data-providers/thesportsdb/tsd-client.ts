export type TsdTeam = {
  idTeam: string;
  strTeam: string;
  strTeamShort?: string;
  strTeamBadge?: string;
  strCountry?: string;
};

export type TsdEvent = {
  idEvent: string;
  strEvent?: string;
  strEventAlternate?: string;
  idLeague?: string;
  strLeague?: string;
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

/** Official TheSportsDB team ids used only as extra lookup keys, never as fake fixtures. */
export const TSD_FOCUS_TEAM_IDS: Record<string, string[]> = {
  '4332': ['133676', '133610'],
};

export type TsdTableRow = {
  idTeam: string;
  strTeam?: string;
  strSeason?: string;
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

export type TsdLeague = {
  idLeague?: string;
  strLeague?: string;
  strCountry?: string;
  strCurrentSeason?: string;
  strSport?: string;
};

export class TheSportsDbClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly label = 'TheSportsDB',
  ) {}

  async getJson<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}/${this.apiKey}${path.startsWith('/') ? path : `/${path}`}`;
    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const waitMs = attempt === 1 ? 700 : 2500 * attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      let res: Response;
      try {
        res = await fetch(url, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(15_000),
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
      if (res.status === 404) return {} as T;
      if (res.ok) {
        const text = await res.text();
        if (!text.trim() || text.includes('error code:')) {
          lastError = new Error(`${this.label} ${path} empty body`);
          continue;
        }
        try {
          return JSON.parse(text) as T;
        } catch {
          lastError = new Error(`${this.label} ${path} invalid JSON`);
          continue;
        }
      }
      lastError = new Error(`${this.label} ${path} failed: ${res.status}`);
      if (res.status !== 429 && res.status < 500) break;
    }
    throw lastError ?? new Error(`${this.label} ${path} failed`);
  }

  async lookupLeague(id: string): Promise<TsdLeague | null> {
    const payload = await this.getJson<{ leagues?: TsdLeague[] }>(`/lookupleague.php?id=${id}`);
    return payload.leagues?.[0] ?? null;
  }

  ping(leagueId: string) {
    return fetch(`${this.baseUrl}/${this.apiKey}/lookupleague.php?id=${leagueId}`, {
      signal: AbortSignal.timeout(8_000),
    });
  }
}

export function num(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function slugify(value?: string): string {
  return (value ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function tsdSeasonCandidates(...seasons: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const add = (value?: string) => {
    const trimmed = value?.trim();
    if (trimmed) seen.add(trimmed);
  };
  for (const season of seasons) {
    add(season);
    if (!season) continue;
    const trimmed = season.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-');
      add(start);
      add(end);
      const year = Number(start);
      if (Number.isFinite(year)) {
        add(`${year - 1}-${year}`);
        add(`${year}-${year + 1}`);
      }
    } else {
      const year = Number(trimmed);
      if (Number.isFinite(year)) {
        add(`${year}-${year + 1}`);
        add(`${year - 1}-${year}`);
        add(String(year - 1));
      }
    }
  }
  return [...seen];
}

export function mapTsdTableRow(
  row: TsdTableRow,
  prefix: string,
  index: number,
): {
  teamExternalId: string;
  teamName?: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
} {
  return {
    teamExternalId: `${prefix}:team:${row.idTeam}`,
    teamName: row.strTeam?.trim() || undefined,
    position: num(row.intRank) || index + 1,
    played: num(row.intPlayed),
    won: num(row.intWin ?? row.intWon),
    drawn: num(row.intDraw),
    lost: num(row.intLoss ?? row.intLost),
    goalsFor: num(row.intGoalsFor),
    goalsAgainst: num(row.intGoalsAgainst),
    points: num(row.intPoints),
  };
}

export async function lookupTsdTable(
  client: TheSportsDbClient,
  leagueId: string,
  seasons: string[],
): Promise<TsdTableRow[]> {
  for (const season of seasons) {
    const payload = await client.getJson<{ table?: TsdTableRow[] | null }>(
      `/lookuptable.php?l=${leagueId}&s=${encodeURIComponent(season)}`,
    );
    const rows = payload.table ?? [];
    if (rows.length) return rows;
  }
  return [];
}

export type TsdGetJson = <T>(path: string) => Promise<T>;

function addTsdEvents(target: Map<string, TsdEvent>, events?: TsdEvent[] | null) {
  for (const event of events ?? []) {
    if (event?.idEvent) target.set(event.idEvent, event);
  }
}

export function tsdFocusDays(from = new Date()): string[] {
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return [0, 1].map((offset) => new Date(start + offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
}

export function eventMatchesLeague(event: TsdEvent, leagueId: string): boolean {
  const id = String(event.idLeague ?? '').trim();
  if (id) return id === leagueId;
  return leagueId === '4332' && /serie a/i.test(event.strLeague ?? '');
}

/**
 * Upcoming league fixtures first, then today/tomorrow, team next events, then season archive.
 * Never invents events: empty provider responses stay empty.
 */
export async function collectTsdLeagueEvents(
  getJson: TsdGetJson,
  leagueId: string,
  seasons: string[],
  now = new Date(),
): Promise<TsdEvent[]> {
  const byId = new Map<string, TsdEvent>();

  try {
    const upcoming = await getJson<{ events?: TsdEvent[] | null }>(
      `/eventsnextleague.php?id=${encodeURIComponent(leagueId)}`,
    );
    addTsdEvents(byId, upcoming.events);
  } catch {
    /* keep going with day / team / season sources */
  }

  for (const day of tsdFocusDays(now)) {
    try {
      const payload = await getJson<{ events?: TsdEvent[] | null }>(
        `/eventsday.php?d=${encodeURIComponent(day)}&s=Soccer`,
      );
      addTsdEvents(
        byId,
        (payload.events ?? []).filter((event) => eventMatchesLeague(event, leagueId)),
      );
    } catch {
      /* ignore a missing day feed */
    }
  }

  for (const teamId of TSD_FOCUS_TEAM_IDS[leagueId] ?? []) {
    try {
      const payload = await getJson<{ events?: TsdEvent[] | null }>(
        `/eventsnext.php?id=${encodeURIComponent(teamId)}`,
      );
      addTsdEvents(
        byId,
        (payload.events ?? []).filter((event) => eventMatchesLeague(event, leagueId)),
      );
    } catch {
      /* ignore a missing team feed */
    }
  }

  const seasonsToTry = byId.size > 0 ? seasons.slice(0, 1) : seasons;
  for (const season of seasonsToTry) {
    try {
      const payload = await getJson<{ events?: TsdEvent[] | null }>(
        `/eventsseason.php?id=${encodeURIComponent(leagueId)}&s=${encodeURIComponent(season)}`,
      );
      const events = payload.events ?? [];
      if (!events.length) continue;
      addTsdEvents(byId, events);
      break;
    } catch {
      /* try the next season label */
    }
  }

  return [...byId.values()];
}
