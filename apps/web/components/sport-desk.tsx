import Link from 'next/link';
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
import { AiSportPath } from './ai-sport-path';
import { EmptyState } from './empty-state';
import { MatchAgenda } from './match-agenda';
import { PageHero } from './page-hero';
import { PossibleResults } from './possible-results';

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

      {sections.length > 0 ? (
        <div className="card league-board nation-board">
          <section className="league-country">
            <p className="muted league-country-label">
              {sport.slug === 'football' ? 'Nazioni' : 'Sezioni'}
            </p>
            <div className="tabs nation-tabs">
              {sections.map((section) => {
                const first = section.competitions[0];
                return (
                  <Link
                    key={section.key}
                    href={`${sport.href}?c=${first.id}`}
                    className={`chip ${activeSection?.key === section.key ? 'chip-active' : 'chip-data'}`}
                  >
                    {section.label}
                  </Link>
                );
              })}
            </div>
          </section>
          {activeSection ? (
            <section className="league-country">
              <p className="muted league-country-label">{activeSection.label} · competizioni</p>
              <div className="tabs">
                {activeSection.competitions.map((competition) => (
                  <Link
                    key={competition.id}
                    href={`${sport.href}?c=${competition.id}`}
                    className={`chip ${selectedId === competition.id ? 'chip-active' : 'chip-stats'}`}
                  >
                    {competition.name}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}

      <h2>Classifica</h2>
      {standings.length > 0 ? (
        <StandingsTable rows={standings} format={standingsFormat} />
      ) : (
        <div className="card">
          <EmptyState
            title={standingsNote === 'Classifica non fornita dalla fonte' ? 'Classifica non fornita dalla fonte' : 'Classifica in attesa'}
            body={
              standingsNote ??
              'Nessuna tabella ufficiale in archivio per questa competizione. Non viene generata una classifica fittizia.'
            }
          />
        </div>
      )}

      {emptyArchive ? (
        <div className="card coming-panel">
          <EmptyState
            title={`${sport.name}: nessun dato sincronizzato`}
            body={
              overview.note ??
              `L'archivio resta vuoto finché il provider non restituisce gare. Nessun punteggio viene inventato.`
            }
          />
        </div>
      ) : (
        <MatchAgenda recent={matches.recent} upcoming={matches.upcoming} />
      )}

      <PossibleResults upcoming={matches.upcoming} locked={matches.probabilitiesLocked} />

      <AiSportPath
        sportSlug={sport.slug}
        sportName={sport.name}
        eventNoun={sport.eventNoun}
        matches={[...matches.upcoming, ...matches.recent]}
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

function StandingsTable({ rows, format }: { rows: Standing[]; format: StandingFormat }) {
  const showPoints = format === 'points' || rows.some((row) => (row.points ?? 0) > 0);
  const showDraws = format === 'points' || rows.some((row) => (row.drawn ?? 0) > 0);
  const showPlayed = format !== 'ranking' || rows.some((row) => (row.played ?? 0) > 0);
  const season = rows[0]?.season?.name;
  return (
    <div className="card table-wrap">
      <span className="badge badge-data">DATI</span>
      {season ? <p className="muted">Stagione {season}</p> : null}
      <table className="data">
        <thead>
          <tr>
            <th>#</th>
            <th>{format === 'ranking' ? 'Nome' : 'Squadra'}</th>
            {showPoints ? <th>Pt</th> : null}
            {showPlayed ? <th>G</th> : null}
            {format !== 'ranking' ? <th>V</th> : null}
            {showDraws ? <th>N</th> : null}
            {format !== 'ranking' ? <th>P</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.position}-${row.team.name}`}>
              <td className="pos">{row.position}</td>
              <td>{row.team.name}</td>
              {showPoints ? <td>{row.points}</td> : null}
              {showPlayed ? <td>{row.played}</td> : null}
              {format !== 'ranking' ? <td>{row.won ?? '—'}</td> : null}
              {showDraws ? <td>{row.drawn ?? '—'}</td> : null}
              {format !== 'ranking' ? <td>{row.lost ?? '—'}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
