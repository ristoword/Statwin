export type DeskCompetition = {
  id: string;
  name: string;
  country?: string | null;
  type?: string | null;
  section?: string | null;
};

export type DeskSection = {
  key: string;
  label: string;
  competitions: DeskCompetition[];
};

const WORLD = /^(world|worldwide|international|internazionale|global)$/i;
const EUROPE = /^(europe|europa|uefa)$/i;

const COUNTRY_ALIASES: Record<string, string> = {
  usa: 'USA',
  us: 'USA',
  'u.s.': 'USA',
  'u.s.a.': 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  uk: 'England',
  'united kingdom': 'England',
  'great britain': 'England',
};

const COUNTRY_LABELS: Record<string, string> = {
  Italy: 'Italia',
  England: 'Inghilterra',
  Spain: 'Spagna',
  Germany: 'Germania',
  France: 'Francia',
  Portugal: 'Portogallo',
  Netherlands: 'Paesi Bassi',
  Belgium: 'Belgio',
  Turkey: 'Turchia',
  Greece: 'Grecia',
  Scotland: 'Scozia',
  Sweden: 'Svezia',
  Norway: 'Norvegia',
  Ukraine: 'Ucraina',
  USA: 'USA',
  India: 'India',
  Europe: 'Europa',
  Internazionale: 'Internazionale',
  ATP: 'ATP',
  WTA: 'WTA',
  UFC: 'UFC',
  NFL: 'NFL',
  'Formula 1': 'Formula 1',
  'PGA Tour': 'PGA Tour',
  UCI: 'UCI World Tour',
  PDC: 'PDC',
};

/** Football: Italy first, then the other nations present in the DB, UEFA last. */
const FOOTBALL_NATION_ORDER = [
  'Italy',
  'England',
  'Spain',
  'Germany',
  'France',
  'Portugal',
  'Netherlands',
  'Belgium',
  'Turkey',
  'Greece',
  'Scotland',
  'Sweden',
  'Norway',
  'Ukraine',
];

const PREFERRED_SECTION: Record<string, string> = {
  football: 'Italy',
  basketball: 'USA',
  tennis: 'ATP',
  volleyball: 'Italy',
  baseball: 'USA',
  'american-football': 'USA',
  'ice-hockey': 'USA',
  formula1: 'Formula 1',
  rugby: 'England',
  handball: 'Germany',
  mma: 'UFC',
  golf: 'USA',
  cycling: 'UCI',
  cricket: 'India',
  darts: 'PDC',
};

const COMPETITION_TIER = [
  /^serie a\b/i,
  /^premier league\b/i,
  /^la liga$/i,
  /^1\.\s*bundesliga\b/i,
  /^bundesliga$/i,
  /^ligue 1\b/i,
  /^nba\b/i,
  /^nfl\b/i,
  /^mlb\b/i,
  /^nhl\b/i,
  /^atp\b/i,
];

function normalizeCountry(value?: string | null): string {
  const trimmed = value?.trim() || '';
  if (!trimmed) return '';
  return COUNTRY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

function isWorld(value: string) {
  return !value || WORLD.test(value) || value === 'Internazionale';
}

function isEurope(value: string) {
  return EUROPE.test(value);
}

function circuitFromName(name: string, sportSlug: string): string | null {
  const n = name.toLowerCase();
  if (sportSlug === 'tennis') {
    if (n.includes('wta')) return 'WTA';
    if (n.includes('atp')) return 'ATP';
  }
  if (sportSlug === 'mma' || n.includes('ufc')) return 'UFC';
  if (sportSlug === 'formula1' || n.includes('formula')) return 'Formula 1';
  if (sportSlug === 'american-football' || /\bnfl\b/.test(n)) {
    if (n.includes('afc')) return 'AFC';
    if (n.includes('nfc')) return 'NFC';
    return 'NFL';
  }
  if (sportSlug === 'golf' && n.includes('pga')) return 'PGA Tour';
  if (sportSlug === 'cycling' && n.includes('uci')) return 'UCI';
  if (sportSlug === 'darts' && n.includes('pdc')) return 'PDC';
  return null;
}

export function sectionKey(item: DeskCompetition, sportSlug: string): string {
  const raw = normalizeCountry(item.country) || normalizeCountry(item.section);
  if (sportSlug === 'football' && isEurope(raw)) return 'Europe';
  if (isWorld(raw)) {
    return circuitFromName(item.name, sportSlug) ?? 'Internazionale';
  }
  return raw;
}

export function sectionLabel(key: string, sportSlug: string): string {
  if (sportSlug === 'football' && key === 'Europe') return 'Europa / UEFA';
  return COUNTRY_LABELS[key] ?? key;
}

function competitionRank(name: string): number {
  const index = COMPETITION_TIER.findIndex((pattern) => pattern.test(name));
  return index === -1 ? 50 : index;
}

function sortCompetitions(items: DeskCompetition[]): DeskCompetition[] {
  return [...items].sort((a, b) => {
    const tier = competitionRank(a.name) - competitionRank(b.name);
    if (tier !== 0) return tier;
    return a.name.localeCompare(b.name, 'it');
  });
}

function sectionRank(key: string, sportSlug: string): number {
  const preferred = PREFERRED_SECTION[sportSlug];
  if (preferred && key === preferred) return -10;
  if (sportSlug === 'football') {
    const index = FOOTBALL_NATION_ORDER.indexOf(key);
    if (index >= 0) return index;
    if (key === 'Europe') return 90;
    return 40;
  }
  if (key === 'Internazionale' || key === 'Europe') return 80;
  return 20;
}

export function groupSportSections(items: DeskCompetition[], sportSlug: string): DeskSection[] {
  const groups = new Map<string, DeskCompetition[]>();
  for (const item of items) {
    const key = sectionKey(item, sportSlug);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort((a, b) => {
      const rank = sectionRank(a[0], sportSlug) - sectionRank(b[0], sportSlug);
      if (rank !== 0) return rank;
      return sectionLabel(a[0], sportSlug).localeCompare(sectionLabel(b[0], sportSlug), 'it');
    })
    .map(([key, competitions]) => ({
      key,
      label: sectionLabel(key, sportSlug),
      competitions: sortCompetitions(competitions),
    }));
}

export function defaultCompetition(
  items: DeskCompetition[],
  sportSlug: string,
  requestedId?: string,
): DeskCompetition | undefined {
  if (requestedId) {
    const requested = items.find((item) => item.id === requestedId);
    if (requested) return requested;
  }
  const sections = groupSportSections(items, sportSlug);
  const first = sections[0];
  if (!first) return undefined;
  if (sportSlug === 'football' && first.key === 'Italy') {
    return first.competitions.find((item) => /^serie a\b/i.test(item.name)) ?? first.competitions[0];
  }
  return first.competitions[0];
}

export function sectionFor(item: DeskCompetition | undefined, sportSlug: string, sections: DeskSection[]) {
  if (!item) return sections[0];
  const key = sectionKey(item, sportSlug);
  return sections.find((section) => section.key === key) ?? sections[0];
}
