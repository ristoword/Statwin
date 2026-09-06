import { apiGet } from '../lib/api';
import { SPORT_CATALOG } from '../lib/sports-catalog';
import { SportsGrid, type SportCard } from './sports-grid';

async function loadSports(): Promise<SportCard[]> {
  try {
    const rows = await apiGet<SportCard[]>('/sports');
    if (Array.isArray(rows) && rows.length) return rows;
  } catch {
    /* directory statica se l'API non e' su */
  }
  return SPORT_CATALOG;
}

export async function SportsDirectory({ compact = false }: { compact?: boolean }) {
  const sports = await loadSports();
  return <SportsGrid sports={sports} compact={compact} />;
}
