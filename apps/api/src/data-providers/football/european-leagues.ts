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
