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

export type TsdTableRow = {
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
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.status === 404) return {} as T;
      if (res.ok) {
        const text = await res.text();
        if (!text.trim()) {
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
    return fetch(`${this.baseUrl}/${this.apiKey}/lookupleague.php?id=${leagueId}`);
  }
}

export function num(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function slugify(value?: string): string {
  return (value ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
