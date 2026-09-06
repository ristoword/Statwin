import { registerAs } from '@nestjs/config';

export default registerAs('basketball', () => ({
  provider: process.env.BASKETBALL_DATA_PROVIDER ?? 'thesportsdb',
  theSportsDbBaseUrl: process.env.THESPORTSDB_BASE_URL ?? 'https://www.thesportsdb.com/api/v1/json',
  theSportsDbKey: process.env.THESPORTSDB_API_KEY ?? '3',
  theSportsDbSeason: process.env.THESPORTSDB_BASKETBALL_SEASON ?? '2025-2026',
  theSportsDbLeagues: process.env.THESPORTSDB_BASKETBALL_LEAGUES ?? '4387,4546',
}));
