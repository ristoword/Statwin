import { type OfficialWatchListing } from './official-watch.types';

const DESTINATION_NOTE =
  'Pagina ufficiale di destinazione: elenco legale / dove guardare. Non è lo stream di questa singola gara.';

/** Public official hosts only. Subdomains of these hosts are accepted. */
export const OFFICIAL_HOSTS = [
  'legaseriea.it',
  'legab.it',
  'lega-pro.com',
  'figc.it',
  'premierleague.com',
  'efl.com',
  'thefa.com',
  'bundesliga.com',
  'dfb.de',
  'laliga.com',
  'rfef.es',
  'ligue1.com',
  'ligue2.fr',
  'lfp.fr',
  'uefa.com',
  'fifa.com',
  'ligaportugal.pt',
  'liga-portugal.pt',
  'eredivisie.eu',
  'eredivisie.nl',
  'spfl.co.uk',
  'scottishfa.co.uk',
  'proleague.be',
  'sfl.ch',
  'bundesliga.at',
  'tff.org',
  'slgr.gr',
  'ekstraklasa.org',
  'superliga.dk',
  'allsvenskan.se',
  'eliteserien.no',
  'dazn.com',
  'sky.it',
  'sky.com',
  'skysports.com',
  'primevideo.com',
  'rai.it',
  'raiplay.it',
  'mediaset.it',
  'mediasetinfinity.mediaset.it',
  'canalplus.com',
  'beinsports.com',
  'bein.com',
  'espn.com',
  'tntsports.co.uk',
  'bbc.co.uk',
  'bbc.com',
  'itv.com',
  'peacocktv.com',
  'paramountplus.com',
  'movistarplus.es',
  'viaplay.com',
  'ziggo.nl',
  'ziggosport.nl',
  'supersport.com',
  'mlssoccer.com',
  'nba.com',
  'euroleaguebasketball.net',
  'nfl.com',
  'mlb.com',
  'nhl.com',
  'formula1.com',
  'ufc.com',
  'atptour.com',
  'wtatennis.com',
  'pgatour.com',
  'lpga.com',
] as const;

const UNOFFICIAL_NAME =
  /\b(iptv|reddit|crackstream|streameast|sportsurge|totalsportek|soccerstream|methstream|buffstream|embedstream|acestream|m3u8?|free\s*stream|watch\s*online|illegal|pirat)/i;

export type OfficialStation = {
  id: string;
  aliases: string[];
  label: string;
  url: string;
  territory?: string;
};

export const OFFICIAL_STATIONS: OfficialStation[] = [
  { id: 'dazn', aliases: ['dazn'], label: 'DAZN', url: 'https://www.dazn.com/' },
  { id: 'sky-it', aliases: ['sky sport', 'sky italia', 'sky calcio'], label: 'Sky Sport', url: 'https://sport.sky.it/', territory: 'Italia' },
  { id: 'sky-uk', aliases: ['sky sports', 'sky sports main event', 'sky sports premier league'], label: 'Sky Sports', url: 'https://www.skysports.com/', territory: 'UK' },
  { id: 'amazon', aliases: ['amazon', 'prime video', 'amazon prime'], label: 'Prime Video', url: 'https://www.primevideo.com/' },
  { id: 'rai', aliases: ['rai', 'rai sport', 'raiplay'], label: 'RaiPlay / Rai Sport', url: 'https://www.raiplay.it/', territory: 'Italia' },
  { id: 'mediaset', aliases: ['mediaset', 'mediaset infinity'], label: 'Mediaset Infinity', url: 'https://www.mediasetinfinity.mediaset.it/', territory: 'Italia' },
  { id: 'canal', aliases: ['canal+', 'canal plus', 'canalplus'], label: 'Canal+', url: 'https://www.canalplus.com/' },
  { id: 'bein', aliases: ['bein', 'bein sports'], label: 'beIN Sports', url: 'https://www.beinsports.com/' },
  { id: 'espn', aliases: ['espn', 'espn+'], label: 'ESPN', url: 'https://www.espn.com/' },
  { id: 'tnt', aliases: ['tnt sports', 'tnt'], label: 'TNT Sports', url: 'https://www.tntsports.co.uk/', territory: 'UK' },
  { id: 'bbc', aliases: ['bbc', 'bbc iplayer', 'bbc sport'], label: 'BBC Sport', url: 'https://www.bbc.co.uk/sport/football', territory: 'UK' },
  { id: 'itv', aliases: ['itv', 'itvx'], label: 'ITV Sport', url: 'https://www.itv.com/sport', territory: 'UK' },
  { id: 'peacock', aliases: ['peacock', 'nbc', 'usa network'], label: 'Peacock', url: 'https://www.peacocktv.com/' },
  { id: 'paramount', aliases: ['paramount+', 'paramount plus', 'cbs sports'], label: 'Paramount+', url: 'https://www.paramountplus.com/' },
  { id: 'movistar', aliases: ['movistar', 'movistar plus'], label: 'Movistar Plus+', url: 'https://www.movistarplus.es/', territory: 'Spagna' },
  { id: 'viaplay', aliases: ['viaplay'], label: 'Viaplay', url: 'https://www.viaplay.com/' },
];

export function normalizeWatchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function officialHostOf(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.replace(/^www\./, '');
    const match = OFFICIAL_HOSTS.find((allowed) => host === allowed || host.endsWith(`.${allowed}`));
    return match ?? null;
  } catch {
    return null;
  }
}

export function isOfficialHttpsUrl(url: string): boolean {
  return officialHostOf(url) !== null;
}

export function looksUnofficial(name: string): boolean {
  return UNOFFICIAL_NAME.test(name);
}

export function listingFromStation(stationName: string): OfficialWatchListing | null {
  const trimmed = stationName.trim();
  if (!trimmed || looksUnofficial(trimmed)) return null;
  const hay = normalizeWatchText(trimmed);
  const ranked = OFFICIAL_STATIONS.map((item) => {
    const hit = item.aliases
      .map((alias) => normalizeWatchText(alias))
      .filter((needle) => hay === needle || hay.includes(needle))
      .sort((a, b) => b.length - a.length)[0];
    return hit ? { item, score: hit.length } : null;
  })
    .filter((row): row is { item: OfficialStation; score: number } => Boolean(row))
    .sort((a, b) => b.score - a.score);
  const station = ranked[0]?.item;
  if (!station || !isOfficialHttpsUrl(station.url)) return null;
  return {
    id: `tsd:${station.id}`,
    label: station.label,
    url: station.url,
    kind: 'licensed_broadcaster',
    territory: station.territory,
    note: DESTINATION_NOTE,
    source: 'thesportsdb_tv',
  };
}

export function parseTvStations(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;/|]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function sanitizeListings<T extends { url: string; label: string }>(listings: T[]): T[] {
  const seen = new Set<string>();
  const safe: T[] = [];
  for (const listing of listings) {
    if (looksUnofficial(listing.label) || looksUnofficial(listing.url)) continue;
    if (!isOfficialHttpsUrl(listing.url)) continue;
    const key = `${listing.label.toLowerCase()}|${listing.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    safe.push(listing);
  }
  return safe;
}
