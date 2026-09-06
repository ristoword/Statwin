export type OfficialWatchListing = {
  id: string;
  label: string;
  url: string;
  kind: 'official_league' | 'licensed_broadcaster';
  territory?: string;
  note: string;
  source: 'competition_catalog' | 'thesportsdb_tv';
};

export type LiveMatch = {
  id: string;
  status: string;
  kickoff: string;
  venue?: string | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  competition: { id: string | null; name: string; country: string | null };
  score: { home: number; away: number } | null;
  listings: OfficialWatchListing[];
};

export type LivePayload = {
  disclaimer?: string;
  generatedAt?: string;
  policy?: {
    officialOnly?: boolean;
    notABroadcaster?: boolean;
    ageRestriction?: string;
  };
  coverage?: Array<{ id: string; country: string; aliases: string[] }>;
  live?: LiveMatch[];
  upcoming?: LiveMatch[];
  groups?: Array<{
    key: string;
    competition: string;
    country: string | null;
    matches: LiveMatch[];
  }>;
  empty?: {
    reason: 'no_matches' | 'no_official_listings';
    message: string;
    unlistedCount: number;
  } | null;
};

export const LIVE_FALLBACK: LivePayload = {
  disclaimer:
    'Solo elenchi ufficiali e legali. STATWIN non è un broadcaster e non offre streaming. 18+. Nessuna vincita promessa.',
  live: [],
  upcoming: [],
  groups: [],
  empty: {
    reason: 'no_matches',
    message: 'Nessuna diretta ufficiale disponibile in questo momento. I canali non ufficiali non vengono mai indicati.',
    unlistedCount: 0,
  },
};
