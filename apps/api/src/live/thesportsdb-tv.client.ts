import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { listingFromStation, parseTvStations, sanitizeListings } from './official-watch.allowlist';
import type { OfficialWatchListing } from './official-watch.types';

type Cached = { at: number; listings: OfficialWatchListing[] };

const CACHE_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 2500;
const MAX_LOOKUPS = 8;

@Injectable()
export class TheSportsDbTvClient {
  private readonly logger = new Logger(TheSportsDbTvClient.name);
  private readonly cache = new Map<string, Cached>();

  constructor(private readonly config: ConfigService) {}

  async listingsForMatches(externalIds: Array<string | null | undefined>): Promise<Map<string, OfficialWatchListing[]>> {
    const result = new Map<string, OfficialWatchListing[]>();
    const eventIds: Array<{ matchKey: string; eventId: string }> = [];
    for (const externalId of externalIds) {
      const eventId = parseTsdEventId(externalId);
      if (!eventId || !externalId) continue;
      eventIds.push({ matchKey: externalId, eventId });
    }

    const unique = [...new Map(eventIds.map((item) => [item.eventId, item])).values()].slice(0, MAX_LOOKUPS);
    await Promise.all(
      unique.map(async (item) => {
        const listings = await this.lookup(item.eventId);
        result.set(item.matchKey, listings);
        result.set(item.eventId, listings);
      }),
    );
    return result;
  }

  private async lookup(eventId: string): Promise<OfficialWatchListing[]> {
    const cached = this.cache.get(eventId);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.listings;

    const listings = await this.fetchStations(eventId);
    this.cache.set(eventId, { at: Date.now(), listings });
    return listings;
  }

  private async fetchStations(eventId: string): Promise<OfficialWatchListing[]> {
    const base = (this.config.get<string>('football.theSportsDbBaseUrl') ?? 'https://www.thesportsdb.com/api/v1/json').replace(
      /\/$/,
      '',
    );
    const key = this.config.get<string>('football.theSportsDbKey') ?? '3';
    const url = `${base}/${key}/lookupevent.php?id=${encodeURIComponent(eventId)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!res.ok) return [];
      const payload = (await res.json()) as {
        events?: Array<{ strTVStation?: string | null; strChannel?: string | null }>;
      };
      const event = payload.events?.[0];
      const names = [...parseTvStations(event?.strTVStation), ...parseTvStations(event?.strChannel)];
      return sanitizeListings(names.map((name) => listingFromStation(name)).filter((item): item is OfficialWatchListing => Boolean(item)));
    } catch (error) {
      this.logger.debug(`TheSportsDB TV lookup skipped for ${eventId}: ${String(error)}`);
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}

export function parseTsdEventId(externalId?: string | null): string | null {
  if (!externalId) return null;
  const match = /^tsd:match:(\d+)$/i.exec(externalId.trim());
  return match?.[1] ?? null;
}
