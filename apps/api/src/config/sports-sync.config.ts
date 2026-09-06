import { registerAs } from '@nestjs/config';
import { WIRED_TSD_SPORTS } from '../data-providers/thesportsdb/wired-sports';

function leaguesMap() {
  const out: Record<string, string> = {};
  for (const sport of WIRED_TSD_SPORTS) {
    out[sport.slug] = process.env[sport.envLeagues] ?? sport.defaultLeagues;
  }
  return out;
}

function seasonsMap() {
  const out: Record<string, string> = {};
  for (const sport of WIRED_TSD_SPORTS) {
    out[sport.slug] = process.env[sport.envSeason] ?? sport.defaultSeason;
  }
  return out;
}

export default registerAs('sportsSync', () => ({
  theSportsDbBaseUrl: process.env.THESPORTSDB_BASE_URL ?? 'https://www.thesportsdb.com/api/v1/json',
  theSportsDbKey: process.env.THESPORTSDB_API_KEY ?? '3',
  intervalMs: Number(process.env.SPORTS_SYNC_INTERVAL_MS ?? 6 * 60 * 60 * 1000),
  staggerMs: Number(process.env.SPORTS_SYNC_STAGGER_MS ?? 2500),
  leagues: leaguesMap(),
  seasons: seasonsMap(),
}));
