import { isOfficialHttpsUrl, normalizeWatchText, sanitizeListings } from './official-watch.allowlist';
import { DESTINATION_NOTE, type CatalogEntry, type OfficialWatchListing } from './official-watch.types';

function league(id: string, label: string, url: string, territory?: string): CatalogEntry['listings'][number] {
  return {
    id,
    label,
    url,
    kind: 'official_league',
    territory,
    note: DESTINATION_NOTE,
  };
}

function broadcaster(id: string, label: string, url: string, territory?: string): CatalogEntry['listings'][number] {
  return {
    id,
    label,
    url,
    kind: 'licensed_broadcaster',
    territory,
    note: DESTINATION_NOTE,
  };
}

/**
 * Official destination pages only (league sites + publicly listed licensed homes).
 * Not match-specific streams. More specific aliases must come first.
 */
export const OFFICIAL_WATCH_CATALOG: CatalogEntry[] = [
  {
    id: 'serie-c',
    aliases: ['serie c', 'serie c girone', 'lega pro'],
    country: 'Italy',
    listings: [
      league('serie-c-lega', 'Lega Pro', 'https://www.lega-pro.com/', 'Italia'),
      league('serie-c-figc', 'FIGC', 'https://www.figc.it/', 'Italia'),
    ],
  },
  {
    id: 'serie-b',
    aliases: ['serie b', 'serie bkt'],
    country: 'Italy',
    listings: [
      league('serie-b-lega', 'Lega B', 'https://www.legab.it/', 'Italia'),
      broadcaster('serie-b-dazn', 'DAZN Italia', 'https://www.dazn.com/it-IT/home', 'Italia'),
    ],
  },
  {
    id: 'serie-a',
    aliases: ['serie a', 'serie a enilive', 'serie a tim'],
    country: 'Italy',
    listings: [
      league('serie-a-lega', 'Lega Serie A', 'https://www.legaseriea.it/', 'Italia'),
      broadcaster('serie-a-dazn', 'DAZN Italia', 'https://www.dazn.com/it-IT/home', 'Italia'),
    ],
  },
  {
    id: 'coppa-italia',
    aliases: ['coppa italia', 'coppa italia frecciarossa'],
    country: 'Italy',
    listings: [
      league('coppa-figc', 'FIGC — Coppa Italia', 'https://www.figc.it/', 'Italia'),
      broadcaster('coppa-dazn', 'DAZN Italia', 'https://www.dazn.com/it-IT/home', 'Italia'),
    ],
  },
  {
    id: 'supercoppa-italiana',
    aliases: ['supercoppa italiana', 'supercoppa'],
    country: 'Italy',
    listings: [
      league('supercoppa-lega', 'Lega Serie A', 'https://www.legaseriea.it/', 'Italia'),
    ],
  },
  {
    id: 'premier-league',
    aliases: ['premier league', 'english premier league', 'epl'],
    country: 'England',
    listings: [
      league('pl-official', 'Premier League', 'https://www.premierleague.com/', 'UK'),
      league('pl-broadcast', 'Premier League — Broadcasting', 'https://www.premierleague.com/broadcasting', 'UK'),
    ],
  },
  {
    id: 'efl-championship',
    aliases: ['efl championship', 'championship', 'english championship'],
    country: 'England',
    listings: [league('efl', 'EFL', 'https://www.efl.com/', 'UK')],
  },
  {
    id: 'fa-cup',
    aliases: ['fa cup', 'emirates fa cup'],
    country: 'England',
    listings: [league('fa', 'The FA', 'https://www.thefa.com/', 'UK')],
  },
  {
    id: 'bundesliga-2',
    aliases: ['2 bundesliga', 'bundesliga 2', 'zweite bundesliga', '2. bundesliga'],
    country: 'Germany',
    listings: [league('bl2', '2. Bundesliga', 'https://www.bundesliga.com/en/2bundesliga', 'Germania')],
  },
  {
    id: 'bundesliga',
    aliases: ['1 bundesliga', 'bundesliga 1', 'bundesliga'],
    country: 'Germany',
    listings: [league('bl1', 'Bundesliga', 'https://www.bundesliga.com/en/bundesliga', 'Germania')],
  },
  {
    id: 'dfb-pokal',
    aliases: ['dfb pokal', 'dfb-pokal'],
    country: 'Germany',
    listings: [league('dfb', 'DFB', 'https://www.dfb.de/', 'Germania')],
  },
  {
    id: 'la-liga-2',
    aliases: ['laliga2', 'la liga 2', 'segunda division', 'segunda divisao', 'laliga hypermotion'],
    country: 'Spain',
    listings: [league('laliga2', 'LALIGA HYPERMOTION', 'https://www.laliga.com/', 'Spagna')],
  },
  {
    id: 'la-liga',
    aliases: ['la liga', 'laliga', 'laliga ea sports', 'primera division'],
    country: 'Spain',
    listings: [league('laliga', 'LALIGA', 'https://www.laliga.com/', 'Spagna')],
  },
  {
    id: 'copa-del-rey',
    aliases: ['copa del rey'],
    country: 'Spain',
    listings: [league('rfef', 'RFEF', 'https://www.rfef.es/', 'Spagna')],
  },
  {
    id: 'ligue-2',
    aliases: ['ligue 2', 'french ligue 2'],
    country: 'France',
    listings: [league('ligue2', 'Ligue 2', 'https://www.ligue2.fr/', 'Francia')],
  },
  {
    id: 'ligue-1',
    aliases: ['ligue 1', 'ligue 1 mcdonalds', 'french ligue 1'],
    country: 'France',
    listings: [league('ligue1', 'Ligue 1', 'https://www.ligue1.com/', 'Francia')],
  },
  {
    id: 'coupe-de-france',
    aliases: ['coupe de france'],
    country: 'France',
    listings: [league('fff-coupe', 'Ligue 1 / FFF', 'https://www.ligue1.com/', 'Francia')],
  },
  {
    id: 'ucl',
    aliases: ['uefa champions league', 'champions league', 'ucl'],
    country: 'Europe',
    listings: [league('ucl', 'UEFA Champions League', 'https://www.uefa.com/uefachampionsleague/', 'Europa')],
  },
  {
    id: 'uel',
    aliases: ['uefa europa league', 'europa league', 'uel'],
    country: 'Europe',
    listings: [league('uel', 'UEFA Europa League', 'https://www.uefa.com/uefaeuropaleague/', 'Europa')],
  },
  {
    id: 'uecl',
    aliases: ['uefa europa conference league', 'uefa conference league', 'conference league', 'uecl'],
    country: 'Europe',
    listings: [
      league('uecl', 'UEFA Conference League', 'https://www.uefa.com/uefaconferenceleague/', 'Europa'),
    ],
  },
  {
    id: 'uefa-super-cup',
    aliases: ['uefa super cup', 'super coppa uefa'],
    country: 'Europe',
    listings: [league('uefa-super', 'UEFA Super Cup', 'https://www.uefa.com/uefasupercup/', 'Europa')],
  },
  {
    id: 'nations-league',
    aliases: ['uefa nations league', 'nations league'],
    country: 'Europe',
    listings: [league('unl', 'UEFA Nations League', 'https://www.uefa.com/uefanationsleague/', 'Europa')],
  },
  {
    id: 'euro',
    aliases: ['uefa euro', 'european championship'],
    country: 'Europe',
    listings: [league('euro', 'UEFA EURO', 'https://www.uefa.com/euro2028/', 'Europa')],
  },
  {
    id: 'primeira-liga',
    aliases: ['primeira liga', 'liga portugal', 'primeiraliga'],
    country: 'Portugal',
    listings: [league('lportugal', 'Liga Portugal', 'https://www.ligaportugal.pt/', 'Portogallo')],
  },
  {
    id: 'eredivisie',
    aliases: ['eredivisie'],
    country: 'Netherlands',
    listings: [league('eredivisie', 'Eredivisie', 'https://eredivisie.eu/', 'Paesi Bassi')],
  },
  {
    id: 'spfl',
    aliases: ['scottish premiership', 'scottish premier', 'spfl', 'cinch premiership'],
    country: 'Scotland',
    listings: [league('spfl', 'SPFL', 'https://spfl.co.uk/', 'Scozia')],
  },
  {
    id: 'pro-league',
    aliases: ['belgian pro league', 'pro league', 'jupiler pro league'],
    country: 'Belgium',
    listings: [league('proleague', 'Pro League', 'https://www.proleague.be/', 'Belgio')],
  },
  {
    id: 'swiss-super-league',
    aliases: ['swiss super league', 'super league switzerland'],
    country: 'Switzerland',
    listings: [league('sfl', 'Swiss Football League', 'https://www.sfl.ch/', 'Svizzera')],
  },
  {
    id: 'austrian-bundesliga',
    aliases: ['austrian bundesliga', 'admiral bundesliga'],
    country: 'Austria',
    listings: [league('at-bl', 'Österreichische Bundesliga', 'https://www.bundesliga.at/', 'Austria')],
  },
  {
    id: 'super-lig',
    aliases: ['super lig', 'superlig', 'süper lig', 'turkish super lig'],
    country: 'Turkey',
    listings: [league('tff', 'TFF', 'https://www.tff.org/', 'Turchia')],
  },
  {
    id: 'super-league-greece',
    aliases: ['super league greece', 'greek super league', 'superleague greece'],
    country: 'Greece',
    listings: [league('slgr', 'Super League Greece', 'https://www.slgr.gr/', 'Grecia')],
  },
  {
    id: 'ekstraklasa',
    aliases: ['ekstraklasa'],
    country: 'Poland',
    listings: [league('ekstra', 'Ekstraklasa', 'https://www.ekstraklasa.org/', 'Polonia')],
  },
  {
    id: 'world-cup',
    aliases: ['fifa world cup', 'world cup'],
    country: 'World',
    listings: [league('fifa-wc', 'FIFA', 'https://www.fifa.com/', 'Mondo')],
  },
  {
    id: 'nba',
    aliases: ['nba', 'national basketball association'],
    country: 'USA',
    listings: [league('nba', 'NBA', 'https://www.nba.com/', 'USA')],
  },
  {
    id: 'euroleague',
    aliases: ['euroleague', 'euroleague basketball'],
    country: 'Europe',
    listings: [league('euroleague', 'EuroLeague', 'https://www.euroleaguebasketball.net/', 'Europa')],
  },
  {
    id: 'nfl',
    aliases: ['nfl', 'national football league'],
    country: 'USA',
    listings: [league('nfl', 'NFL', 'https://www.nfl.com/', 'USA')],
  },
  {
    id: 'mlb',
    aliases: ['mlb', 'major league baseball'],
    country: 'USA',
    listings: [league('mlb', 'MLB', 'https://www.mlb.com/', 'USA')],
  },
  {
    id: 'nhl',
    aliases: ['nhl', 'national hockey league'],
    country: 'USA',
    listings: [league('nhl', 'NHL', 'https://www.nhl.com/', 'USA')],
  },
  {
    id: 'formula-1',
    aliases: ['formula 1', 'formula one', 'f1'],
    country: 'World',
    listings: [league('f1', 'Formula 1', 'https://www.formula1.com/', 'Mondo')],
  },
  {
    id: 'ufc',
    aliases: ['ufc', 'ultimate fighting championship'],
    country: 'USA',
    listings: [league('ufc', 'UFC', 'https://www.ufc.com/', 'USA')],
  },
  {
    id: 'atp',
    aliases: ['atp', 'atp tour', 'atp world tour'],
    country: 'World',
    listings: [league('atp', 'ATP Tour', 'https://www.atptour.com/', 'Mondo')],
  },
  {
    id: 'wta',
    aliases: ['wta', 'wta tour'],
    country: 'World',
    listings: [league('wta', 'WTA', 'https://www.wtatennis.com/', 'Mondo')],
  },
  {
    id: 'pga-tour',
    aliases: ['pga tour', 'pga'],
    country: 'USA',
    listings: [league('pga', 'PGA Tour', 'https://www.pgatour.com/', 'USA')],
  },
];

function aliasMatches(name: string, alias: string): boolean {
  if (!name || !alias) return false;
  if (name === alias) return true;
  return name.startsWith(`${alias} `) || name.endsWith(` ${alias}`) || name.includes(` ${alias} `);
}

export function findCatalogEntry(competitionName?: string | null, country?: string | null): CatalogEntry | null {
  const name = normalizeWatchText(competitionName ?? '');
  if (!name) return null;
  const hay = normalizeWatchText(`${competitionName ?? ''} ${country ?? ''}`);

  for (const entry of OFFICIAL_WATCH_CATALOG) {
    const aliases = [...entry.aliases].sort((a, b) => b.length - a.length).map((item) => normalizeWatchText(item));
    if (aliases.some((alias) => aliasMatches(name, alias) || aliasMatches(hay, alias))) {
      return entry;
    }
  }
  return null;
}

export function listingsForCompetition(
  competitionName?: string | null,
  country?: string | null,
): OfficialWatchListing[] {
  const entry = findCatalogEntry(competitionName, country);
  if (!entry) return [];
  return sanitizeListings(
    entry.listings
      .filter((item) => isOfficialHttpsUrl(item.url))
      .map((item) => ({ ...item, source: 'competition_catalog' as const })),
  );
}

export function catalogCoverage(): Array<{ id: string; country: string; aliases: string[] }> {
  return OFFICIAL_WATCH_CATALOG.map((entry) => ({
    id: entry.id,
    country: entry.country,
    aliases: entry.aliases,
  }));
}
