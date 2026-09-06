import { PrismaService } from '../../database/prisma/prisma.service';
import { ExternalStanding } from '../../data-providers/interfaces/external-football';

export type StandingFormat = 'points' | 'win-loss' | 'ranking' | 'none';

export const NO_LEAGUE_TABLE_SPORTS = new Set([
  'tennis',
  'formula1',
  'mma',
  'golf',
  'cycling',
  'darts',
  'horse-racing',
]);

export const WIN_LOSS_SPORTS = new Set([
  'basketball',
  'american-football',
  'ice-hockey',
  'baseball',
]);

export const POINTS_TABLE_SPORTS = new Set([
  'football',
  'rugby',
  'handball',
  'volleyball',
  'cricket',
]);

export type StandingRow = {
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  team?: { name: string };
  season?: { name?: string | null };
};

export type StandingsPayload = {
  sport: string;
  competitionId: string | null;
  format: StandingFormat;
  note: string | null;
  items: StandingRow[];
};

export function classifyStandingFormat(
  slug: string,
  rows: Array<Pick<StandingRow, 'played' | 'won' | 'drawn' | 'lost' | 'points'>>,
): StandingFormat {
  if (!rows.length) return 'none';
  if (WIN_LOSS_SPORTS.has(slug)) return 'win-loss';
  const hasDraws = rows.some((row) => (row.drawn ?? 0) > 0);
  const hasPoints = rows.some((row) => (row.points ?? 0) > 0);
  const hasWl = rows.some((row) => (row.won ?? 0) > 0 || (row.lost ?? 0) > 0);
  const hasPlayed = rows.some((row) => (row.played ?? 0) > 0);
  if (POINTS_TABLE_SPORTS.has(slug) || hasDraws) return 'points';
  if (hasWl && !hasDraws) return 'win-loss';
  if (hasPlayed || hasPoints) return hasDraws ? 'points' : 'win-loss';
  return 'ranking';
}

export function standingsUnavailableNote(slug: string): string {
  if (NO_LEAGUE_TABLE_SPORTS.has(slug)) {
    return 'Classifica non fornita dalla fonte';
  }
  return 'Nessuna tabella ufficiale in archivio per questa competizione. Non viene generata una classifica fittizia.';
}

export function toStandingsPayload(
  slug: string,
  competitionId: string | undefined,
  items: StandingRow[],
): StandingsPayload {
  const format = classifyStandingFormat(slug, items);
  return {
    sport: slug,
    competitionId: competitionId ?? null,
    format,
    note: items.length ? null : standingsUnavailableNote(slug),
    items,
  };
}

export function strengthFromStanding(
  slug: string,
  row: Pick<StandingRow, 'played' | 'won' | 'points'>,
): number | null {
  if (!row.played) return null;
  if (WIN_LOSS_SPORTS.has(slug) || classifyStandingFormat(slug, [row as StandingRow]) === 'win-loss') {
    return row.won / row.played;
  }
  return row.points / (row.played * 3);
}

export function leagueShortcutFromExternalId(externalId?: string | null): string | undefined {
  if (!externalId) return undefined;
  const parts = externalId.split(':').filter(Boolean);
  return parts[parts.length - 1] || undefined;
}

export async function loadOfficialStandings(prisma: PrismaService, slug: string, competitionId?: string) {
  const competition = {
    sport: { slug },
    ...(competitionId ? { id: competitionId } : {}),
  };
  const current = await prisma.standing.findMany({
    where: { season: { isCurrent: true, competition } },
    include: { team: true, season: { include: { competition: true } } },
    orderBy: { position: 'asc' },
  });
  if (current.length) return current;

  const any = await prisma.standing.findMany({
    where: { season: { competition } },
    include: { team: true, season: { include: { competition: true } } },
    orderBy: [{ season: { updatedAt: 'desc' } }, { position: 'asc' }],
  });
  if (!any.length) return [];
  const seasonId = any[0].seasonId;
  return any.filter((row) => row.seasonId === seasonId).sort((a, b) => a.position - b.position);
}

export async function persistOfficialStandings(
  prisma: PrismaService,
  params: { sportId: string; seasonId: string; rows: ExternalStanding[] },
): Promise<number> {
  let saved = 0;
  for (const row of params.rows) {
    const team = await resolveOfficialTeam(prisma, params.sportId, row);
    if (!team) continue;
    await prisma.standing.upsert({
      where: { seasonId_teamId: { seasonId: params.seasonId, teamId: team.id } },
      update: {
        position: row.position,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: row.points,
      },
      create: {
        seasonId: params.seasonId,
        teamId: team.id,
        position: row.position,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: row.points,
      },
    });
    saved += 1;
  }
  return saved;
}

async function resolveOfficialTeam(
  prisma: PrismaService,
  sportId: string,
  row: ExternalStanding,
): Promise<{ id: string } | null> {
  const byExternal = await prisma.team.findUnique({ where: { externalId: row.teamExternalId } });
  if (byExternal) return byExternal;

  const name = row.teamName?.trim();
  if (name) {
    const byName = await prisma.team.findFirst({
      where: { sportId, name: { equals: name, mode: 'insensitive' } },
    });
    if (byName) return byName;
    return prisma.team.upsert({
      where: { externalId: row.teamExternalId },
      update: { name },
      create: { sportId, externalId: row.teamExternalId, name },
    });
  }
  return null;
}
