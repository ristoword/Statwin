import { notFound } from 'next/navigation';
import { apiGet } from '../lib/api';
import { asMatchDesk, type AgendaMatch } from '../lib/agenda';
import { getServerAccessToken } from '../lib/server-auth';
import { findSport } from '../lib/sports-catalog';
import {
  defaultCompetition,
  groupSportSections,
  sectionFor,
  type DeskCompetition,
} from '../lib/sport-sections';
import { PageHero } from './page-hero';
import { SportDeskBrowser } from './sport-desk-browser';

type SportOverview = {
  sport?: { name: string };
  counts?: { competitions: number; teams: number; matches: number };
  note?: string;
};

type Standing = {
  position: number;
  played: number;
  points: number;
  won?: number;
  drawn?: number;
  lost?: number;
  team: { name: string };
  season?: { name?: string | null };
};

type StandingFormat = 'points' | 'win-loss' | 'ranking' | 'none';

type StandingsPayload = {
  format?: StandingFormat;
  note?: string | null;
  items?: Standing[];
};

async function load(apiPath: string, sportSlug: string, competitionId?: string) {
  try {
    const [overview, rawCompetitions] = await Promise.all([
      apiGet<SportOverview>(`/${apiPath}`),
      apiGet<DeskCompetition[]>(`/${apiPath}/competitions`),
    ]);
    const competitions = Array.isArray(rawCompetitions) ? rawCompetitions : [];
    const selected = defaultCompetition(competitions, sportSlug, competitionId);
    const query = selected?.id ? `?competitionId=${selected.id}` : '';
    const standingsQuery = selected?.id
      ? `?sport=${encodeURIComponent(sportSlug)}&competitionId=${selected.id}`
      : `?sport=${encodeURIComponent(sportSlug)}`;
    const token = await getServerAccessToken();
    const [rawMatches, rawStandings] = await Promise.all([
      apiGet<unknown>(`/${apiPath}/matches${query}`, token),
      apiGet<StandingsPayload | Standing[]>(`/sports/standings${standingsQuery}`),
    ]);
    const table = asStandings(rawStandings, sportSlug);
    return {
      overview,
      competitions,
      selected,
      matches: asMatchDesk(rawMatches),
      standings: table.items,
      standingsFormat: table.format,
      standingsNote: table.note,
    };
  } catch {
    return {
      overview: {
        note: 'API non raggiungibile o database non ancora avviato.',
        counts: { competitions: 0, teams: 0, matches: 0 },
      },
      competitions: [] as DeskCompetition[],
      selected: undefined as DeskCompetition | undefined,
      matches: {
        recent: [] as AgendaMatch[],
        upcoming: [] as AgendaMatch[],
        probabilitiesLocked: false,
      },
      standings: [] as Standing[],
      standingsFormat: 'none' as StandingFormat,
      standingsNote: 'Nessuna tabella ufficiale in archivio per questa competizione. Non viene generata una classifica fittizia.',
    };
  }
}

export async function SportDesk({
  slug,
  competitionId,
}: {
  slug: string;
  competitionId?: string;
}) {
  const sport = findSport(slug);
  if (!sport) notFound();

  const { overview, competitions, selected, matches, standings, standingsFormat, standingsNote } = await load(
    sport.apiPath,
    sport.slug,
    competitionId,
  );
  const sections = groupSportSections(competitions, sport.slug);
  const activeSection = sectionFor(selected, sport.slug, sections);
  const selectedId = selected?.id;
  const emptyArchive =
    competitions.length === 0 && (overview.counts?.matches ?? 0) === 0 && standings.length === 0;

  return (
    <>
      <PageHero
        kicker={`${sport.focus} · ${activeSection?.label ?? sport.name}`}
        title={selected?.name ?? sport.name}
      >
        <p className="disclaimer">
          18+. STATWIN è analisi sportiva, non un bookmaker. Nessuna vincita promessa. Nessun
          risultato inventato: i punteggi appaiono solo se la fonte ha chiuso la gara.
        </p>
        <p>{sport.blurb}</p>
      </PageHero>

      <div className="grid">
        <div className="card stat">
          <span>Competizioni</span>
          <strong>{overview.counts?.competitions ?? 0}</strong>
        </div>
        <div className="card stat">
          <span>Squadre / atleti</span>
          <strong>{overview.counts?.teams ?? 0}</strong>
        </div>
        <div className="card stat">
          <span>{sport.eventNoun}</span>
          <strong>{overview.counts?.matches ?? 0}</strong>
        </div>
      </div>

      <SportDeskBrowser
        sportHref={sport.href}
        sportSlug={sport.slug}
        sportName={sport.name}
        eventNoun={sport.eventNoun}
        nationLabel={sport.slug === 'football' ? 'Nazioni' : 'Sezioni'}
        sections={sections}
        activeSectionKey={activeSection?.key}
        selectedId={selectedId}
        standings={standings}
        standingsFormat={standingsFormat}
        standingsNote={standingsNote}
        recent={matches.recent}
        upcoming={matches.upcoming}
        probabilitiesLocked={matches.probabilitiesLocked}
        emptyArchive={emptyArchive}
        emptyArchiveBody={
          overview.note ??
          `L'archivio resta vuoto finché il provider non restituisce gare. Nessun punteggio viene inventato.`
        }
      />
    </>
  );
}

function asStandings(raw: StandingsPayload | Standing[], slug: string) {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      format: inferFormat(slug, raw),
      note: raw.length ? null : emptyNote(slug),
    };
  }
  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items,
    format: raw?.format ?? inferFormat(slug, items),
    note: raw?.note ?? (items.length ? null : emptyNote(slug)),
  };
}

function inferFormat(slug: string, rows: Standing[]): StandingFormat {
  if (!rows.length) return 'none';
  if (['basketball', 'american-football', 'ice-hockey', 'baseball'].includes(slug)) {
    return 'win-loss';
  }
  if (rows.some((row) => (row.drawn ?? 0) > 0)) return 'points';
  if (rows.some((row) => (row.won ?? 0) > 0 || (row.lost ?? 0) > 0)) return 'win-loss';
  return rows.some((row) => (row.points ?? 0) > 0) ? 'points' : 'ranking';
}

function emptyNote(slug: string) {
  if (['tennis', 'formula1', 'mma', 'golf', 'cycling', 'darts', 'horse-racing'].includes(slug)) {
    return 'Classifica non fornita dalla fonte';
  }
  return 'Nessuna tabella ufficiale in archivio per questa competizione. Non viene generata una classifica fittizia.';
}
