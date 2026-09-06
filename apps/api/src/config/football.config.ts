import { registerAs } from '@nestjs/config';

export default registerAs('football', () => ({
  provider: process.env.FOOTBALL_DATA_PROVIDER ?? 'openligadb',
  openLigaDbBaseUrl: process.env.OPENLIGADB_BASE_URL ?? 'https://api.openligadb.de',
  seasonYear: process.env.OPENLIGADB_SEASON ?? String(new Date().getFullYear()),
  leagues: process.env.OPENLIGADB_LEAGUES ?? 'bl1',
}));
