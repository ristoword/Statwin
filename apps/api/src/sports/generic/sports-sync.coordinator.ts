import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FootballSyncService } from '../football/football-sync.service';
import { BasketballSyncService } from '../basketball/basketball-sync.service';
import { SportSyncService, type SportSyncResult } from './sport-sync.service';
import { WIRED_TSD_SPORTS, EMPTY_SPORTS } from '../../data-providers/thesportsdb/wired-sports';

@Injectable()
export class SportsSyncCoordinator {
  private readonly logger = new Logger(SportsSyncCoordinator.name);

  constructor(
    private readonly football: FootballSyncService,
    private readonly basketball: BasketballSyncService,
    private readonly generic: SportSyncService,
    private readonly config: ConfigService,
  ) {}

  async syncAll(only?: string[]) {
    const stagger = Number(this.config.get('sportsSync.staggerMs') ?? 2500);
    const wanted = only?.length ? new Set(only) : null;
    const results: SportSyncResult[] = [];

    const run = async (slug: string, task: () => Promise<SportSyncResult | Record<string, unknown>>) => {
      if (wanted && !wanted.has(slug)) return;
      try {
        const raw = await task();
        const result = normalizeResult(slug, raw);
        results.push(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Sync ${slug}: ${message}`);
        results.push({
          sport: slug,
          provider: slug,
          source: slug,
          note: message.includes('429')
            ? 'TheSportsDB ha risposto 429 (rate limit). Riprova più tardi. Nessun risultato inventato.'
            : `Sync interrotto: ${message}. Nessun risultato inventato.`,
          imported: { competitions: 0, teams: 0, matches: 0, standings: 0 },
          error: message,
        });
      }
      await delay(stagger);
    };

    await run('football', async () => this.football.syncAll());
    await run('basketball', async () => this.basketball.syncAll());

    for (const sport of WIRED_TSD_SPORTS) {
      await run(sport.slug, () => this.generic.syncSport(sport.slug));
    }

    for (const sport of EMPTY_SPORTS) {
      if (wanted && !wanted.has(sport.slug)) continue;
      results.push({
        sport: sport.slug,
        provider: 'none',
        source: 'none',
        note: sport.reason,
        imported: { competitions: 0, teams: 0, matches: 0, standings: 0 },
      });
    }

    return {
      note: 'Sincronizzazione sequenziale con backoff. Solo dati del provider. Nessun punteggio inventato.',
      sports: results,
    };
  }

  async syncStandings(only?: string[]) {
    const wanted = only?.length ? new Set(only) : null;
    const results: SportSyncResult[] = [];

    if (!wanted || wanted.has('basketball')) {
      const raw = await this.basketball.syncStandings();
      results.push(normalizeResult('basketball', raw));
    }

    for (const sport of WIRED_TSD_SPORTS) {
      if (wanted && !wanted.has(sport.slug)) continue;
      results.push(await this.generic.syncStandings(sport.slug));
    }

    return {
      note: 'Solo tabelle ufficiali del provider. Nessuna classifica inventata.',
      sports: results,
    };
  }
}

function normalizeResult(slug: string, raw: SportSyncResult | Record<string, unknown>): SportSyncResult {
  if ('sport' in raw && 'imported' in raw) {
    return raw as SportSyncResult;
  }
  const imported = (raw.imported ?? {}) as SportSyncResult['imported'];
  return {
    sport: slug,
    provider: String(raw.provider ?? slug),
    source: String(raw.source ?? raw.provider ?? slug),
    note: String(raw.note ?? 'Solo dati restituiti dal provider. Nessun risultato inventato.'),
    imported: {
      competitions: imported.competitions ?? 0,
      teams: imported.teams ?? 0,
      matches: imported.matches ?? 0,
      standings: imported.standings ?? 0,
    },
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}
