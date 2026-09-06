export type AgendaMatch = {
  id: string;
  kickoff?: string;
  status?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeam?: { name: string };
  awayTeam?: { name: string };
  competition?: { name: string };
  sport?: { name: string; slug: string };
  estimate?: Estimate | null;
};

export type Estimate = {
  predictedScore?: { home?: number; away?: number; outcome?: string } | null;
  outcomes?: Array<{ selection: string; probability: number; impliedOdds?: number | null }>;
  overUnder?: Array<{
    line: number;
    over: number;
    under: number;
    impliedOver?: number | null;
    impliedUnder?: number | null;
  }>;
  btts?: { yes: number; no: number; impliedYes?: number | null; impliedNo?: number | null };
  impliedOddsDisclaimer?: string;
};

export function asAgenda(payload: unknown): { recent: AgendaMatch[]; upcoming: AgendaMatch[] } {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'recent' in payload) {
    const grouped = payload as { recent?: AgendaMatch[]; upcoming?: AgendaMatch[] };
    return { recent: grouped.recent ?? [], upcoming: grouped.upcoming ?? [] };
  }
  const list = Array.isArray(payload) ? (payload as AgendaMatch[]) : [];
  const now = Date.now();
  return {
    recent: list.filter((item) => item.kickoff && new Date(item.kickoff).getTime() < now),
    upcoming: list.filter((item) => !item.kickoff || new Date(item.kickoff).getTime() >= now),
  };
}
