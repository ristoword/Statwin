import { Injectable } from '@nestjs/common';
import { MatchStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import { listingFromStation, parseTvStations, sanitizeListings } from './official-watch.allowlist';
import { catalogCoverage, listingsForCompetition } from './official-watch.catalog';
import type { OfficialWatchListing } from './official-watch.types';
import { parseTsdEventId, TheSportsDbTvClient } from './thesportsdb-tv.client';

const LIVE_STATUSES: MatchStatus[] = [MatchStatus.LIVE, MatchStatus.HALF_TIME];
const HORIZON_MS = 7 * 24 * 60 * 60 * 1000;
const LOOKBACK_MS = 3 * 60 * 60 * 1000;

export const LIVE_DISCLAIMER =
  'Solo elenchi ufficiali e legali (siti di lega, club/lega e broadcaster autorizzati pubblicamente). STATWIN non è un broadcaster e non offre streaming. 18+. Nessuna vincita promessa.';

export type LiveMatchDto = {
  id: string;
  status: MatchStatus;
  kickoff: Date;
  venue: string | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  competition: { id: string | null; name: string; country: string | null };
  score: { home: number; away: number } | null;
  listings: OfficialWatchListing[];
};

export type LiveResponse = {
  disclaimer: string;
  generatedAt: string;
  policy: {
    officialOnly: true;
    notABroadcaster: true;
    ageRestriction: '18+';
    noInventedScores: true;
    noUnofficialStreams: true;
  };
  coverage: Array<{ id: string; country: string; aliases: string[] }>;
  live: LiveMatchDto[];
  upcoming: LiveMatchDto[];
  groups: Array<{
    key: string;
    competition: string;
    country: string | null;
    matches: LiveMatchDto[];
  }>;
  empty: {
    reason: 'no_matches' | 'no_official_listings';
    message: string;
    unlistedCount: number;
  } | null;
};

@Injectable()
export class LiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tsdTv: TheSportsDbTvClient,
  ) {}

  async list(filters?: { competition?: string; country?: string }): Promise<LiveResponse> {
    const now = new Date();
    const matches = await this.prisma.match.findMany({
      where: {
        sport: { slug: 'football' },
        OR: [
          { status: { in: LIVE_STATUSES } },
          {
            status: MatchStatus.SCHEDULED,
            kickoff: { gte: new Date(now.getTime() - LOOKBACK_MS), lte: new Date(now.getTime() + HORIZON_MS) },
          },
        ],
      },
      include: { homeTeam: true, awayTeam: true, competition: true },
      orderBy: { kickoff: 'asc' },
      take: 80,
    });

    const liveExternalIds = matches.filter((match) => LIVE_STATUSES.includes(match.status)).map((match) => match.externalId);
    const tsdMap = await this.tsdTv.listingsForMatches(liveExternalIds);

    const listed: LiveMatchDto[] = [];
    let unlistedCount = 0;

    for (const match of matches) {
      const catalog = listingsForCompetition(match.competition?.name, match.competition?.country);
      const fromTsd =
        tsdMap.get(match.externalId ?? '') ??
        tsdMap.get(parseTsdEventId(match.externalId) ?? '') ??
        [];
      const listings = sanitizeListings([...catalog, ...fromTsd]);
      if (listings.length === 0) {
        unlistedCount += 1;
        continue;
      }

      const dto = toDto(match, listings);
      if (filters?.competition && !matchesFilter(dto.competition.name, filters.competition)) continue;
      if (filters?.country && !matchesFilter(dto.competition.country ?? '', filters.country)) continue;
      listed.push(dto);
    }

    const live = listed.filter((item) => LIVE_STATUSES.includes(item.status));
    const upcoming = listed.filter((item) => item.status === MatchStatus.SCHEDULED);
    const groups = groupByCompetition(listed);

    return {
      disclaimer: LIVE_DISCLAIMER,
      generatedAt: new Date().toISOString(),
      policy: {
        officialOnly: true,
        notABroadcaster: true,
        ageRestriction: '18+',
        noInventedScores: true,
        noUnofficialStreams: true,
      },
      coverage: catalogCoverage(),
      live,
      upcoming,
      groups,
      empty: emptyState(matches.length, listed.length, unlistedCount),
    };
  }

  async forMatch(id: string): Promise<{ disclaimer: string; match: LiveMatchDto | null }> {
    const match = await this.prisma.match.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true, competition: true },
    });
    if (!match) return { disclaimer: LIVE_DISCLAIMER, match: null };

    const catalog = listingsForCompetition(match.competition?.name, match.competition?.country);
    const tsdMap = LIVE_STATUSES.includes(match.status)
      ? await this.tsdTv.listingsForMatches([match.externalId])
      : new Map<string, OfficialWatchListing[]>();
    const listings = sanitizeListings([
      ...catalog,
      ...(tsdMap.get(match.externalId ?? '') ?? []),
    ]);
    return { disclaimer: LIVE_DISCLAIMER, match: toDto(match, listings) };
  }
}

function toDto(
  match: {
    id: string;
    status: MatchStatus;
    kickoff: Date;
    venue: string | null;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: { name: string };
    awayTeam: { name: string };
    competition: { id: string; name: string; country: string | null } | null;
  },
  listings: OfficialWatchListing[],
): LiveMatchDto {
  const officialScore =
    match.homeScore != null && match.awayScore != null ? { home: match.homeScore, away: match.awayScore } : null;
  return {
    id: match.id,
    status: match.status,
    kickoff: match.kickoff,
    venue: match.venue,
    homeTeam: { name: match.homeTeam.name },
    awayTeam: { name: match.awayTeam.name },
    competition: {
      id: match.competition?.id ?? null,
      name: match.competition?.name ?? 'Calcio',
      country: match.competition?.country ?? null,
    },
    score: officialScore,
    listings,
  };
}

function groupByCompetition(matches: LiveMatchDto[]) {
  const map = new Map<string, LiveMatchDto[]>();
  for (const match of matches) {
    const key = match.competition.id ?? match.competition.name;
    const list = map.get(key) ?? [];
    list.push(match);
    map.set(key, list);
  }
  return [...map.entries()].map(([key, items]) => ({
    key,
    competition: items[0].competition.name,
    country: items[0].competition.country,
    matches: items,
  }));
}

function emptyState(
  totalInWindow: number,
  listed: number,
  unlistedCount: number,
): LiveResponse['empty'] {
  if (listed > 0) return null;
  if (totalInWindow === 0) {
    return {
      reason: 'no_matches',
      message:
        'Nessuna gara live o imminente in archivio. La sezione si popola dopo la sincronizzazione del calendario, solo con elenchi ufficiali.',
      unlistedCount: 0,
    };
  }
  return {
    reason: 'no_official_listings',
    message:
      'Ci sono partite in programma, ma nessuna ha un elenco ufficiale/legale noto. STATWIN non inventa canali e non indica stream non ufficiali.',
    unlistedCount,
  };
}

function matchesFilter(value: string, filter: string): boolean {
  return value.toLowerCase().includes(filter.toLowerCase());
}

export function mergeOfficialListings(
  competitionName?: string | null,
  country?: string | null,
  tvRaw?: string | null,
): OfficialWatchListing[] {
  const catalog = listingsForCompetition(competitionName, country);
  const tv = sanitizeListings(
    parseTvStations(tvRaw)
      .map((name) => listingFromStation(name))
      .filter((item): item is OfficialWatchListing => Boolean(item)),
  );
  return sanitizeListings([...catalog, ...tv]);
}
