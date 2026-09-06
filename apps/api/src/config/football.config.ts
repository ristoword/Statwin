import { registerAs } from '@nestjs/config';
import { DEFAULT_OPENLIGA_LEAGUES, DEFAULT_TSD_LEAGUES } from '../data-providers/football/european-leagues';

export default registerAs('football', () => ({
  provider: process.env.FOOTBALL_DATA_PROVIDER ?? 'composite',
  openLigaDbBaseUrl: process.env.OPENLIGADB_BASE_URL ?? 'https://api.openligadb.de',
  seasonYear: process.env.OPENLIGADB_SEASON ?? String(new Date().getFullYear()),
  leagues: process.env.OPENLIGADB_LEAGUES ?? DEFAULT_OPENLIGA_LEAGUES,
  theSportsDbBaseUrl: process.env.THESPORTSDB_BASE_URL ?? 'https://www.thesportsdb.com/api/v1/json',
  theSportsDbKey: process.env.THESPORTSDB_API_KEY ?? '3',
  theSportsDbSeason: process.env.THESPORTSDB_SEASON ?? '2026-2027',
  theSportsDbLeagues: process.env.THESPORTSDB_LEAGUES ?? DEFAULT_TSD_LEAGUES,
}));
