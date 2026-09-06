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
    focus: 'Italia · Europa',
    blurb: 'Campionati europei e coppe UEFA. Punteggi solo se il provider ha chiuso la gara.',
    eventNoun: 'partite',
  },
  {
    slug: 'basketball',
    name: 'Basket',
    href: '/basketball',
    apiPath: 'basketball',
    status: 'synced',
    focus: 'NBA · Euroleague',
    blurb: 'Fonte TheSportsDB. I punteggi restano vuoti finche la gara non e chiusa dalla fonte.',
    eventNoun: 'partite',
  },
  {
    slug: 'tennis',
    name: 'Tennis',
    href: '/tennis',
    apiPath: 'tennis',
    status: 'predisposed',
    focus: 'Slam · ATP · WTA',
    blurb: 'Desk predisposto. Archivio vuoto in attesa del provider ufficiale.',
    eventNoun: 'incontri',
  },
  {
    slug: 'volleyball',
    name: 'Pallavolo',
    href: '/volleyball',
    apiPath: 'volleyball',
    status: 'predisposed',
    focus: 'Serie A · Champions',
    blurb: 'Modulo pronto. Nessun set viene generato in assenza di fonte.',
    eventNoun: 'incontri',
  },
  {
    slug: 'baseball',
    name: 'Baseball',
    href: '/baseball',
    apiPath: 'baseball',
    status: 'predisposed',
    focus: 'MLB · NPB',
    blurb: 'Archivio predisposto. STATWIN non inventa inning o score.',
    eventNoun: 'partite',
  },
  {
    slug: 'american-football',
    name: 'Football americano',
    href: '/american-football',
    apiPath: 'american-football',
    status: 'predisposed',
    focus: 'NFL · College',
    blurb: 'Desk analitico per NFL e college. Vuoto finche non arriva un provider legale.',
    eventNoun: 'partite',
  },
  {
    slug: 'ice-hockey',
    name: 'Hockey su ghiaccio',
    href: '/ice-hockey',
    apiPath: 'ice-hockey',
    status: 'predisposed',
    focus: 'NHL · Europa',
    blurb: 'Modulo per NHL e campionati europei. Nessun gol inventato.',
    eventNoun: 'partite',
  },
  {
    slug: 'formula1',
    name: 'Formula 1',
    href: '/formula1',
    apiPath: 'formula1',
    status: 'predisposed',
    focus: 'Mondiale · Motorsport',
    blurb: 'Calendario solo da fonte ufficiale. Nessun tempo di gara simulato.',
    eventNoun: 'gare',
  },
  {
    slug: 'horse-racing',
    name: 'Ippica',
    href: '/horse-racing',
    apiPath: 'horse-racing',
    status: 'predisposed',
    focus: 'Ippica · Trotto',
    blurb: 'Desk predisposto. Nessun ordine di arrivo viene creato a tavolino.',
    eventNoun: 'corse',
  },
  {
    slug: 'rugby',
    name: 'Rugby',
    href: '/rugby',
    apiPath: 'rugby',
    status: 'predisposed',
    focus: 'Six Nations · World Cup',
    blurb: 'Unione e league: stesso rigoroso rispetto delle fonti.',
    eventNoun: 'incontri',
  },
  {
    slug: 'handball',
    name: 'Pallamano',
    href: '/handball',
    apiPath: 'handball',
    status: 'predisposed',
    focus: 'EHF · campionati',
    blurb: 'Modulo pronto. L\'AI non riempie i vuoti.',
    eventNoun: 'partite',
  },
  {
    slug: 'mma',
    name: 'MMA / UFC',
    href: '/mma',
    apiPath: 'mma',
    status: 'predisposed',
    focus: 'UFC · Combat',
    blurb: 'Sport da combattimento in modalita analisi. Nessun verdetto inventato.',
    eventNoun: 'incontri',
  },
  {
    slug: 'golf',
    name: 'Golf',
    href: '/golf',
    apiPath: 'golf',
    status: 'predisposed',
    focus: 'PGA · Major',
    blurb: 'Desk predisposto per i major. Nessun leaderboard fittizio.',
    eventNoun: 'tornei',
  },
  {
    slug: 'cycling',
    name: 'Ciclismo',
    href: '/cycling',
    apiPath: 'cycling',
    status: 'predisposed',
    focus: 'Grand Tour · WorldTour',
    blurb: 'Modulo per corse a tappe e classiche. Tempi solo da fonte ufficiale.',
    eventNoun: 'corse',
  },
  {
    slug: 'cricket',
    name: 'Cricket',
    href: '/cricket',
    apiPath: 'cricket',
    status: 'predisposed',
    focus: 'Test · IPL · ODI',
    blurb: 'Desk predisposto. Nessun scorecard viene generato in assenza di provider.',
    eventNoun: 'incontri',
  },
  {
    slug: 'darts',
    name: 'Darts',
    href: '/darts',
    apiPath: 'darts',
    status: 'predisposed',
    focus: 'PDC · Major',
    blurb: 'Modulo opzionale, stesso standard: niente risultati inventati.',
    eventNoun: 'incontri',
  },
];

export function findSport(slug: string): SportDefinition | undefined {
  return SPORT_CATALOG.find((sport) => sport.slug === slug);
}

export function isSportPath(pathname: string): boolean {
  return SPORT_CATALOG.some((sport) => pathname === sport.href || pathname.startsWith(`${sport.href}/`));
}
