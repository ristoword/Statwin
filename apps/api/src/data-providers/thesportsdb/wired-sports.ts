export type WiredSportSpec = {
  slug: string;
  name: string;
  prefix: string;
  defaultLeagues: string;
  defaultSeason: string;
  envLeagues: string;
  envSeason: string;
  pingLeagueId: string;
};

/**
 * TheSportsDB league IDs verified against the public all_leagues dump
 * (lookupleague.php supplies name/country at sync time — never hardcoded Italy).
 */
export const WIRED_TSD_SPORTS: WiredSportSpec[] = [
  {
    slug: 'tennis',
    name: 'Tennis',
    prefix: 'tsd:tennis',
    defaultLeagues: '4464,4517',
    defaultSeason: '2026',
    envLeagues: 'THESPORTSDB_TENNIS_LEAGUES',
    envSeason: 'THESPORTSDB_TENNIS_SEASON',
    pingLeagueId: '4464',
  },
  {
    slug: 'volleyball',
    name: 'Pallavolo',
    prefix: 'tsd:volleyball',
    defaultLeagues: '4544',
    defaultSeason: '2025-2026',
    envLeagues: 'THESPORTSDB_VOLLEYBALL_LEAGUES',
    envSeason: 'THESPORTSDB_VOLLEYBALL_SEASON',
    pingLeagueId: '4544',
  },
  {
    slug: 'baseball',
    name: 'Baseball',
    prefix: 'tsd:mlb',
    defaultLeagues: '4424',
    defaultSeason: '2026',
    envLeagues: 'THESPORTSDB_BASEBALL_LEAGUES',
    envSeason: 'THESPORTSDB_BASEBALL_SEASON',
    pingLeagueId: '4424',
  },
  {
    slug: 'american-football',
    name: 'Football americano',
    prefix: 'tsd:nfl',
    defaultLeagues: '4391',
    defaultSeason: '2025',
    envLeagues: 'THESPORTSDB_NFL_LEAGUES',
    envSeason: 'THESPORTSDB_NFL_SEASON',
    pingLeagueId: '4391',
  },
  {
    slug: 'ice-hockey',
    name: 'Hockey su ghiaccio',
    prefix: 'tsd:nhl',
    defaultLeagues: '4380',
    defaultSeason: '2025-2026',
    envLeagues: 'THESPORTSDB_HOCKEY_LEAGUES',
    envSeason: 'THESPORTSDB_HOCKEY_SEASON',
    pingLeagueId: '4380',
  },
  {
    slug: 'formula1',
    name: 'Formula 1',
    prefix: 'tsd:f1',
    defaultLeagues: '4370',
    defaultSeason: '2026',
    envLeagues: 'THESPORTSDB_F1_LEAGUES',
    envSeason: 'THESPORTSDB_F1_SEASON',
    pingLeagueId: '4370',
  },
  {
    slug: 'rugby',
    name: 'Rugby',
    prefix: 'tsd:rugby',
    defaultLeagues: '4414,4714',
    defaultSeason: '2026',
    envLeagues: 'THESPORTSDB_RUGBY_LEAGUES',
    envSeason: 'THESPORTSDB_RUGBY_SEASON',
    pingLeagueId: '4414',
  },
  {
    slug: 'handball',
    name: 'Pallamano',
    prefix: 'tsd:handball',
    defaultLeagues: '4533',
    defaultSeason: '2025-2026',
    envLeagues: 'THESPORTSDB_HANDBALL_LEAGUES',
    envSeason: 'THESPORTSDB_HANDBALL_SEASON',
    pingLeagueId: '4533',
  },
  {
    slug: 'mma',
    name: 'MMA / UFC',
    prefix: 'tsd:ufc',
    defaultLeagues: '4443',
    defaultSeason: '2026',
    envLeagues: 'THESPORTSDB_MMA_LEAGUES',
    envSeason: 'THESPORTSDB_MMA_SEASON',
    pingLeagueId: '4443',
  },
  {
    slug: 'golf',
    name: 'Golf',
    prefix: 'tsd:golf',
    defaultLeagues: '4425',
    defaultSeason: '2026',
    envLeagues: 'THESPORTSDB_GOLF_LEAGUES',
    envSeason: 'THESPORTSDB_GOLF_SEASON',
    pingLeagueId: '4425',
  },
  {
    slug: 'cycling',
    name: 'Ciclismo',
    prefix: 'tsd:cycling',
    defaultLeagues: '4465',
    defaultSeason: '2026',
    envLeagues: 'THESPORTSDB_CYCLING_LEAGUES',
    envSeason: 'THESPORTSDB_CYCLING_SEASON',
    pingLeagueId: '4465',
  },
  {
    slug: 'cricket',
    name: 'Cricket',
    prefix: 'tsd:cricket',
    defaultLeagues: '4460',
    defaultSeason: '2026',
    envLeagues: 'THESPORTSDB_CRICKET_LEAGUES',
    envSeason: 'THESPORTSDB_CRICKET_SEASON',
    pingLeagueId: '4460',
  },
  {
    slug: 'darts',
    name: 'Darts',
    prefix: 'tsd:darts',
    defaultLeagues: '4554',
    defaultSeason: '2026',
    envLeagues: 'THESPORTSDB_DARTS_LEAGUES',
    envSeason: 'THESPORTSDB_DARTS_SEASON',
    pingLeagueId: '4554',
  },
];

export const EMPTY_SPORTS = [
  {
    slug: 'horse-racing',
    name: 'Ippica',
    reason:
      'Nessun feed pubblico legale collegato. TheSportsDB non espone un calendario ippico utilizzabile; l’archivio resta vuoto.',
  },
] as const;

export function findWiredSport(slug: string): WiredSportSpec | undefined {
  return WIRED_TSD_SPORTS.find((sport) => sport.slug === slug);
}

export function isEmptySport(slug: string): boolean {
  return EMPTY_SPORTS.some((sport) => sport.slug === slug);
}
