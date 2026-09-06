export const DESK_UPCOMING_LIMIT = 40;
export const DESK_RECENT_LIMIT = 20;
export const GLOBAL_UPCOMING_LIMIT = 40;
export const GLOBAL_RECENT_LIMIT = 20;
export const FEATURED_UPCOMING_LIMIT = 24;
export const FEATURED_RESERVE = 12;
export const FEATURED_WINDOW_DAYS = 7;

/** Highlighted leagues that must not fall off the global “Prossime partite” window. */
export const FEATURED_COMPETITION_NAMES = [
  'Serie A',
  'Premier League',
  'La Liga',
  '1. Bundesliga',
  'Bundesliga',
  'Ligue 1',
  'NBA',
];

export function matchSearchWhere(q?: string) {
  const term = q?.trim();
  if (!term) return {};
  return {
    OR: [
      { homeTeam: { name: { contains: term, mode: 'insensitive' as const } } },
      { awayTeam: { name: { contains: term, mode: 'insensitive' as const } } },
      { competition: { name: { contains: term, mode: 'insensitive' as const } } },
    ],
  };
}

export function featuredCompetitionWhere() {
  return {
    OR: FEATURED_COMPETITION_NAMES.map((name) => ({
      competition: { name: { contains: name, mode: 'insensitive' as const } },
    })),
  };
}

export function featuredWindow(from: Date, days = FEATURED_WINDOW_DAYS) {
  return {
    gte: from,
    lte: new Date(from.getTime() + days * 24 * 60 * 60 * 1000),
  };
}

/**
 * Keep a reserved slice for featured leagues (Serie A first) so an evening
 * Juventus–Milan is not pushed out by 30+ earlier kickoffs from other cups.
 */
export function mergeFeaturedUpcoming<T extends { id: string; kickoff: Date | string }>(
  chronological: T[],
  featured: T[],
  total = GLOBAL_UPCOMING_LIMIT + FEATURED_RESERVE,
  featuredReserve = FEATURED_RESERVE,
): T[] {
  const byKickoff = (a: T, b: T) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  const featuredKept = [...featured].sort(byKickoff).slice(0, featuredReserve);
  const reserved = new Set(featuredKept.map((item) => item.id));
  const rest = chronological
    .filter((item) => !reserved.has(item.id))
    .slice(0, Math.max(0, total - featuredKept.length));
  return [...featuredKept, ...rest].sort(byKickoff);
}
