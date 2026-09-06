export type LeagueMeta = {
  name: string;
  country: string;
  type?: 'LEAGUE' | 'CUP';
};

/** Campionati europei confermati su TheSportsDB. La Bundesliga resta su OpenLigaDB. */
export const EUROPEAN_TSD_LEAGUES: Record<string, LeagueMeta> = {
  '4328': { name: 'Premier League', country: 'England' },
  '4329': { name: 'Championship', country: 'England' },
  '4330': { name: 'Scottish Premiership', country: 'Scotland' },
  '4332': { name: 'Serie A', country: 'Italy' },
  '4334': { name: 'Ligue 1', country: 'France' },
  '4335': { name: 'La Liga', country: 'Spain' },
  '4336': { name: 'Super League', country: 'Greece' },
  '4337': { name: 'Eredivisie', country: 'Netherlands' },
  '4338': { name: 'Pro League', country: 'Belgium' },
  '4339': { name: 'Süper Lig', country: 'Turkey' },
  '4344': { name: 'Primeira Liga', country: 'Portugal' },
  '4347': { name: 'Allsvenskan', country: 'Sweden' },
  '4354': { name: 'Ukrainian Premier League', country: 'Ukraine' },
  '4358': { name: 'Eliteserien', country: 'Norway' },
  '4394': { name: 'Serie B', country: 'Italy' },
  '4396': { name: 'League One', country: 'England' },
  '4398': { name: 'Serie C Girone C', country: 'Italy' },
  '4400': { name: 'La Liga 2', country: 'Spain' },
  '4401': { name: 'Ligue 2', country: 'France' },
  '4403': { name: 'Superettan', country: 'Sweden' },
  '4480': { name: 'UEFA Champions League', country: 'Europe', type: 'CUP' },
  '4481': { name: 'UEFA Europa League', country: 'Europe', type: 'CUP' },
};

export const DEFAULT_TSD_LEAGUES = Object.keys(EUROPEAN_TSD_LEAGUES).join(',');

export const OPENLIGA_COMPETITIONS: Record<string, LeagueMeta> = {
  bl1: { name: '1. Bundesliga', country: 'Germany' },
  bl2: { name: '2. Bundesliga', country: 'Germany' },
  bl3: { name: '3. Liga', country: 'Germany' },
  dfb: { name: 'DFB-Pokal', country: 'Germany', type: 'CUP' },
};

export const DEFAULT_OPENLIGA_LEAGUES = 'bl1,bl2,dfb';

const NAME_COUNTRY: Array<{ test: RegExp; country: string }> = [
  { test: /^serie [abc]\b/i, country: 'Italy' },
  { test: /^coppa italia\b/i, country: 'Italy' },
  { test: /^premier league\b/i, country: 'England' },
  { test: /^championship\b/i, country: 'England' },
  { test: /^league one\b/i, country: 'England' },
  { test: /^la liga\b/i, country: 'Spain' },
  { test: /bundesliga|dfb-pokal|3\.\s*liga/i, country: 'Germany' },
  { test: /^ligue [12]\b/i, country: 'France' },
  { test: /eredivisie/i, country: 'Netherlands' },
  { test: /primeira liga/i, country: 'Portugal' },
  { test: /^pro league\b/i, country: 'Belgium' },
  { test: /s[uü]per lig/i, country: 'Turkey' },
  { test: /scottish/i, country: 'Scotland' },
  { test: /allsvenskan|superettan/i, country: 'Sweden' },
  { test: /eliteserien/i, country: 'Norway' },
  { test: /ukrainian/i, country: 'Ukraine' },
  { test: /^super league\b/i, country: 'Greece' },
  { test: /uefa|champions league|europa league/i, country: 'Europe' },
];

export function parseIdList(value?: string | null): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Env extras are kept, but the European catalog is never dropped if Railway has a short leftover list. */
export function mergeLeagueIds(configured: string | undefined, defaults: string): string[] {
  return [...new Set([...parseIdList(defaults), ...parseIdList(configured)])];
}

export function inferFootballCountry(
  name: string,
  existing?: string | null,
  externalId?: string | null,
): string | undefined {
  const trimmed = existing?.trim();
  if (trimmed) return trimmed;
  if (externalId) {
    const tsdId = externalId.replace(/^tsd:/, '');
    if (EUROPEAN_TSD_LEAGUES[tsdId]) return EUROPEAN_TSD_LEAGUES[tsdId].country;
    const oldbId = externalId.replace(/^oldb:/, '');
    if (OPENLIGA_COMPETITIONS[oldbId]) return OPENLIGA_COMPETITIONS[oldbId].country;
  }
  return NAME_COUNTRY.find((row) => row.test.test(name))?.country;
}

type NamedCompetition = {
  name: string;
  shortcut?: string;
  externalId?: string;
};

const FOOTBALL_SYNC_PRIORITY: Array<{ rank: number; test: (name: string, id: string) => boolean }> = [
  { rank: 0, test: (name, id) => id === '4332' || /^italian serie a\b/i.test(name) || /^serie a\b/i.test(name) },
  { rank: 1, test: (name, id) => id === '4328' || /^premier league\b/i.test(name) },
  { rank: 2, test: (name, id) => id === '4335' || /^la liga$/i.test(name) },
  { rank: 3, test: (name, id) => id === 'bl1' || /^1\.\s*bundesliga\b/i.test(name) || /^bundesliga$/i.test(name) },
  { rank: 4, test: (name, id) => id === '4334' || /^ligue 1\b/i.test(name) },
  { rank: 8, test: (name, id) => id === '4394' || /^serie b\b/i.test(name) },
  { rank: 12, test: (name) => /uefa|champions league|europa league/i.test(name) },
];

export function footballCompetitionId(item: NamedCompetition): string {
  return (item.shortcut || item.externalId || '').replace(/^(tsd:|oldb:)/, '');
}

/** Lower rank is synced first so a short Railway budget cannot skip Serie A. */
export function footballSyncPriority(item: NamedCompetition): number {
  const id = footballCompetitionId(item);
  return FOOTBALL_SYNC_PRIORITY.find((row) => row.test(item.name, id))?.rank ?? 40;
}

export function prioritizeFootballCompetitions<T extends NamedCompetition>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const rank = footballSyncPriority(a) - footballSyncPriority(b);
    if (rank !== 0) return rank;
    return a.name.localeCompare(b.name, 'en');
  });
}
