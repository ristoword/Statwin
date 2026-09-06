export type SportStatus = 'synced' | 'predisposed';

export type SportDefinition = {
  slug: string;
  name: string;
  href: string;
  apiPath: string;
  status: SportStatus;
  focus: string;
  blurb: string;
  eventNoun: string;
};

export const SPORT_CATALOG: SportDefinition[] = [
  {
    slug: 'football',
    name: 'Calcio',
    href: '/football',
    apiPath: 'football',
    status: 'synced',
    focus: 'Italia · nazione per nazione',
    blurb: 'Italia prima, poi tutte le altre nazioni in archivio e le coppe UEFA. Punteggi solo se il provider ha chiuso la gara.',
    eventNoun: 'partite',
  },
  {
    slug: 'basketball',
    name: 'Basket',
    href: '/basketball',
    apiPath: 'basketball',
    status: 'synced',
    focus: 'NBA · Euroleague',
    blurb: 'Fonte TheSportsDB: NBA ed Euroleague. I punteggi restano vuoti finche la gara non e chiusa dalla fonte.',
    eventNoun: 'partite',
  },
  {
    slug: 'tennis',
    name: 'Tennis',
    href: '/tennis',
    apiPath: 'tennis',
    status: 'synced',
    focus: 'ATP · WTA',
    blurb: 'Circuiti ATP e WTA via TheSportsDB. Archivio aggiornato dal sync, nessun risultato inventato.',
    eventNoun: 'incontri',
  },
  {
    slug: 'volleyball',
    name: 'Pallavolo',
    href: '/volleyball',
    apiPath: 'volleyball',
    status: 'synced',
    focus: 'Serie A · campionati',
    blurb: 'Campionati TheSportsDB. Nessun set viene generato in assenza di fonte.',
    eventNoun: 'incontri',
  },
  {
    slug: 'baseball',
    name: 'Baseball',
    href: '/baseball',
    apiPath: 'baseball',
    status: 'synced',
    focus: 'MLB',
    blurb: 'MLB via TheSportsDB. STATWIN non inventa inning o score.',
    eventNoun: 'partite',
  },
  {
    slug: 'american-football',
    name: 'Football americano',
    href: '/american-football',
    apiPath: 'american-football',
    status: 'synced',
    focus: 'NFL',
    blurb: 'NFL via TheSportsDB. Punteggi solo se la fonte ha chiuso la gara.',
    eventNoun: 'partite',
  },
  {
    slug: 'ice-hockey',
    name: 'Hockey su ghiaccio',
    href: '/ice-hockey',
    apiPath: 'ice-hockey',
    status: 'synced',
    focus: 'NHL',
    blurb: 'NHL via TheSportsDB. Nessun gol inventato.',
    eventNoun: 'partite',
  },
  {
    slug: 'formula1',
    name: 'Formula 1',
    href: '/formula1',
    apiPath: 'formula1',
    status: 'synced',
    focus: 'Mondiale',
    blurb: 'Calendario Formula 1 da TheSportsDB. Nessun tempo di gara simulato.',
    eventNoun: 'gare',
  },
  {
    slug: 'horse-racing',
    name: 'Ippica',
    href: '/horse-racing',
    apiPath: 'horse-racing',
    status: 'predisposed',
    focus: 'Ippica · Trotto',
    blurb: 'Nessun feed pubblico legale collegato. L’archivio resta vuoto: nessun ordine di arrivo inventato.',
    eventNoun: 'corse',
  },
  {
    slug: 'rugby',
    name: 'Rugby',
    href: '/rugby',
    apiPath: 'rugby',
    status: 'synced',
    focus: 'Premiership · Six Nations',
    blurb: 'Premiership e Six Nations via TheSportsDB. Stesso rispetto delle fonti del calcio.',
    eventNoun: 'incontri',
  },
  {
    slug: 'handball',
    name: 'Pallamano',
    href: '/handball',
    apiPath: 'handball',
    status: 'synced',
    focus: 'Bundesliga',
    blurb: 'Handball-Bundesliga via TheSportsDB. L’AI non riempie i vuoti.',
    eventNoun: 'partite',
  },
  {
    slug: 'mma',
    name: 'MMA / UFC',
    href: '/mma',
    apiPath: 'mma',
    status: 'synced',
    focus: 'UFC',
    blurb: 'Eventi UFC da TheSportsDB. Nessun verdetto inventato.',
    eventNoun: 'incontri',
  },
  {
    slug: 'golf',
    name: 'Golf',
    href: '/golf',
    apiPath: 'golf',
    status: 'synced',
    focus: 'PGA Tour',
    blurb: 'PGA Tour via TheSportsDB. Nessun leaderboard fittizio.',
    eventNoun: 'tornei',
  },
  {
    slug: 'cycling',
    name: 'Ciclismo',
    href: '/cycling',
    apiPath: 'cycling',
    status: 'synced',
    focus: 'UCI World Tour',
    blurb: 'UCI World Tour via TheSportsDB. Tempi solo da fonte ufficiale.',
    eventNoun: 'corse',
  },
  {
    slug: 'cricket',
    name: 'Cricket',
    href: '/cricket',
    apiPath: 'cricket',
    status: 'synced',
    focus: 'IPL',
    blurb: 'Indian Premier League via TheSportsDB. Nessun scorecard inventato.',
    eventNoun: 'incontri',
  },
  {
    slug: 'darts',
    name: 'Darts',
    href: '/darts',
    apiPath: 'darts',
    status: 'synced',
    focus: 'PDC',
    blurb: 'PDC Darts via TheSportsDB. Niente risultati inventati.',
    eventNoun: 'incontri',
  },
];

export const PREDISPOSED_SPORTS = SPORT_CATALOG.filter((sport) => sport.status === 'predisposed');

export function findSport(slug: string): SportDefinition | undefined {
  return SPORT_CATALOG.find((sport) => sport.slug === slug);
}
